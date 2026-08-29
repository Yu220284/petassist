import type { LiveAgentId } from "./specs";
import type { Locale } from "@/lib/i18n/types";
import { DEFAULT_GRANTS, type PetGrants } from "@/lib/grants";
import {
  DEFAULT_PET_CONFIG,
  isDeskAppId,
  type PetConfig,
} from "@/lib/pet-config";
import { openMacApp } from "./gateway";
import {
  DESK_TOOLS,
  deskCallLeavesWorkspace,
  executeDeskTool,
  isDeskTool,
  isDeskWriteTool,
} from "./sandbox";

export function inspectUntrusted(args: {
  sender?: string;
  body: string;
}): string {
  const body = args.body ?? "";
  const sender = args.sender ?? "";
  const flags: string[] = [];
  if (/slack|投稿|post|share|宣伝/i.test(body)) flags.push("asks_to_post");
  if (/名簿|roster|pii|個人情報|電話|email|メール/i.test(body)) {
    flags.push("asks_for_pii");
  }
  if (!sender || /unknown|未知|連絡先にいない|not in contacts/i.test(sender)) {
    flags.push("unknown_sender");
  }
  return JSON.stringify({
    sandbox: "local-inspect",
    posted: false,
    sender: sender || "unknown",
    flags,
    recommendation: flags.length ? "do_not_send" : "safe_to_draft_only",
  });
}

export async function webSearch(query: string): Promise<string> {
  const q = query.trim();
  if (!q) return JSON.stringify({ results: [] });
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return JSON.stringify({ error: `search ${res.status}`, query: q });
    }
    const json = (await res.json()) as {
      AbstractText?: string;
      Heading?: string;
      AbstractURL?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
    };
    const related = (json.RelatedTopics ?? [])
      .slice(0, 3)
      .map((t) => ({ text: t.Text, url: t.FirstURL }))
      .filter((t) => t.text);
    return JSON.stringify({
      query: q,
      heading: json.Heading,
      abstract: json.AbstractText,
      url: json.AbstractURL,
      related,
    });
  } catch (err) {
    return JSON.stringify({
      error: err instanceof Error ? err.message : "search failed",
      query: q,
    });
  }
}

export async function slackPost(args: {
  channel?: string;
  text: string;
}): Promise<string> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: args.text,
        channel: args.channel,
      }),
    });
    if (!res.ok) {
      return JSON.stringify({
        ok: false,
        delivered: false,
        error: `webhook ${res.status}`,
      });
    }
    return JSON.stringify({ ok: true, delivered: true, channel: args.channel ?? "webhook" });
  }
  return JSON.stringify({
    ok: true,
    delivered: false,
    mock: true,
    note: "No SLACK_WEBHOOK_URL; logged as a desk send after Allow.",
    channel: args.channel ?? "#team",
    text: args.text,
  });
}

export function toolsFor(
  petId: LiveAgentId,
  grants: PetGrants = DEFAULT_GRANTS,
  config: PetConfig = DEFAULT_PET_CONFIG
) {
  const base =
    petId === "cat"
      ? [
          {
            type: "function" as const,
            function: {
              name: "inspect_untrusted",
              description:
                "Inspect an untrusted message inside the local sandbox. Never sends or posts.",
              parameters: {
                type: "object",
                properties: {
                  sender: { type: "string" },
                  body: { type: "string" },
                },
                required: ["body"],
              },
            },
          },
          {
            type: "function" as const,
            function: {
              name: "web_search",
              description: "Look up a short public web snippet about a query.",
              parameters: {
                type: "object",
                properties: { query: { type: "string" } },
                required: ["query"],
              },
            },
          },
        ]
      : petId === "bunny"
        ? [
            {
              type: "function" as const,
              function: {
                name: "save_draft",
                description: "Save a reply draft. Does not send it.",
                parameters: {
                  type: "object",
                  properties: { draft: { type: "string" } },
                  required: ["draft"],
                },
              },
            },
          ]
        : [
            {
              type: "function" as const,
              function: {
                name: "slack_post",
                description:
                  "Post a message to Slack or the desk outbound channel. Requires trainer Allow.",
                parameters: {
                  type: "object",
                  properties: {
                    channel: { type: "string" },
                    text: { type: "string" },
                  },
                  required: ["text"],
                },
              },
            },
          ];

  if (grants.sandbox === "read_only") {
    return filterTools([...base, ...appTools(config)], config);
  }

  const scoped =
    grants.sandbox === "workspace"
      ? "Only paths inside the trainer's granted folders, unless the trainer Allows leaving."
      : "Unrestricted on this Mac. Do not post to Slack without slack_post + Allow.";

  const readTools = [
    {
      type: "function" as const,
      function: {
        name: "list_dir",
        description: `List a directory. ${scoped}`,
        parameters: {
          type: "object",
          properties: { path: { type: "string" } },
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "glob_files",
        description: `Find files under a folder. pattern examples: *.txt, *.png, *.{txt,png}. ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            pattern: { type: "string" },
          },
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "read_file",
        description: `Read a file. Large files support offset/limit. Binary images are not dumped — use process_image or write_pptx. ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            offset: { type: "number" },
            limit: { type: "number" },
            encoding: { type: "string", enum: ["utf8", "base64"] },
          },
          required: ["path"],
        },
      },
    },
  ];

  if (petId !== "dog") return filterTools([...base, ...readTools, ...appTools(config)], config);

  const writeTools = [
    {
      type: "function" as const,
      function: {
        name: "write_file",
        description: `Write a UTF-8 or base64 file (txt, log, large text). Up to 8MB. ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" },
            encoding: { type: "string", enum: ["utf8", "base64"] },
            append: { type: "boolean" },
          },
          required: ["path", "content"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "append_file",
        description: `Append to a log or text file. Set timestamp true to prefix ISO time. ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" },
            timestamp: { type: "boolean" },
          },
          required: ["path", "content"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "write_json",
        description: `Write a JSON file. ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            data: { description: "JSON value to write" },
            pretty: { type: "boolean" },
          },
          required: ["path", "data"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "write_csv",
        description: `Write a CSV (Excel-friendly BOM). ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            headers: { type: "array", items: { type: "string" } },
            rows: {
              type: "array",
              items: { type: "array", items: { type: "string" } },
            },
          },
          required: ["path", "headers", "rows"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "write_pdf",
        description: `Generate a PDF from text or from_file. Japanese-capable on this Mac. ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            title: { type: "string" },
            text: { type: "string" },
            from_file: { type: "string" },
          },
          required: ["path"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "write_pptx",
        description: `Build a PPTX. Pass from_folder of .txt/.md + .png/.jpg (paired by filename), or slides[{title,body,image,from_file}]. ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            title: { type: "string" },
            from_folder: { type: "string" },
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                  image: { type: "string" },
                  from_file: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "process_image",
        description: `Resize, grayscale, rotate, or convert png/jpeg and save. ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            source: { type: "string" },
            dest: { type: "string" },
            width: { type: "number" },
            height: { type: "number" },
            grayscale: { type: "boolean" },
            rotate: { type: "number" },
            format: { type: "string", enum: ["png", "jpeg"] },
            quality: { type: "number" },
          },
          required: ["source", "dest"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "copy_file",
        description: `Copy a file inside granted folders. ${scoped}`,
        parameters: {
          type: "object",
          properties: {
            source: { type: "string" },
            dest: { type: "string" },
          },
          required: ["source", "dest"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "run_command",
        description:
          grants.sandbox === "full_access"
            ? "Run a shell command anywhere on this Mac. Prefer write_pdf / write_pptx / process_image when those fit. Timeout applies."
            : "Run a shell command with cwd inside granted folders. Prefer dedicated file tools. Leaving the folder needs Allow.",
        parameters: {
          type: "object",
          properties: {
            command: { type: "string" },
            cwd: { type: "string" },
          },
          required: ["command"],
        },
      },
    },
  ];

  return filterTools(
    [...base, ...readTools, ...writeTools, ...appTools(config)],
    config
  );
}

function appTools(config: PetConfig) {
  if (!config.apps.length) return [];
  return [
    {
      type: "function" as const,
      function: {
        name: "open_app",
        description: `Open an allowed Mac app. Allowed: ${config.apps.join(", ")}.`,
        parameters: {
          type: "object",
          properties: {
            app: { type: "string", enum: config.apps },
          },
          required: ["app"],
        },
      },
    },
  ];
}

function filterTools<T extends { function: { name: string } }>(
  tools: T[],
  config: PetConfig
) {
  if (!config.disabledTools.length) return tools;
  const blocked = new Set(config.disabledTools);
  return tools.filter((tool) => !blocked.has(tool.function.name));
}

export async function executeTool(
  name: string,
  rawArgs: string,
  locale: Locale,
  grants: PetGrants = DEFAULT_GRANTS,
  escape = false,
  petId?: LiveAgentId,
  config: PetConfig = DEFAULT_PET_CONFIG
): Promise<string> {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
  } catch {
    args = {};
  }
  if (config.disabledTools.includes(name)) {
    const msg =
      locale === "ja"
        ? `道具 ${name} はこの子には渡していません（MCP Gateway）`
        : `Tool ${name} is disabled for this pet (MCP Gateway)`;
    return JSON.stringify({ error: msg });
  }
  if (name === "inspect_untrusted") {
    return inspectUntrusted({
      sender: typeof args.sender === "string" ? args.sender : undefined,
      body: typeof args.body === "string" ? args.body : String(args.body ?? ""),
    });
  }
  if (name === "web_search") {
    return webSearch(typeof args.query === "string" ? args.query : "");
  }
  if (name === "save_draft") {
    const draft = typeof args.draft === "string" ? args.draft : "";
    return JSON.stringify({ saved: true, sent: false, draft });
  }
  if (name === "slack_post") {
    return slackPost({
      channel: typeof args.channel === "string" ? args.channel : undefined,
      text: typeof args.text === "string" ? args.text : "",
    });
  }
  if (name === "open_app") {
    const app = args.app;
    if (!isDeskAppId(app) || !config.apps.includes(app)) {
      const msg =
        locale === "ja"
          ? "このアプリは許可されていません"
          : "That app is not allowed";
      return JSON.stringify({ error: msg });
    }
    try {
      return JSON.stringify(await openMacApp(app));
    } catch (err) {
      return JSON.stringify({
        error: err instanceof Error ? err.message : "open failed",
      });
    }
  }
  if (isDeskTool(name)) {
    if (isDeskWriteTool(name) && petId && petId !== "dog") {
      const msg =
        locale === "ja"
          ? "書く・変換するのはいぬのライセンスだけです"
          : "Only the dog may write or convert files";
      return JSON.stringify({ error: msg });
    }
    return executeDeskTool(name, rawArgs, grants, locale, escape);
  }
  const msg =
    locale === "ja"
      ? `ツール ${name} はこのライセンスにありません`
      : `Tool ${name} is not on this license`;
  return JSON.stringify({ error: msg });
}

export function isGatedTool(
  name: string,
  rawArgs = "",
  grants: PetGrants = DEFAULT_GRANTS
) {
  if (name === "slack_post") return true;
  if (!isDeskTool(name)) return false;
  if (grants.sandbox === "full_access") return false;
  return deskCallLeavesWorkspace(name, rawArgs, grants);
}

export { DESK_TOOLS };

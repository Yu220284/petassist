import type { PetGrants } from "@/lib/grants";
import {
  APP_CATALOG,
  DEFAULT_PET_CONFIG,
  type PetConfig,
} from "@/lib/pet-config";
import { isLiveAgent } from "@/data/party";
import type { Messages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/types";

export type CapLists = {
  can: string[];
  cannot: string[];
};

function off(config: PetConfig, name: string) {
  return config.disabledTools.includes(name);
}

export function capabilitiesFor(
  petId: string,
  grants: PetGrants,
  t: Messages,
  locale: Locale,
  config: PetConfig = DEFAULT_PET_CONFIG
): CapLists {
  const c = t.cap;
  const can: string[] = [];
  const cannot: string[] = [];
  const disk =
    grants.sandbox === "workspace" || grants.sandbox === "full_access";
  const full = grants.sandbox === "full_access";
  const tool = (name: string) => !off(config, name);

  if (!isLiveAgent(petId)) {
    can.push(c.seen);
    cannot.push(c.notLive);
    cannot.push(c.noSend);
    return { can, cannot };
  }

  can.push(c.talk);

  if (petId === "cat") {
    if (tool("inspect_untrusted") || tool("web_search")) can.push(c.research);
    else cannot.push(c.noResearch);
    cannot.push(c.noSend);
    cannot.push(c.noWrite);
  }

  if (petId === "bunny") {
    if (tool("save_draft")) can.push(c.draft);
    cannot.push(c.noSend);
    cannot.push(c.noWrite);
  }

  if (petId === "dog") {
    if (tool("slack_post")) can.push(c.sendAfterAllow);
    else cannot.push(c.noSend);
    cannot.push(c.noElevate);
  }

  if (disk) {
    const reader = petId === "dog" || petId === "cat" || petId === "bunny";
    if (reader && (tool("read_file") || tool("list_dir") || tool("glob_files"))) {
      can.push(full ? c.diskFullRead : c.readFolder);
    } else {
      cannot.push(c.noDisk);
    }
    if (petId === "dog") {
      const writes =
        tool("write_file") ||
        tool("write_json") ||
        tool("write_csv") ||
        tool("append_file");
      const office =
        tool("write_pdf") || tool("write_pptx") || tool("process_image");
      if (writes) can.push(c.writeFiles);
      else cannot.push(c.noWrite);
      if (office) can.push(c.makeOffice);
      if (tool("run_command")) can.push(full ? c.shellFull : c.shellFolder);
      else cannot.push(c.noShell);
      if (!full) cannot.push(c.noOutside);
    } else {
      cannot.push(c.noShell);
    }
  } else {
    cannot.push(c.noDisk);
    cannot.push(c.noShell);
    if (petId === "dog") cannot.push(c.noWrite);
  }

  if (config.apps.length && tool("open_app")) {
    const names = config.apps
      .map((id) => APP_CATALOG.find((a) => a.id === id))
      .filter((a): a is (typeof APP_CATALOG)[number] => Boolean(a))
      .map((a) => (locale === "ja" ? a.ja : a.en));
    can.push(c.openApps(names.join(locale === "ja" ? "、" : ", ")));
  } else {
    cannot.push(c.noApps);
  }

  return { can: [...new Set(can)], cannot: [...new Set(cannot)] };
}

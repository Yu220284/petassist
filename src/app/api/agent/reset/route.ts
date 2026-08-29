import { resetAgents } from "@/lib/agent/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { petId?: string };
  resetAgents(typeof body.petId === "string" ? body.petId : undefined);
  return Response.json({ ok: true });
}

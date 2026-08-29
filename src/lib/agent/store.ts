import { randomUUID } from "crypto";
import type { AgentSession } from "./types";

const g = globalThis as typeof globalThis & {
  __pockassistSessions?: Map<string, AgentSession>;
};

function map() {
  if (!g.__pockassistSessions) g.__pockassistSessions = new Map();
  return g.__pockassistSessions;
}

export function getSession(id: string) {
  return map().get(id);
}

export function putSession(session: AgentSession) {
  map().set(session.id, session);
  return session;
}

export function deleteSession(id: string) {
  map().delete(id);
}

export function newSessionId() {
  return randomUUID();
}

export function resetPetSessions(petId?: string) {
  if (!petId) {
    map().clear();
    return;
  }
  for (const [id, session] of map()) {
    if (session.petId === petId) map().delete(id);
  }
}

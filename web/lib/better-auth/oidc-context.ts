import { AsyncLocalStorage } from "node:async_hooks";

const context = new AsyncLocalStorage<{ groups?: string[] }>();

export function withOidcContext<T>(callback: () => T): T {
  return context.run({}, callback);
}

export function captureOidcGroups(value: unknown) {
  const current = context.getStore();
  if (current) current.groups = undefined;
  if (current && Array.isArray(value) && value.every(group => typeof group === "string")) {
    current.groups = [...new Set(value.filter(group => group.length > 0))];
  }
}

export function getOidcGroups() {
  return context.getStore()?.groups;
}

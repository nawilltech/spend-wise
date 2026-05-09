function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

export function camelizeKeys<T = unknown>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map(camelizeKeys) as T;
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        toCamelCase(k),
        camelizeKeys(v),
      ])
    ) as T;
  }
  return obj as T;
}

export function snakelizeKeys<T = unknown>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map(snakelizeKeys) as T;
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        toSnakeCase(k),
        snakelizeKeys(v),
      ])
    ) as T;
  }
  return obj as T;
}

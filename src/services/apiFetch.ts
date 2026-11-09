export class ApiFetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiFetchError";
  }
}

export async function apiFetch(
  url: string,
  options?: RequestInit,
): Promise<unknown> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : res.statusText;
    const code = (data as { code?: unknown }).code;
    throw new ApiFetchError(
      message,
      res.status,
      typeof code === "string" ? code : undefined,
    );
  }
  return data;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

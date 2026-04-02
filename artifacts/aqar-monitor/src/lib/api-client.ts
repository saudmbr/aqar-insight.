export function apiPath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

export async function readApiResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const rawText = await res.text();

  let data: unknown = null;
  if (rawText) {
    if (contentType.includes("application/json") || looksLikeJson(rawText)) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
    }
  }

  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : rawText.trim().startsWith("<")
          ? "The API returned HTML instead of JSON. Make sure the backend is running and /api is proxied correctly."
          : fallbackMessage;
    throw new Error(message);
  }

  if (data !== null) {
    return data as T;
  }

  return {} as T;
}

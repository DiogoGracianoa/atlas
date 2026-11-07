interface ContentOptions {
  config?: { url: string; anonKey: string } | null;
  authFetch?: typeof fetch;
  root?: string;
}
export function serveContent(request: Request, options?: ContentOptions): Promise<Response>;

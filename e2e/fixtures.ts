import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ authenticated: boolean }>({
  authenticated: [true, { option: true }],
  context: async ({ context, authenticated }, use) => {
    if (authenticated) await context.addInitScript(() => {
      // Sessão de teste reconhecida somente pelo Auth local de tests/e2e-server.mts.
      // Não sobrescrever storage em reload: a saída precisa continuar valendo.
      if (!sessionStorage.getItem("atlas-e2e-initialized")) {
        localStorage.setItem("sb-127-auth-token", JSON.stringify({
          access_token: "accepted-token", refresh_token: "test-refresh", token_type: "bearer",
          expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: { id: "e2e-user", email: "reader@example.test", aud: "authenticated", role: "authenticated", is_anonymous: false },
        }));
        sessionStorage.setItem("atlas-e2e-initialized", "1");
      }
    });
    await use(context);
  },
});
export { expect };

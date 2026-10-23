export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
let csrf = { headerName: "", token: "" };
let csrfFlight: Promise<void> | null = null;
export async function refreshCsrf() {
  if (!csrfFlight)
    csrfFlight = (async () => {
      const response = await fetch("/api/auth/csrf");
      if (!response.ok) throw new Error("服务暂时无法连接，请重试");
      csrf = await response.json();
    })().finally(() => {
      csrfFlight = null;
    });
  return csrfFlight;
}
export async function api<T = any>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  if (!csrf.token) await refreshCsrf();
  const r = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(method === "GET" ? {} : { [csrf.headerName]: csrf.token }),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!r.ok) {
    const b = await r
      .json()
      .catch(() => ({ message: "服务暂时无法连接，请重试" }));
    throw new ApiError(b.message, r.status);
  }
  return r.status === 204 ? undefined : await r.json();
}

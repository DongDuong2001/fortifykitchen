export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
  },
  MENU: {
    BASE: "/menu",
    DETAIL: (id: string) => `/menu/${id}`,
    CATEGORIES: "/menu/categories",
  },
  ORDERS: {
    BASE: "/orders",
    DETAIL: (id: string) => `/orders/${id}`,
  },
  SUBSCRIPTIONS: {
    BASE: "/subscriptions",
    DETAIL: (id: string) => `/subscriptions/${id}`,
  },
  PAYMENTS: {
    BASE: "/payments",
  },
  DASHBOARD: {
    STATS: "/dashboard/stats",
  },
} as const;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: any[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const url = `${baseUrl}${path}`;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    headers: requestHeaders,
    ...rest,
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      responseData.message || "Something went wrong",
      responseData.errors,
    );
  }

  return responseData.data as T;
}

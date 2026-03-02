import { useAuthStore } from "../store/auth-store";

const BASE_URL = "https://rentalmeet.onrender.com/api/";

type RequestOptions = {
    method?: string;
    body?: unknown;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
};

export const getAuthHeader = () => {
    const token = useAuthStore.getState().token;

    return { authorization: `Bearer ${token}` };
};

async function request<T = unknown>(
    endpoint: string,
    { method = "GET", body, params, headers = {} }: RequestOptions = {}
): Promise<T> {
    let url = `${BASE_URL}${endpoint}`;

    if (params) {
        const filtered = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
        );
        const query = new URLSearchParams(filtered as Record<string, string>).toString();
        if (query) url += `?${query}`;
    }

    const isFormData = body instanceof FormData;

    const response = await fetch(url, {
        method,
        headers: {
            ...(!isFormData && { "Content-Type": "application/json" }),
            ...headers,
        },
        body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
    }

    // Return parsed JSON, or null for empty responses (e.g. 204)
    const data = await response.json();
    return data;
}

export const apiClient = {
    get: <T = any>(url: string, opts?: Pick<RequestOptions, "params" | "headers">) =>
        request<T>(url, { method: "GET", ...opts }),
    post: <T = any>(url: string, body?: unknown, opts?: Pick<RequestOptions, "headers">) =>
        request<T>(url, { method: "POST", body, ...opts }),
    put: <T = any>(url: string, body?: unknown, opts?: Pick<RequestOptions, "headers">) =>
        request<T>(url, { method: "PUT", body, ...opts }),
    delete: <T = any>(url: string, opts?: Pick<RequestOptions, "headers">) =>
        request<T>(url, { method: "DELETE", ...opts }),
};
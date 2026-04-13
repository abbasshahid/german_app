class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path, query) {
  const url = new URL(path, window.location.origin);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function request(path, { method = "GET", body, query } = {}) {
  const response = await fetch(buildUrl(path, query), {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.error?.message ?? "Request failed", response.status, payload?.error?.details);
  }

  return payload;
}

export const api = {
  get(path, query) {
    return request(path, { query });
  },
  post(path, body) {
    return request(path, { method: "POST", body });
  },
  patch(path, body) {
    return request(path, { method: "PATCH", body });
  }
};

export { ApiError };

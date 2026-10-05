import { useCallback, useEffect, useState } from "react";

// Read a query-string value from the current URL (deep links from search and notifications)
export const urlParam = (key) => new URLSearchParams(window.location.search).get(key);

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error((data && data.detail) || `Server returned ${res.status}`);
  }
  return data;
}

// Loads `path` and re-loads whenever it changes. `reload()` refreshes after a mutation.
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api(path));
    } catch (err) {
      setError(err.message || "Could not reach the DentalIQ engine.");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

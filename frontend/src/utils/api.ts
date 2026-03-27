const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
};

export async function apiJson<T>(path: string, options: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const token = localStorage.getItem('token');
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const json = await res.json();
  if (!res.ok || !json?.success) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export async function getJson<T>(path: string, auth = true) {
  return apiJson<T>(path, { method: 'GET', auth });
}

export async function postJson<T>(path: string, body: unknown, auth = true): Promise<ApiResponse<T>> {
  return apiJson<T>(path, { method: 'POST', body, auth });
}

export async function putJson<T>(path: string, body: unknown, auth = true): Promise<ApiResponse<T>> {
  return apiJson<T>(path, { method: 'PUT', body, auth });
}

export async function patchJson<T>(path: string, body?: unknown, auth = true): Promise<ApiResponse<T>> {
  return apiJson<T>(path, { method: 'PATCH', body, auth });
}

export async function deleteJson<T>(path: string, auth = true): Promise<ApiResponse<T>> {
  return apiJson<T>(path, { method: 'DELETE', auth });
}

export function saveAuth(data: { token: string; role?: string; email?: string; name?: string }) {
  localStorage.setItem('token', data.token);
  if (data.role) localStorage.setItem('role', data.role);
  if (data.email) localStorage.setItem('email', data.email);
  if (data.name) localStorage.setItem('name', data.name);
}

/** Returns the stored faculty email for use as ?facultyEmail= query param */
export function getFacultyEmail(): string {
  return localStorage.getItem('email') || 'faculty@dept.com';
}

/**
 * Appends ?facultyEmail=<email> (and any extra params) to a path.
 * Usage: facultyUrl('/api/faculty/dashboard/stats')
 *        facultyUrl('/api/faculty/students', { status: 'PENDING' })
 */
export function facultyUrl(path: string, extra: Record<string, string | number | undefined> = {}): string {
  const params = new URLSearchParams({ facultyEmail: getFacultyEmail() });
  Object.entries(extra).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
  return `${path}?${params.toString()}`;
}

// Convenience API helpers for new flows
export async function sendStudentToAdmin(studentId: number) {
  return postJson<void>(facultyUrl(`/api/faculty/students/${studentId}/send-to-admin`), {});
}

export async function fetchAdminReviewStudents() {
  return getJson(`/api/admin/students/eligible-for-review`);
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const apiBaseUrl = baseUrl;

export type User = { id: string; _id?: string; name: string; email: string; image?: string; role: 'user' | 'admin'; disabled?: boolean; createdAt: string };
export type Artist = { id: string; _id?: string; name: string };
export type Category = { id: string; _id?: string; name: string; slug: string };
export type Tag = { id: string; _id?: string; name: string; slug: string };
export type Song = {
  id: string; _id?: string;
  title: string;
  artist: string;
  album?: string;
  artistId?: string;
  albumId?: string;
  language: string;
  duration?: number;
  genre?: string;
  year?: number;
  trackNumber?: number;
  discNumber?: number;
  format?: string;
  bitrate?: number;
  artwork?: string;
  url?: string;
  coverUrl?: string;
  coverPublicId?: string;
  isFavorite?: boolean;
  playCount?: number;
  lastPlayedAt?: string | null;
  dateAdded?: number | string | null;
  processing: 'pending' | 'processing' | 'ready' | 'failed';
  published: boolean;
  audio?: { quality: string }[];
};
export class ApiError extends Error {}
export const configured = Boolean(baseUrl);

export async function api<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.error?.code || `Request failed (${response.status})`);
  return body as T;
}

export async function login(email: string, password: string) {
  const response = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.error?.code || 'Unable to sign in');
  return body as { accessToken: string; refreshToken: string };
}

export async function upload(token: string, songId: string, kind: 'audio' | 'cover', file: File) {
  const response = await fetch(`${baseUrl}/admin/songs/${songId}/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type, 'X-Upload-Kind': kind },
    body: file,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.error?.code || `Upload failed (${response.status})`);
  return body as { uploadId: string; jobId: string; status: string };
}

export async function uploadProfileImage(token: string, file: File) {
  const response = await fetch(`${baseUrl}/users/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type || 'image/png' },
    body: file,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.error?.code || `Profile upload failed (${response.status})`);
  return body as { image: string; name: string; email: string; role: 'user' | 'admin'; createdAt: string };
}

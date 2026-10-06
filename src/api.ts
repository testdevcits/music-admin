const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const apiBaseUrl = baseUrl;

export type UserImage = { url: string; alt?: string; publicId?: string };

export type User = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  image?: string | UserImage | null;
  role: 'user' | 'admin';
  disabled?: boolean;
  createdAt: string;
};

export type UserProfileUploadResponse = {
  id: string;
  name: string;
  email: string;
  image: UserImage | string;
  role: 'user' | 'admin';
  createdAt: string;
};
export type Artist = { id: string; _id?: string; mongoId?: string; name: string };
export type Category = { id: string; _id?: string; mongoId?: string; name: string; slug: string };
export type Tag = { id: string; _id?: string; mongoId?: string; name: string; slug: string };
export type Song = {
  id: string; _id?: string; mongoId?: string;
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
  categories?: string[];
  tags?: string[];
  processing: 'pending' | 'processing' | 'ready' | 'failed';
  published: boolean;
  audio?: { quality: string }[];
  audioUrl?: string;
};
export class ApiError extends Error {}
export const configured = Boolean(baseUrl);

export async function api<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const requestUrl = `${baseUrl}${path}`;
  console.log('[api] request', { requestUrl, method: init.method || 'GET', headers: init.headers });

  const response = await fetch(requestUrl, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  console.log('[api] response', { requestUrl, status: response.status, body });

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
  if (kind === 'audio') {
    const signed = await api<{
      cloudName: string; apiKey: string; timestamp: number; signature: string;
      folder: string; publicId: string; overwrite: string;
    }>(token, `/admin/songs/${songId}/cloudinary-signature?bytes=${file.size}`);
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', signed.apiKey);
    body.append('timestamp', String(signed.timestamp));
    body.append('signature', signed.signature);
    body.append('folder', signed.folder);
    body.append('public_id', signed.publicId);
    body.append('overwrite', signed.overwrite);
    const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/video/upload`, {
      method: 'POST', body,
    });
    const uploadedBody = await uploaded.json().catch(() => null);
    if (!uploaded.ok) throw new ApiError(uploadedBody?.error?.message || `Cloudinary upload failed (${uploaded.status})`);
    return api<{ status: string; uploadId: string; jobId: string }>(token, `/admin/songs/${songId}/cloudinary-complete`, {
      method: 'POST',
      body: JSON.stringify({ publicId: uploadedBody.public_id, bytes: uploadedBody.bytes }),
    });
  }
  const response = await fetch(`${baseUrl}/admin/songs/${songId}/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type || 'image/jpeg', 'X-Upload-Kind': kind },
    body: file,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.error?.code || `Upload failed (${response.status})`);
  return body as { uploadId: string; jobId: string; status: string };
}

export async function uploadProfileImage(token: string, file: File) {
  const url = `${baseUrl}/users/me/avatar`;
  console.log('[avatar upload] start', { url, fileName: file.name, type: file.type, size: file.size });

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type || 'image/png' },
    body: file,
  });
  const body = await response.json().catch(() => null);
  console.log('[avatar upload] response', { url, status: response.status, body });

  if (!response.ok) throw new ApiError(body?.error?.code || `Profile upload failed (${response.status})`);
  return body as UserProfileUploadResponse;
}

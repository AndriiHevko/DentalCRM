import { UserProfile } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const handle = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export const register = async (payload: {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}): Promise<void> => {
  const res = await fetch(`${API_URL}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await handle(res);
};

export const login = async (username: string, password: string): Promise<{ access: string; refresh: string }> => {
  const res = await fetch(`${API_URL}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handle<{ access: string; refresh: string }>(res);
};

export const fetchProfile = async (token: string): Promise<UserProfile> => {
  const res = await fetch(`${API_URL}/profile/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<UserProfile>(res);
};






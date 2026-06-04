const BASE = '/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`);
  return res.json();
}

export const projectsApi = {
  list: () => req<Project[]>('GET', '/projects'),
  create: (data: Omit<Project, 'id' | 'createdAt'>) => req<Project>('POST', '/projects', data),
  update: (id: string, data: Partial<Project>) => req<Project>('PUT', `/projects/${id}`, data),
  delete: (id: string) => req<void>('DELETE', `/projects/${id}`),
};

export const settingsApi = {
  get: () => req<{ provider: string; hasGeminiKey: boolean; hasKieKey: boolean }>('GET', '/settings'),
  save: (data: { geminiKey?: string; kieKey?: string; provider?: string }) =>
    req<{ success: boolean }>('POST', '/settings', data),
  getKeys: () => req<{ geminiKey: string; kieKey: string }>('GET', '/settings/keys'),
};

import type { Project } from '../types';

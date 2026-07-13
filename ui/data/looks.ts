import * as db from '../../services/dbService';

/**
 * Looks — reusable Look presets persisted as JSON docs in Supabase Storage (app-docs
 * bucket) via the dbService document store. No dedicated table required.
 */

export interface Look {
  id: string;
  name: string;
  serviceType: string;
  background: 'Studio' | 'Environment';
  backgroundValue: string; // studio colour name or environment description
  mood: string;
  lighting: string;
  fashionType: string;
  tags: string[];
  createdAt: number;
}

export const SERVICE_TYPES = ['E-Commerce', 'Lifestyle', 'Editorial', 'Campaign', 'Social Media', 'Marketplace'];
export const MOODS = ['Minimal', 'Warm', 'Moody', 'Bold', 'Neutral', 'Bright', 'Dramatic'];
export const LIGHTINGS = ['Soft light', 'Golden hour', 'High contrast', 'Even', 'Studio flash', 'Natural'];
export const FASHION_TYPES = ['Casual', 'Formal', 'Streetwear', 'Ethnic', 'Athleisure', 'Luxury'];

export function newLookId(): string {
  return `look-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyLook(): Look {
  return {
    id: newLookId(), name: '', serviceType: 'E-Commerce', background: 'Studio',
    backgroundValue: 'Pure White', mood: 'Minimal', lighting: 'Soft light',
    fashionType: 'Casual', tags: [], createdAt: Date.now(),
  };
}

export const listLooks = () => db.listDocs<Look>('looks');
export const saveLook = (l: Look) => db.saveDoc('looks', l.id, l as unknown as Record<string, any>);
export const deleteLook = (id: string) => db.deleteDoc('looks', id);

const EDIT_KEY = 'ovarly.editingLook';
export const setEditingLook = (id: string | null) => {
  try { id ? sessionStorage.setItem(EDIT_KEY, id) : sessionStorage.removeItem(EDIT_KEY); } catch { /* ignore */ }
};
export const getEditingLook = (): string | null => {
  try { return sessionStorage.getItem(EDIT_KEY); } catch { return null; }
};

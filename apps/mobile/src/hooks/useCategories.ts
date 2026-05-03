import { useState, useEffect, useCallback } from 'react';
import { categoriesApi } from '@services/api/categories';
import type { Category, CategoryCreate } from '@/types';

interface CategoryUpdate { name?: string; icon?: string; color?: string; type?: string }

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.list();
      setCategories(data);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload: CategoryCreate): Promise<Category | null> => {
    try {
      const category = await categoriesApi.create(payload);
      setCategories((prev) => [...prev, category]);
      return category;
    } catch {
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, payload: CategoryUpdate): Promise<Category | null> => {
    try {
      const updated = await categoriesApi.update(id, payload);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch {
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await categoriesApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { categories, loading, error, refetch: fetch, create, update, remove };
}

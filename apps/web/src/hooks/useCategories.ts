'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { categoriesApi } from '@/services/api/categories';
import type { Category, CategoryCreate } from '@/types';

interface CategoryUpdate { name?: string; icon?: string; color?: string; type?: string }

export function useCategories(filterType?: string, searchTerm?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async (type?: string, term?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.list(type, term);
      setCategories(data);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = searchTerm?.trim();
    if (trimmed) {
      debounceRef.current = setTimeout(() => fetch(filterType, trimmed), 300);
    } else {
      fetch(filterType, undefined);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filterType, searchTerm, fetch]);

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

  return { categories, loading, error, refetch: () => fetch(filterType, searchTerm?.trim()), create, update, remove };
}

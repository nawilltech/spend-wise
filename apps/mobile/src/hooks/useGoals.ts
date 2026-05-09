import { useState, useEffect, useCallback } from 'react';
import { goalsApi } from '@services/api/goals';
import type { Goal, GoalCreate, GoalType } from '@/types';

interface GoalUpdate { name?: string; targetAmount?: number; currency?: string; type?: GoalType }

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await goalsApi.list();
      setGoals(data);
    } catch {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload: GoalCreate): Promise<Goal | null> => {
    try {
      const goal = await goalsApi.create(payload);
      setGoals((prev) => [...prev, goal]);
      return goal;
    } catch {
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, payload: GoalUpdate): Promise<Goal | null> => {
    try {
      const updated = await goalsApi.update(id, payload);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return updated;
    } catch {
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await goalsApi.delete(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { goals, loading, error, refetch: fetch, create, update, remove };
}

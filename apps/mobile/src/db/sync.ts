import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { apiClient } from '@services/api/client';

export async function syncDatabase(): Promise<void> {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const response = await apiClient.get('/sync', {
        params: { last_pulled_at: lastPulledAt ?? 0 },
      });
      const { changes, timestamp } = response.data;
      return { changes, timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await apiClient.post('/sync', { changes, last_pulled_at: lastPulledAt });
    },
    migrationsEnabledAtVersion: 1,
  });
}

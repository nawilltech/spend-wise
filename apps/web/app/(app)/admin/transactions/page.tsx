'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/services/api/admin';
import type { AdminTransaction } from '@/types';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTransactions(await adminApi.listTransactions());
    } catch {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  return (
    <>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-text-secondary">Loading transactions…</div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">User</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">Description</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">Amount</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">{tx.userName}</div>
                    <div className="text-xs text-text-secondary">{tx.userEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{tx.description || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-text-primary">
                    {tx.currency} {tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {new Date(tx.transactionDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary text-sm">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

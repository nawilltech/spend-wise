'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/services/api/admin';
import type { AdminUser } from '@/types';

type EditForm = {
  name: string;
  email: string;
  role: string;
  baseCurrency: string;
  location: string;
  emailVerified: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await adminApi.listUsers());
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleVerify = async (userId: string) => {
    setVerifying(userId);
    try {
      const updated = await adminApi.verifyUserEmail(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch {
      setError('Failed to verify email');
    } finally {
      setVerifying(null);
    }
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      baseCurrency: u.baseCurrency,
      location: u.location,
      emailVerified: u.emailVerified,
    });
  };

  const handleSave = async () => {
    if (!editing || !editForm) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateUser(editing.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        base_currency: editForm.baseCurrency,
        location: editForm.location,
        email_verified: editForm.emailVerified,
      });
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? updated : u)));
      setEditing(null);
      setEditForm(null);
    } catch {
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-text-secondary">Loading users…</div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">User</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">Verified</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">Transactions</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">{u.name}</div>
                    <div className="text-xs text-text-secondary">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.emailVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {u.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">{u.transactionCount}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!u.emailVerified && (
                        <button
                          onClick={() => handleVerify(u.id)}
                          disabled={verifying === u.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          {verifying === u.id ? 'Verifying…' : 'Verify'}
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-background transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary text-sm">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && editForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Edit User</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Currency</label>
                  <input
                    value={editForm.baseCurrency}
                    onChange={(e) => setEditForm({ ...editForm, baseCurrency: e.target.value.toUpperCase() })}
                    maxLength={3}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Location</label>
                <input
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emailVerified"
                  checked={editForm.emailVerified}
                  onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.checked })}
                  className="w-4 h-4 rounded accent-primary"
                />
                <label htmlFor="emailVerified" className="text-sm text-text-primary">Email verified</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setEditing(null); setEditForm(null); }}
                className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-xl text-text-secondary hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

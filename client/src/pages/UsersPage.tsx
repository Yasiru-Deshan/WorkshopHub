import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import type { User, PaginatedResponse } from '../lib/types';
import toast from 'react-hot-toast';
import { Plus, Check, X } from 'lucide-react';

const ROLES = ['ADMIN', 'MANAGER', 'STAFF'] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'STAFF' as any });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<User>>('/users', { params: { page, limit: 20 } });
      setUsers(data.data);
      setMeta(data.meta);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', form);
      toast.success('User created');
      setShowModal(false);
      setForm({ email: '', fullName: '', password: '', role: 'STAFF' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSubmitting(false); }
  }

  async function toggleActive(u: User) {
    try {
      await api.patch(`/users/${u.id}`, { isActive: !u.is_active });
      toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  }

  async function changeRole(u: User, role: string) {
    try {
      await api.patch(`/users/${u.id}`, { role });
      toast.success('Role updated');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  }

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">{meta.total} users</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New User
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading…</div>
      ) : (
        <div className="reg-table-wrap">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.full_name}</td>
                  <td className="text-muted">{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className="role-select"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    {u.is_active
                      ? <Check size={16} className="text-green" />
                      : <X size={16} className="text-red" />}
                  </td>
                  <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => toggleActive(u)}
                      className={u.is_active ? 'btn-danger-sm' : 'btn-success-sm'}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary">← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary">Next →</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create User</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Full Name</label>
                <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@centre.local" />
              </div>
              <div className="form-group">
                <label>Password (min 8 chars)</label>
                <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

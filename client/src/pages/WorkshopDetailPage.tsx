import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Workshop, Registration, PaginatedResponse } from '../lib/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, User, Clock, Users, Edit, UserPlus } from 'lucide-react';

export default function WorkshopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ attendeeName: '', attendeeEmail: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const canEdit = user?.role === 'MANAGER';
  const canRegister = user?.role === 'MANAGER' || user?.role === 'STAFF';

  async function loadWorkshop() {
    try {
      const { data } = await api.get<Workshop>(`/workshops/${id}`);
      setWorkshop(data);
    } catch {
      toast.error('Workshop not found');
      navigate('/workshops');
    }
  }

  async function loadRegistrations() {
    setRegLoading(true);
    try {
      const params: any = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<PaginatedResponse<Registration>>(`/workshops/${id}/registrations`, { params });
      setRegistrations(data.data);
    } catch {
      toast.error('Failed to load registrations');
    } finally {
      setRegLoading(false);
    }
  }

  useEffect(() => { if (id) { loadWorkshop(); } }, [id]);
  useEffect(() => { if (id) { loadRegistrations(); } }, [id, statusFilter]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/workshops/${id}/registrations`, regForm);
      toast.success('Registration successful!');
      setShowRegModal(false);
      setRegForm({ attendeeName: '', attendeeEmail: '' });
      loadWorkshop();
      loadRegistrations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(regId: string) {
    const reason = prompt('Cancellation reason (optional):') ?? undefined;
    try {
      await api.post(`/registrations/${regId}/cancel`, { reason });
      toast.success('Registration cancelled');
      loadWorkshop();
      loadRegistrations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  }

  if (!workshop) return <div className="loading-state">Loading…</div>;

  const pct = Math.round((workshop.seatsTaken / workshop.capacity) * 100);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-ghost" onClick={() => navigate('/workshops')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="header-actions">
          {canEdit && (
            <button className="btn-secondary" onClick={() => navigate(`/workshops/${id}/edit`)}>
              <Edit size={14} /> Edit
            </button>
          )}
          {canRegister && workshop.status === 'OPEN' && (
            <button className="btn-primary" onClick={() => setShowRegModal(true)}>
              <UserPlus size={14} /> Register Attendee
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-card-header">
            <span className={`badge badge-${workshop.status.toLowerCase()}`}>{workshop.status}</span>
            <span className="ws-code-badge">{workshop.code}</span>
          </div>
          <h2 className="detail-title">{workshop.title}</h2>
          {workshop.description && <p className="detail-desc">{workshop.description}</p>}
          <div className="detail-meta">
            <div className="meta-item"><User size={15} /> <span>{workshop.instructor}</span></div>
            <div className="meta-item"><MapPin size={15} /> <span>{workshop.location}</span></div>
            <div className="meta-item"><Clock size={15} /> <span>{format(new Date(workshop.starts_at), 'PPP p')} – {format(new Date(workshop.ends_at), 'p')}</span></div>
            <div className="meta-item"><Users size={15} />
              <span>{workshop.seatsAvailable} of {workshop.capacity} seats available</span>
            </div>
          </div>
          <div className="capacity-bar-track" style={{ marginTop: 12 }}>
            <div className="capacity-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>

        <div>
          <div className="section-header" style={{ marginBottom: 12 }}>
            <h3>Registrations ({registrations.length})</h3>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {regLoading ? (
            <div className="loading-state">Loading…</div>
          ) : registrations.length === 0 ? (
            <div className="empty-state">No registrations yet.</div>
          ) : (
            <div className="reg-table-wrap">
              <table className="reg-table">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Registered At</th>
                    {canRegister && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.attendeeName}</td>
                      <td className="text-muted">{r.attendeeEmail}</td>
                      <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                      <td className="text-muted">{format(new Date(r.registeredAt), 'MMM d, p')}</td>
                      {canRegister && (
                        <td>
                          {r.status === 'ACTIVE' && (
                            <button className="btn-danger-sm" onClick={() => handleCancel(r.id)}>Cancel</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showRegModal && (
        <div className="modal-overlay" onClick={() => setShowRegModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Register Attendee</h3>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Full Name</label>
                <input required value={regForm.attendeeName} onChange={(e) => setRegForm({ ...regForm, attendeeName: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={regForm.attendeeEmail} onChange={(e) => setRegForm({ ...regForm, attendeeEmail: e.target.value })} placeholder="jane@example.com" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRegModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Registering…' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

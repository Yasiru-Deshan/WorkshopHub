import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Workshop, PaginatedResponse } from '../lib/types';
import { format } from 'date-fns';
import { Search, Plus, MapPin, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['DRAFT', 'OPEN', 'CANCELLED', 'COMPLETED'];

export default function WorkshopsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [hasSeats, setHasSeats] = useState(false);
  const [page, setPage] = useState(1);

  const canCreate = user?.role === 'MANAGER';

  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (q) params.q = q;
      if (status) params.status = status;
      if (location) params.location = location;
      if (hasSeats) params.hasSeats = true;
      const { data } = await api.get<PaginatedResponse<Workshop>>('/workshops', { params });
      if (Array.isArray(data)) {
        setWorkshops(data as any);
        setMeta({ page: 1, limit: 20, total: (data as any).length });
      } else {
        setWorkshops(data.data ?? []);
        setMeta(data.meta ?? { page: 1, limit: 20, total: data.data?.length ?? 0 });
      }
    } catch {
      toast.error('Failed to load workshops');
    } finally {
      setLoading(false);
    }
  }, [q, status, location, hasSeats, page]);

  useEffect(() => { fetchWorkshops(); }, [fetchWorkshops]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchWorkshops();
  }

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Workshops</h2>
          <p className="page-subtitle">{meta.total} workshops found</p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => navigate('/workshops/new')}>
            <Plus size={16} /> New Workshop
          </button>
        )}
      </div>

      {/* Filters */}
      <form className="filters-bar" onSubmit={handleSearch}>
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by title, code, instructor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="filter-select">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          className="filter-input"
          placeholder="Location"
          value={location}
          onChange={(e) => { setLocation(e.target.value); setPage(1); }}
        />
        <label className="checkbox-label">
          <input type="checkbox" checked={hasSeats} onChange={(e) => { setHasSeats(e.target.checked); setPage(1); }} />
          Has seats
        </label>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {loading ? (
        <div className="loading-state">Loading…</div>
      ) : workshops.length === 0 ? (
        <div className="empty-state">No workshops match your filters.</div>
      ) : (
        <div className="workshops-grid">
          {workshops.map((w) => <WorkshopCard key={w.id} workshop={w} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary">← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary">Next →</button>
        </div>
      )}
    </div>
  );
}

function WorkshopCard({ workshop: w }: { workshop: Workshop }) {
  const pct = Math.round((w.seatsTaken / w.capacity) * 100);
  const full = w.seatsAvailable === 0;

  return (
    <Link to={`/workshops/${w.id}`} className="workshop-card">
      <div className="card-top">
        <span className={`badge badge-${w.status.toLowerCase()}`}>{w.status}</span>
        <span className="ws-code-badge">{w.code}</span>
      </div>
      <h3 className="card-title">{w.title}</h3>
      <div className="card-meta">
        <span><User size={13} /> {w.instructor}</span>
        <span><MapPin size={13} /> {w.location}</span>
        <span><Clock size={13} /> {format(new Date(w.starts_at), 'MMM d, yyyy')}</span>
      </div>
      <div className="capacity-bar-wrap">
        <div className="capacity-bar-track">
          <div
            className={`capacity-bar-fill ${full ? 'full' : ''}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="capacity-text">
          {full ? 'Full' : `${w.seatsAvailable} / ${w.capacity} seats`}
        </span>
      </div>
    </Link>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Workshop, PaginatedResponse } from '../lib/types';
import {
  CalendarDays,
  // Users, 
  CheckCircle,
  // XCircle 
} from 'lucide-react';

interface Stats {
  totalWorkshops: number;
  openWorkshops: number;
  totalCapacity: number;
  totalTaken: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') return;
    api.get<PaginatedResponse<Workshop>>('/workshops?limit=100').then(({ data }) => {
      const ws = data.data;
      setWorkshops(ws.slice(0, 5));
      setStats({
        totalWorkshops: data.meta.total,
        openWorkshops: ws.filter((w) => w.status === 'OPEN').length,
        totalCapacity: ws.reduce((a, w) => a + w.capacity, 0),
        totalTaken: ws.reduce((a, w) => a + w.seatsTaken, 0),
      });
    });
  }, [user]);

  if (user?.role === 'ADMIN') {
    return (
      <div className="page">
        <h2 className="page-title">Dashboard</h2>
        <div className="empty-state">
          <p>Welcome, {user.full_name}! Use the <Link to="/users">Users</Link> section to manage accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>
      <p className="page-subtitle">Welcome back, {user?.full_name}</p>

      {stats && (
        <div className="stats-grid">
          <StatCard icon={<CalendarDays size={22} />} label="Total Workshops" value={stats.totalWorkshops} color="blue" />
          <StatCard icon={<CheckCircle size={22} />} label="Open Workshops" value={stats.openWorkshops} color="green" />
          {/* <StatCard icon={<Users size={22} />} label="Seats Taken" value={stats.totalTaken} color="amber" />
          <StatCard icon={<XCircle size={22} />} label="Seats Available" value={stats.totalCapacity - stats.totalTaken} color="red" /> */}
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <h3>Recent Workshops</h3>
          <Link to="/workshops" className="link-sm">View all →</Link>
        </div>
        <div className="workshop-list">
          {workshops.map((w) => (
            <Link key={w.id} to={`/workshops/${w.id}`} className="workshop-row">
              <div>
                <span className="ws-code">{w.code}</span>
                <span className="ws-title">{w.title}</span>
              </div>
              <div className="ws-row-right">
                <span className={`badge badge-${w.status.toLowerCase()}`}>{w.status}</span>
                <span className="ws-seats">{w.seatsAvailable} left</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

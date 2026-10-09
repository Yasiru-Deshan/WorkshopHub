import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import type { Workshop } from '../lib/types';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['CANCELLED', 'COMPLETED'],
  CANCELLED: [],
  COMPLETED: [],
};

export default function WorkshopFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);

  const [form, setForm] = useState({
    code: '', title: '', instructor: '', location: '', description: '',
    starts_at: '', ends_at: '', capacity: 10, status: 'DRAFT',
  });

  useEffect(() => {
    if (isEdit) {
      api.get<Workshop>(`/workshops/${id}`).then(({ data }) => {
        setWorkshop(data);
        setForm({
          code: data.code,
          title: data.title,
          instructor: data.instructor,
          location: data.location,
          description: data.description || '',
          starts_at: data.starts_at.slice(0, 16),
          ends_at: data.ends_at.slice(0, 16),
          capacity: data.capacity,
          status: data.status,
        });
      });
    }
  }, [id, isEdit]);

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        ...form,
        capacity: Number(form.capacity),
        code: form.code.toUpperCase(),
      };
      if (isEdit) {
        await api.patch(`/workshops/${id}`, body);
        toast.success('Workshop updated');
      } else {
        await api.post('/workshops', body);
        toast.success('Workshop created');
      }
      navigate('/workshops');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  const allowedStatuses = isEdit && workshop ? STATUS_TRANSITIONS[workshop.status] : [];

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
      <div className="form-card">
        <h2 className="page-title">{isEdit ? 'Edit Workshop' : 'New Workshop'}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Code <span className="required">*</span></label>
            <input required value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="POT-101" />
          </div>
          <div className="form-group">
            <label>Title <span className="required">*</span></label>
            <input required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Intro to Pottery" />
          </div>
          <div className="form-group">
            <label>Instructor <span className="required">*</span></label>
            <input required value={form.instructor} onChange={(e) => set('instructor', e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="form-group">
            <label>Location <span className="required">*</span></label>
            <input required value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Downtown" />
          </div>
          <div className="form-group span-2">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Workshop description…" />
          </div>
          <div className="form-group">
            <label>Starts At <span className="required">*</span></label>
            <input required type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Ends At <span className="required">*</span></label>
            <input required type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Capacity <span className="required">*</span></label>
            <input required type="number" min="1" max="10000" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} />
          </div>
          {isEdit && allowedStatuses.length > 0 && (
            <div className="form-group">
              <label>Change Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value={workshop?.status}>{workshop?.status} (current)</option>
                {allowedStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="form-actions span-2">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Workshop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

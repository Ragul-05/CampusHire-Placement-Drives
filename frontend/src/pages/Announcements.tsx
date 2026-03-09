import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Trash2, X, Megaphone, Calendar, MapPin,
  RefreshCw, ChevronLeft, CheckCircle2, AlertCircle,
  Bell, Clock, Filter, Edit3, CalendarDays
} from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, postJson, deleteJson, facultyUrl } from '../utils/api';
import AdminLayout from '../components/AdminLayout';
import FacultyLayout from '../components/FacultyLayout';

/* ══════════════════════════════════
   TYPES — aligned with backend models
══════════════════════════════════ */

/* Announcement model:
   id, title, content, scope(GLOBAL|DEPARTMENT),
   department{id,name}, createdBy{email}, createdAt */
type Announcement = {
  id: number;
  title: string;
  content: string;
  scope: 'GLOBAL' | 'DEPARTMENT';
  department?: { id: number; name: string } | null;
  createdBy?: { email: string } | string | null;
  createdAt: string;
};

/* Event model:
   id, title, description, scheduledAt, locationOrLink, department */
type CampusEvent = {
  id: number;
  title: string;
  description: string;
  scheduledAt: string;
  locationOrLink: string;
  department?: { id: number; name: string } | null;
};

type Tab = 'announcements' | 'events';

/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function creatorEmail(a: Announcement): string {
  if (!a.createdBy) return '—';
  if (typeof a.createdBy === 'string') return a.createdBy;
  return (a.createdBy as any).email ?? '—';
}

function fmtDate(dt: string | null | undefined): string {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function fmtDateTime(dt: string | null | undefined): string {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function isPast(dt: string | null | undefined): boolean {
  if (!dt) return false;
  return new Date(dt) < new Date();
}

/* ── Toast ── */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`sv-toast sv-toast-${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{msg}</span>
      <button className="sv-toast-close" onClick={onClose}><X size={14} /></button>
    </div>
  );
}

/* ── Confirm delete dialog ── */
function ConfirmDelete({ label, onConfirm, onCancel, loading }: {
  label: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="sv-confirm-overlay" onClick={onCancel}>
      <div className="sv-confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="sv-confirm-icon reject"><Trash2 size={26} /></div>
        <h3 className="sv-confirm-title">Delete {label}?</h3>
        <p className="sv-confirm-sub">This action cannot be undone.</p>
        <div className="sv-confirm-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   CREATE ANNOUNCEMENT MODAL
══════════════════════════════════ */
function AnnouncementModal({ onClose, onSaved, isFaculty }: {
  onClose: () => void; onSaved: () => void; isFaculty: boolean;
}) {
  const [form, setForm]         = useState({ title: '', content: '', scope: isFaculty ? 'DEPARTMENT' : 'GLOBAL', departmentId: '' });
  const [departments, setDepts] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSub]    = useState(false);
  const [err, setErr]           = useState('');

  // Load departments for admin scope=DEPARTMENT picker
  useEffect(() => {
    if (!isFaculty) {
      getJson<{ id: number; name: string }[]>('/api/admin/departments')
        .then(r => setDepts(r.data || []))
        .catch(() => {});
    }
  }, [isFaculty]);

  const handleSubmit = async () => {
    if (!form.title.trim())   { setErr('Title is required');   return; }
    if (!form.content.trim()) { setErr('Content is required'); return; }
    try {
      setSub(true); setErr('');
      const url = isFaculty
        ? facultyUrl('/api/faculty/announcements')
        : '/api/admin/announcements';

      const body: Record<string, unknown> = {
        title:   form.title.trim(),
        content: form.content.trim(),
        scope:   isFaculty ? 'DEPARTMENT' : form.scope,
      };
      // Only send departmentId if admin chose DEPARTMENT scope
      if (!isFaculty && form.scope === 'DEPARTMENT' && form.departmentId) {
        body.departmentId = Number(form.departmentId);
      }

      await postJson(url, body);
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message || 'Failed to create announcement');
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="sv-modal-overlay" onClick={onClose}>
      <div className="sv-modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="sv-modal-header">
          <div className="sv-modal-title-block">
            <div className="ac-modal-icon ann"><Megaphone size={18} color="#6366f1" /></div>
            <div>
              <h3 className="sv-modal-name">New Announcement</h3>
              <p className="sv-modal-meta">{isFaculty ? 'Publish to your department' : 'Publish to students'}</p>
            </div>
          </div>
          <button className="sv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="sv-modal-body">
          {err && (
            <div className="faculty-alert-banner" style={{ marginBottom: 14 }}>
              <AlertCircle size={15} /><span>{err}</span>
            </div>
          )}

          <div className="ac-form-group">
            <label className="ac-label">Title <span className="ac-required">*</span></label>
            <input className="ac-input" placeholder="e.g. Placement Drive Notice"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="ac-form-group">
            <label className="ac-label">Content <span className="ac-required">*</span></label>
            <textarea className="ac-textarea" rows={5}
              placeholder="Write the announcement content…"
              value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          </div>

          {/* Admin: scope + optional department selector */}
          {!isFaculty && (
            <>
              <div className="ac-form-group">
                <label className="ac-label">Audience</label>
                <select className="ac-select"
                  value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value, departmentId: '' })}>
                  <option value="GLOBAL">🌐 All Students (Global)</option>
                  <option value="DEPARTMENT">🏫 Specific Department</option>
                </select>
              </div>
              {form.scope === 'DEPARTMENT' && (
                <div className="ac-form-group">
                  <label className="ac-label">Department <span className="ac-required">*</span></label>
                  <select className="ac-select"
                    value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">— Select Department —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sv-modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   CREATE EVENT MODAL
══════════════════════════════════ */
function EventModal({ onClose, onSaved, isFaculty }: {
  onClose: () => void; onSaved: () => void; isFaculty: boolean;
}) {
  const [form, setForm]       = useState({
    title: '', description: '', scheduledAt: '', locationOrLink: ''
  });
  const [submitting, setSub]  = useState(false);
  const [err, setErr]         = useState('');

  const handleSubmit = async () => {
    if (!form.title.trim())       { setErr('Title is required'); return; }
    if (!form.scheduledAt)        { setErr('Scheduled date/time is required'); return; }
    try {
      setSub(true); setErr('');
      const url = isFaculty
        // ✅ POST /api/faculty/events?facultyEmail=
        ? facultyUrl('/api/faculty/events')
        : '/api/admin/events';
      await postJson(url, {
        title:           form.title.trim(),
        description:     form.description.trim(),
        scheduledAt:     form.scheduledAt,   // ISO string from datetime-local input
        locationOrLink:  form.locationOrLink.trim(),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message || 'Failed to create event');
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="sv-modal-overlay" onClick={onClose}>
      <div className="sv-modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="sv-modal-header">
          <div className="sv-modal-title-block">
            <div className="ac-modal-icon evt"><CalendarDays size={18} color="#10b981" /></div>
            <div>
              <h3 className="sv-modal-name">New Event</h3>
              <p className="sv-modal-meta">Schedule a department event</p>
            </div>
          </div>
          <button className="sv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="sv-modal-body">
          {err && (
            <div className="faculty-alert-banner" style={{ marginBottom: 14 }}>
              <AlertCircle size={15} /><span>{err}</span>
            </div>
          )}

          <div className="ac-form-group">
            <label className="ac-label">Event Title <span className="ac-required">*</span></label>
            <input className="ac-input" placeholder="e.g. Pre-Placement Talk — TCS"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="ac-form-group">
            <label className="ac-label">Description</label>
            <textarea className="ac-textarea" rows={3}
              placeholder="Describe the event…"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="ac-form-row">
            <div className="ac-form-group" style={{ flex: 1 }}>
              <label className="ac-label">Date &amp; Time <span className="ac-required">*</span></label>
              <input className="ac-input" type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
            <div className="ac-form-group" style={{ flex: 1 }}>
              <label className="ac-label">Location / Link</label>
              <input className="ac-input" placeholder="Room 204 or https://meet.google.com/…"
                value={form.locationOrLink}
                onChange={e => setForm({ ...form, locationOrLink: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="sv-modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}
            style={{ background: '#10b981', borderColor: '#10b981' }}>
            {submitting ? 'Scheduling…' : 'Schedule Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   MAIN PAGE
══════════════════════════════════ */
export default function Announcements({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const userRole  = localStorage.getItem('role');
  const isFaculty = userRole === 'FACULTY';
  const Layout    = isFaculty ? FacultyLayout : AdminLayout;
  const activeNav = isFaculty ? 'alerts' : 'alerts';

  const [tab, setTab]                       = useState<Tab>('announcements');
  const [announcements, setAnnouncements]   = useState<Announcement[]>([]);
  const [events, setEvents]                 = useState<CampusEvent[]>([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [scopeFilter, setScopeFilter]       = useState<'ALL' | 'GLOBAL' | 'DEPARTMENT'>('ALL');

  const [showAnnModal, setShowAnnModal]     = useState(false);
  const [showEvtModal, setShowEvtModal]     = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<{ id: number; type: 'ann' | 'evt'; label: string } | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [toast, setToast]                   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [refreshKey, setRefreshKey]         = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') =>
    setToast({ msg, type });

  /* ── Load all data ── */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const annUrl = isFaculty
          ? facultyUrl('/api/faculty/announcements')   // ✅ GET /api/faculty/announcements?facultyEmail=
          : '/api/admin/announcements';
        const evtUrl = isFaculty
          ? facultyUrl('/api/faculty/events')          // ✅ GET /api/faculty/events?facultyEmail=
          : '/api/admin/events';

        const [annRes, evtRes] = await Promise.all([
          getJson<Announcement[]>(annUrl),
          getJson<CampusEvent[]>(evtUrl),
        ]);
        if (!active) return;
        setAnnouncements(annRes.data || []);
        setEvents(evtRes.data || []);
      } catch (e: any) {
        if (active) showToast(e.message || 'Failed to load data', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [refreshKey, isFaculty]);

  /* ── Filtered announcements ── */
  const displayedAnn = useMemo(() => {
    let list = announcements;
    if (scopeFilter !== 'ALL') list = list.filter(a => a.scope === scopeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [announcements, scopeFilter, search]);

  /* ── Filtered events ── */
  const displayedEvt = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.description ?? '').toLowerCase().includes(q) ||
      (e.locationOrLink ?? '').toLowerCase().includes(q)
    );
  }, [events, search]);

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.type === 'ann') {
        const url = isFaculty
          // ✅ DELETE /api/faculty/announcements/{id}?facultyEmail=
          ? facultyUrl(`/api/faculty/announcements/${deleteTarget.id}`)
          : `/api/admin/announcements/${deleteTarget.id}`;
        await deleteJson(url);
        setAnnouncements(prev => prev.filter(a => a.id !== deleteTarget.id));
        showToast('Announcement deleted');
      } else {
        const url = isFaculty
          // ✅ DELETE /api/faculty/events/{id}?facultyEmail=
          ? facultyUrl(`/api/faculty/events/${deleteTarget.id}`)
          : `/api/admin/events/${deleteTarget.id}`;
        await deleteJson(url);
        setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
        showToast('Event deleted');
      }
    } catch (e: any) {
      showToast(e.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const onSaved = () => {
    showToast(tab === 'announcements' ? 'Announcement published!' : 'Event scheduled!');
    setRefreshKey(k => k + 1);
  };

  /* ══ RENDER ══ */
  return (
    <Layout activeNav={activeNav} onNavigate={onNavigate}>
      <div className="content">

        {/* ── Page header ── */}
        <div className="ac-page-header fade-in">
          <div>
            <h1 className="page-title">Announcements &amp; Events</h1>
            <p className="page-subtitle">Manage department communications — announcements and scheduled events</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
              <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh
            </button>
            {isFaculty && (
              <button className="btn-secondary" onClick={() => onNavigate?.('facultyDashboard')}>
                <ChevronLeft size={15} /> Dashboard
              </button>
            )}
            {tab === 'announcements' ? (
              <button className="btn-primary ac-btn-ann" onClick={() => setShowAnnModal(true)}>
                <Plus size={15} /> New Announcement
              </button>
            ) : (
              <button className="btn-primary ac-btn-evt" onClick={() => setShowEvtModal(true)}>
                <Plus size={15} /> Schedule Event
              </button>
            )}
          </div>
        </div>

        {/* ── Tab bar + filters ── */}
        <div className="ac-tab-bar fade-in">
          <div className="ac-tabs">
            <button
              className={`ac-tab ${tab === 'announcements' ? 'active' : ''}`}
              onClick={() => { setTab('announcements'); setSearch(''); }}
            >
              <Megaphone size={15} />
              Announcements
              <span className="ac-tab-badge">{announcements.length}</span>
            </button>
            <button
              className={`ac-tab ${tab === 'events' ? 'active' : ''}`}
              onClick={() => { setTab('events'); setSearch(''); setScopeFilter('ALL'); }}
            >
              <CalendarDays size={15} />
              Events
              <span className="ac-tab-badge evt">{events.length}</span>
            </button>
          </div>

          <div className="ac-filters">
            <div className="sv-search-box" style={{ minWidth: 220 }}>
              <Search size={14} color="#94a3b8" />
              <input placeholder={tab === 'announcements' ? 'Search announcements…' : 'Search events…'}
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button className="sv-search-clear" onClick={() => setSearch('')}><X size={12} /></button>
              )}
            </div>
            {tab === 'announcements' && !isFaculty && (
              <select className="ac-scope-select" value={scopeFilter}
                onChange={e => setScopeFilter(e.target.value as any)}>
                <option value="ALL">All Scopes</option>
                <option value="GLOBAL">Global</option>
                <option value="DEPARTMENT">Department</option>
              </select>
            )}
            <span className="sv-result-count">
              {loading ? '…' : tab === 'announcements'
                ? `${displayedAnn.length} announcement${displayedAnn.length !== 1 ? 's' : ''}`
                : `${displayedEvt.length} event${displayedEvt.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* ══ ANNOUNCEMENTS TAB ══ */}
        {tab === 'announcements' && (
          <div className="ac-ann-section fade-in">
            {loading ? (
              <div className="ac-table-card">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="sk-table-row">
                    {[35, 20, 12, 10, 8].map((w, j) => (
                      <div key={j} className="sk-box sk-text-sm" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ))}
              </div>
            ) : displayedAnn.length === 0 ? (
              <div className="faculty-empty-state ac-empty fade-in">
                <Megaphone size={48} color="#94a3b8" />
                <h4>No Announcements</h4>
                <p>{search ? 'No announcements match your search' : 'Create your first announcement to notify students'}</p>
                {!search && (
                  <button className="btn-primary ac-btn-ann" style={{ marginTop: 8 }}
                    onClick={() => setShowAnnModal(true)}>
                    <Plus size={14} /> Create Announcement
                  </button>
                )}
              </div>
            ) : (
              <div className="ac-table-card fade-in">
                <table className="ac-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Content Preview</th>
                      <th>Scope</th>
                      <th>Department</th>
                      <th>Created By</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedAnn.map((ann, idx) => (
                      <tr key={ann.id} className="ac-ann-row fade-in">
                        <td className="sm-row-num">{idx + 1}</td>
                        <td>
                          <div className="ac-ann-title-cell">
                            <div className="ac-ann-icon"><Bell size={13} color="#6366f1" /></div>
                            <span className="ac-ann-title">{ann.title}</span>
                          </div>
                        </td>
                        <td>
                          <span className="ac-content-preview">{ann.content}</span>
                        </td>
                        <td>
                          <span className={`badge ${ann.scope === 'GLOBAL' ? 'info' : 'warning'}`}>
                            {ann.scope}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {ann.department?.name ?? (ann.scope === 'GLOBAL' ? 'All Depts.' : '—')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {creatorEmail(ann).split('@')[0]}
                          </span>
                        </td>
                        <td>
                          <div className="ac-date-cell">
                            <Clock size={11} color="#94a3b8" />
                            <span>{fmtDate(ann.createdAt)}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="icon-btn delete"
                            title="Delete announcement"
                            onClick={() => setDeleteTarget({ id: ann.id, type: 'ann', label: 'Announcement' })}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ EVENTS TAB ══ */}
        {tab === 'events' && (
          <div className="ac-events-section fade-in">
            {loading ? (
              <div className="ac-event-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="ac-event-card">
                    <div className="sk-box" style={{ height: 120, borderRadius: 14 }} />
                  </div>
                ))}
              </div>
            ) : displayedEvt.length === 0 ? (
              <div className="faculty-empty-state ac-empty fade-in">
                <CalendarDays size={48} color="#94a3b8" />
                <h4>No Events</h4>
                <p>{search ? 'No events match your search' : 'Schedule your first department event'}</p>
                {!search && (
                  <button className="btn-primary ac-btn-evt" style={{ marginTop: 8 }}
                    onClick={() => setShowEvtModal(true)}>
                    <Plus size={14} /> Schedule Event
                  </button>
                )}
              </div>
            ) : (
              <div className="ac-event-grid fade-in">
                {displayedEvt.map(evt => {
                  const past = isPast(evt.scheduledAt);
                  return (
                    <div key={evt.id} className={`ac-event-card ${past ? 'ac-event-past' : ''}`}>
                      {/* Status ribbon */}
                      <div className={`ac-event-ribbon ${past ? 'past' : 'upcoming'}`}>
                        {past ? 'Completed' : 'Upcoming'}
                      </div>

                      {/* Header */}
                      <div className="ac-event-header">
                        <div className="ac-event-icon-wrap">
                          <CalendarDays size={20} color={past ? '#94a3b8' : '#10b981'} />
                        </div>
                        <button className="icon-btn delete ac-event-delete"
                          title="Delete event"
                          onClick={() => setDeleteTarget({ id: evt.id, type: 'evt', label: 'Event' })}>
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="ac-event-title">{evt.title}</h3>

                      {/* Description */}
                      {evt.description && (
                        <p className="ac-event-desc">{evt.description}</p>
                      )}

                      {/* Meta */}
                      <div className="ac-event-meta">
                        <div className="ac-event-meta-row">
                          <Clock size={13} color="#64748b" />
                          <span className={past ? 'ac-meta-past' : 'ac-meta-upcoming'}>
                            {fmtDateTime(evt.scheduledAt)}
                          </span>
                        </div>
                        {evt.locationOrLink && (
                          <div className="ac-event-meta-row">
                            <MapPin size={13} color="#64748b" />
                            <span className="ac-meta-location">{evt.locationOrLink}</span>
                          </div>
                        )}
                        {evt.department?.name && (
                          <div className="ac-event-meta-row">
                            <Filter size={13} color="#64748b" />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{evt.department.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      {showAnnModal && (
        <AnnouncementModal
          isFaculty={isFaculty}
          onClose={() => setShowAnnModal(false)}
          onSaved={onSaved}
        />
      )}
      {showEvtModal && (
        <EventModal
          isFaculty={isFaculty}
          onClose={() => setShowEvtModal(false)}
          onSaved={onSaved}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          label={deleteTarget.label}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}

import { useEffect, useState, useCallback } from 'react';
import StudentLayout from '../components/StudentLayout';
import { getJson } from '../utils/api';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface AnnouncementDTO {
  id: number;
  title: string;
  content: string;
  scope: 'GLOBAL' | 'DEPARTMENT';
  departmentName: string | null;
  createdByEmail: string;
  postedByRole: 'PLACEMENT_HEAD' | 'FACULTY' | 'SYSTEM';
  postedByName: string;
  createdAt: string;
}

interface EventDTO {
  id: number;
  title: string;
  description: string;
  scheduledAt: string;
  locationOrLink: string | null;
  departmentName: string | null;
  scope: 'GLOBAL' | 'DEPARTMENT';
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function timeAgo(iso: string | null) {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return fmtDate(iso);
  } catch { return ''; }
}

function isUpcoming(iso: string | null) {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

function daysUntil(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return null;
  return Math.ceil(diff / 86400000);
}

/* ─────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────── */
function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16,
      padding: '18px 20px', animation: 'shimmer 1.4s infinite',
      backgroundImage: 'linear-gradient(90deg,#f8fafc 25%,#f1f5f9 50%,#f8fafc 75%)',
      backgroundSize: '200% 100%',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#e2e8f0', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 15, width: wide ? '55%' : '70%', background: '#e2e8f0', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 12, width: '90%', background: '#f1f5f9', borderRadius: 6, marginBottom: 5 }} />
          <div style={{ height: 12, width: '75%', background: '#f1f5f9', borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANNOUNCEMENT CARD
───────────────────────────────────────────── */
function AnnouncementCard({ ann }: { ann: AnnouncementDTO }) {
  const [expanded, setExpanded] = useState(false);
  const isGlobal    = ann.scope === 'GLOBAL';
  const isPlacementHead = ann.postedByRole === 'PLACEMENT_HEAD';
  const isFaculty   = ann.postedByRole === 'FACULTY';
  const preview     = ann.content.length > 160 ? ann.content.slice(0, 160) + '…' : ann.content;

  // Colour scheme: blue = placement head / global, purple = faculty / dept
  const accentColor  = isPlacementHead ? '#2563eb' : '#7c3aed';
  const borderColor  = isPlacementHead ? '#bfdbfe'  : '#ddd6fe';
  const bgGradient   = isPlacementHead
    ? 'linear-gradient(135deg,#dbeafe,#eff6ff)'
    : 'linear-gradient(135deg,#ede9fe,#f5f3ff)';
  const tagBg        = isPlacementHead ? '#dbeafe'  : '#ede9fe';
  const tagColor     = isPlacementHead ? '#1e40af'  : '#5b21b6';
  const posterBg     = isPlacementHead ? '#f0f9ff'  : '#faf5ff';
  const posterColor  = isPlacementHead ? '#0369a1'  : '#6d28d9';
  const posterBorder = isPlacementHead ? '#bae6fd'  : '#ddd6fe';

  return (
    <div
      style={{
        background: '#fff',
        border: `1.5px solid ${borderColor}`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 14,
        padding: '16px 18px',
        transition: 'box-shadow .15s, transform .15s',
        cursor: 'pointer',
        animation: 'fadeIn .35s ease both',
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 18px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: bgGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {isPlacementHead ? '📢' : isFaculty ? '🏫' : '📋'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + scope badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{ann.title}</span>
            {/* Scope badge */}
            <span style={{
              padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800,
              background: tagBg, color: tagColor,
              border: `1px solid ${borderColor}`,
              flexShrink: 0,
            }}>
              {isGlobal ? '🌐 Global' : `🏫 ${ann.departmentName || 'Department'}`}
            </span>
          </div>

          {/* Posted-by pill — KEY new badge showing Faculty or Placement Head */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800,
              background: posterBg, color: posterColor,
              border: `1px solid ${posterBorder}`,
            }}>
              {isPlacementHead ? '🎓 Posted by Placement Head'
                : isFaculty     ? `👨‍🏫 Posted by ${ann.postedByName}`
                :                  '📋 Posted by System'}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
              🕐 {timeAgo(ann.createdAt)} · {fmtDate(ann.createdAt)}
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <span style={{
          fontSize: 14, color: '#94a3b8', transition: 'transform .2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0, marginTop: 2,
        }}>▼</span>
      </div>

      {/* Content */}
      <div style={{
        fontSize: 13, color: '#475569', lineHeight: 1.65,
        paddingLeft: 50,
        whiteSpace: 'pre-wrap',
      }}>
        {expanded ? ann.content : preview}
        {ann.content.length > 160 && (
          <span style={{ color: isGlobal ? '#2563eb' : '#7c3aed', fontWeight: 700, marginLeft: 4 }}>
            {expanded ? ' Show less' : ' Read more'}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EVENT CARD
───────────────────────────────────────────── */
function EventCard({ ev }: { ev: EventDTO }) {
  const upcoming  = isUpcoming(ev.scheduledAt);
  const days      = daysUntil(ev.scheduledAt);
  const isGlobal  = ev.scope === 'GLOBAL';

  return (
    <div style={{
      background: upcoming
        ? 'linear-gradient(135deg,#f0fdf4,#fff)'
        : '#fff',
      border: `1.5px solid ${upcoming ? '#86efac' : '#e2e8f0'}`,
      borderLeft: `4px solid ${upcoming ? '#16a34a' : '#94a3b8'}`,
      borderRadius: 14,
      padding: '16px 18px',
      transition: 'box-shadow .15s, transform .15s',
      animation: 'fadeIn .35s ease both',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseOver={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 18px rgba(0,0,0,0.07)';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
    }}
    onMouseOut={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
    }}
    >
      {/* Countdown ribbon */}
      {upcoming && days !== null && days <= 7 && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          background: days === 0 ? '#ef4444' : days <= 2 ? '#f97316' : '#16a34a',
          color: '#fff', fontSize: 10, fontWeight: 800,
          padding: '3px 9px', borderRadius: 99,
        }}>
          {days === 0 ? 'Today!' : `In ${days}d`}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: upcoming
            ? 'linear-gradient(135deg,#dcfce7,#f0fdf4)'
            : 'linear-gradient(135deg,#f1f5f9,#f8fafc)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {upcoming ? '🗓️' : '📆'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{ev.title}</span>
            <span style={{
              padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 800,
              background: upcoming ? '#dcfce7' : '#f1f5f9',
              color: upcoming ? '#15803d' : '#64748b',
              border: `1px solid ${upcoming ? '#86efac' : '#e2e8f0'}`,
            }}>
              {upcoming ? '🟢 Upcoming' : '⚫ Past'}
            </span>
            {!isGlobal && ev.departmentName && (
              <span style={{
                padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe',
              }}>
                🏫 {ev.departmentName}
              </span>
            )}
          </div>

          {ev.description && (
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              {ev.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              color: upcoming ? '#15803d' : '#64748b', fontWeight: 700,
            }}>
              🕐 {fmtDateTime(ev.scheduledAt)}
            </span>
            {ev.locationOrLink && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#2563eb', fontWeight: 600 }}>
                📍 {ev.locationOrLink.startsWith('http')
                  ? <a href={ev.locationOrLink} target="_blank" rel="noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'underline' }}>Join Link</a>
                  : ev.locationOrLink}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────── */
function SectionHeader({ icon, title, count, color }: {
  icon: string; title: string; count: number; color: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 14,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{title}</h2>
      </div>
      <span style={{
        marginLeft: 'auto',
        background: `${color}18`, color, border: `1px solid ${color}44`,
        borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 800,
      }}>
        {count} {count === 1 ? 'item' : 'items'}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EMPTY SECTION
───────────────────────────────────────────── */
function EmptySection({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '32px 20px',
      background: '#fff', border: '1.5px dashed #e2e8f0',
      borderRadius: 14, color: '#94a3b8',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{message}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATS BAR
───────────────────────────────────────────── */
function StatsBar({ global: gCount, dept: dCount, events: eCount }: {
  global: number; dept: number; events: number;
}) {
  const items = [
    { label: 'Global',       value: gCount, icon: '🌐', bg: '#dbeafe', color: '#1e40af' },
    { label: 'Department',   value: dCount, icon: '🏫', bg: '#ede9fe', color: '#5b21b6' },
    { label: 'Events',       value: eCount, icon: '🗓️', bg: '#dcfce7', color: '#15803d' },
  ];
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
      {items.map(it => (
        <div key={it.label} style={{
          flex: '1 1 100px',
          background: '#fff', border: '1.5px solid #e2e8f0',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: it.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {it.icon}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{it.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function StudentAnnouncements() {
  const email = localStorage.getItem('email') || '';

  const [announcements, setAnnouncements] = useState<AnnouncementDTO[]>([]);
  const [events,        setEvents]        = useState<EventDTO[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [tab,           setTab]           = useState<'all' | 'global' | 'department' | 'events'>('all');
  const [search,        setSearch]        = useState('');

  const loadData = useCallback(async () => {
    if (!email) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const [annRes, evRes] = await Promise.all([
        getJson<AnnouncementDTO[]>(`/api/student/announcements?email=${encodeURIComponent(email)}`),
        getJson<EventDTO[]>(`/api/student/events?email=${encodeURIComponent(email)}`),
      ]);
      setAnnouncements(annRes.data || []);
      setEvents(evRes.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds so new posts from Faculty/Placement Head
    // appear dynamically without a manual page reload
    const interval = setInterval(() => {
      loadData();
    }, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  /* ── Derived counts ── */
  const globalAnns = announcements.filter(a => a.scope === 'GLOBAL');
  const deptAnns   = announcements.filter(a => a.scope === 'DEPARTMENT');
  const upcomingEv = events.filter(e => isUpcoming(e.scheduledAt));
  const pastEv     = events.filter(e => !isUpcoming(e.scheduledAt));

  /* ── Search filter ── */
  const q = search.toLowerCase();
  const filteredAnns = announcements.filter(a =>
    !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
  );
  const filteredGlobal = filteredAnns.filter(a => a.scope === 'GLOBAL');
  const filteredDept   = filteredAnns.filter(a => a.scope === 'DEPARTMENT');
  const filteredEvents = events.filter(e =>
    !q || e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
  );

  /* ── Tab selection ── */
  const TAB_ITEMS: { key: typeof tab; label: string; icon: string; count: number }[] = [
    { key: 'all',        label: 'All',        icon: '📋', count: announcements.length + events.length },
    { key: 'global',     label: 'Global',     icon: '🌐', count: globalAnns.length                   },
    { key: 'department', label: 'Department', icon: '🏫', count: deptAnns.length                     },
    { key: 'events',     label: 'Events',     icon: '🗓️', count: events.length                       },
  ];

  return (
    <StudentLayout>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%{ background-position:-200% 0; } 100%{ background-position:200% 0; } }
        @keyframes pulse   { 0%,100%{ opacity:1; } 50%{ opacity:.5; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        .sa-tab { border: none; background: transparent; cursor: pointer; padding: 8px 16px;
                  border-radius: 10px; font-size: 13px; font-weight: 700; color: #64748b;
                  display: flex; align-items: center; gap: 6px; transition: all .15s; white-space: nowrap; }
        .sa-tab:hover { background: #f1f5f9; color: #1e293b; }
        .sa-tab.active { background: #2563eb; color: #fff; box-shadow: 0 3px 10px rgba(37,99,235,.3); }
        .sa-tab .sa-badge { background: rgba(255,255,255,.25); border-radius: 99px;
                            padding: 1px 7px; font-size: 11px; font-weight: 800; }
        .sa-tab:not(.active) .sa-badge { background: #f1f5f9; color: #64748b; }
        .sa-refresh-btn:hover { background: #eff6ff !important; }
        .sa-refresh-spin { animation: spin .6s linear; }
      `}</style>

      <div style={{ padding: '24px 28px', minHeight: '100vh', background: '#f8fafc' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 20, animation: 'fadeIn .3s ease', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
              📢 Announcements & Events
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              Stay updated with the latest news, department updates, and campus events.
            </p>
          </div>
          {/* Live indicator + manual refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#dcfce7', border: '1px solid #86efac',
              borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: '#15803d',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#16a34a',
                display: 'inline-block',
                boxShadow: '0 0 0 2px rgba(22,163,74,0.3)',
                animation: 'pulse 1.5s infinite',
              }} />
              Live · Refreshes every 30s
            </span>
            <button
              className="sa-refresh-btn"
              onClick={() => loadData()}
              disabled={loading}
              style={{
                border: '1.5px solid #e2e8f0', background: '#fff', borderRadius: 10,
                padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#2563eb',
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'background .15s',
              }}
              title="Refresh now"
            >
              <span className={loading ? 'sa-refresh-spin' : ''} style={{ fontSize: 13 }}>🔄</span>
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats / KPI bar ── */}
        {!loading && !error && (
          <StatsBar
            global={globalAnns.length}
            dept={deptAnns.length}
            events={upcomingEv.length}
          />
        )}

        {/* ── Search + Tabs ── */}
        <div style={{
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {TAB_ITEMS.map(t => (
              <button
                key={t.key}
                className={`sa-tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.icon} {t.label}
                <span className="sa-badge">{t.count}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>🔍</span>
            <input
              style={{
                paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13,
                outline: 'none', width: 200, transition: 'border-color .15s',
              }}
              onFocus={e  => (e.target.style.borderColor = '#2563eb')}
              onBlur={e   => (e.target.style.borderColor = '#e2e8f0')}
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>

        ) : error ? (
          <div style={{
            textAlign: 'center', padding: '50px 24px',
            background: '#fff', border: '1.5px solid #fca5a5', borderRadius: 16,
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
            <p style={{ color: '#991b1b', fontWeight: 700, margin: '0 0 10px' }}>Failed to load announcements</p>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{error}</p>
            <button onClick={loadData} style={{
              padding: '9px 20px', background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: 9, fontWeight: 700, cursor: 'pointer',
            }}>🔄 Retry</button>
          </div>

        ) : (
          <>
            {/* ══ ALL tab ══ */}
            {tab === 'all' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Global Announcements */}
                <section>
                  <SectionHeader icon="🌐" title="Global Announcements" count={filteredGlobal.length} color="#2563eb" />
                  {filteredGlobal.length === 0
                    ? <EmptySection icon="🌐" message="No global announcements yet." />
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredGlobal.map((a, i) => (
                          <div key={a.id} style={{ animationDelay: `${i * 0.06}s` }}>
                            <AnnouncementCard ann={a} />
                          </div>
                        ))}
                      </div>
                  }
                </section>

                {/* Department Announcements */}
                <section>
                  <SectionHeader icon="🏫" title="Department Announcements" count={filteredDept.length} color="#7c3aed" />
                  {filteredDept.length === 0
                    ? <EmptySection icon="🏫" message="No department announcements yet." />
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredDept.map((a, i) => (
                          <div key={a.id} style={{ animationDelay: `${i * 0.06}s` }}>
                            <AnnouncementCard ann={a} />
                          </div>
                        ))}
                      </div>
                  }
                </section>

                {/* Events */}
                <section>
                  <SectionHeader icon="🗓️" title="Upcoming Events" count={filteredEvents.filter(e => isUpcoming(e.scheduledAt)).length} color="#16a34a" />
                  {filteredEvents.length === 0
                    ? <EmptySection icon="🗓️" message="No events scheduled yet." />
                    : (
                      <>
                        {/* Upcoming */}
                        {upcomingEv.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                            {filteredEvents.filter(e => isUpcoming(e.scheduledAt)).map((ev, i) => (
                              <div key={ev.id} style={{ animationDelay: `${i * 0.06}s` }}>
                                <EventCard ev={ev} />
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Past */}
                        {pastEv.length > 0 && (
                          <>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                              Past Events
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {filteredEvents.filter(e => !isUpcoming(e.scheduledAt)).map((ev, i) => (
                                <div key={ev.id} style={{ animationDelay: `${i * 0.06}s` }}>
                                  <EventCard ev={ev} />
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )
                  }
                </section>
              </div>
            )}

            {/* ══ GLOBAL tab ══ */}
            {tab === 'global' && (
              <div>
                <SectionHeader icon="🌐" title="Global Announcements" count={filteredGlobal.length} color="#2563eb" />
                {filteredGlobal.length === 0
                  ? <EmptySection icon="🌐" message="No global announcements found." />
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {filteredGlobal.map((a, i) => (
                        <div key={a.id} style={{ animationDelay: `${i * 0.06}s` }}>
                          <AnnouncementCard ann={a} />
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* ══ DEPARTMENT tab ══ */}
            {tab === 'department' && (
              <div>
                <SectionHeader icon="🏫" title="Department Announcements" count={filteredDept.length} color="#7c3aed" />
                {filteredDept.length === 0
                  ? <EmptySection icon="🏫" message="No department announcements found." />
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {filteredDept.map((a, i) => (
                        <div key={a.id} style={{ animationDelay: `${i * 0.06}s` }}>
                          <AnnouncementCard ann={a} />
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* ══ EVENTS tab ══ */}
            {tab === 'events' && (
              <div>
                <SectionHeader icon="🗓️" title="Events" count={filteredEvents.length} color="#16a34a" />
                {filteredEvents.length === 0
                  ? <EmptySection icon="🗓️" message="No events found." />
                  : (
                    <>
                      {/* Upcoming */}
                      {filteredEvents.filter(e => isUpcoming(e.scheduledAt)).length > 0 && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                            Upcoming
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {filteredEvents.filter(e => isUpcoming(e.scheduledAt)).map((ev, i) => (
                              <div key={ev.id} style={{ animationDelay: `${i * 0.06}s` }}>
                                <EventCard ev={ev} />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {/* Past */}
                      {filteredEvents.filter(e => !isUpcoming(e.scheduledAt)).length > 0 && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                            Past Events
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {filteredEvents.filter(e => !isUpcoming(e.scheduledAt)).map((ev, i) => (
                              <div key={ev.id} style={{ animationDelay: `${i * 0.06}s` }}>
                                <EventCard ev={ev} />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )
                }
              </div>
            )}
          </>
        )}

        {/* ── Footer count ── */}
        {!loading && !error && (
          <div style={{ marginTop: 20, textAlign: 'right', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} ·
            {' '}{events.length} event{events.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import StudentLayout from '../components/StudentLayout';
import { getJson } from '../utils/api';

type AnnScope = 'GLOBAL' | 'DEPARTMENT';

type AnnouncementDTO = {
  id: number;
  title: string;
  content: string;
  scope: AnnScope;
  departmentName: string | null;
  postedByRole: 'PLACEMENT_HEAD' | 'FACULTY' | 'SYSTEM';
  postedByName: string;
  createdAt: string;
};

type EventDTO = {
  id: number;
  title: string;
  description: string;
  scheduledAt: string;
  locationOrLink: string | null;
  departmentName: string | null;
  scope: AnnScope;
};

type FilterKey = 'all' | 'important' | 'event' | 'department';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: 'important' | 'event' | 'department' | 'general';
  createdAt: string;
  source: 'announcement' | 'event';
  cta: string;
  meta: string;
};

const READ_KEY = 'student.notifications.readIds';

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isSoon(iso: string) {
  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
}

function getAnnouncementCategory(ann: AnnouncementDTO): NotificationItem['category'] {
  if (ann.postedByRole === 'PLACEMENT_HEAD') return 'important';
  if (ann.scope === 'DEPARTMENT') return 'department';
  return 'general';
}

function toNotificationItems(announcements: AnnouncementDTO[], events: EventDTO[]): NotificationItem[] {
  const annItems: NotificationItem[] = announcements.map((ann) => ({
    id: `ann-${ann.id}`,
    title: ann.title,
    body: ann.content,
    category: getAnnouncementCategory(ann),
    createdAt: ann.createdAt,
    source: 'announcement',
    cta: ann.scope === 'DEPARTMENT' ? 'Review department update' : 'Read announcement',
    meta: ann.scope === 'DEPARTMENT' ? (ann.departmentName || 'Department') : 'Campus-wide',
  }));

  const eventItems: NotificationItem[] = events.map((ev) => ({
    id: `ev-${ev.id}`,
    title: ev.title,
    body: ev.description || 'New campus event available. Open details for date, venue, and link.',
    category: 'event',
    createdAt: ev.scheduledAt,
    source: 'event',
    cta: ev.locationOrLink ? 'Open event details' : 'Check event timing',
    meta: ev.locationOrLink || ev.departmentName || 'Event update',
  }));

  return [...annItems, ...eventItems].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function IdeaCard({ title, text, accent }: { title: string; text: string; accent: string }) {
  return (
    <div
      style={{
        border: `1px solid ${accent}44`,
        borderRadius: 14,
        padding: 14,
        background: `linear-gradient(135deg, ${accent}22, #ffffff)`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.6, color: '#475569' }}>{text}</div>
    </div>
  );
}

export default function StudentNotifications() {
  const email = localStorage.getItem('email') || '';

  const [announcements, setAnnouncements] = useState<AnnouncementDTO[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const loadData = useCallback(async () => {
    if (!email) {
      setLoading(false);
      return;
    }

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
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify(readIds));
  }, [readIds]);

  const notifications = useMemo(() => toNotificationItems(announcements, events), [announcements, events]);

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return notifications.filter((item) => {
      if (filter === 'important' && item.category !== 'important') return false;
      if (filter === 'event' && item.category !== 'event') return false;
      if (filter === 'department' && item.category !== 'department') return false;
      if (!lowered) return true;
      return (
        item.title.toLowerCase().includes(lowered) ||
        item.body.toLowerCase().includes(lowered) ||
        item.meta.toLowerCase().includes(lowered)
      );
    });
  }, [filter, notifications, query]);

  const unreadCount = filtered.filter((n) => !readIds.includes(n.id)).length;
  const soonEvents = events.filter((ev) => isSoon(ev.scheduledAt)).length;

  const toggleRead = (id: string) => {
    setReadIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  return (
    <StudentLayout>
      <div
        style={{
          minHeight: '100%',
          padding: 24,
          background:
            'radial-gradient(circle at 0% 0%, #dff2ff 0%, transparent 35%), radial-gradient(circle at 100% 0%, #fdeacc 0%, transparent 28%), #f8fbff',
        }}
      >
        <div
          style={{
            borderRadius: 18,
            background: '#ffffffd9',
            backdropFilter: 'blur(6px)',
            border: '1px solid #dbeafe',
            padding: 18,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 25, color: '#0f172a' }}>Notifications Center</h1>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
                A single feed for alerts, events, and department updates with action ideas.
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#1d4ed8',
                borderRadius: 10,
                fontWeight: 700,
                padding: '8px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                height: 36,
              }}
            >
              Refresh
            </button>
          </div>

          <div
            style={{
              marginTop: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 10,
            }}
          >
            <div style={{ background: '#eff6ff', borderRadius: 12, padding: 12, border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 700 }}>UNREAD</div>
              <div style={{ fontSize: 24, color: '#0f172a', fontWeight: 800 }}>{unreadCount}</div>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 12, border: '1px solid #86efac' }}>
              <div style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>EVENTS SOON</div>
              <div style={{ fontSize: 24, color: '#0f172a', fontWeight: 800 }}>{soonEvents}</div>
            </div>
            <div style={{ background: '#fff7ed', borderRadius: 12, padding: 12, border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: 11, color: '#9a3412', fontWeight: 700 }}>TOTAL ITEMS</div>
              <div style={{ fontSize: 24, color: '#0f172a', fontWeight: 800 }}>{notifications.length}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 14,
            alignItems: 'start',
          }}
        >
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'important', label: 'Important' },
                { key: 'event', label: 'Events' },
                { key: 'department', label: 'Department' },
              ].map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => setFilter(chip.key as FilterKey)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 999,
                    border: filter === chip.key ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                    background: filter === chip.key ? '#dbeafe' : '#fff',
                    color: filter === chip.key ? '#1d4ed8' : '#475569',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {chip.label}
                </button>
              ))}

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notifications"
                style={{
                  marginLeft: 'auto',
                  minWidth: 180,
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 12,
                  padding: '8px 10px',
                }}
              />
            </div>

            {loading && <div style={{ color: '#64748b', fontSize: 13 }}>Loading notifications...</div>}

            {!loading && error && (
              <div style={{ border: '1px solid #fecaca', background: '#fff1f2', color: '#9f1239', padding: 12, borderRadius: 12 }}>
                {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div style={{ border: '1px dashed #cbd5e1', color: '#64748b', padding: 16, borderRadius: 12, fontSize: 13 }}>
                No notifications match this filter.
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((item) => {
                  const read = readIds.includes(item.id);
                  const isImportant = item.category === 'important';
                  const marker = isImportant ? '#f97316' : item.category === 'event' ? '#16a34a' : '#3b82f6';

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderLeft: `4px solid ${marker}`,
                        borderRadius: 12,
                        padding: 12,
                        background: read ? '#fcfdff' : '#f8fbff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{item.title}</div>
                          <div style={{ color: '#64748b', marginTop: 4, fontSize: 12, lineHeight: 1.6 }}>{item.body}</div>
                        </div>
                        {!read && (
                          <span
                            style={{
                              borderRadius: 999,
                              fontSize: 10,
                              padding: '3px 8px',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              background: '#eff6ff',
                              fontWeight: 700,
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {item.meta} | {fmtDateTime(item.createdAt)}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            style={{
                              border: '1px solid #e2e8f0',
                              background: '#fff',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '6px 8px',
                              color: '#475569',
                              cursor: 'pointer',
                            }}
                          >
                            {item.cta}
                          </button>
                          <button
                            onClick={() => toggleRead(item.id)}
                            style={{
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '6px 8px',
                              color: '#1d4ed8',
                              cursor: 'pointer',
                            }}
                          >
                            {read ? 'Mark unread' : 'Mark read'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 10 }}>Idea Board</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <IdeaCard
                  title="Focus Flow"
                  text="Pin top 3 important alerts each morning and clear them before noon to avoid missed deadlines."
                  accent="#3b82f6"
                />
                <IdeaCard
                  title="Weekly Prep"
                  text="Use events tab every Monday and block calendar slots for mock tests and company prep sessions."
                  accent="#16a34a"
                />
                <IdeaCard
                  title="Department Pulse"
                  text="Filter by department before placement season starts to catch department-specific shortlisting notes."
                  accent="#f97316"
                />
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 8 }}>Smart Suggestions</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: '#475569', fontSize: 12, lineHeight: 1.8 }}>
                <li>Enable browser push notifications for urgent placement updates.</li>
                <li>Add "deadline" tags from announcement keywords in the backend.</li>
                <li>Show reminder countdown for drives ending in less than 48 hours.</li>
                <li>Auto-group repeated event updates into one collapsed card.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

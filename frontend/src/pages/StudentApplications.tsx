import { useEffect, useState, useCallback } from 'react';
import StudentLayout from '../components/StudentLayout';
import { getJson } from '../utils/api';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface ApplicationDto {
  id: number;
  driveId: number;
  driveTitle: string;
  role: string;
  companyName: string;
  companyIndustry: string;
  ctcLpa: number | null;
  stage: string;
  appliedAt: string;
  lastUpdatedAt: string;
  applicationDeadline: string | null;
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const PROGRESS_STAGES = ['APPLIED', 'ASSESSMENT', 'TECHNICAL', 'HR', 'SELECTED'];
const ALL_STAGES = ['APPLIED', 'ASSESSMENT', 'TECHNICAL', 'HR', 'SELECTED', 'REJECTED'];

const STAGE_CFG: Record<string, { bg: string; text: string; border: string; icon: string; label: string; dot: string }> = {
  APPLIED:    { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', icon: '📋', label: 'Applied',    dot: '#3b82f6' },
  ASSESSMENT: { bg: '#fef3c7', text: '#92400e', border: '#fde68a', icon: '📝', label: 'Assessment', dot: '#f59e0b' },
  TECHNICAL:  { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe', icon: '💻', label: 'Technical',  dot: '#7c3aed' },
  HR:         { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7', icon: '🤝', label: 'HR Round',   dot: '#10b981' },
  SELECTED:   { bg: '#dcfce7', text: '#15803d', border: '#86efac', icon: '🏆', label: 'Selected',   dot: '#16a34a' },
  REJECTED:   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: '❌', label: 'Rejected',   dot: '#ef4444' },
};

function fmtDate(iso: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

/* ─────────────────────────────────────────────
   STAGE PROGRESS BAR
───────────────────────────────────────────── */
function StageProgressBar({ stage }: { stage: string }) {
  const isRejected = stage === 'REJECTED';
  const current = PROGRESS_STAGES.indexOf(isRejected ? 'APPLIED' : stage);

  if (isRejected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5',
          borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#991b1b'
        }}>❌ Not Selected</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 240 }}>
      {PROGRESS_STAGES.map((s, i) => {
        const done   = i <= current;
        const active = i === current;
        const cfg    = STAGE_CFG[s];
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < PROGRESS_STAGES.length - 1 ? 1 : 'unset' }}>
            {/* Step node */}
            <div title={cfg.label} style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: done ? (active ? cfg.dot : '#2563eb') : '#e2e8f0',
              border: active ? `3px solid ${cfg.border}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: done ? '#fff' : '#94a3b8', fontWeight: 800,
              boxShadow: active ? `0 0 0 3px ${cfg.bg}` : 'none',
              transition: 'all .2s',
              cursor: 'default',
            }}>
              {done && !active ? '✓' : i + 1}
            </div>
            {/* Connector */}
            {i < PROGRESS_STAGES.length - 1 && (
              <div style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i < current ? '#2563eb' : '#e2e8f0',
                transition: 'background .3s',
                margin: '0 1px',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONGRATULATORY BANNER
───────────────────────────────────────────── */
function CongratsBanner({ apps }: { apps: ApplicationDto[] }) {
  const selected = apps.filter(a => a.stage === 'SELECTED');
  if (selected.length === 0) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg,#065f46,#059669)',
      borderRadius: 16, padding: '18px 24px', marginBottom: 22,
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 8px 24px rgba(5,150,105,0.3)',
      animation: 'fadeIn .4s ease',
    }}>
      <div style={{ fontSize: 36 }}>🎉</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>
          Congratulations! You've been selected!
        </div>
        <div style={{ fontSize: 13, color: '#a7f3d0', marginTop: 2 }}>
          {selected.length === 1
            ? `You've been selected at ${selected[0].companyName} for ${selected[0].role}.`
            : `You've been selected in ${selected.length} drives. Check the table below for details.`}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[200, 120, 100, 160, 100, 100].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: 14, width: w, borderRadius: 6,
            background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        </td>
      ))}
    </tr>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function StudentApplications() {
  const email = localStorage.getItem('email') || '';

  const [apps,    setApps]    = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageF,  setStageF]  = useState('ALL');
  const [search,  setSearch]  = useState('');
  const [view,    setView]    = useState<'table' | 'card'>('table');
  const [expanded, setExpanded] = useState<number | null>(null);

  const loadApps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJson<ApplicationDto[]>(`/api/student/applications?email=${encodeURIComponent(email)}`);
      setApps(res.data || []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { loadApps(); }, [loadApps]);

  const filtered = apps.filter(a => {
    if (stageF !== 'ALL' && a.stage !== stageF) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.companyName.toLowerCase().includes(q) &&
          !a.role.toLowerCase().includes(q) &&
          !a.driveTitle.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = ALL_STAGES.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.stage === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <StudentLayout>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
        .app-row:hover { background: #f8fafc !important; }
        .app-row-selected:hover { background: #f0fdf4 !important; }
        .kpi-pill:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.10) !important; }
        .view-btn { border: 1.5px solid #e2e8f0; background: #fff; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; color: #64748b; transition: all .15s; }
        .view-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; }
        .view-btn:hover:not(.active) { background: #f8fafc; }
        @media (max-width: 768px) {
          .app-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      <div style={{ padding: '24px 28px', minHeight: '100vh', background: '#f8fafc' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
              📂 My Applications
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              Track your placement journey across all drives
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`view-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>
              ☰ Table
            </button>
            <button className={`view-btn ${view === 'card' ? 'active' : ''}`} onClick={() => setView('card')}>
              ⊞ Cards
            </button>
          </div>
        </div>

        {/* ── Congratulatory Banner ── */}
        {!loading && <CongratsBanner apps={apps} />}

        {/* ── KPI Summary Pills ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
          {ALL_STAGES.map(s => {
            const cfg = STAGE_CFG[s];
            return (
              <div
                key={s}
                className="kpi-pill"
                onClick={() => setStageF(stageF === s ? 'ALL' : s)}
                style={{
                  background: stageF === s ? cfg.bg : '#fff',
                  border: `1.5px solid ${stageF === s ? cfg.border : '#e2e8f0'}`,
                  borderRadius: 99, padding: '7px 16px',
                  display: 'flex', alignItems: 'center', gap: 7,
                  cursor: 'pointer', transition: 'all .15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: cfg.dot, flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: stageF === s ? cfg.text : '#374151' }}>
                  {cfg.label}
                </span>
                <span style={{
                  background: stageF === s ? cfg.border : '#f1f5f9',
                  color: stageF === s ? cfg.text : '#64748b',
                  borderRadius: 99, padding: '1px 8px', fontSize: 12, fontWeight: 800,
                }}>
                  {counts[s]}
                </span>
              </div>
            );
          })}
          {stageF !== 'ALL' && (
            <div
              className="kpi-pill"
              onClick={() => setStageF('ALL')}
              style={{
                background: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: 99, padding: '7px 14px',
                display: 'flex', alignItems: 'center', gap: 6,
                cursor: 'pointer', transition: 'all .15s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>✕ Clear Filter</span>
            </div>
          )}
        </div>

        {/* ── Search + Count bar ── */}
        <div style={{
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
          padding: '12px 18px', marginBottom: 18,
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center'
        }}>
          <input
            style={{
              flex: '1 1 220px', padding: '9px 14px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
              transition: 'border-color .15s',
            }}
            onFocus={e => (e.target.style.borderColor = '#2563eb')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            placeholder="🔍 Search by company, role, or drive…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginLeft: 'auto' }}>
            {filtered.length} application{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Content ── */}
        {loading ? (
          view === 'table' ? (
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                    {['Drive / Role', 'Company', 'Applied Date', 'Stage Progress', 'Status', 'Last Updated'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '.05em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{[1,2,3,4].map(i => <SkeletonRow key={i} />)}</tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 160, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16,
                  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 0', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📂</div>
            <p style={{ fontWeight: 700, fontSize: 17, color: '#1e293b', margin: '0 0 6px' }}>
              {apps.length === 0 ? 'No applications yet' : 'No results found'}
            </p>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              {apps.length === 0
                ? 'Browse available drives and apply to get started!'
                : 'Try adjusting your search or stage filter.'}
            </p>
          </div>
        ) : view === 'table' ? (
          /* ══════════════ TABLE VIEW ══════════════ */
          <div className="app-table-wrap" style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  {['Drive / Role', 'Company', 'Applied Date', 'Stage Progress', 'Status', 'Last Updated'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, idx) => {
                  const cfg = STAGE_CFG[app.stage] ?? STAGE_CFG['APPLIED'];
                  const isSelected = app.stage === 'SELECTED';
                  const isExpanded = expanded === app.id;
                  return (
                    <>
                      <tr
                        key={app.id}
                        className={isSelected ? 'app-row-selected' : 'app-row'}
                        onClick={() => setExpanded(isExpanded ? null : app.id)}
                        style={{
                          borderBottom: idx < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                          background: isSelected ? '#f0fdf4' : '#fff',
                          cursor: 'pointer',
                          transition: 'background .12s',
                          ...(isSelected ? { boxShadow: 'inset 4px 0 0 #16a34a' } : {}),
                        }}
                      >
                        {/* Drive / Role */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                            {app.driveTitle || '—'}
                          </div>
                          <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginTop: 1 }}>
                            {app.role}
                          </div>
                          {app.ctcLpa != null && (
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                              💰 {app.ctcLpa} LPA
                            </div>
                          )}
                        </td>

                        {/* Company */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, color: '#fff', fontWeight: 900,
                            }}>
                              {(app.companyName || 'C').charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{app.companyName}</div>
                              {app.companyIndustry && (
                                <div style={{ fontSize: 11, color: '#64748b' }}>{app.companyIndustry}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Applied Date */}
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {fmtDate(app.appliedAt)}
                        </td>

                        {/* Stage Progress */}
                        <td style={{ padding: '14px 16px' }}>
                          <StageProgressBar stage={app.stage} />
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 12px', borderRadius: 99,
                              background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                              fontSize: 12, fontWeight: 800, color: cfg.text,
                              whiteSpace: 'nowrap',
                            }}>
                              {cfg.icon} {cfg.label}
                            </span>
                            {isSelected && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '2px 8px', borderRadius: 99,
                                background: '#fef9c3', border: '1px solid #fde047',
                                fontSize: 10, fontWeight: 800, color: '#854d0e',
                              }}>
                                🏅 Offer Ready
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Last Updated */}
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {fmtDate(app.lastUpdatedAt)}
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExpanded && (
                        <tr key={`${app.id}-exp`} style={{ background: isSelected ? '#f0fdf4' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                          <td colSpan={6} style={{ padding: '0 16px 16px 16px' }}>
                            <div style={{ paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: '6px 24px', fontSize: 12, color: '#64748b' }}>
                              {app.applicationDeadline && (
                                <span>⏰ Deadline: <b>{fmtDate(app.applicationDeadline)}</b></span>
                              )}
                              {app.companyIndustry && (
                                <span>🏭 Industry: <b>{app.companyIndustry}</b></span>
                              )}
                              {app.ctcLpa != null && (
                                <span>💰 CTC: <b>{app.ctcLpa} LPA</b></span>
                              )}
                              <span>🆔 Application ID: <b>#{app.id}</b></span>
                            </div>
                            {isSelected && (
                              <div style={{
                                marginTop: 10, background: 'linear-gradient(135deg,#065f46,#059669)',
                                borderRadius: 10, padding: '10px 16px',
                                display: 'flex', alignItems: 'center', gap: 10,
                              }}>
                                <span style={{ fontSize: 22 }}>🎉</span>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
                                  Congratulations! You have been selected at {app.companyName} for the {app.role} role.
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ══════════════ CARD VIEW ══════════════ */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
            {filtered.map(app => {
              const cfg = STAGE_CFG[app.stage] ?? STAGE_CFG['APPLIED'];
              const isSelected = app.stage === 'SELECTED';
              return (
                <div
                  key={app.id}
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${isSelected ? '#86efac' : '#e2e8f0'}`,
                    borderRadius: 18, padding: '20px',
                    boxShadow: isSelected
                      ? '0 4px 20px rgba(22,163,74,0.15)'
                      : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'box-shadow .15s,transform .15s',
                    animation: 'fadeIn .35s ease',
                    ...(isSelected ? { background: 'linear-gradient(160deg,#f0fdf4,#fff)' } : {}),
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 12,
                        background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: '#fff', fontWeight: 900, flexShrink: 0,
                      }}>
                        {(app.companyName || 'C').charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{app.companyName}</div>
                        <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>{app.role}</div>
                      </div>
                    </div>
                    <span style={{
                      padding: '5px 12px', borderRadius: 99,
                      background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                      fontSize: 12, fontWeight: 800, color: cfg.text, whiteSpace: 'nowrap',
                    }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  {/* Drive title */}
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{app.driveTitle}</div>

                  {/* Meta */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                    <span>📅 Applied: <b style={{ color: '#374151' }}>{fmtDate(app.appliedAt)}</b></span>
                    {app.ctcLpa != null && <span>💰 <b style={{ color: '#374151' }}>{app.ctcLpa} LPA</b></span>}
                    {app.lastUpdatedAt && <span>🔄 Updated: <b style={{ color: '#374151' }}>{fmtDate(app.lastUpdatedAt)}</b></span>}
                  </div>

                  {/* Progress */}
                  <StageProgressBar stage={app.stage} />

                  {/* Selected badge */}
                  {isSelected && (
                    <div style={{
                      marginTop: 14, background: 'linear-gradient(135deg,#065f46,#059669)',
                      borderRadius: 10, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 18 }}>🎉</span>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>
                        Congratulations! You've been selected at {app.companyName}.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Total summary footer ── */}
        {!loading && apps.length > 0 && (
          <div style={{ marginTop: 16, textAlign: 'right', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            Total {apps.length} application{apps.length !== 1 ? 's' : ''} · Showing {filtered.length}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

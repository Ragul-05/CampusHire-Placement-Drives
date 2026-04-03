import { useEffect, useState, useCallback, useRef } from 'react';
import StudentLayout from '../components/StudentLayout';
import { getJson, postJson } from '../utils/api';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface DriveDto {
  id: number;
  title: string;
  role: string;
  ctcLpa: number;
  status: 'ONGOING' | 'UPCOMING' | 'COMPLETED';
  description: string;
  createdAt: string;
  applicationDeadline: string | null;
  totalOpenings: number | null;
  companyName: string;
  companyIndustry: string;
  companyWebsite: string;
  isEligible: boolean;
  ineligibilityReason: string | null;
  minCgpa: number | null;
  maxStandingArrears: number | null;
  maxHistoryOfArrears: number | null;
  minXMarks: number | null;
  minXiiMarks: number | null;
  graduationYear: number | null;
  requiredSkills: string[];
  allowedDepartments: string[];
  hasApplied: boolean;
  applicationStage: string | null;
  studentSkills?: string[]; // student's own skills for match viz
}

/* ─────────────────────────────────────────────
   STAGE badge colours
───────────────────────────────────────────── */
const STAGE_COLOR: Record<string, { bg: string; text: string }> = {
  APPLIED:    { bg: '#dbeafe', text: '#1e40af' },
  ASSESSMENT: { bg: '#fef3c7', text: '#92400e' },
  TECHNICAL:  { bg: '#ede9fe', text: '#5b21b6' },
  HR:         { bg: '#d1fae5', text: '#065f46' },
  SELECTED:   { bg: '#dcfce7', text: '#15803d' },
};

function hasDeadlinePassed(deadline: string | null) {
  return !!deadline && new Date(deadline).getTime() < Date.now();
}

function getDriveStatusPalette(status: DriveDto['status']) {
  if (status === 'ONGOING') return { bg: '#d1fae5', text: '#065f46' };
  if (status === 'COMPLETED') return { bg: '#e2e8f0', text: '#475569' };
  return { bg: '#fef3c7', text: '#92400e' };
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '13px 22px', borderRadius: 12, fontWeight: 700, fontSize: 14, color: '#fff',
      background: type === 'success' ? '#10b981' : '#ef4444',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      animation: 'fadeInUp .25s ease'
    }}>
      {type === 'success' ? '✅' : '❌'} {msg}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function StudentDrives() {
  const [drives,    setDrives]    = useState<DriveDto[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [applying,  setApplying]  = useState<number | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [selected,  setSelected]  = useState<DriveDto | null>(null);
  const [confirmDrive, setConfirmDrive] = useState<DriveDto | null>(null);
  const [profileLocked, setProfileLocked] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string>('PENDING');

  // Filters
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState<'ALL' | 'ONGOING' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [minCtc,    setMinCtc]    = useState('');
  const [maxCtc,    setMaxCtc]    = useState('');
  const [eligOnly,  setEligOnly]  = useState(false);

  const loadDrives = useCallback(async () => {
    try {
      setLoading(true);
      const [drivesRes, profileRes] = await Promise.all([
        getJson<DriveDto[]>('/api/student/drives'),
        getJson<{ isLocked: boolean; verificationStatus: string }>(
          '/api/student/profile'
        ).catch(() => ({ data: { isLocked: false, verificationStatus: 'PENDING' } })),
      ]);
      setDrives(drivesRes.data || []);
      setProfileLocked(!!(profileRes as any).data?.isLocked);
      setProfileStatus((profileRes as any).data?.verificationStatus || 'PENDING');
    } catch {
      setToast({ msg: 'Failed to load drives', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDrives(); }, [loadDrives]);

  /* ── Filtered list ── */
  const filtered = drives.filter(d => {
    if (statusF !== 'ALL' && d.status !== statusF) return false;
    if (search && !d.companyName.toLowerCase().includes(search.toLowerCase()) &&
        !d.title.toLowerCase().includes(search.toLowerCase()) &&
        !d.role.toLowerCase().includes(search.toLowerCase())) return false;
    if (minCtc && d.ctcLpa < parseFloat(minCtc)) return false;
    if (maxCtc && d.ctcLpa > parseFloat(maxCtc)) return false;
    if (eligOnly && !d.isEligible) return false;
    return true;
  });

  /* ── Confirm → Apply ── */
  const confirmAndApply = async () => {
    if (!confirmDrive) return;
    // Module 10: block apply if profile is locked
    if (profileLocked) {
      setToast({ msg: '🔒 Your profile is locked. Contact your placement office to apply.', type: 'error' });
      setConfirmDrive(null);
      return;
    }
    if (confirmDrive.status === 'COMPLETED' || hasDeadlinePassed(confirmDrive.applicationDeadline)) {
      setToast({ msg: 'This drive is closed for applications.', type: 'error' });
      setConfirmDrive(null);
      return;
    }
    const driveId = confirmDrive.id;
    setConfirmDrive(null);
    setApplying(driveId);
    try {
      await postJson(`/api/student/applications/${driveId}/apply`, {});
      setToast({ msg: '🎉 Application submitted successfully!', type: 'success' });
      await loadDrives();
      if (selected?.id === driveId) {
        setSelected(prev => prev ? { ...prev, hasApplied: true, applicationStage: 'APPLIED' } : null);
      }
    } catch (e: any) {
      setToast({ msg: e?.message || 'Failed to apply', type: 'error' });
    } finally {
      setApplying(null);
    }
  };

  /* ── Kept for modal onApply button ── */
  const handleApply = (drive: DriveDto) => {
    if (profileLocked) {
      setToast({ msg: '🔒 Your profile is locked. You cannot apply while locked.', type: 'error' });
      return;
    }
    setConfirmDrive(drive);
  };

  /* ── Stats ── */
  const total    = drives.length;
  const eligible = drives.filter(d => d.isEligible).length;
  const applied  = drives.filter(d => d.applicationStage).length;
  const ongoing  = drives.filter(d => d.status === 'ONGOING').length;

  return (
    <StudentLayout>
      <div style={{ padding: '24px 28px', minHeight: '100vh', background: '#f8fafc' }}>

        {/* ── Module 10: Profile Lock Banner ── */}
        {profileLocked && (
          <div style={{
            background: 'linear-gradient(135deg,#1e293b,#0f172a)',
            border: '2px solid #ef4444',
            borderRadius: 16, padding: '16px 22px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 4px 24px rgba(239,68,68,0.2)',
          }}>
            <span style={{ fontSize: 28 }}>🔒</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#f1f5f9' }}>Profile Locked — Applications Disabled</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Your profile has been locked by the placement office. You cannot apply for any drive until it is unlocked.
                Please contact your faculty coordinator.
              </div>
            </div>
            <span style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 800,
              background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1.5px solid rgba(239,68,68,0.4)',
            }}>
              🔒 LOCKED
            </span>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
            🏢 Browse Placement Drives
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Review your automatically matched placement opportunities
          </p>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Drives',     value: total,    color: '#2563eb', bg: '#eff6ff' },
            { label: 'Ongoing',          value: ongoing,  color: '#d97706', bg: '#fffbeb' },
            { label: 'You\'re Eligible', value: eligible, color: '#059669', bg: '#f0fdf4' },
            { label: 'Applied',          value: applied,  color: '#7c3aed', bg: '#f5f3ff' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1.5px solid ${s.color}22`,
              borderRadius: 14, padding: '16px 18px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
          padding: '16px 20px', marginBottom: 24,
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center'
        }}>
          {/* Search */}
          <input
            style={{
              flex: '1 1 220px', padding: '9px 14px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none'
            }}
            placeholder="🔍  Search by company, role, or title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Status */}
          <select
            style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}
            value={statusF}
            onChange={e => setStatusF(e.target.value as any)}
          >
            <option value="ALL">All Status</option>
            <option value="ONGOING">Ongoing</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* CTC range */}
          <input
            type="number" min={0} placeholder="Min CTC (LPA)"
            style={{ width: 130, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}
            value={minCtc}
            onChange={e => setMinCtc(e.target.value)}
          />
          <input
            type="number" min={0} placeholder="Max CTC (LPA)"
            style={{ width: 130, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}
            value={maxCtc}
            onChange={e => setMaxCtc(e.target.value)}
          />

          {/* Eligible only */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={eligOnly} onChange={e => setEligOnly(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
            Eligible Only
          </label>

          {/* Clear */}
          {(search || statusF !== 'ALL' || minCtc || maxCtc || eligOnly) && (
            <button
              onClick={() => { setSearch(''); setStatusF('ALL'); setMinCtc(''); setMaxCtc(''); setEligOnly(false); }}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}
            >✕ Clear</button>
          )}
        </div>

        {/* ── Results count ── */}
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 16 }}>
          Showing {filtered.length} of {total} drive{total !== 1 ? 's' : ''}
        </div>

        {/* ── Loading / Empty ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p style={{ fontWeight: 600 }}>Loading drives…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>No drives found</p>
            <p style={{ fontSize: 14 }}>Try adjusting your filters</p>
          </div>
        ) : (
          /* ── Drive Cards Grid ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20
          }}>
            {filtered.map(drive => (
              <DriveCard
                key={drive.id}
                drive={drive}
                onView={() => setSelected(drive)}
                profileLocked={profileLocked}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <DriveDetailModal
          drive={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Confirm Apply Modal ── */}
      {confirmDrive && (
        <ConfirmApplyModal
          drive={confirmDrive}
          onConfirm={confirmAndApply}
          onCancel={() => setConfirmDrive(null)}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </StudentLayout>
  );
}

/* ─────────────────────────────────────────────
   DRIVE CARD
───────────────────────────────────────────── */
function DriveCard({ drive, onView, profileLocked }: {
  drive: DriveDto;
  onView: () => void;
  profileLocked: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const statusColor = getDriveStatusPalette(drive.status);
  const stageCfg = drive.applicationStage ? STAGE_COLOR[drive.applicationStage] : null;
  const isCompleted = drive.status === 'COMPLETED';
  const deadlinePassed = hasDeadlinePassed(drive.applicationDeadline);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1.5px solid ${hovered ? '#2563eb' : '#e2e8f0'}`,
        borderRadius: 18,
        padding: '22px 22px 18px',
        boxShadow: hovered ? '0 12px 40px rgba(37,99,235,0.13)' : '0 2px 8px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        transition: 'all .2s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}
    >
      {/* ── Top Row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Company avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: '#fff', fontWeight: 900
        }}>
          {(drive.companyName || 'C').charAt(0)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: statusColor.bg, color: statusColor.text }}>
            {drive.status}
          </span>
          {drive.applicationStage && stageCfg && (
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: stageCfg.bg, color: stageCfg.text }}>
              ✓ {drive.applicationStage}
            </span>
          )}
        </div>
      </div>

      {/* ── Company & Role ── */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
          {drive.companyName}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', marginTop: 2 }}>{drive.role}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{drive.title}</div>
      </div>

      {/* ── Key Details ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
        <InfoChip icon="💰" label="CTC" value={drive.ctcLpa ? `${drive.ctcLpa} LPA` : 'N/A'} />
        <InfoChip icon="🏭" label="Industry" value={drive.companyIndustry || 'N/A'} />
        {drive.applicationDeadline && (
          <InfoChip icon="📅" label="Deadline" value={formatDate(drive.applicationDeadline)} />
        )}
        {drive.totalOpenings != null && (
          <InfoChip icon="👥" label="Openings" value={String(drive.totalOpenings)} />
        )}
        {drive.minCgpa != null && (
          <InfoChip icon="🎓" label="Min CGPA" value={String(drive.minCgpa)} />
        )}
        {drive.maxStandingArrears != null && (
          <InfoChip icon="📝" label="Max Arrears" value={String(drive.maxStandingArrears)} />
        )}
      </div>

      {/* ── Eligibility Badge ── */}
      <div style={{ position: 'relative' }}>
        {drive.isEligible ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10
          }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>You are eligible!</span>
          </div>
        ) : (
          <div title={drive.ineligibilityReason || 'Not eligible'} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10,
            cursor: 'help'
          }}>
            <span style={{ fontSize: 16 }}>❌</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Not Eligible</div>
              {drive.ineligibilityReason && (
                <div style={{ fontSize: 11, color: '#dc2626', marginTop: 1 }}>{drive.ineligibilityReason}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Required Skills (max 4) ── */}
      {drive.requiredSkills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {drive.requiredSkills.slice(0, 4).map(s => (
            <span key={s} style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              {s}
            </span>
          ))}
          {drive.requiredSkills.length > 4 && (
            <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: '#f1f5f9', color: '#64748b' }}>
              +{drive.requiredSkills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={e => { e.stopPropagation(); onView(); }}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            color: '#374151', transition: 'background .12s'
          }}
        >
          👁️ View Details
        </button>

        {drive.applicationStage ? (
          <button disabled style={{
            flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
            background: '#d1fae5', fontSize: 13, fontWeight: 700, color: '#065f46', cursor: 'default'
          }}>
            ✓ Applied
          </button>
        ) : isCompleted ? (
          <button
            disabled
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, border: '1.5px solid #cbd5e1',
              background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#64748b',
              cursor: 'not-allowed',
            }}
          >
            Drive Completed
          </button>
        ) : deadlinePassed ? (
          <button
            disabled
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, border: '1.5px solid #cbd5e1',
              background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#64748b',
              cursor: 'not-allowed',
            }}
          >
            Deadline Closed
          </button>
        ) : profileLocked ? (
          <button
            disabled
            title="Your profile is locked. Contact your placement office to unlock."
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, border: '1.5px solid #475569',
              background: '#1e293b', fontSize: 12, fontWeight: 700, color: '#64748b',
              cursor: 'not-allowed',
            }}
          >
            🔒 Locked
          </button>
        ) : (
          <button
            disabled
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
              background: '#dcfce7',
              fontSize: 13, fontWeight: 700,
              color: '#15803d',
              cursor: 'default',
              transition: 'opacity .15s'
            }}
          >
            You are Eligible
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INFO CHIP
───────────────────────────────────────────── */
function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}:</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SKILL MATCH PANEL  (Module 9)
───────────────────────────────────────────── */
function calcSkillMatchData(studentSkills: string[], requiredSkills: string[]) {
  if (!requiredSkills.length) return { pct: 100, matched: [], missing: [] };
  const norm  = (s: string) => s.toLowerCase().trim();
  const have  = (studentSkills || []).map(norm);
  const matched: string[] = [];
  const missing: string[] = [];
  requiredSkills.forEach(req => {
    const r = norm(req);
    const hit = have.some(h => h.includes(r) || r.includes(h));
    (hit ? matched : missing).push(req);
  });
  const pct = Math.round((matched.length / requiredSkills.length) * 100);
  return { pct, matched, missing };
}

function AnimatedBar({ pct, animate }: { pct: number; animate: boolean }) {
  const color = pct === 100 ? '#10b981' : pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : pct >= 25 ? '#f97316' : '#ef4444';
  const label = pct === 100 ? 'Perfect Match' : pct >= 75 ? 'Strong Match' : pct >= 50 ? 'Partial Match' : pct >= 25 ? 'Weak Match' : 'Low Match';
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Skill Match Score</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color, background: `${color}18`, padding: '2px 10px', borderRadius: 99, border: `1px solid ${color}33` }}>{label}</span>
          <span style={{ fontSize: 22, fontWeight: 900, color }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 12, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          width: animate ? `${pct}%` : '0%',
          transition: 'width 1.1s cubic-bezier(.22,.61,.36,1)',
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
    </div>
  );
}

function SkillMatchPanel({ drive }: { drive: DriveDto }) {
  const [studentSkills, setStudentSkills] = useState<string[]>(drive.studentSkills || []);
  const [loaded, setLoaded] = useState(!!(drive.studentSkills?.length));
  const [animate, setAnimate] = useState(false);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    // Fetch student skills if not already on the drive DTO
    if (!drive.studentSkills?.length) {
      getJson<{ skills: Array<{ skillName: string }> }>('/api/student/profile/skills')
        .then(r => {
          const skills = (r.data?.skills || []).map((s: any) => s.skillName || s);
          setStudentSkills(skills);
          setLoaded(true);
        }).catch(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [drive.studentSkills]);

  useEffect(() => {
    if (loaded) {
      // Small delay so the modal is visible before bar animates
      const t = setTimeout(() => setAnimate(true), 120);
      return () => clearTimeout(t);
    }
  }, [loaded]);

  if (!drive.requiredSkills?.length) {
    return (
      <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 18px' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>✅ No specific skills required for this drive.</span>
      </div>
    );
  }

  const { pct, matched, missing } = calcSkillMatchData(studentSkills, drive.requiredSkills);

  return (
    <div style={{ background: '#fafbff', border: '1.5px solid #e0e7ff', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        🎯 Skill Match Analysis
      </div>

      <AnimatedBar pct={pct} animate={animate} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
        {/* Matched */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#15803d', marginBottom: 8 }}>
            ✅ Matched ({matched.length})
          </div>
          {matched.length === 0
            ? <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No matching skills</div>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {matched.map(s => (
                  <span key={s} title={`You have "${s}"`} style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: '#dcfce7', color: '#15803d', border: '1.5px solid #86efac', cursor: 'help',
                  }}>✓ {s}</span>
                ))}
              </div>
          }
        </div>

        {/* Missing */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>
            ❌ Missing ({missing.length})
          </div>
          {missing.length === 0
            ? <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>You have all required skills! 🎉</div>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {missing.map(s => (
                  <span key={s} title={`Add "${s}" to your profile to improve eligibility`} style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', cursor: 'help',
                  }}>✗ {s}</span>
                ))}
              </div>
          }
        </div>
      </div>

      {missing.length > 0 && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
          💡 Add <strong>{missing.join(', ')}</strong> to your profile skills to improve your eligibility score.
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   INFO CHIP
───────────────────────────────────────────── */
function DriveDetailModal({ drive, onClose }: {
  drive: DriveDto;
  onClose: () => void;
}) {
  const statusColor = getDriveStatusPalette(drive.status);
  const stageCfg = drive.applicationStage ? STAGE_COLOR[drive.applicationStage] : null;
  const isCompleted = drive.status === 'COMPLETED';
  const deadlinePassed = hasDeadlinePassed(drive.applicationDeadline);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24, backdropFilter: 'blur(4px)',
      animation: 'fadeIn .2s ease'
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 22, width: '100%', maxWidth: 680,
        maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        animation: 'slideUp .22s ease'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#0f172a,#1e3a5f)',
          borderRadius: '22px 22px 0 0', padding: '24px 28px',
          color: '#fff', position: 'relative'
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 18,
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            color: '#fff', padding: '4px 10px', cursor: 'pointer', fontSize: 16, fontWeight: 700
          }}>✕</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, flexShrink: 0
            }}>
              {(drive.companyName || 'C').charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{drive.companyName}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#93c5fd', marginTop: 2 }}>{drive.role}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{drive.title}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: statusColor.bg, color: statusColor.text }}>{drive.status}</span>
            {drive.applicationStage && stageCfg && (
              <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: stageCfg.bg, color: stageCfg.text }}>✓ {drive.applicationStage}</span>
            )}
            {drive.isEligible
              ? <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: '#d1fae5', color: '#065f46' }}>✅ Eligible</span>
              : <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>❌ Not Eligible</span>
            }
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Ineligibility reason */}
          {!drive.isEligible && drive.ineligibilityReason && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 13 }}>⚠️ Why you're not eligible:</div>
              <div style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{drive.ineligibilityReason}</div>
            </div>
          )}

          {/* Key info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DetailBox icon="💰" label="CTC Package" value={drive.ctcLpa ? `${drive.ctcLpa} LPA` : 'Not disclosed'} />
            <DetailBox icon="🏭" label="Industry" value={drive.companyIndustry || 'N/A'} />
            {drive.applicationDeadline && (
              <DetailBox icon="📅" label="Application Deadline" value={formatDate(drive.applicationDeadline)} />
            )}
            {drive.totalOpenings != null && (
              <DetailBox icon="👥" label="Total Openings" value={String(drive.totalOpenings)} />
            )}
            {drive.companyWebsite && (
              <DetailBox icon="🌐" label="Website"
                value={<a href={drive.companyWebsite} target="_blank" rel="noreferrer"
                  style={{ color: '#2563eb', fontWeight: 700, fontSize: 13 }}>Visit Website ↗</a>} />
            )}
          </div>

          {/* Description */}
          {drive.description && (
            <Section title="📋 About the Drive">
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{drive.description}</p>
            </Section>
          )}

          {/* Eligibility Criteria */}
          <Section title="📌 Eligibility Criteria">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {drive.minCgpa != null        && <CriteriaRow label="Minimum CGPA"           value={`≥ ${drive.minCgpa}`} />}
              {drive.maxStandingArrears != null && <CriteriaRow label="Max Standing Arrears" value={`≤ ${drive.maxStandingArrears}`} />}
              {drive.maxHistoryOfArrears != null && <CriteriaRow label="Max History Arrears" value={`≤ ${drive.maxHistoryOfArrears}`} />}
              {drive.minXMarks != null      && <CriteriaRow label="Min 10th Marks"          value={`≥ ${drive.minXMarks}%`} />}
              {drive.minXiiMarks != null    && <CriteriaRow label="Min 12th Marks"          value={`≥ ${drive.minXiiMarks}%`} />}
              {drive.graduationYear != null && <CriteriaRow label="Graduation Year"         value={String(drive.graduationYear)} />}
            </div>
          </Section>

          {/* Required Skills */}
          {drive.requiredSkills?.length > 0 && (
            <Section title="🛠️ Required Skills">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {drive.requiredSkills.map(s => (
                  <span key={s} style={{ padding: '4px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                    background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe' }}>{s}</span>
                ))}
              </div>
            </Section>
          )}

          {/* ── Skill Match Visualization (Module 9) ── */}
          <Section title="">
            <SkillMatchPanel drive={drive} />
          </Section>

          {/* Allowed Departments */}
          {drive.allowedDepartments?.length > 0 && (
            <Section title="🏛️ Allowed Departments">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {drive.allowedDepartments.map(dept => (
                  <span key={dept} style={{ padding: '4px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                    background: '#f0fdf4', color: '#065f46', border: '1.5px solid #86efac' }}>{dept}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Apply button */}
          <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: 18 }}>
            {drive.applicationStage ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
                background: '#d1fae5', borderRadius: 12, border: '1.5px solid #6ee7b7' }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                    <div style={{ fontWeight: 800, color: '#065f46', fontSize: 15 }}>Automatically Mapped to Drive</div>
                  {drive.applicationStage && (
                    <div style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>
                      Current stage: <strong>{drive.applicationStage}</strong>
                    </div>
                  )}
                </div>
              </div>
            ) : isCompleted ? (
              <div style={{ padding: '14px 20px', background: '#f8fafc', borderRadius: 12,
                border: '1.5px solid #cbd5e1', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: 14 }}>
                Drive Completed
              </div>
            ) : deadlinePassed ? (
              <div style={{ padding: '14px 20px', background: '#f8fafc', borderRadius: 12,
                border: '1.5px solid #cbd5e1', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: 14 }}>
                Application deadline closed
              </div>
            ) : drive.isEligible ? (
              <button
                disabled
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: '#dcfce7',
                  color: '#15803d', fontSize: 15, fontWeight: 800, cursor: 'default',
                  transition: 'opacity .15s'
                }}
              >
                You are Eligible
              </button>
            ) : (
              <div style={{ padding: '14px 20px', background: '#fef2f2', borderRadius: 12,
                border: '1.5px solid #fca5a5', textAlign: 'center', fontWeight: 700, color: '#991b1b', fontSize: 14 }}>
                ❌ You are not eligible for this drive
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HELPER COMPONENTS
───────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function DetailBox({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{icon} {label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 3 }}>{value}</div>
    </div>
  );
}

function CriteriaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 800 }}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONFIRM APPLY MODAL
───────────────────────────────────────────── */
function ConfirmApplyModal({ drive, onConfirm, onCancel }: {
  drive: DriveDto;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 24, backdropFilter: 'blur(6px)',
      animation: 'fadeIn .18s ease'
    }} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        animation: 'slideUp .2s ease', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
          padding: '22px 26px', color: '#fff'
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🚀</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Confirm Application</div>
          <div style={{ fontSize: 13, color: '#bfdbfe', marginTop: 2 }}>
            You're about to apply for this placement drive
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px' }}>
          {/* Drive summary */}
          <div style={{
            background: '#f8fafc', border: '1.5px solid #e2e8f0',
            borderRadius: 14, padding: '16px 18px', marginBottom: 18
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#fff', fontWeight: 900, flexShrink: 0
              }}>
                {(drive.companyName || 'C').charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{drive.companyName}</div>
                <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>{drive.role}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                  💰 {drive.ctcLpa ? `${drive.ctcLpa} LPA` : 'CTC not disclosed'}
                  {drive.applicationDeadline && (
                    <> &nbsp;·&nbsp; 📅 Deadline: {formatDate(drive.applicationDeadline)}</>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rules reminder */}
          <div style={{
            background: '#fffbeb', border: '1.5px solid #fde68a',
            borderRadius: 12, padding: '12px 16px', marginBottom: 20
          }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#92400e', marginBottom: 6 }}>
              ⚠️ Please note before applying:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#78350f', lineHeight: 1.7 }}>
              <li>You cannot withdraw after submitting</li>
              <li>Your profile details will be shared with the company</li>
              <li>Stage progression is managed by faculty/admin</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', background: '#f8fafc',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#374151'
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                fontSize: 14, fontWeight: 800, cursor: 'pointer', color: '#fff',
                boxShadow: '0 6px 20px rgba(37,99,235,0.4)'
              }}
            >
              ✅ Yes, Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

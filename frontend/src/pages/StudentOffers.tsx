import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../components/StudentLayout';
import { getJson } from '../utils/api';
import { ROUTES } from '../utils/routes';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface StudentOfferDTO {
  id: number;
  driveId: number;
  driveTitle: string;
  companyName: string;
  companyIndustry: string;
  role: string;
  ctcLpa: number | null;
  issuedAt: string;
  status: string;
  // placement summary
  isPlaced: boolean;
  isLocked: boolean;
  numberOfOffers: number;
  highestPackageLpa: number | null;
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return iso; }
}

/* ─────────────────────────────────────────────
   CONFETTI PARTICLE
───────────────────────────────────────────── */
function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => i);
  const colors = ['#facc15', '#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa'];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'inherit' }}>
      {particles.map(i => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            background: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.8 + 0.2,
            animation: `confetti-fall ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   OFFER CARD
───────────────────────────────────────────── */
function OfferCard({ offer }: { offer: StudentOfferDTO }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      style={{
        background: revealed
          ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)'
          : '#fff',
        border: `2px solid ${revealed ? '#86efac' : '#e2e8f0'}`,
        borderRadius: 20,
        padding: '24px',
        boxShadow: revealed
          ? '0 8px 32px rgba(22,163,74,0.18)'
          : '0 2px 10px rgba(0,0,0,0.05)',
        transition: 'all .3s ease',
        position: 'relative',
        overflow: 'hidden',
        animation: 'slideUp .4s ease',
      }}
    >
      {revealed && <Confetti />}

      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Company Avatar */}
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff', fontWeight: 900,
            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
          }}>
            {(offer.companyName || 'C').charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
              {offer.companyName}
            </div>
            <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, marginTop: 1 }}>
              {offer.role}
            </div>
            {offer.companyIndustry && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                🏭 {offer.companyIndustry}
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
        }}>
          <span style={{
            padding: '6px 16px', borderRadius: 99,
            background: '#dcfce7', border: '1.5px solid #86efac',
            fontSize: 12, fontWeight: 800, color: '#15803d',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            🏆 Offer Received
          </span>
          {offer.isLocked && (
            <span style={{
              padding: '4px 10px', borderRadius: 99,
              background: '#fef3c7', border: '1.5px solid #fde68a',
              fontSize: 10, fontWeight: 700, color: '#92400e',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              🔒 Profile Locked
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
        marginTop: 20,
        padding: '16px',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: 14,
        border: '1px solid rgba(226,232,240,0.8)',
        position: 'relative', zIndex: 1,
      }}>
        <InfoChip icon="💼" label="Drive" value={offer.driveTitle || '—'} />
        <InfoChip
          icon="💰"
          label="CTC Package"
          value={offer.ctcLpa != null ? `${offer.ctcLpa} LPA` : '—'}
          highlight
        />
        <InfoChip icon="📅" label="Offer Date" value={fmtDate(offer.issuedAt)} />
        <InfoChip icon="✅" label="Status" value="Placed" color="#15803d" />
      </div>

      {/* Reveal / Celebration button */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '10px 28px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)';
            }}
          >
            🎁 Reveal Offer Details
          </button>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #065f46, #059669)',
            borderRadius: 12, padding: '12px 24px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
          }}>
            <span style={{ fontSize: 22 }}>🎉</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
              Congratulations on your placement at {offer.companyName}!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoChip({ icon, label, value, highlight, color }: {
  icon: string; label: string; value: string; highlight?: boolean; color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {icon} {label}
      </span>
      <span style={{
        fontSize: highlight ? 18 : 14,
        fontWeight: highlight ? 900 : 700,
        color: color ?? (highlight ? '#059669' : '#0f172a'),
      }}>
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 20,
      padding: 24, animation: 'pulse 1.4s infinite',
    }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#e2e8f0' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 18, width: '60%', background: '#e2e8f0', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 13, width: '40%', background: '#f1f5f9', borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ height: 80, background: '#f8fafc', borderRadius: 14 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   PLACEMENT SUMMARY BAR
───────────────────────────────────────────── */
function PlacementSummary({ offers }: { offers: StudentOfferDTO[] }) {
  if (offers.length === 0) return null;
  const first = offers[0];
  const totalOffers = first.numberOfOffers ?? offers.length;
  const highestCtc = first.highestPackageLpa ?? Math.max(...offers.map(o => o.ctcLpa ?? 0));

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)',
      borderRadius: 18, padding: '20px 28px', marginBottom: 24,
      display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 8px 28px rgba(29,78,216,0.25)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', right: -40, top: -40,
        width: 180, height: 180, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }} />
      <div style={{
        position: 'absolute', right: 40, bottom: -60,
        width: 120, height: 120, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 36 }}>🎓</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>
            You are Placed! 🎉
          </div>
          <div style={{ fontSize: 13, color: '#93c5fd', marginTop: 2 }}>
            VCET CampusHire · Placement Summary
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <SummaryChip label="Total Offers" value={String(totalOffers)} icon="📦" />
        <SummaryChip label="Highest CTC" value={highestCtc ? `${highestCtc} LPA` : '—'} icon="💰" />
        {first.isLocked && <SummaryChip label="Profile" value="Locked" icon="🔒" color="#fbbf24" />}
      </div>
    </div>
  );
}

function SummaryChip({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600, marginBottom: 2 }}>{icon} {label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: color ?? '#fff' }}>{value}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NO OFFERS EMPTY STATE
───────────────────────────────────────────── */
function EmptyState({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div style={{
      textAlign: 'center', padding: '70px 24px',
      background: '#fff', border: '1.5px solid #e2e8f0',
      borderRadius: 20, animation: 'fadeIn .4s ease',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
        No Offers Yet
      </h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
        You haven't received any placement offers yet. Keep applying to drives and give your best in each round!
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate(ROUTES.studentDrives)}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 22px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
          }}
        >
          🔍 Browse Drives
        </button>
        <button
          onClick={() => navigate(ROUTES.studentApplications)}
          style={{
            background: '#fff', color: '#2563eb',
            border: '1.5px solid #2563eb', borderRadius: 10,
            padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          📂 My Applications
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOCKED PROFILE NOTICE
───────────────────────────────────────────── */
function LockedProfileNotice() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
      border: '1.5px solid #fde68a', borderRadius: 14,
      padding: '14px 18px', marginBottom: 20,
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>🔒</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 3 }}>
          Profile Editing Disabled
        </div>
        <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>
          Your profile has been locked because you've received a placement offer.
          Contact your placement coordinator if you need to make any changes.
          Further drive applications have also been disabled.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function StudentOffers() {
  const navigate = useNavigate();
  const email = localStorage.getItem('email') || '';

  const [offers,  setOffers]  = useState<StudentOfferDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    if (!email) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await getJson<StudentOfferDTO[]>(`/api/student/offers?email=${encodeURIComponent(email)}`);
      setOffers(res.data || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load offers';
      setError(msg);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  const isLocked  = offers.length > 0 && offers[0].isLocked;
  const isPlaced  = offers.length > 0 && offers[0].isPlaced;

  return (
    <StudentLayout>
      <style>{`
        @keyframes fadeIn   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:.5; } }
        @keyframes confetti-fall {
          0%   { transform: translateY(-10px) rotate(0deg);   opacity:.9; }
          50%  { transform: translateY(20px)  rotate(180deg); opacity:.5; }
          100% { transform: translateY(-10px) rotate(360deg); opacity:.9; }
        }
        @keyframes shimmer  { 0%{ background-position:-200% 0; } 100%{ background-position:200% 0; } }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(5,150,105,0.4); }
          50%     { box-shadow: 0 0 0 10px rgba(5,150,105,0); }
        }
      `}</style>

      <div style={{ padding: '24px 28px', minHeight: '100vh', background: '#f8fafc' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 22, animation: 'fadeIn .3s ease' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
            🏆 My Offers
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            {isPlaced
              ? 'Congratulations on your placement! Here are your received offers.'
              : 'Your placement offers will appear here once you are selected.'}
          </p>
        </div>

        {/* ── Loading ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              height: 100, borderRadius: 18,
              background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
            }} />
            {[1, 2].map(i => <SkeletonCard key={i} />)}
          </div>

        ) : error ? (
          <div style={{
            textAlign: 'center', padding: '50px 24px',
            background: '#fff', border: '1.5px solid #fca5a5',
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
            <p style={{ color: '#991b1b', fontWeight: 700, margin: '0 0 10px' }}>Failed to load offers</p>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{error}</p>
            <button
              onClick={loadOffers}
              style={{
                padding: '9px 20px', background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: 9, fontWeight: 700, cursor: 'pointer', fontSize: 13,
              }}
            >
              🔄 Retry
            </button>
          </div>

        ) : offers.length === 0 ? (
          <EmptyState navigate={navigate} />

        ) : (
          <>
            {/* Placement Summary Banner */}
            <PlacementSummary offers={offers} />

            {/* Locked profile notice */}
            {isLocked && <LockedProfileNotice />}

            {/* Offers heading */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14,
            }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                📦 Received Offers ({offers.length})
              </h2>
              <span style={{
                background: '#dcfce7', border: '1.5px solid #86efac',
                color: '#15803d', borderRadius: 99, padding: '4px 14px',
                fontSize: 12, fontWeight: 800,
                animation: 'glow-pulse 2s infinite',
              }}>
                ✅ Placed
              </span>
            </div>

            {/* Offer Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {offers.map((offer, idx) => (
                <div
                  key={offer.id}
                  style={{ animationDelay: `${idx * 0.08}s`, animation: 'slideUp .4s ease both' }}
                >
                  <OfferCard offer={offer} />
                </div>
              ))}
            </div>

            {/* Info footer */}
            <div style={{
              marginTop: 24, padding: '14px 18px',
              background: '#f0f9ff', border: '1.5px solid #bae6fd',
              borderRadius: 12, fontSize: 12, color: '#0369a1', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>ℹ️</span>
              Your profile is now locked and further applications have been disabled.
              Contact your Placement Coordinator for any queries.
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}

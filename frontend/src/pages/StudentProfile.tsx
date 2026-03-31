import { useEffect, useState, useCallback } from 'react';
import StudentLayout from '../components/StudentLayout';
import { getJson, postJson, putJson } from '../utils/api';

/* ─────────────────────────────────────────────
   TYPES  (mirror the expanded DTO)
───────────────────────────────────────────── */
interface PersonalDetailsDto {
  firstName: string; lastName: string; fatherName: string; motherName: string;
  fatherOccupation: string; motherOccupation: string; gender: string;
  community: string; dateOfBirth: string; hostelerOrDayScholar: string; bio: string;
}
interface ContactDetailsDto {
  alternateEmail: string; studentMobile1: string; studentMobile2: string;
  parentMobile: string; landlineNo: string; fullAddress: string;
  city: string; state: string; pincode: string;
}
interface AcademicRecordDto {
  ugYearOfPass: number | ''; admissionQuota: string; mediumOfInstruction: string;
  locality: string; sem1Gpa: number | ''; sem2Gpa: number | ''; sem3Gpa: number | '';
  sem4Gpa: number | ''; sem5Gpa: number | ''; sem6Gpa: number | '';
  sem7Gpa: number | ''; sem8Gpa: number | ''; cgpa: number | '';
  standingArrears: number | ''; historyOfArrears: number | '';
  hasHistoryOfArrears: boolean; courseGapInYears: number | '';
}
interface SchoolingDetailsDto {
  xMarksPercentage: number | ''; xYearOfPassing: number | ''; xSchoolName: string; xBoardOfStudy: string;
  xiiMarksPercentage: number | ''; xiiYearOfPassing: number | ''; xiiSchoolName: string;
  xiiBoardOfStudy: string; xiiCutOffMarks: number | ''; diplomaMarksPercentage: number | '';
}
interface ProfessionalProfileDto {
  linkedinProfileUrl: string; githubProfileUrl: string; portfolioUrl: string;
  leetcodeProfileUrl: string; leetcodeProblemsSolved: number | ''; leetcodeRating: string;
  hackerrankProfileUrl: string; codechefProfileUrl: string; codeforcesProfileUrl: string;
}
interface CertificationDto { id?: number; skillName: string; duration: string; vendor: string; }
interface SkillDto { id?: number; skillName: string; proficiencyLevel: string; category: string; }
interface ResumeDto { resumeUrl: string; resumeFileName: string; resumeUploadedAt?: string; resumeSummary: string; }
interface IdentityDocsDto {
  isAadharAvailable: boolean; aadharNumber: string; nameAsPerAadhar: string;
  familyCardNumber: string; isPanCardAvailable: boolean; isPassportAvailable: boolean;
}
interface ProfileDto {
  id: number; rollNo: string; batch: string;
  registerNumber: string; email: string; departmentName: string;
  resumeUrl: string; resumeFileName: string; resumeUploadedAt?: string; resumeSummary: string;
  verificationStatus: string; submittedForVerification?: boolean; isLocked: boolean; isEligibleForPlacements: boolean;
  interestedOnPlacement: boolean; isPlaced: boolean; numberOfOffers: number; highestPackageLpa: number;
  personalDetails: PersonalDetailsDto; contactDetails: ContactDetailsDto;
  academicRecord: AcademicRecordDto; schoolingDetails: SchoolingDetailsDto;
  professionalProfile: ProfessionalProfileDto; certifications: CertificationDto[];
  skills: SkillDto[]; identityDocs: IdentityDocsDto; resume: ResumeDto;
  profileCompletion?: number;
}

/* ─────────────────────────────────────────────
   DEFAULTS
───────────────────────────────────────────── */
const defPersonal   = (): PersonalDetailsDto   => ({ firstName:'',lastName:'',fatherName:'',motherName:'',fatherOccupation:'',motherOccupation:'',gender:'',community:'',dateOfBirth:'',hostelerOrDayScholar:'',bio:'' });
const defContact    = (): ContactDetailsDto    => ({ alternateEmail:'',studentMobile1:'',studentMobile2:'',parentMobile:'',landlineNo:'',fullAddress:'',city:'',state:'',pincode:'' });
const defAcademic   = (): AcademicRecordDto    => ({ ugYearOfPass:'',admissionQuota:'',mediumOfInstruction:'',locality:'',sem1Gpa:'',sem2Gpa:'',sem3Gpa:'',sem4Gpa:'',sem5Gpa:'',sem6Gpa:'',sem7Gpa:'',sem8Gpa:'',cgpa:'',standingArrears:'',historyOfArrears:'',hasHistoryOfArrears:false,courseGapInYears:'' });
const defSchooling  = (): SchoolingDetailsDto  => ({ xMarksPercentage:'',xYearOfPassing:'',xSchoolName:'',xBoardOfStudy:'',xiiMarksPercentage:'',xiiYearOfPassing:'',xiiSchoolName:'',xiiBoardOfStudy:'',xiiCutOffMarks:'',diplomaMarksPercentage:'' });
const defProfessional = (): ProfessionalProfileDto => ({ linkedinProfileUrl:'',githubProfileUrl:'',portfolioUrl:'',leetcodeProfileUrl:'',leetcodeProblemsSolved:'',leetcodeRating:'',hackerrankProfileUrl:'',codechefProfileUrl:'',codeforcesProfileUrl:'' });
const defIdentity   = (): IdentityDocsDto      => ({ isAadharAvailable:false,aadharNumber:'',nameAsPerAadhar:'',familyCardNumber:'',isPanCardAvailable:false,isPassportAvailable:false });
const defResume     = (): ResumeDto            => ({ resumeUrl:'', resumeFileName:'', resumeSummary:'' });

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
type TabId = 'personal'|'contact'|'academic'|'schooling'|'professional'|'certifications'|'skills'|'resume'|'identity';

/**
 * Recursively converts:
 *   '' (empty string) number/'' union → null
 *   '  ' whitespace string            → null
 * so the backend receives proper nulls instead of empty strings.
 */
function sanitize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return (obj.trim() === '' ? null : obj.trim()) as unknown as T;
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize) as unknown as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as object)) {
      const val = (obj as Record<string, unknown>)[key];
      // empty-string number fields stored as '' should become null
      result[key] = (val === '') ? null : sanitize(val);
    }
    return result as T;
  }
  return obj;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id:'personal',       label:'Personal Details',    icon:'👤' },
  { id:'contact',        label:'Contact Details',     icon:'📞' },
  { id:'academic',       label:'Academic Record',     icon:'🎓' },
  { id:'schooling',      label:'Schooling Details',   icon:'🏫' },
  { id:'professional',   label:'Professional Profiles',icon:'💼' },
  { id:'certifications', label:'Certifications',      icon:'📜' },
  { id:'skills',         label:'Skills',              icon:'🛠️' },
  { id:'resume',         label:'Resume',              icon:'📄' },
  { id:'identity',       label:'Identity Documents',  icon:'🪪' },
];

function calcCompletion(p: ProfileDto | null): number {
  if (!p) return 0;
  let filled = 0, total = 0;
  const check = (v: unknown) => { total++; if (v !== null && v !== undefined && v !== '' && v !== 0) filled++; };
  const pd = p.personalDetails;
  if (pd) { check(pd.firstName); check(pd.lastName); check(pd.gender); check(pd.dateOfBirth); check(pd.fatherName); check(pd.motherName); check(pd.bio); } else total += 7;
  const cd = p.contactDetails;
  if (cd) { check(cd.studentMobile1); check(cd.city); check(cd.state); check(cd.pincode); check(cd.fullAddress); } else total += 5;
  const ar = p.academicRecord;
  if (ar) { check(ar.cgpa); check(ar.ugYearOfPass); check(ar.standingArrears); check(ar.admissionQuota); } else total += 4;
  const sd = p.schoolingDetails;
  if (sd) { check(sd.xMarksPercentage); check(sd.xiiMarksPercentage); check(sd.xSchoolName); check(sd.xiiSchoolName); } else total += 4;
  const pp = p.professionalProfile;
  if (pp) { check(pp.linkedinProfileUrl); check(pp.githubProfileUrl); } else total += 2;
  check(p.certifications?.length > 0 ? 'yes' : '');
  const id = p.identityDocs;
  if (id) { check(id.aadharNumber); check(id.nameAsPerAadhar); } else total += 2;
  return Math.round((filled / total) * 100);
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success'|'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',alignItems:'center',gap:10,
      padding:'13px 20px',borderRadius:12,color:'#fff',fontWeight:600,fontSize:14,
      background: type==='success' ? '#10b981' : '#ef4444',
      boxShadow:'0 8px 24px rgba(0,0,0,0.18)',animation:'slideUp .3s ease' }}>
      {type==='success' ? '✅' : '❌'} {msg}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FIELD COMPONENTS
───────────────────────────────────────────── */
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="sp-field">
      <label className="sp-label">{label}{required && <span style={{color:'#ef4444'}}> *</span>}</label>
      {children}
      {error && <span className="sp-err">{error}</span>}
    </div>
  );
}

function Input({ disabled, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { disabled?: boolean }) {
  return <input className={`sp-input${disabled?' sp-disabled':''}`} disabled={disabled} {...props} value={props.value ?? ''} />;
}
function Select({ disabled, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { disabled?: boolean }) {
  return <select className={`sp-input${disabled?' sp-disabled':''}`} disabled={disabled} {...props} value={props.value ?? ''}>{children}</select>;
}
function Textarea({ disabled, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { disabled?: boolean }) {
  return <textarea className={`sp-input sp-textarea${disabled?' sp-disabled':''}`} disabled={disabled} {...props} value={props.value ?? ''} />;
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function StudentProfile() {
  const [profile,  setProfile]  = useState<ProfileDto | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [saving,   setSaving]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  // Tab-local form states
  const [personal,       setPersonal]       = useState<PersonalDetailsDto>(defPersonal());
  const [contact,        setContact]        = useState<ContactDetailsDto>(defContact());
  const [academic,       setAcademic]       = useState<AcademicRecordDto>(defAcademic());
  const [schooling,      setSchooling]      = useState<SchoolingDetailsDto>(defSchooling());
  const [professional,   setProfessional]   = useState<ProfessionalProfileDto>(defProfessional());
  const [certifications, setCertifications] = useState<CertificationDto[]>([]);
  const [skills,         setSkills]         = useState<SkillDto[]>([]);
  const [resume,         setResume]         = useState<ResumeDto>(defResume());
  const [identity,       setIdentity]       = useState<IdentityDocsDto>(defIdentity());

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJson<ProfileDto>('/api/student/profile');
      const p = res.data;
      setProfile(p);
      if (p.personalDetails)   setPersonal({ ...defPersonal(),   ...p.personalDetails });
      if (p.contactDetails)    setContact({  ...defContact(),    ...p.contactDetails });
      if (p.academicRecord)    setAcademic({ ...defAcademic(),   ...p.academicRecord });
      if (p.schoolingDetails)  setSchooling({...defSchooling(),  ...p.schoolingDetails });
      if (p.professionalProfile) setProfessional({ ...defProfessional(), ...p.professionalProfile });
      if (p.certifications?.length) setCertifications(p.certifications);
      if (p.skills?.length)    setSkills(p.skills);
      if (p.resume)            setResume({ ...defResume(), ...p.resume });
      else if (p.resumeUrl)    setResume({ resumeUrl: p.resumeUrl||'', resumeFileName: p.resumeFileName||'', resumeSummary: p.resumeSummary||'' });
      if (p.identityDocs)      setIdentity({  ...defIdentity(),  ...p.identityDocs });
    } catch { setToast({ msg: 'Failed to load profile', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const isLocked   = !!profile?.isLocked;
  const isReadonly = isLocked || profile?.verificationStatus === 'VERIFIED';

  // ── Save dispatcher ──
  async function handleSave() {
    if (isReadonly) return;
    setSaving(true);
    setErrors({});
    try {
      if (activeTab === 'personal')       await putJson('/api/student/profile/personal',       sanitize(personal));
      if (activeTab === 'contact')        await putJson('/api/student/profile/contact',        sanitize(contact));
      if (activeTab === 'academic')       await putJson('/api/student/profile/academic',       sanitize(academic));
      if (activeTab === 'schooling')      await putJson('/api/student/profile/schooling',      sanitize(schooling));
      if (activeTab === 'professional')   await putJson('/api/student/profile/professional',   sanitize(professional));
      if (activeTab === 'certifications') await putJson('/api/student/profile/certifications', sanitize(certifications));
      if (activeTab === 'skills')         await putJson('/api/student/profile/skills',         sanitize(skills));
      if (activeTab === 'resume')         await putJson('/api/student/profile/resume',         sanitize(resume));
      if (activeTab === 'identity')       await putJson('/api/student/profile/identity',       sanitize(identity));
      setToast({ msg: 'Saved successfully!', type: 'success' });
      await loadProfile();
    } catch (e: any) {
      setToast({ msg: e?.message || 'Save failed', type: 'error' });
    } finally { setSaving(false); }
  }

  async function handleSubmitForVerification() {
    if (isReadonly) return;
    setSubmitting(true);
    try {
      await postJson('/api/student/profile/submit', {});
      setToast({ msg: 'Profile submitted to faculty for verification!', type: 'success' });
      await loadProfile();
    } catch (e: any) {
      setToast({ msg: e?.message || 'Submission failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const completion = Math.round(profile?.profileCompletion ?? calcCompletion(profile));
  const verStatus  = profile?.verificationStatus || 'PENDING';
  const isSubmitted = !!profile?.submittedForVerification;
  const canSubmitForVerification = !isReadonly && !isLocked && completion >= 80 && !isSubmitted;

  /* ── Status banner config ── */
  const statusCfg: Record<string, { bg: string; border: string; color: string; icon: string; text: string }> = {
    VERIFIED:  { bg:'#f0fdf4', border:'#86efac', color:'#15803d', icon:'✅', text:'Your profile has been verified. Editing is disabled.' },
    PENDING:   { bg:'#fffbeb', border:'#fde68a', color:'#92400e', icon:'⏳', text: isSubmitted ? 'Awaiting faculty verification. Your submitted profile is now in the faculty queue.' : 'Your profile is still a draft. Submit it to faculty once completion reaches at least 80%.' },
    REJECTED:  { bg:'#fef2f2', border:'#fca5a5', color:'#991b1b', icon:'❌', text:'Your profile was rejected. Please update and resubmit.' },
  };
  const cfg = statusCfg[verStatus] || statusCfg['PENDING'];

  if (loading) return (
    <StudentLayout>
      <div className="sp-loading"><div className="sp-spinner" /><p>Loading your profile…</p></div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="sp-page">

        {/* ── LOCK BANNER (Module 10) — shown only when isLocked ── */}
        {isLocked && (
          <div style={{
            background: 'linear-gradient(135deg,#1e293b,#0f172a)',
            border: '2px solid #475569',
            borderRadius: 16,
            padding: '18px 22px',
            marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
            animation: 'slideUp .3s ease',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle diagonal pattern overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.04,
              backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
              backgroundSize: '12px 12px',
            }} />

            {/* Lock Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, zIndex: 1,
            }}>
              🔒
            </div>

            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#f1f5f9', marginBottom: 4 }}>
                Profile is Locked
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                Your profile has been locked by the placement office. All editing is disabled.
                You cannot apply for new drives while your profile is locked.
                Please contact your faculty or placement coordinator to unlock it.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, zIndex: 1 }}>
              {/* What's disabled tooltip */}
              <div
                title="Profile editing, applying to drives, and updating details are all disabled while locked."
                style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                  background: 'rgba(239,68,68,0.2)', color: '#fca5a5',
                  border: '1.5px solid rgba(239,68,68,0.35)', cursor: 'help',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                ℹ️ What's disabled?
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                background: 'rgba(148,163,184,0.15)', color: '#64748b',
                border: '1.5px solid rgba(148,163,184,0.3)',
                textAlign: 'center',
              }}>
                🔒 LOCKED
              </div>
            </div>
          </div>
        )}

        {/* ── Top Status Banner ── */}
        <div className="sp-banner" style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
          <div className="sp-banner-left">
            <span className="sp-banner-icon">{cfg.icon}</span>
            <div>
              <div className="sp-banner-title" style={{ color: cfg.color }}>
                Profile Status: <strong>{verStatus}</strong>
                {profile?.isLocked && <span className="sp-lock-badge">🔒 Locked</span>}
              </div>
              <div className="sp-banner-sub" style={{ color: cfg.color }}>{cfg.text}</div>
              {profile?.registerNumber && (
                <div style={{ marginTop: 4, fontSize: 12, color: cfg.color, fontWeight: 600 }}>
                  🎓 Reg No: <strong>{profile.registerNumber}</strong>
                  {profile.departmentName && <> &nbsp;|&nbsp; 🏛️ {profile.departmentName}</>}
                </div>
              )}
            </div>
          </div>
          <div className="sp-banner-right">
            <div className="sp-placement-badge" style={{ background: profile?.isEligibleForPlacements ? '#d1fae5' : '#fee2e2', color: profile?.isEligibleForPlacements ? '#065f46' : '#991b1b' }}>
              {profile?.isEligibleForPlacements ? '✅ Eligible for Placements' : '❌ Not Eligible'}
            </div>
            {profile?.isPlaced && (
              <div className="sp-placement-badge" style={{ background:'#dbeafe', color:'#1e40af' }}>🏆 Placed</div>
            )}
          </div>
        </div>

        {/* ── Completion Bar ── */}
        <div className="sp-completion-card">
          <div className="sp-completion-header">
            <span className="sp-completion-label">Profile Completion</span>
            <span className="sp-completion-pct" style={{ color: completion >= 80 ? '#059669' : completion >= 50 ? '#d97706' : '#dc2626' }}>
              {completion}%
            </span>
          </div>
          <div className="sp-completion-track">
            <div className="sp-completion-fill" style={{
              width: `${completion}%`,
              background: completion >= 80 ? 'linear-gradient(90deg,#10b981,#059669)' : completion >= 50 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)'
            }} />
          </div>
          <div className="sp-completion-hint">
            {completion < 80
              ? 'Complete at least 80% of your profile before submitting it to faculty.'
              : completion < 100
                ? 'You can now submit this profile to faculty, or keep filling more sections to reach 100%.'
                : 'Your profile is complete and ready for faculty review.'}
          </div>
        </div>

        {/* ── Tab Layout ── */}
        <div className="sp-layout">

          {/* Sidebar Tabs */}
          <nav className="sp-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`sp-tab${activeTab===t.id?' active':''}`} onClick={() => setActiveTab(t.id)}>
                <span className="sp-tab-icon">{t.icon}</span>
                <span className="sp-tab-label">{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Form Panel */}
          <div className="sp-panel">
            <div className="sp-panel-header">
              <h2 className="sp-panel-title">
                {TABS.find(t => t.id === activeTab)?.icon}{' '}
                {TABS.find(t => t.id === activeTab)?.label}
              </h2>
              {!isLocked && !isReadonly && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="sp-save-btn"
                    onClick={handleSubmitForVerification}
                    disabled={!canSubmitForVerification || submitting || saving}
                    style={{
                      background: canSubmitForVerification ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#cbd5e1',
                      boxShadow: canSubmitForVerification ? '0 10px 24px rgba(37,99,235,0.18)' : 'none'
                    }}
                    title={completion < 80 ? 'Complete at least 80% of your profile before submitting' : isSubmitted ? 'Already submitted to faculty' : 'Submit profile to faculty'}
                  >
                    {submitting ? 'Submitting…' : isSubmitted ? 'Submitted to Faculty' : 'Submit to Faculty'}
                  </button>
                  {!isSubmitted && completion < 80 && (
                    <span style={{ fontSize: 12, color: '#b45309', fontWeight: 700 }}>
                      Reach 80% completion to submit
                    </span>
                  )}
                </div>
              )}
              {isLocked && (
                <span
                  title="Your profile is locked by the placement office. Contact your faculty to unlock."
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, cursor: 'help',
                    padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                    background: '#1e293b', color: '#f1f5f9', border: '1.5px solid #475569',
                  }}
                >
                  🔒 Profile Locked
                </span>
              )}
              {!isLocked && isReadonly && (
                <span className="sp-readonly-badge">✅ Verified — Read-only</span>
              )}
            </div>

            {/* Locked overlay notice */}
            {isLocked && (
              <div style={{
                margin: '12px 20px', padding: '12px 16px',
                background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#991b1b' }}>Editing Disabled — Profile Locked</div>
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>
                    All fields are read-only. You cannot apply for placement drives while locked.
                    Contact your placement coordinator to request an unlock.
                  </div>
                </div>
              </div>
            )}

            <div className="sp-panel-body">
              {activeTab === 'personal'       && <PersonalTab       data={personal}       onChange={setPersonal}       disabled={!!isReadonly} errors={errors} />}
              {activeTab === 'contact'        && <ContactTab        data={contact}        onChange={setContact}        disabled={!!isReadonly} errors={errors} />}
              {activeTab === 'academic'       && <AcademicTab       data={academic}       onChange={setAcademic}       disabled={!!isReadonly} errors={errors} />}
              {activeTab === 'schooling'      && <SchoolingTab      data={schooling}      onChange={setSchooling}      disabled={!!isReadonly} errors={errors} />}
              {activeTab === 'professional'   && <ProfessionalTab   data={professional}   onChange={setProfessional}   disabled={!!isReadonly} errors={errors} />}
              {activeTab === 'certifications' && <CertificationsTab data={certifications} onChange={setCertifications} disabled={!!isReadonly} />}
              {activeTab === 'skills'         && <SkillsTab         data={skills}         onChange={setSkills}         disabled={!!isReadonly} />}
              {activeTab === 'resume'         && <ResumeTab         data={resume}         onChange={setResume}         disabled={!!isReadonly} profile={profile} />}
              {activeTab === 'identity'       && <IdentityTab       data={identity}       onChange={setIdentity}       disabled={!!isReadonly} errors={errors} />}
            </div>

            {!isReadonly && (
              <div className="sp-panel-footer">
                <button className="sp-save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="sp-btn-spinner" /> Saving…</> : '💾 Save Changes'}
                </button>
              </div>
            )}

            {isLocked && (
              <div className="sp-panel-footer" style={{ background: '#1e293b' }}>
                <button
                  disabled
                  title="Profile is locked. Contact your placement office to unlock."
                  style={{
                    width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #475569',
                    background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 700,
                    cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  🔒 Saving Disabled — Profile Locked
                </button>
              </div>
            )}

            {!isLocked && isReadonly && (
              <div className="sp-panel-footer">
                <button
                  disabled
                  title="Profile is verified. Editing is disabled. Contact faculty to re-open."
                  style={{
                    width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #86efac',
                    background: '#f0fdf4', color: '#15803d', fontSize: 13, fontWeight: 700,
                    cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  ✅ Profile Verified — Editing Locked
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </StudentLayout>
  );
}

/* ═══════════════════════════════════════════
   TAB 1 — PERSONAL DETAILS
═══════════════════════════════════════════ */
function PersonalTab({ data, onChange, disabled, errors }: { data: PersonalDetailsDto; onChange: (d: PersonalDetailsDto) => void; disabled: boolean; errors: Record<string,string> }) {
  const set = (k: keyof PersonalDetailsDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...data, [k]: e.target.value });
  return (
    <div className="sp-grid-2">
      <Field label="First Name" required error={errors.firstName}><Input disabled={disabled} value={data.firstName} onChange={set('firstName')} placeholder="Enter first name" /></Field>
      <Field label="Last Name" required error={errors.lastName}><Input disabled={disabled} value={data.lastName} onChange={set('lastName')} placeholder="Enter last name" /></Field>
      <Field label="Gender"><Select disabled={disabled} value={data.gender} onChange={set('gender')}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></Select></Field>
      <Field label="Date of Birth"><Input type="date" disabled={disabled} value={data.dateOfBirth} onChange={set('dateOfBirth')} /></Field>
      <Field label="Father Name"><Input disabled={disabled} value={data.fatherName} onChange={set('fatherName')} placeholder="Father's name" /></Field>
      <Field label="Mother Name"><Input disabled={disabled} value={data.motherName} onChange={set('motherName')} placeholder="Mother's name" /></Field>
      <Field label="Father Occupation"><Input disabled={disabled} value={data.fatherOccupation} onChange={set('fatherOccupation')} placeholder="e.g. Engineer, Farmer" /></Field>
      <Field label="Mother Occupation"><Input disabled={disabled} value={data.motherOccupation} onChange={set('motherOccupation')} placeholder="e.g. Teacher, Homemaker" /></Field>
      <Field label="Community"><Select disabled={disabled} value={data.community} onChange={set('community')}><option value="">Select community</option><option>OC</option><option>BC</option><option>BCM</option><option>MBC</option><option>SC</option><option>ST</option><option>SCA</option></Select></Field>
      <Field label="Hosteler / Day Scholar"><Select disabled={disabled} value={data.hostelerOrDayScholar} onChange={set('hostelerOrDayScholar')}><option value="">Select</option><option value="Hosteler">Hosteler</option><option value="Day Scholar">Day Scholar</option></Select></Field>
      <div className="sp-col-2">
        <Field label="Bio / About Yourself"><Textarea disabled={disabled} value={data.bio} onChange={set('bio')} placeholder="Write a short bio about yourself…" rows={4} /></Field>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 2 — CONTACT DETAILS
═══════════════════════════════════════════ */
function ContactTab({ data, onChange, disabled, errors }: { data: ContactDetailsDto; onChange: (d: ContactDetailsDto) => void; disabled: boolean; errors: Record<string,string> }) {
  const set = (k: keyof ContactDetailsDto) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, [k]: e.target.value });
  return (
    <div className="sp-grid-2">
      <Field label="Primary Mobile" required error={errors.studentMobile1}><Input type="tel" disabled={disabled} value={data.studentMobile1} onChange={set('studentMobile1')} placeholder="10-digit mobile number" /></Field>
      <Field label="Alternate Mobile"><Input type="tel" disabled={disabled} value={data.studentMobile2} onChange={set('studentMobile2')} placeholder="Alternate mobile" /></Field>
      <Field label="Parent Mobile"><Input type="tel" disabled={disabled} value={data.parentMobile} onChange={set('parentMobile')} placeholder="Parent contact" /></Field>
      <Field label="Landline No"><Input type="tel" disabled={disabled} value={data.landlineNo} onChange={set('landlineNo')} placeholder="Landline (optional)" /></Field>
      <Field label="Alternate Email"><Input type="email" disabled={disabled} value={data.alternateEmail} onChange={set('alternateEmail')} placeholder="alternate@email.com" /></Field>
      <Field label="Pincode"><Input disabled={disabled} value={data.pincode} onChange={set('pincode')} placeholder="6-digit pincode" maxLength={6} /></Field>
      <Field label="City" required><Input disabled={disabled} value={data.city} onChange={set('city')} placeholder="City" /></Field>
      <Field label="State" required><Input disabled={disabled} value={data.state} onChange={set('state')} placeholder="State" /></Field>
      <div className="sp-col-2">
        <Field label="Full Address"><Input disabled={disabled} value={data.fullAddress} onChange={set('fullAddress')} placeholder="Door no., Street, Area, District" /></Field>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 3 — ACADEMIC RECORD
═══════════════════════════════════════════ */
function AcademicTab({ data, onChange, disabled, errors }: { data: AcademicRecordDto; onChange: (d: AcademicRecordDto) => void; disabled: boolean; errors: Record<string,string> }) {
  const set = (k: keyof AcademicRecordDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    onChange({ ...data, [k]: v });
  };
  const sems: (keyof AcademicRecordDto)[] = ['sem1Gpa','sem2Gpa','sem3Gpa','sem4Gpa','sem5Gpa','sem6Gpa','sem7Gpa','sem8Gpa'];
  return (
    <div>
      <div className="sp-grid-2">
        <Field label="UG Year of Pass"><Input type="number" disabled={disabled} value={data.ugYearOfPass} onChange={set('ugYearOfPass')} placeholder="e.g. 2026" min={2020} max={2035} /></Field>
        <Field label="Admission Quota"><Select disabled={disabled} value={data.admissionQuota} onChange={set('admissionQuota')}><option value="">Select</option><option>Management</option><option>Government</option><option>NRI</option></Select></Field>
        <Field label="Medium of Instruction"><Select disabled={disabled} value={data.mediumOfInstruction} onChange={set('mediumOfInstruction')}><option value="">Select</option><option>English</option><option>Tamil</option></Select></Field>
        <Field label="Locality"><Select disabled={disabled} value={data.locality} onChange={set('locality')}><option value="">Select</option><option>Rural</option><option>Urban</option></Select></Field>
        <Field label="CGPA" required error={errors.cgpa}><Input type="number" step="0.01" min={0} max={10} disabled={disabled} value={data.cgpa} onChange={set('cgpa')} placeholder="e.g. 8.5" /></Field>
        <Field label="Standing Arrears"><Input type="number" min={0} disabled={disabled} value={data.standingArrears} onChange={set('standingArrears')} placeholder="Current backlogs" /></Field>
        <Field label="History of Arrears"><Input type="number" min={0} disabled={disabled} value={data.historyOfArrears} onChange={set('historyOfArrears')} placeholder="Total history" /></Field>
        <Field label="Course Gap (Years)"><Input type="number" min={0} disabled={disabled} value={data.courseGapInYears} onChange={set('courseGapInYears')} placeholder="0 if no gap" /></Field>
        <div className="sp-col-2 sp-checkbox-row">
          <label className="sp-checkbox-label">
            <input type="checkbox" disabled={disabled} checked={!!data.hasHistoryOfArrears}
              onChange={e => onChange({ ...data, hasHistoryOfArrears: e.target.checked })} />
            Has History of Arrears
          </label>
        </div>
      </div>

      <div className="sp-section-divider">Semester-wise GPA</div>
      <div className="sp-grid-4">
        {sems.map((s, i) => (
          <Field key={s} label={`Sem ${i+1} GPA`}>
            <Input type="number" step="0.01" min={0} max={10} disabled={disabled}
              value={data[s] as number | ''} onChange={set(s)} placeholder="0.00" />
          </Field>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 4 — SCHOOLING DETAILS
═══════════════════════════════════════════ */
function SchoolingTab({ data, onChange, disabled, errors }: { data: SchoolingDetailsDto; onChange: (d: SchoolingDetailsDto) => void; disabled: boolean; errors: Record<string,string> }) {
  const set = (k: keyof SchoolingDetailsDto) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, [k]: e.target.value });
  return (
    <div>
      <div className="sp-section-divider">10th Standard (SSLC)</div>
      <div className="sp-grid-2">
        <Field label="School Name"><Input disabled={disabled} value={data.xSchoolName} onChange={set('xSchoolName')} placeholder="Name of school" /></Field>
        <Field label="Board of Study"><Select disabled={disabled} value={data.xBoardOfStudy} onChange={e => onChange({ ...data, xBoardOfStudy: e.target.value })}><option value="">Select board</option><option>State Board</option><option>CBSE</option><option>ICSE</option><option>Matric</option></Select></Field>
        <Field label="Marks / Percentage" required><Input type="number" step="0.01" min={0} max={100} disabled={disabled} value={data.xMarksPercentage} onChange={set('xMarksPercentage')} placeholder="e.g. 92.5" /></Field>
        <Field label="Year of Passing"><Input type="number" disabled={disabled} value={data.xYearOfPassing} onChange={set('xYearOfPassing')} placeholder="e.g. 2020" /></Field>
      </div>

      <div className="sp-section-divider">12th Standard (HSC)</div>
      <div className="sp-grid-2">
        <Field label="School Name"><Input disabled={disabled} value={data.xiiSchoolName} onChange={set('xiiSchoolName')} placeholder="Name of school" /></Field>
        <Field label="Board of Study"><Select disabled={disabled} value={data.xiiBoardOfStudy} onChange={e => onChange({ ...data, xiiBoardOfStudy: e.target.value })}><option value="">Select board</option><option>State Board</option><option>CBSE</option><option>ICSE</option><option>Matric</option></Select></Field>
        <Field label="Marks / Percentage" required><Input type="number" step="0.01" min={0} max={100} disabled={disabled} value={data.xiiMarksPercentage} onChange={set('xiiMarksPercentage')} placeholder="e.g. 88.0" /></Field>
        <Field label="Year of Passing"><Input type="number" disabled={disabled} value={data.xiiYearOfPassing} onChange={set('xiiYearOfPassing')} placeholder="e.g. 2022" /></Field>
        <Field label="Cut-off Marks"><Input type="number" step="0.01" disabled={disabled} value={data.xiiCutOffMarks} onChange={set('xiiCutOffMarks')} placeholder="e.g. 195.5" /></Field>
      </div>

      <div className="sp-section-divider">Diploma (if applicable)</div>
      <div className="sp-grid-2">
        <Field label="Diploma Marks %"><Input type="number" step="0.01" min={0} max={100} disabled={disabled} value={data.diplomaMarksPercentage} onChange={set('diplomaMarksPercentage')} placeholder="Leave blank if N/A" /></Field>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 5 — PROFESSIONAL PROFILES
═══════════════════════════════════════════ */
function ProfessionalTab({ data, onChange, disabled, errors }: { data: ProfessionalProfileDto; onChange: (d: ProfessionalProfileDto) => void; disabled: boolean; errors: Record<string,string> }) {
  const set = (k: keyof ProfessionalProfileDto) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, [k]: e.target.value });
  return (
    <div>
      <div className="sp-section-divider">🌐 Networking Profiles</div>
      <div className="sp-grid-2">
        <Field label="LinkedIn URL"><Input disabled={disabled} value={data.linkedinProfileUrl} onChange={set('linkedinProfileUrl')} placeholder="https://linkedin.com/in/username" /></Field>
        <Field label="GitHub URL"><Input disabled={disabled} value={data.githubProfileUrl} onChange={set('githubProfileUrl')} placeholder="https://github.com/username" /></Field>
        <Field label="Portfolio URL"><Input disabled={disabled} value={data.portfolioUrl} onChange={set('portfolioUrl')} placeholder="https://yourportfolio.com" /></Field>
      </div>

      <div className="sp-section-divider">🏆 Competitive Programming</div>
      <div className="sp-grid-2">
        <Field label="LeetCode URL"><Input disabled={disabled} value={data.leetcodeProfileUrl} onChange={set('leetcodeProfileUrl')} placeholder="https://leetcode.com/username" /></Field>
        <Field label="LeetCode Problems Solved"><Input type="number" min={0} disabled={disabled} value={data.leetcodeProblemsSolved} onChange={set('leetcodeProblemsSolved')} placeholder="e.g. 250" /></Field>
        <Field label="LeetCode Rating"><Input disabled={disabled} value={data.leetcodeRating} onChange={set('leetcodeRating')} placeholder="e.g. 1850" /></Field>
        <Field label="HackerRank URL"><Input disabled={disabled} value={data.hackerrankProfileUrl} onChange={set('hackerrankProfileUrl')} placeholder="https://hackerrank.com/username" /></Field>
        <Field label="CodeChef URL"><Input disabled={disabled} value={data.codechefProfileUrl} onChange={set('codechefProfileUrl')} placeholder="https://codechef.com/username" /></Field>
        <Field label="Codeforces URL"><Input disabled={disabled} value={data.codeforcesProfileUrl} onChange={set('codeforcesProfileUrl')} placeholder="https://codeforces.com/profile/username" /></Field>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 6 — CERTIFICATIONS
═══════════════════════════════════════════ */
function CertificationsTab({ data, onChange, disabled }: { data: CertificationDto[]; onChange: (d: CertificationDto[]) => void; disabled: boolean }) {
  const add = () => onChange([...data, { skillName: '', duration: '', vendor: '' }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof CertificationDto, v: string) => {
    const copy = [...data]; copy[i] = { ...copy[i], [k]: v }; onChange(copy);
  };
  return (
    <div>
      <div className="sp-certs-header">
        <span className="sp-certs-count">{data.length} certification{data.length !== 1 ? 's' : ''}</span>
        {!disabled && (
          <button className="sp-add-cert-btn" onClick={add}>＋ Add Certification</button>
        )}
      </div>

      {data.length === 0 && (
        <div className="sp-empty-certs">
          <span>📜</span>
          <p>No certifications added yet.</p>
          {!disabled && <button className="sp-add-cert-btn" onClick={add}>Add your first certification</button>}
        </div>
      )}

      <div className="sp-cert-list">
        {data.map((cert, i) => (
          <div key={i} className="sp-cert-card">
            <div className="sp-cert-num">#{i + 1}</div>
            <div className="sp-grid-3">
              <Field label="Skill / Course Name">
                <Input disabled={disabled} value={cert.skillName} onChange={e => update(i, 'skillName', e.target.value)} placeholder="e.g. Python, IoT 4.0" />
              </Field>
              <Field label="Duration">
                <Input disabled={disabled} value={cert.duration} onChange={e => update(i, 'duration', e.target.value)} placeholder="e.g. 12 weeks" />
              </Field>
              <Field label="Vendor / Platform">
                <Input disabled={disabled} value={cert.vendor} onChange={e => update(i, 'vendor', e.target.value)} placeholder="e.g. NPTEL, Coursera" />
              </Field>
            </div>
            {!disabled && (
              <button className="sp-remove-cert-btn" onClick={() => remove(i)}>✕ Remove</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 7 — IDENTITY DOCUMENTS
═══════════════════════════════════════════ */
function IdentityTab({ data, onChange, disabled, errors }: { data: IdentityDocsDto; onChange: (d: IdentityDocsDto) => void; disabled: boolean; errors: Record<string,string> }) {
  const set = (k: keyof IdentityDocsDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...data, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <div className="sp-grid-2">
      {/* Aadhar */}
      <div className="sp-col-2 sp-id-section">
        <div className="sp-id-section-title">🪪 Aadhar Card</div>
        <div className="sp-checkbox-row">
          <label className="sp-checkbox-label">
            <input type="checkbox" disabled={disabled} checked={!!data.isAadharAvailable}
              onChange={e => onChange({ ...data, isAadharAvailable: e.target.checked })} />
            Aadhar Card Available
          </label>
        </div>
        {data.isAadharAvailable && (
          <div className="sp-grid-2">
            <Field label="Aadhar Number" error={errors.aadharNumber}>
              <Input disabled={disabled} value={data.aadharNumber} onChange={set('aadharNumber')} placeholder="XXXX XXXX XXXX" maxLength={14} />
            </Field>
            <Field label="Name as per Aadhar">
              <Input disabled={disabled} value={data.nameAsPerAadhar} onChange={set('nameAsPerAadhar')} placeholder="Full name on Aadhar" />
            </Field>
          </div>
        )}
      </div>

      {/* Other docs */}
      <div className="sp-col-2 sp-id-section">
        <div className="sp-id-section-title">📄 Other Documents</div>
        <div className="sp-docs-grid">
          <label className="sp-checkbox-label">
            <input type="checkbox" disabled={disabled} checked={!!data.isPanCardAvailable}
              onChange={e => onChange({ ...data, isPanCardAvailable: e.target.checked })} />
            PAN Card Available
          </label>
          <label className="sp-checkbox-label">
            <input type="checkbox" disabled={disabled} checked={!!data.isPassportAvailable}
              onChange={e => onChange({ ...data, isPassportAvailable: e.target.checked })} />
            Passport Available
          </label>
        </div>
        <Field label="Family Card Number">
          <Input disabled={disabled} value={data.familyCardNumber} onChange={set('familyCardNumber')} placeholder="Ration card / family card number" />
        </Field>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 8 — SKILLS
═══════════════════════════════════════════ */
const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const SKILL_CATEGORIES   = ['Technical', 'Soft', 'Language', 'Tool', 'Framework', 'Other'];

function SkillsTab({ data, onChange, disabled }: { data: SkillDto[]; onChange: (d: SkillDto[]) => void; disabled: boolean }) {
  const [newSkill, setNewSkill] = useState('');

  const add = () => {
    const name = newSkill.trim();
    if (!name) return;
    if (data.some(s => s.skillName.toLowerCase() === name.toLowerCase())) return;
    onChange([...data, { skillName: name, proficiencyLevel: 'Intermediate', category: 'Technical' }]);
    setNewSkill('');
  };
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof SkillDto, v: string) => {
    const copy = [...data]; copy[i] = { ...copy[i], [k]: v }; onChange(copy);
  };

  const profColor: Record<string, string> = {
    Beginner: '#fef3c7', Intermediate: '#dbeafe', Advanced: '#d1fae5', Expert: '#ede9fe'
  };
  const profText: Record<string, string> = {
    Beginner: '#92400e', Intermediate: '#1e40af', Advanced: '#065f46', Expert: '#5b21b6'
  };

  return (
    <div>
      {/* Add skill bar */}
      {!disabled && (
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <input
            className="sp-input" style={{ flex:1 }}
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Type a skill and press Enter or click Add (e.g. React, Java, SQL)"
          />
          <button className="sp-save-btn" style={{ padding:'9px 20px', fontSize:13 }} onClick={add}>
            ＋ Add
          </button>
        </div>
      )}

      {data.length === 0 ? (
        <div className="sp-empty-certs">
          <span>🛠️</span>
          <p>No skills added yet. Add your technical and soft skills.</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize:12, color:'#6b7280', fontWeight:600, marginBottom:12 }}>
            {data.length} skill{data.length !== 1 ? 's' : ''} added
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {data.map((skill, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:12,
                transition:'border-color .15s'
              }}>
                {/* Skill name */}
                <div style={{ flex:1, fontWeight:700, fontSize:14, color:'#1e293b' }}>
                  {skill.skillName}
                </div>

                {/* Proficiency */}
                <select
                  className="sp-input"
                  style={{ width:140, background: profColor[skill.proficiencyLevel] || '#f1f5f9',
                    color: profText[skill.proficiencyLevel] || '#374151',
                    fontWeight:700, fontSize:12, border:'1.5px solid #e2e8f0' }}
                  disabled={disabled}
                  value={skill.proficiencyLevel}
                  onChange={e => update(i, 'proficiencyLevel', e.target.value)}
                >
                  {PROFICIENCY_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>

                {/* Category */}
                <select
                  className="sp-input"
                  style={{ width:130, fontSize:12 }}
                  disabled={disabled}
                  value={skill.category}
                  onChange={e => update(i, 'category', e.target.value)}
                >
                  {SKILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>

                {/* Remove */}
                {!disabled && (
                  <button onClick={() => remove(i)} style={{
                    background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca',
                    borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:12,
                    fontWeight:700, transition:'background .12s', flexShrink:0
                  }}>✕</button>
                )}
              </div>
            ))}
          </div>

          {/* Proficiency legend */}
          <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
            {PROFICIENCY_LEVELS.map(l => (
              <span key={l} style={{
                padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700,
                background: profColor[l], color: profText[l]
              }}>{l}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 9 — RESUME
═══════════════════════════════════════════ */
function ResumeTab({ data, onChange, disabled, profile }: {
  data: ResumeDto; onChange: (d: ResumeDto) => void; disabled: boolean; profile: ProfileDto | null
}) {
  const set = (k: keyof ResumeDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...data, [k]: e.target.value });

  return (
    <div>
      {/* Info card */}
      <div style={{
        background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:12,
        padding:'14px 18px', marginBottom:20, fontSize:13, color:'#1e40af', fontWeight:500
      }}>
        📋 <strong>Register Number:</strong> {profile?.registerNumber || '—'}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        📧 <strong>Email:</strong> {profile?.email || '—'}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        🏛️ <strong>Department:</strong> {profile?.departmentName || '—'}
      </div>

      <div className="sp-section-divider">📄 Resume Link</div>
      <div className="sp-grid-2" style={{ marginBottom:20 }}>
        <Field label="Resume URL (Google Drive / OneDrive link)">
          <Input
            disabled={disabled}
            value={data.resumeUrl}
            onChange={set('resumeUrl')}
            placeholder="https://drive.google.com/file/..."
          />
        </Field>
        <Field label="File Name">
          <Input
            disabled={disabled}
            value={data.resumeFileName}
            onChange={set('resumeFileName')}
            placeholder="e.g. Ragul_Resume_2026.pdf"
          />
        </Field>
      </div>

      {/* Preview link */}
      {data.resumeUrl && (
        <div style={{ marginBottom:20 }}>
          <a href={data.resumeUrl} target="_blank" rel="noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px',
              background:'#2563eb', color:'#fff', borderRadius:10, fontSize:13, fontWeight:700,
              textDecoration:'none', transition:'background .15s' }}>
            👁️ Preview Resume
          </a>
        </div>
      )}

      <div className="sp-section-divider">📝 Career Summary</div>
      <Field label="Resume Summary / Career Objective">
        <Textarea
          disabled={disabled}
          value={data.resumeSummary}
          onChange={set('resumeSummary')}
          placeholder="Write your career objective or a brief summary from your resume (2-4 sentences)…"
          rows={5}
        />
      </Field>

      {/* Upload timestamp display */}
      {data.resumeUploadedAt && (
        <div style={{ marginTop:14, fontSize:12, color:'#6b7280', fontWeight:600 }}>
          📅 Last updated: {new Date(data.resumeUploadedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}


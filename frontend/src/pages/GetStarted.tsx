import {
  ShieldCheck,
  GraduationCap,
  BriefcaseBusiness,
  LineChart,
  Sparkles,
  Users,
  CheckCircle2,
  Cpu,
  ScrollText,
  ArrowRight,
  PlayCircle
} from 'lucide-react';
import '../styles.css';

const features = [
  { icon: BriefcaseBusiness, title: 'Smart Drive Management', desc: 'Plan, publish, and monitor placement drives with real-time insights.' },
  { icon: ScrollText, title: 'Real-Time Application Tracking', desc: 'Track every application stage with instant status updates.' },
  { icon: ShieldCheck, title: 'Profile Verification Workflow', desc: 'Streamlined approvals with faculty verification and audit trails.' },
  { icon: Cpu, title: 'AI-Based Shortlisting', desc: 'Automated eligibility checks and shortlist generation for drives.' },
  { icon: LineChart, title: 'Department Analytics', desc: 'Placement KPIs, trends, and recruiter performance at a glance.' },
  { icon: Sparkles, title: 'Secure Offer Management', desc: 'Issue offers, lock profiles, and keep records compliant and auditable.' }
];

const roles = [
  {
    icon: ShieldCheck,
    role: 'Placement Head',
    items: ['Manage companies & drives', 'Configure eligibility', 'Record offers', 'View analytics'],
    cta: 'Login as Placement Head'
  },
  {
    icon: Users,
    role: 'Faculty',
    items: ['Verify student profiles', 'Monitor department applications', 'Track student stages'],
    cta: 'Login as Faculty'
  },
  {
    icon: GraduationCap,
    role: 'Students',
    items: ['Build profile', 'Apply to drives', 'Track placement progress'],
    cta: 'Login as Student'
  }
];

const steps = [
  'Student Registration',
  'Profile Verification',
  'Drive Creation',
  'Application Tracking',
  'Offer Issuance'
];

const GetStartedPage = ({ onAdminLogin, onStudentLogin, onStudentRegister }: { onAdminLogin?: () => void; onStudentLogin?: () => void; onStudentRegister?: () => void; }) => {
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page">
      <nav className="navbar">
        <div className="nav-left" onClick={() => scrollToId('hero')}>
          <div className="logo-dot" />
          <span className="logo-text">VCET CampusHire</span>
        </div>
        <div className="nav-links">
          <button onClick={() => scrollToId('hero')}>Home</button>
          <button onClick={() => scrollToId('features')}>Features</button>
          <button onClick={() => scrollToId('how-it-works')}>How It Works</button>
          <button onClick={onStudentLogin}>Login</button>
        </div>
        <div className="nav-actions">
          <button className="btn primary" onClick={onStudentRegister}>
            Get Started
          </button>
        </div>
      </nav>

      <header id="hero" className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <Sparkles size={16} /> Premium SaaS for Placements
          </div>
          <h1>Empowering VCET Placements with Smart Automation</h1>
          <p className="hero-sub">
            A modern AI-powered platform to manage students, drives, and placements efficiently.
          </p>
          <div className="hero-actions">
            <button className="btn primary" onClick={onStudentRegister}>Get Started</button>
            <button className="btn ghost" onClick={() => scrollToId('features')}>
              <PlayCircle size={18} /> Explore Features
            </button>
          </div>
          <div className="hero-badges">
            <span className="badge"><CheckCircle2 size={14} /> Secure & Audited</span>
            <span className="badge"><LineChart size={14} /> Data-driven Insights</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="glass card-large">
            <div className="card-header">
              <div className="dot red" /><div className="dot yellow" /><div className="dot green" />
              <span>Dashboard Preview</span>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Ongoing Drives</div>
                <div className="stat-value">12</div>
                <div className="stat-trend up">+3 this week</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Offers Issued</div>
                <div className="stat-value">87</div>
                <div className="stat-trend up">+14%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Highest CTC</div>
                <div className="stat-value">₹32 LPA</div>
                <div className="stat-trend">Top Recruiter: AWS</div>
              </div>
            </div>
            <div className="progress-row">
              <div className="progress-label">Placement Completion</div>
              <div className="progress-bar"><span style={{ width: '76%' }} /></div>
              <div className="progress-meta">76% 2026 Batch</div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="section">
        <div className="section-header">
          <p className="eyebrow">Platform Superpowers</p>
          <h2>Why VCET CampusHire?</h2>
          <p className="section-sub">Purpose-built for modern placement offices with security, speed, and clarity.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="icon-wrap"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="section roles">
        <div className="section-header">
          <p className="eyebrow">Role-based Experience</p>
          <h2>Built for Every Role</h2>
        </div>
        <div className="roles-grid">
          {roles.map(({ icon: Icon, role, items, cta }) => (
            <div key={role} className="role-card">
              <div className="role-head">
                <div className="icon-pill"><Icon size={20} /></div>
                <h3>{role}</h3>
              </div>
              <ul>
                {items.map(item => (
                  <li key={item}><CheckCircle2 size={16} /> {item}</li>
                ))}
              </ul>
              <button className="btn ghost" onClick={role === 'Students' ? onStudentRegister : onAdminLogin}>
                {role === 'Students' ? 'Register as Student' : cta} <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section timeline">
        <div className="section-header">
          <p className="eyebrow">Flow</p>
          <h2>How It Works</h2>
        </div>
        <div className="timeline-grid">
          {steps.map((step, idx) => (
            <div key={step} className="timeline-step">
              <div className="step-index">{idx + 1}</div>
              <div className="step-line" />
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cta" className="cta">
        <div className="cta-content">
          <div>
            <p className="eyebrow light">Next-gen placements</p>
            <h2>Ready to Transform VCET Placements?</h2>
            <p>Launch a secure, auditable, and delightful placement experience for every stakeholder.</p>
          </div>
          <div className="cta-actions">
            <button className="btn light" onClick={onStudentRegister}>Get Started Now</button>
            <button className="btn outline-light" onClick={onAdminLogin}>Login</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="logo-foot">VCET CampusHire</div>
            <p className="foot-sub">Smart placement management for modern universities.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <a onClick={() => scrollToId('hero')}>Home</a>
            <a onClick={() => scrollToId('features')}>Features</a>
            <a onClick={() => scrollToId('how-it-works')}>How It Works</a>
            <a onClick={() => scrollToId('roles')}>Login</a>
          </div>
          <div>
            <h4>Contact</h4>
            <p>placements@vcet.edu</p>
            <p>+91 98765 43210</p>
            <p>VCET, Tamil Nadu</p>
          </div>
          <div>
            <h4>Follow</h4>
            <div className="social-row">
              <div className="social-dot" />
              <div className="social-dot" />
              <div className="social-dot" />
            </div>
          </div>
        </div>
        <div className="footer-base">© {new Date().getFullYear()} VCET CampusHire. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default GetStartedPage;

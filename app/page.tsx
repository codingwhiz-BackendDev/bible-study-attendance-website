'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Grid2X2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Members', icon: Users },
  { label: 'Centers', icon: Grid2X2 },
  { label: 'Meetings', icon: CalendarDays },
  { label: 'Mark Attendance', icon: ClipboardCheck, active: true },
  { label: 'Attendance History', icon: Clock3 },
  { label: 'Statistics', icon: BarChart3 },
  { label: 'Reports', icon: FileText },
]

const initialMembers = [
  { name: 'John Doe', matric: 'RUN/CMP/23/15322', code: '2315322', dept: 'Computer Science', level: '300 Level', time: '08:42 AM' },
  { name: 'Sarah Johnson', matric: 'RUN/LAW/22/08104', code: '2208104', dept: 'Law', level: '400 Level', time: '08:40 AM' },
  { name: 'Michael Adeyemi', matric: 'RUN/ENG/24/00418', code: '2400418', dept: 'Engineering', level: '200 Level', time: '08:37 AM' },
  { name: 'Grace Williams', matric: 'RUN/MED/23/11920', code: '2311920', dept: 'Medicine', level: '300 Level', time: '08:31 AM' },
]

function Logo() {
  return <div className="brand-mark"><BookOpen size={18} strokeWidth={2.5} /></div>
}

function Sidebar({ onClose, onNavigate }: { onClose?: () => void; onNavigate?: (label: string) => void }) {
  return <aside className="sidebar">
    <div className="sidebar-top">
      <div className="brand"><Logo /><div><strong>Bible Study</strong><span>Attendance Manager</span></div></div>
      {onClose && <button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>}
    </div>
    <div className="church-switcher"><div className="church-avatar">R</div><div><strong>Redeemer&apos;s University</strong><span>Bible Study Department</span></div><ChevronDown size={15} /></div>
    <nav className="nav-list" aria-label="Main navigation">
      <p className="nav-label">Workspace</p>
      {navItems.map(({ label, icon: Icon, active }) => <button className={`nav-item ${active ? 'active' : ''}`} key={label} onClick={() => onNavigate?.(label)}><Icon size={17} /><span>{label}</span>{label === 'Mark Attendance' && <span className="nav-pulse" />}</button>)}
      <p className="nav-label settings-label">Manage</p>
      <button className="nav-item"><Settings size={17} /><span>Settings</span></button>
    </nav>
    <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><HelpCircle size={16} /></div><div><strong>Need help?</strong><span>View quick guide</span></div><ArrowRight size={15} /></div><div className="user-row"><div className="user-avatar">AD</div><div><strong>Admin</strong><span>Administrator</span></div><MoreHorizontal size={18} /></div></div>
  </aside>
}

function StatCard({ icon: Icon, label, value, detail, tone = 'green' }: { icon: typeof Users; label: string; value: string; detail: string; tone?: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small><b>{detail.split(' ')[0]}</b> {detail.split(' ').slice(1).join(' ')}</small></div></div>
}

function AttendancePage() {
  const [code, setCode] = useState('')
  const [present, setPresent] = useState(initialMembers)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isOpen, setIsOpen] = useState(true)

  const markPresent = () => {
    if (!isOpen) { setMessage({ type: 'error', text: 'Attendance for this meeting has been closed.' }); return }
    const member = initialMembers.find((item) => item.code === code.trim())
    if (!member) { setMessage({ type: 'error', text: 'Member not found. Please check the attendance code.' }); setCode(''); return }
    if (present.some((item) => item.code === member.code)) { setMessage({ type: 'error', text: 'This member has already been marked present for this meeting.' }); setCode(''); return }
    setPresent((items) => [{ ...member, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...items])
    setMessage({ type: 'success', text: `${member.name} marked present.` })
    setCode('')
  }
  const rate = Math.round((present.length / 72) * 1000) / 10
  return <>
    <div className="page-heading"><div><p className="eyebrow">LIVE SESSION</p><h1>Mark Attendance</h1><p>Record attendance quickly using each member&apos;s unique code.</p></div><div className="heading-actions"><button className="outline-button"><Download size={16} /> Export list</button><button className="ghost-button"><MoreHorizontal size={19} /></button></div></div>
    <div className="meeting-banner"><div className="meeting-icon"><CalendarDays size={21} /></div><div className="meeting-details"><div><strong>Sunday Bible Study</strong><span className="status-badge"><span /> Open</span></div><p>Center: <b>Faith Center</b><span className="dot-separator">·</span> Sunday, September 20, 2026</p></div><div className="live-time"><span>Current time</span><strong>08:45:12 AM</strong></div><button className="close-session" onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Close session' : 'Re-open session'}</button></div>
    <div className="attendance-layout">
      <div className="attendance-main"><div className="scan-card"><div className="scan-top"><div><p className="eyebrow">QUICK ENTRY</p><h2>Enter attendance code</h2><p>Press Enter or tap the button to mark a member present.</p></div><div className="scan-badge"><ShieldCheck size={16} /> Fast & secure</div></div><div className="code-entry"><div className="code-input-wrap"><Search size={20} /><input autoFocus inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) markPresent() }} placeholder="e.g. 2315322" aria-label="Enter attendance code" /></div><button className="primary-button" onClick={markPresent}><Check size={18} /> Mark present</button></div>{message && <div className={`feedback ${message.type}`}><div className="feedback-icon">{message.type === 'success' ? <Check size={15} /> : <X size={15} />}</div><span>{message.text}</span><button onClick={() => setMessage(null)} aria-label="Dismiss message"><X size={14} /></button></div>}<div className="tip"><Sparkles size={15} /><span>Tip: Keep this page open and use Enter to process the next member quickly.</span></div></div>
        <div className="present-card"><div className="section-header"><div><h2>Present today</h2><p>Members marked present in this session</p></div><div className="present-count"><strong>{present.length}</strong><span>of 72 members</span></div></div><div className="progress-wrap"><div className="progress-track"><div className="progress-fill" style={{ width: `${rate}%` }} /></div><strong>{rate}%</strong><span>attendance rate</span></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Member</th><th>Matric number</th><th>Department</th><th>Time marked</th><th>Status</th></tr></thead><tbody>{present.map((member, index) => <tr key={member.code}><td className="muted-cell">{String(index + 1).padStart(2, '0')}</td><td><div className="member-cell"><div className="mini-avatar">{member.name.split(' ').map((n) => n[0]).join('')}</div><strong>{member.name}</strong></div></td><td className="mono">{member.matric}</td><td>{member.dept}</td><td>{member.time}</td><td><span className="present-badge"><Check size={12} /> Present</span></td></tr>)}</tbody></table></div></div>
      </div>
      <aside className="attendance-side"><div className="side-card"><div className="side-card-heading"><h3>Session overview</h3><MoreHorizontal size={17} /></div><div className="circle-chart"><div><strong>{rate}%</strong><span>attendance</span></div></div><div className="side-stat-row"><span><i className="dot present-dot" /> Present</span><strong>{present.length}</strong></div><div className="side-stat-row"><span><i className="dot absent-dot" /> Remaining</span><strong>{72 - present.length}</strong></div><div className="side-divider" /><div className="side-stat-row total"><span>Total members</span><strong>72</strong></div></div><div className="side-card activity-card"><div className="side-card-heading"><h3>Recent activity</h3><button>View all</button></div>{present.slice(0, 3).map((member) => <div className="activity-row" key={member.code}><div className="mini-avatar">{member.name.split(' ').map((n) => n[0]).join('')}</div><div><strong>{member.name}</strong><span>Marked present · {member.time}</span></div></div>)}</div></aside>
    </div>
  </>
}

function DashboardHome() {
  return <><div className="page-heading"><div><p className="eyebrow">SUNDAY, SEPTEMBER 20, 2026</p><h1>Good morning, Admin</h1><p>Here&apos;s what&apos;s happening with your Bible Study community.</p></div><div className="heading-actions"><button className="outline-button"><Download size={16} /> Export report</button><button className="primary-button"><Plus size={17} /> Create meeting</button></div></div><div className="stats-grid"><StatCard icon={Users} label="Total members" value="248" detail="12 this month" /><StatCard icon={ClipboardCheck} label="Overall attendance" value="82.4%" detail="4.8% vs last month" tone="blue" /><StatCard icon={CalendarDays} label="Meetings this month" value="8" detail="2 upcoming" tone="purple" /><StatCard icon={Activity} label="Active centers" value="3" detail="All centers active" tone="orange" /></div><div className="dashboard-grid"><div className="chart-card"><div className="section-header"><div><h2>Attendance overview</h2><p>Attendance trends across all meetings</p></div><button className="filter-button">Last 6 months <ChevronDown size={14} /></button></div><div className="fake-chart"><div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><div className="grid-lines" /> <svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-label="Attendance trend chart"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0d8c66" stopOpacity=".2" /><stop offset="100%" stopColor="#0d8c66" stopOpacity="0" /></linearGradient></defs><path d="M0,160 C45,145 65,170 110,130 S175,105 220,126 S275,72 330,98 S390,92 440,68 S500,105 550,65 S625,42 700,45 L700,220 L0,220Z" fill="url(#area)" /><path d="M0,160 C45,145 65,170 110,130 S175,105 220,126 S275,72 330,98 S390,92 440,68 S500,105 550,65 S625,42 700,45" fill="none" stroke="#0d8c66" strokeWidth="3" /></svg><div className="chart-x"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span></div></div></div></div><div className="recent-card"><div className="section-header"><div><h2>Recent activity</h2><p>Latest updates from your department</p></div><button className="text-button">View all <ArrowRight size={14} /></button></div><div className="activity-list"><div className="activity-item"><div className="activity-circle green-bg"><Check size={15} /></div><div><strong>John Doe was marked present</strong><span>Sunday Bible Study · Faith Center</span></div><time>2m ago</time></div><div className="activity-item"><div className="activity-circle blue-bg"><Users size={15} /></div><div><strong>New member registered</strong><span>Grace Williams · Medicine</span></div><time>1h ago</time></div><div className="activity-item"><div className="activity-circle purple-bg"><CalendarDays size={15} /></div><div><strong>Meeting session created</strong><span>Weekly Bible Study · Sep 23</span></div><time>3h ago</time></div></div></div></div></>
}

export default function Page() {
  const [mobileNav, setMobileNav] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const page = useMemo(() => activePage === 'Mark Attendance' ? <AttendancePage /> : <DashboardHome />, [activePage])
  return <div className="app-shell"><div className={`mobile-overlay ${mobileNav ? 'show' : ''}`} onClick={() => setMobileNav(false)} /><div className={`sidebar-wrap ${mobileNav ? 'open' : ''}`}><Sidebar onClose={() => setMobileNav(false)} onNavigate={(label) => { setActivePage(label); setMobileNav(false) }} /></div><main className="main-content"><header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><ArrowRight size={14} /><strong>{activePage}</strong></div><div className="topbar-actions"><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="topbar-avatar">AD</div></div></header><div className="content-wrap"><div className="page-tabs">{['Dashboard', 'Mark Attendance'].map((item) => <button key={item} className={activePage === item ? 'selected' : ''} onClick={() => setActivePage(item)}>{item}</button>)}</div>{page}</div></main></div>
}

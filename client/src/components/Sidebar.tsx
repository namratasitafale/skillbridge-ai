import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FileSearch,
  LayoutDashboard,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PageId = 'dashboard' | 'analyzer' | 'matcher' | 'roadmap' | 'history' | 'settings';

export const pagePaths: Record<PageId, string> = {
  dashboard: '/dashboard',
  analyzer: '/resume-analyzer',
  matcher: '/job-matcher',
  roadmap: '/learning-roadmap',
  history: '/analysis-history',
  settings: '/settings',
};

const links: { id: PageId; label: string; icon: LucideIcon; group: 'workspace' | 'account' }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'workspace' },
  { id: 'analyzer', label: 'Resume Analyzer', icon: FileSearch, group: 'workspace' },
  { id: 'matcher', label: 'Job Matcher', icon: BriefcaseBusiness, group: 'workspace' },
  { id: 'roadmap', label: 'Learning Roadmap', icon: ChartNoAxesCombined, group: 'workspace' },
  { id: 'history', label: 'Analysis History', icon: Activity, group: 'account' },
  { id: 'settings', label: 'Settings', icon: Settings2, group: 'account' },
];

type SidebarProps = {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onClose: () => void;
  userName: string;
  userInitials: string;
};

export default function Sidebar({ activePage, onNavigate, mobileOpen, onClose, userName, userInitials }: SidebarProps) {
  const renderLinks = (group: 'workspace' | 'account') => links
    .filter((link) => link.group === group)
    .map(({ id, label, icon: Icon }) => (
      <button
        className={`sidebar-link${activePage === id ? ' active' : ''}`}
        key={id}
        type="button"
        aria-current={activePage === id ? 'page' : undefined}
        title={label}
        onClick={() => {
          onNavigate(id);
          onClose();
        }}
      >
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>{label}</span>
        {id === 'analyzer' && <span className="nav-new">NEW</span>}
      </button>
    ));

  return (
    <>
      <button className={`sidebar-backdrop${mobileOpen ? ' visible' : ''}`} type="button" aria-label="Close navigation" onClick={onClose} tabIndex={mobileOpen ? 0 : -1} />
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`} aria-label="Main navigation">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true"><Sparkles size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">SkillBridge<span>AI</span></span>
          <button className="icon-button sidebar-close" type="button" aria-label="Close navigation" onClick={onClose}><X size={19} /></button>
        </div>

        <div className="workspace-chip">
          <span className="workspace-avatar">S</span>
          <span className="workspace-copy"><strong>My workspace</strong><small>Personal account</small></span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </div>

        <div className="sidebar-group">
          <p className="sidebar-label">WORKSPACE</p>
          <nav aria-label="Workspace">{renderLinks('workspace')}</nav>
        </div>

        <div className="sidebar-group account-group">
          <p className="sidebar-label">PREFERENCES</p>
          <nav aria-label="Preferences">{renderLinks('account')}</nav>
        </div>

        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-icon"><Sparkles size={16} /></div>
            <div><strong>Career toolkit</strong><p>Demo workspace</p></div>
            <span className="plan-dot" aria-label="Demo mode enabled" />
          </div>
          <div className="sidebar-user">
            <span className="avatar avatar-small">{userInitials}</span>
            <span className="user-copy"><strong>{userName}</strong><small>Demo profile</small></span>
            <span className="online-dot" aria-label="Online" />
          </div>
        </div>
      </aside>
    </>
  );
}
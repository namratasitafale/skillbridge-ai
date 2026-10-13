import { Fragment, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Activity,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CloudUpload,
  Download,
  FileCheck2,
  FileSearch,
  FileText,
  Filter,
  GraduationCap,
  Heart,
  Eye,
  EyeOff,
  LayoutDashboard,
  ListChecks,
  LogIn,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Moon,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Upload,
  UserRoundPlus,
  X,
  Zap,
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import { pagePaths } from './components/Sidebar';
import type { PageId } from './components/Sidebar';
import { getJobSkillMatch, jobs, roadmap, skills } from './data';
import type { Job } from './data';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeResume, demoResumeText, extractResumeText } from './resume-analysis';
import type { ResumeReport } from './resume-analysis';

type ToastMessage = { id: number; text: string };
type Notice = { kind: 'error' | 'success' | 'info'; text: string };
type Theme = 'dark' | 'light';
type DemoUser = { name: string; email: string; careerGoal?: string; preferredRole?: string; targetSkills?: string[] };
type SavedJob = { id: string; saved: boolean; status: 'Saved' | 'Interested' | 'Applied' };
type ActivityItem = { id: string; label: string; detail: string; createdAt: string; kind: 'analysis' | 'job' | 'roadmap' };
type RoadmapStep = { id: string; title: string; detail: string; duration: string; resource?: string; stage?: 'Beginner' | 'Intermediate' | 'Advanced' };

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Demo features continue in memory if browser storage is unavailable or full.
  }
}

function getUserSkills(reports: ResumeReport[], profileSkills: string[] = []) {
  return [...new Set([...reports.flatMap((report) => report.skills ?? []), ...profileSkills])];
}

function readDemoUser(): DemoUser | null {
  try {
    const savedUser = localStorage.getItem('skillbridge-demo-user') ?? sessionStorage.getItem('skillbridge-demo-user');
    return savedUser ? JSON.parse(savedUser) as DemoUser : null;
  } catch {
    return null;
  }
}

function readTheme(): Theme {
  try {
    return localStorage.getItem('skillbridge-theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

const pageInfo: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Welcome to SkillBridge AI', subtitle: 'Discover your skills. Find your next opportunity.' },
  analyzer: { title: 'Resume Analyzer', subtitle: 'Get a clearer picture of what your resume can say.' },
  matcher: { title: 'Job Matcher', subtitle: 'Explore roles matched to this demo skill profile.' },
  roadmap: { title: 'Learning Roadmap', subtitle: 'A practical sample path for your next career move.' },
  history: { title: 'Analysis History', subtitle: 'Your previous resume reviews will appear here.' },
  settings: { title: 'Settings', subtitle: 'Shape how your SkillBridge workspace feels.' },
};

const pathPages = Object.fromEntries(Object.entries(pagePaths).map(([page, path]) => [path, page])) as Record<string, PageId>;

const goalResources: Record<string, string> = {
  'Frontend Developer': 'https://react.dev/learn',
  'Data Analyst': 'https://sqlbolt.com/',
  'Product Designer': 'https://www.w3.org/WAI/fundamentals/accessibility-intro/',
  'Full Stack Developer': 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
  'Software Engineer': 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
};

function createGoalRoadmap(goal: string, missingSkills: string[]): RoadmapStep[] {
  const curriculum: RoadmapStep[] = roadmap.map((step) => ({ ...step, stage: step.stage as RoadmapStep['stage'] }));
  const gaps = missingSkills.slice(0, 3);
  return [...curriculum, ...gaps.map((gap, index) => ({
    id: `goal-${goal.toLowerCase().replace(/\W+/g, '-')}-${gap.toLowerCase().replace(/\W+/g, '-')}`,
    title: `Target skill practice: ${gap}`,
    detail: `A suggested practice milestone for your ${goal} direction. Only add this skill to your resume if it reflects your experience.`,
    duration: `Optional · Week ${index + 9}`,
    resource: goalResources[goal] ?? 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    stage: 'Advanced' as const,
  }))];
}

function DemoTag({ children = 'DEMO' }: { children?: ReactNode }) {
  return <span className="demo-tag"><span className="demo-dot" />{children}</span>;
}

function SectionHeading({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {detail && <p className="section-detail">{detail}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
  trend,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Target;
  tone: string;
  trend?: string;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} strokeWidth={1.9} aria-hidden="true" /></div>
      <div className="stat-topline"><span>{label}</span></div>
      <div className="stat-value-row"><strong>{value}</strong>{trend && <span className="stat-trend"><TrendingUp size={13} />{trend}</span>}</div>
      <p>{note}</p>
      <span className={`stat-accent ${tone}`} />
    </article>
  );
}

function ScoreTrendChart({ reports }: { reports: ResumeReport[] }) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
  const recent = reports.filter((report) => new Date(report.createdAt).getTime() >= cutoff).slice(0, 12).reverse();
  const points = recent.map((report, index) => ({
    x: recent.length === 1 ? 50 : 8 + index * (84 / (recent.length - 1)),
    y: 88 - report.score * 0.72,
    report,
  }));
  return (
    <section className="panel trend-panel" aria-labelledby="trend-title">
      <div className="panel-heading trend-heading"><div><div className="section-eyebrow">YOUR PROGRESS</div><h2 id="trend-title">Resume score trend</h2></div><div className="range-control" role="group" aria-label="Chart time range">{([7, 30, 90] as const).map((days) => <button key={days} className={range === days ? 'selected' : ''} type="button" aria-pressed={range === days} onClick={() => setRange(days)}>{days}d</button>)}</div></div>
      {points.length ? <div className="trend-chart-wrap"><svg className="trend-chart" viewBox="0 0 100 100" role="img" aria-label={`Resume score trend for the last ${range} days`}>
        <defs><linearGradient id="score-area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--chart-fill)" stopOpacity=".3" /><stop offset="100%" stopColor="var(--chart-fill)" stopOpacity="0" /></linearGradient></defs>
        {[20, 40, 60, 80].map((line) => <g key={line}><line x1="7" x2="94" y1={line} y2={line} className="chart-gridline" /><text x="1" y={line + 2} className="chart-axis-label">{Math.round((88 - line) / .72)}</text></g>)}
        {points.length > 1 && <polygon points={`7,90 ${points.map((point) => `${point.x},${point.y}`).join(' ')} 94,90`} fill="url(#score-area-fill)" />}
        <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} className="chart-line" />
        {points.map((point) => <circle key={point.report.id} cx={point.x} cy={point.y} r="2.1" className="chart-point"><title>{new Date(point.report.createdAt).toLocaleDateString()}: {point.report.score}</title></circle>)}
      </svg><div className="trend-chart-legend"><span><i />Completed demo analyses</span><span>{recent.length} {recent.length === 1 ? 'report' : 'reports'}</span></div></div> : <div className="chart-empty"><TrendingUp size={20} /><strong>No score history yet</strong><span>Complete an analysis to see your progress here.</span></div>}
    </section>
  );
}

function RecentActivity({ activity, onNavigate }: { activity: ActivityItem[]; onNavigate: (page: PageId) => void }) {
  return <section className="panel activity-panel"><div className="panel-heading"><div className="panel-heading-copy"><h2>Recent activity</h2><p>Updates from this browser profile.</p></div><button className="text-button" type="button" onClick={() => onNavigate('history')}>View history <ArrowRight size={14} /></button></div>
    {activity.length ? <ul className="activity-list">{activity.slice(0, 5).map((item) => <li key={item.id}><span className={`activity-mark ${item.kind}`}><Activity size={15} /></span><div><strong>{item.label}</strong><span>{item.detail}</span></div><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time></li>)}</ul> : <div className="activity-empty"><Clock3 size={18} /><span>Activity will appear here as you use the demo workspace.</span></div>}
  </section>;
}

function UploadCard({
  compact = false,
  onNotice,
  onToast,
  onOpenAnalyzer,
}: {
  compact?: boolean;
  onNotice?: (notice: Notice) => void;
  onToast: (message: string) => void;
  onOpenAnalyzer?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dragging, setDragging] = useState(false);

  const reportNotice = (nextNotice: Notice) => {
    setNotice(nextNotice);
    onNotice?.(nextNotice);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    const hasPdfMime = !file.type || file.type === 'application/pdf';
    if (!hasPdfExtension || !hasPdfMime) {
      setFileName('');
      reportNotice({ kind: 'error', text: 'That file is not a PDF. Choose a .pdf file to continue.' });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFileName(file.name);
    reportNotice({ kind: 'success', text: `${file.name} is ready. PDF analysis will be added in a later step; this file stays on your device.` });
    onToast('PDF selected. No file was uploaded or analyzed.');
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => handleFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  if (compact) return <section className="panel upload-panel upload-compact"><div className="panel-heading"><div className="panel-heading-icon upload-heading-icon"><FileSearch size={19} /></div><div className="panel-heading-copy"><h2>Resume Analyzer</h2><p>PDF/DOCX text extraction stays local.</p></div><DemoTag /></div><div className="compact-analyzer-cta"><span><LockKeyhole size={15} />Rule-based review · sample resume available</span><button className="button button-outline" type="button" onClick={onOpenAnalyzer}>Open analyzer <ArrowRight size={14} /></button></div></section>;

  return (
    <section className={`panel upload-panel${compact ? ' upload-compact' : ''}`} aria-labelledby={compact ? 'upload-title-compact' : 'upload-title'}>
      <div className="panel-heading">
        <div className="panel-heading-icon upload-heading-icon"><FileSearch size={19} /></div>
        <div className="panel-heading-copy">
          <h2 id={compact ? 'upload-title-compact' : 'upload-title'}>Resume Analyzer</h2>
          <p>See what stands out in your experience.</p>
        </div>
        <DemoTag />
      </div>

      <div
        className={`dropzone${dragging ? ' dragging' : ''}${fileName ? ' has-file' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
        onDrop={onDrop}
        aria-label="PDF drop area"
      >
        <div className="upload-illustration"><CloudUpload size={23} strokeWidth={1.8} /></div>
        <div className="dropzone-copy">
          <strong>{fileName || 'Drop your resume here'}</strong>
          <span>{fileName ? 'Selected locally · PDF only' : 'PDF format · up to 10 MB recommended'}</span>
        </div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf" onChange={onInputChange} aria-label="Choose a resume PDF" />
        <button className="button button-outline browse-button" type="button" onClick={() => inputRef.current?.click()}>
          <Upload size={15} /> Browse files
        </button>
      </div>

      <div className="upload-footnote"><LockKeyhole size={14} /><span>Private by design. This demo does not upload or read your file.</span></div>
      {notice && (
        <p className={`upload-notice ${notice.kind}`} role="status">
          {notice.kind === 'error' ? <CircleHelp size={15} /> : notice.kind === 'success' ? <CheckCircle2 size={15} /> : <Sparkles size={15} />}
          <span>{notice.text}</span>
        </p>
      )}
      {!notice && <p className="upload-step-note"><Sparkles size={14} />Real PDF analysis arrives in a later step.</p>}
    </section>
  );
}

function SkillsCard({ compact = false, userSkills = [] }: { compact?: boolean; userSkills?: string[] }) {
  const shownSkills = userSkills.length
    ? userSkills.slice(0, 6).map((name, index) => ({ name, level: 'Profile skill', progress: 100, tone: ['blue', 'violet', 'green', 'amber', 'rose', 'blue'][index % 6] }))
    : skills;
  return (
    <section className={`panel skills-panel${compact ? ' compact-panel' : ''}`} aria-labelledby={compact ? 'skills-title-small' : 'skills-title'}>
      <div className="panel-heading">
        <div className="panel-heading-icon skills-heading-icon"><Zap size={18} /></div>
        <div className="panel-heading-copy">
          <h2 id={compact ? 'skills-title-small' : 'skills-title'}>{compact ? 'Skills snapshot' : 'Example skills'}</h2>
          <p>{userSkills.length ? 'From your local resume reviews and target skills.' : 'Example only, not extracted from a resume.'}</p>
        </div>
        <DemoTag />
      </div>
      {userSkills.length ? <><div className="job-skills skill-summary-tags">{userSkills.slice(0, 12).map((skill) => <span key={skill}>{skill}</span>)}</div><p className="skill-data-note">Detected in local resume text or added to your target-skill profile. Proficiency is not scored.</p></> : <div className="skill-list">
        {shownSkills.map((skill) => (
          <div className="skill-row" key={skill.name}>
            <div className="skill-row-top"><span className="skill-name">{skill.name}</span><span className="skill-level">{skill.level}</span></div>
            <div className="skill-track" role="meter" aria-label={`${skill.name} example proficiency`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={skill.progress}>
              <span className={`skill-fill ${skill.tone}`} style={{ width: `${skill.progress}%` }} />
            </div>
          </div>
        ))}
      </div>}
      {compact && !userSkills.length && <div className="skills-footnote"><span className="mini-spark"><Sparkles size={13} /></span>Example profile · not extracted from a resume</div>}
    </section>
  );
}

function JobCard({ job, onDetails, isSaved, status, onToggleSave, onStatusChange, resumeSkills }: { job: Job; onDetails: (job: Job) => void; isSaved: boolean; status: SavedJob['status']; onToggleSave: (job: Job) => void; onStatusChange: (jobId: string, status: SavedJob['status']) => void; resumeSkills: string[] }) {
  const skillMatch = getJobSkillMatch(job, resumeSkills);
  const match = resumeSkills.length ? skillMatch.percentage : job.match;
  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className={`company-mark ${job.color}`} aria-hidden="true">{job.company.slice(0, 1)}</div>
        <div className="job-card-actions"><button className={`save-job-button${isSaved ? ' saved' : ''}`} type="button" aria-pressed={isSaved} aria-label={`${isSaved ? 'Unsave' : 'Save'} ${job.title}`} title={`${isSaved ? 'Unsave' : 'Save'} sample job`} onClick={() => onToggleSave(job)}>{isSaved ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}</button><button className="icon-button more-button" type="button" aria-label={`View details for ${job.title}`} onClick={() => onDetails(job)}><MoreHorizontal size={20} /></button></div>
      </div>
      <div className="job-title-line"><div><h3>{job.title}</h3><p>{job.company} <span className="meta-separator">·</span> {job.location}</p></div><span className={`match-score ${job.color}`}><strong>{match}%</strong><small>{resumeSkills.length ? 'SKILL OVERLAP' : 'SAMPLE SCORE'}</small></span></div>
      <div className="job-meta-row"><span><BriefcaseBusiness size={13} />{job.type} · {job.experience}</span><DemoTag>SAMPLE LISTING</DemoTag></div>
      <div className="job-skills" aria-label="Example required skills">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
      {resumeSkills.length > 0 && <div className="job-skills-breakdown"><p><CheckCircle2 size={12} />Match: {skillMatch.matching.join(', ') || 'No exact skill overlap yet'}</p>{skillMatch.missing.length > 0 && <p><Target size={12} />Build: {skillMatch.missing.join(', ')}</p>}<small>Consider one missing skill for your next learning milestone.</small></div>}
      {isSaved && <label className="job-status-field">Application tracker (local only)<select value={status} onChange={(event) => onStatusChange(job.id, event.target.value as SavedJob['status'])}><option>Saved</option><option>Interested</option><option>Applied</option></select></label>}
      <button className="job-details-button" type="button" onClick={() => onDetails(job)}>View details <ArrowRight size={15} /></button>
    </article>
  );
}

function RoadmapCard({
  completed,
  onToggle,
  compact = false,
  steps = roadmap as RoadmapStep[],
}: {
  completed: Set<string>;
  onToggle: (id: string) => void;
  compact?: boolean;
  steps?: RoadmapStep[];
}) {
  const visibleSteps = compact ? steps.slice(0, 2) : steps;
  const doneCount = steps.filter((step) => completed.has(step.id)).length;
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  return (
    <section className={`panel roadmap-panel${compact ? ' compact-panel' : ''}`} aria-labelledby={compact ? 'roadmap-title-small' : 'roadmap-title'}>
      <div className="panel-heading">
        <div className="panel-heading-icon roadmap-heading-icon"><GraduationCap size={19} /></div>
        <div className="panel-heading-copy">
          <h2 id={compact ? 'roadmap-title-small' : 'roadmap-title'}>{compact ? 'Your next steps' : 'Learning roadmap'}</h2>
          <p>Sample plan for building toward your next role.</p>
        </div>
        <DemoTag />
      </div>
      <div className="roadmap-progress-head"><span>Example progress</span><strong>{progress}%</strong></div>
      <div className="roadmap-progress-track" role="progressbar" aria-label="Sample roadmap progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
      <ol className="roadmap-list">
        {visibleSteps.map((step, index) => {
          const isDone = completed.has(step.id);
          return (
            <Fragment key={step.id}>
              {!compact && step.stage && (index === 0 || visibleSteps[index - 1]?.stage !== step.stage) && <li className={`roadmap-stage-heading stage-${step.stage.toLowerCase()}`}><span>{step.stage} stage</span><small>{step.stage === 'Beginner' ? 'Start with the foundations' : step.stage === 'Intermediate' ? 'Build and connect your skills' : 'Prepare to present your work'}</small></li>}
              <li className={`roadmap-step${isDone ? ' complete' : ''}`}>
                <span className="roadmap-step-marker">{isDone ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span>
                <div className="roadmap-step-copy"><strong>{step.title}</strong><span>{step.detail}</span><small><Clock3 size={12} />{step.duration}</small>{step.resource && <a href={step.resource} target="_blank" rel="noreferrer">Open learning resource <ArrowUpRight size={12} /></a>}</div>
                <button className={`step-toggle${isDone ? ' done' : ''}`} type="button" aria-label={`${isDone ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`} onClick={() => onToggle(step.id)}>{isDone ? <Check size={15} /> : <ArrowRight size={15} />}</button>
              </li>
            </Fragment>
          );
        })}
      </ol>
      <p className="sample-content-note"><Sparkles size={13} />Recommendations are sample content, not AI-generated.</p>
    </section>
  );
}

function DashboardPage({
  query,
  onNavigate,
  onJobDetails,
  completed,
  onToggleStep,
  onToast,
  reports,
  savedCount,
  activity,
  savedJobs,
  onToggleSave,
  onStatusChange,
  careerGoal,
  profileName,
  targetSkills,
}: {
  query: string;
  onNavigate: (page: PageId) => void;
  onJobDetails: (job: Job) => void;
  completed: Set<string>;
  onToggleStep: (id: string) => void;
  onToast: (message: string) => void;
  reports: ResumeReport[];
  savedCount: number;
  activity: ActivityItem[];
  savedJobs: SavedJob[];
  onToggleSave: (job: Job) => void;
  onStatusChange: (jobId: string, status: SavedJob['status']) => void;
  careerGoal: string;
  profileName: string;
  targetSkills: string[];
}) {
  const searchTerm = query.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => `${job.title} ${job.company} ${job.skills.join(' ')}`.toLowerCase().includes(searchTerm));
  const userSkills = getUserSkills(reports, targetSkills);
  const averageJobMatch = userSkills.length ? Math.round(jobs.reduce((sum, job) => sum + getJobSkillMatch(job, userSkills).percentage, 0) / jobs.length) : null;
  const learningPlan = careerGoal ? createGoalRoadmap(careerGoal, reports[0]?.missingKeywords ?? []) : [];
  const completedLearningSteps = learningPlan.filter((step) => completed.has(step.id)).length;
  const roadmapProgress = learningPlan.length ? Math.round(completedLearningSteps / learningPlan.length * 100) : 0;
  return (
    <>
      <section className="dashboard-hero" aria-labelledby="dashboard-hero-title">
        <div className="dashboard-hero-copy"><span className="hero-kicker"><span className="hero-kicker-dot" /> CAREER DEVELOPMENT WORKSPACE</span><h2 id="dashboard-hero-title">Your next chapter<br /><span>starts with a plan.</span></h2><p>Welcome, {profileName.split(/\s+/)[0]}. Review your experience, explore sample opportunities, and turn a career goal into practical weekly steps.</p><div className="hero-actions"><button className="button button-primary" type="button" onClick={() => onNavigate('analyzer')}><FileSearch size={16} />Review my resume <ArrowRight size={15} /></button><button className="button button-hero-secondary" type="button" onClick={() => onNavigate('matcher')}>Explore sample roles</button></div><div className="hero-footnote"><ShieldCheck size={14} />Local demo workspace · your resume text is not saved</div></div>
        <div className="hero-illustration" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-illustration-core"><span><Sparkles size={25} /></span><strong>Career<br />momentum</strong><small>ONE STEP AT A TIME</small></div><div className="hero-float hero-float-score"><span className="hero-float-icon"><Target size={15} /></span><span><strong>{reports.length ? `${Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length)}%` : '—'}</strong><small>resume score</small></span></div><div className="hero-float hero-float-goal"><span className="hero-float-icon"><GraduationCap size={15} /></span><span><strong>{careerGoal || 'Choose a goal'}</strong><small>career direction</small></span></div><div className="hero-illustration-mark mark-one"><BriefcaseBusiness size={16} /></div><div className="hero-illustration-mark mark-two"><TrendingUp size={16} /></div></div>
      </section>
      <section className="stats-grid" aria-label="Career summary">
        <StatCard label="Resume analyses" value={String(reports.length)} note="Reports stored in this browser" icon={FileSearch} tone="blue" />
        <StatCard label="Average resume score" value={reports.length ? `${Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length)}%` : '—'} note={reports.length ? 'Rule-based demo score' : 'Run an analysis to begin'} icon={Target} tone="violet" />
        <StatCard label="Identified skills" value={String(userSkills.length)} note={userSkills.length ? 'Unique skills across your local profile' : 'Try the sample resume or add target skills'} icon={Zap} tone="green" />
        <StatCard label="Average job match" value={averageJobMatch === null ? '—' : `${averageJobMatch}%`} note={userSkills.length ? 'Exact overlap across sample roles' : 'Available when profile skills are added'} icon={BriefcaseBusiness} tone="amber" />
      </section>

      <div className="dashboard-workspace-layout">
        <div className="dashboard-primary-column">
          <ScoreTrendChart reports={reports} />
          <section className="quick-actions-panel panel"><div className="panel-heading"><div className="panel-heading-copy"><h2>Quick actions</h2><p>Keep your next step moving.</p></div></div><div className="quick-actions" aria-label="Quick actions"><button type="button" onClick={() => onNavigate('analyzer')}><span><FileSearch size={17} /></span><strong>Review resume</strong><small>Explainable text review</small><ArrowRight size={15} /></button><button type="button" onClick={() => onNavigate('matcher')}><span><BriefcaseBusiness size={17} /></span><strong>Explore roles</strong><small>Search sample listings</small><ArrowRight size={15} /></button><button type="button" onClick={() => onNavigate('roadmap')}><span><GraduationCap size={17} /></span><strong>Build a roadmap</strong><small>Plan weekly progress</small><ArrowRight size={15} /></button></div></section>
          <RecentActivity activity={activity} onNavigate={onNavigate} />
          <UploadCard compact onToast={onToast} onOpenAnalyzer={() => onNavigate('analyzer')} />
          <section className="section-block featured-jobs" aria-labelledby="featured-jobs-title"><SectionHeading eyebrow="SAMPLE LISTINGS" title="Roles to explore" detail="Example matches, not verified vacancies." action={<button className="text-button" type="button" onClick={() => onNavigate('matcher')}>View all roles <ArrowRight size={15} /></button>} /><div className="job-grid dashboard-job-grid">{filteredJobs.length ? filteredJobs.slice(0, 2).map((job) => { const saved = savedJobs.find((item) => item.id === job.id); return <JobCard key={job.id} job={job} onDetails={onJobDetails} isSaved={Boolean(saved?.saved)} status={saved?.status ?? 'Saved'} onToggleSave={onToggleSave} onStatusChange={onStatusChange} resumeSkills={userSkills} />; }) : <EmptySearch query={query} />}</div></section>
        </div>
        <aside className="dashboard-side-column" aria-label="Career progress">
          <section className="panel career-progress-panel"><div className="panel-heading"><div className="panel-heading-icon roadmap-heading-icon"><Target size={18} /></div><div className="panel-heading-copy"><h2>Career progress</h2><p>Your activity in this browser.</p></div><span className="progress-status-dot" title="Local profile data" /></div><div className="career-progress-ring" style={{ '--progress': `${roadmapProgress}%` } as React.CSSProperties}><div><strong>{careerGoal ? `${roadmapProgress}%` : '—'}</strong><span>roadmap done</span></div></div><p className="career-goal-label">{careerGoal ? <>Current goal <strong>{careerGoal}</strong></> : 'Choose a career goal to build your plan.'}</p><button className="text-button career-progress-link" type="button" onClick={() => onNavigate(careerGoal ? 'roadmap' : 'settings')}>{careerGoal ? 'View your roadmap' : 'Set a career goal'} <ArrowRight size={14} /></button><div className="career-progress-divider" /><div className="career-progress-stat"><span>Resume reviews</span><strong>{reports.length}</strong></div><div className="career-progress-stat"><span>Identified skills</span><strong>{userSkills.length}</strong></div><div className="career-progress-stat"><span>Saved sample roles</span><strong>{savedCount}</strong></div><div className="career-progress-stat"><span>Completed milestones</span><strong>{completedLearningSteps}/{learningPlan.length}</strong></div></section>
          <SkillsCard compact userSkills={userSkills} />
          {careerGoal ? <RoadmapCard compact completed={completed} onToggle={onToggleStep} steps={learningPlan} /> : <section className="panel dashboard-goal-empty"><div className="panel-heading"><div className="panel-heading-icon roadmap-heading-icon"><GraduationCap size={19} /></div><div className="panel-heading-copy"><h2>Choose a career goal</h2><p>Your sample weekly plan starts here.</p></div></div><button className="text-button" type="button" onClick={() => onNavigate('roadmap')}>Build a roadmap <ArrowRight size={14} /></button></section>}
        </aside>
      </div>
    </>
  );
}

function EmptySearch({ query }: { query: string }) {
  return <div className="empty-search"><Search size={19} /><strong>No demo jobs match “{query}”</strong><span>Try a role title, company, or skill.</span></div>;
}

function AnalyzerPage({ onToast, onComplete }: { onToast: (message: string) => void; onComplete: (report: ResumeReport) => void }) {
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('Pasted resume text');
  const [targetDescription, setTargetDescription] = useState('');
  const [report, setReport] = useState<ResumeReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setLoading(true);
    setReport(null);
    try {
      const text = await extractResumeText(file);
      setResumeText(text);
      setFileName(file.name);
      onToast('Resume text was extracted locally. No file was uploaded.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This document could not be read.');
      setResumeText('');
      setFileName('Pasted resume text');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const runAnalysis = async () => {
    setError('');
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    try {
      if (resumeText.trim().length < 80) throw new Error('Add at least 80 characters of resume text before analyzing.');
      const nextReport = analyzeResume({ text: resumeText, fileName, targetDescription });
      setReport(nextReport);
      onComplete(nextReport);
      onToast('Rule-based demo review completed and saved to local history.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The resume could not be analyzed.');
    } finally {
      setLoading(false);
    }
  };

  const tryDemoResume = () => {
    setResumeText(demoResumeText);
    setFileName('SkillBridge sample resume');
    setTargetDescription('Frontend Developer React TypeScript accessibility Git responsive interfaces testing');
    setError('');
    setLoading(true);
    window.setTimeout(() => {
      const sampleReport = analyzeResume({ text: demoResumeText, fileName: 'SkillBridge sample resume', targetDescription: 'Frontend Developer React TypeScript accessibility Git responsive interfaces testing' });
      sampleReport.isSample = true;
      setReport(sampleReport);
      onComplete(sampleReport);
      setLoading(false);
      onToast('Sample resume reviewed. This rule-based result was saved in local history.');
    }, 250);
  };

  const downloadReport = () => {
    if (!report) return;
    const contents = [
      'SkillBridge AI · Resume review (rule-based demo)',
      `File: ${report.fileName}`,
      `Date: ${new Date(report.createdAt).toLocaleString()}`,
      `ATS-style score: ${report.score}/100 · ${report.scoreLabel}`,
      `Skills found: ${report.skills.join(', ') || 'None detected'}`,
      `Education detected: ${(report.education ?? []).join(' | ') || 'None detected'}`,
      `Experience detected: ${(report.experience ?? []).join(' | ') || 'None detected'}`,
      `Strengths: ${report.strengths.join(' | ')}`,
      `Weaknesses to review: ${(report.weaknesses ?? report.suggestions).join(' | ')}`,
      `Suggestions: ${report.suggestions.join(' | ')}`,
      `Missing target keywords: ${report.missingKeywords.join(', ') || 'No target description supplied or no gaps found'}`,
      `Section checks: ${report.sectionChecks.map((section) => `${section.label}: ${section.present ? 'present' : 'not detected'}`).join('; ')}`,
      '',
      'This report uses transparent text-matching rules. It is not AI-generated or professional hiring advice.',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `skillbridge-resume-review-${new Date(report.createdAt).toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="analyzer-workspace">
      <div className="intro-callout analyzer-disclosure"><div className="intro-callout-icon"><ShieldCheck size={20} /></div><div><strong>Private, rule-based demo review</strong><p>Documents are read in your browser and never uploaded. Scores explain document structure and keyword coverage; they are not generated by an AI model.</p></div><DemoTag>LOCAL ONLY</DemoTag></div>
      <section className="panel analyzer-input-panel">
        <div className="panel-heading"><div className="panel-heading-icon upload-heading-icon"><FileSearch size={19} /></div><div className="panel-heading-copy"><h2>Resume content</h2><p>Upload a text PDF/DOCX or paste the content below.</p></div><button className="button button-outline try-demo-button" type="button" onClick={tryDemoResume} disabled={loading}><Sparkles size={14} />Try Demo</button><DemoTag>MAX 10 MB</DemoTag></div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" onChange={(event) => void readFile(event.target.files?.[0])} aria-label="Choose a PDF or DOCX resume" />
        <div className="analyzer-input-toolbar"><button className="button button-outline" type="button" onClick={() => inputRef.current?.click()} disabled={loading}><Upload size={15} />Choose PDF or DOCX</button><span className="selected-file"><FileText size={14} />{fileName}</span>{loading && <span className="loading-inline" role="status"><span />Reading locally...</span>}</div>
        <label className="auth-field resume-text-field"><span>Resume text <small>{resumeText.length} characters</small></span><textarea value={resumeText} onChange={(event) => { setResumeText(event.target.value); setFileName('Pasted resume text'); setReport(null); }} placeholder="Paste your resume text here, including contact details, experience, education, and skills..." rows={11} /></label>
        <label className="auth-field target-description-field"><span>Target job description <small>Optional · used for keyword comparison only</small></span><textarea value={targetDescription} onChange={(event) => setTargetDescription(event.target.value)} placeholder="Paste a job description to compare its terms with your resume." rows={5} /></label>
        {error && <p className="auth-message error analyzer-error" role="alert">{error}</p>}
        <div className="analyzer-actions"><span><LockKeyhole size={13} />Resume text stays in this browser and is not stored in history.</span><button className="button button-primary analyze-button" type="button" disabled={loading || resumeText.trim().length < 80} onClick={() => void runAnalysis()}>{loading ? <><span className="button-spinner" />Analyzing locally...</> : <><Sparkles size={15} />Review resume</>}</button></div>
      </section>

      {report && <section className="analysis-report" aria-labelledby="report-title" aria-live="polite">
        <div className="report-header"><div><p className="section-eyebrow">{report.isSample ? 'SAMPLE RESUME · RULE-BASED CHECK' : 'EXPLAINABLE TEXT CHECK'}</p><h2 id="report-title">Resume review</h2><p>{report.fileName} · {new Date(report.createdAt).toLocaleString()}</p></div><button className="button button-outline" type="button" onClick={downloadReport}><Download size={15} />Download report</button></div>
        <div className="report-summary-grid"><div className="panel score-panel"><span>ATS-style score</span><strong>{report.score}<small>/100</small></strong><DemoTag>{report.scoreLabel}</DemoTag><p>Based on sections, detected skills, action verbs, measurable outcomes, and document length.</p></div><div className="panel report-list-panel"><h3><CheckCircle2 size={16} />Strengths found</h3><ul>{report.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
        <div className="report-detail-grid"><section className="panel report-list-panel"><h3><Zap size={16} />Skills detected</h3>{report.skills.length ? <div className="job-skills">{report.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <p>No terms from the supported skill list were detected. This doesn't mean the resume lacks skills.</p>}</section><section className="panel report-list-panel"><h3><ListChecks size={16} />Section checks</h3><ul className="section-check-list">{report.sectionChecks.map((item) => <li key={item.label} className={item.present ? 'present' : 'missing'}><span>{item.present ? <Check size={14} /> : <X size={14} />}</span>{item.label}<small>{item.present ? 'Detected' : 'Not detected'}</small></li>)}</ul></section></div>
        <div className="report-detail-grid"><section className="panel report-list-panel"><h3><BriefcaseBusiness size={16} />Experience found</h3>{report.experience.length ? <ul>{report.experience.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No role or experience lines were detected. Add titles, organizations, and dates if applicable.</p>}</section><section className="panel report-list-panel"><h3><GraduationCap size={16} />Education found</h3>{report.education.length ? <ul>{report.education.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No education or qualification lines were detected.</p>}</section></div>
        <section className="panel report-list-panel report-suggestions"><h3><CircleHelp size={16} />Weaknesses to review</h3>{report.weaknesses.length ? <ul>{report.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No high-priority structure gaps were found by these demo rules.</p>}</section>
        <section className="panel report-list-panel report-suggestions"><h3><ArrowUpRight size={16} />Suggestions to consider</h3><ul>{report.suggestions.map((item) => <li key={item}>{item}</li>)}</ul></section>
        {report.targetRole && <section className="panel report-list-panel report-keywords"><h3><Search size={16} />Target keyword comparison</h3><p>Terms not found in the text are suggestions to review for accuracy, not endorsements to add unrelated skills.</p>{report.missingKeywords.length ? <div className="job-skills">{report.missingKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div> : <p>No gaps were detected from the selected target text.</p>}</section>}
      </section>}
    </div>
  );
}

function MatcherPage({ query, onJobDetails, savedJobs, onToggleSave, onStatusChange, resumeSkills }: { query: string; onJobDetails: (job: Job) => void; savedJobs: SavedJob[]; onToggleSave: (job: Job) => void; onStatusChange: (jobId: string, status: SavedJob['status']) => void; resumeSkills: string[] }) {
  const [category, setCategory] = useState('All categories');
  const [workMode, setWorkMode] = useState('Any location');
  const [experience, setExperience] = useState('Any experience');
  const [skill, setSkill] = useState('All skills');
  const [savedOnly, setSavedOnly] = useState(false);
  const term = query.trim().toLowerCase();
  const allSkills = [...new Set(jobs.flatMap((job) => job.skills))].sort();
  const filteredJobs = jobs.filter((job) => {
    const saved = savedJobs.some((item) => item.id === job.id && item.saved);
    const locationMode = job.location.toLowerCase().includes('remote') ? 'Remote' : job.location.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site';
    return `${job.title} ${job.company} ${job.location} ${job.skills.join(' ')}`.toLowerCase().includes(term)
      && (category === 'All categories' || job.category === category)
      && (workMode === 'Any location' || locationMode === workMode)
      && (experience === 'Any experience' || job.experience === experience)
      && (skill === 'All skills' || job.skills.includes(skill))
      && (!savedOnly || saved);
  });
  return (
    <>
      <div className="filter-summary"><div><Filter size={16} /><span>{filteredJobs.length} illustrative sample {filteredJobs.length === 1 ? 'listing' : 'listings'}</span></div><DemoTag>NOT LIVE VACANCIES</DemoTag></div>
      <section className="panel matcher-filters" aria-label="Job filters"><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{[...new Set(jobs.map((job) => job.category))].map((item) => <option key={item}>{item}</option>)}</select></label><label>Work mode<select value={workMode} onChange={(event) => setWorkMode(event.target.value)}>{['Any location', 'Remote', 'Hybrid', 'On-site'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Experience<select value={experience} onChange={(event) => setExperience(event.target.value)}>{['Any experience', 'Entry', 'Mid', 'Senior'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Skill<select value={skill} onChange={(event) => setSkill(event.target.value)}><option>All skills</option>{allSkills.map((item) => <option key={item}>{item}</option>)}</select></label><label className="saved-only-filter"><input type="checkbox" checked={savedOnly} onChange={(event) => setSavedOnly(event.target.checked)} />Saved only</label></section>
      {filteredJobs.length ? <div className="job-grid full-job-grid">{filteredJobs.map((job) => { const saved = savedJobs.find((item) => item.id === job.id); return <JobCard key={job.id} job={job} onDetails={onJobDetails} isSaved={Boolean(saved?.saved)} status={saved?.status ?? 'Saved'} onToggleSave={onToggleSave} onStatusChange={onStatusChange} resumeSkills={resumeSkills} />; })}</div> : <div className="matcher-empty panel"><BriefcaseBusiness size={22} /><strong>{savedOnly ? 'No saved listings match these filters' : 'No sample listings match these filters'}</strong><span>Adjust or clear a filter to see more roles.</span><button className="text-button" type="button" onClick={() => { setCategory('All categories'); setWorkMode('Any location'); setExperience('Any experience'); setSkill('All skills'); setSavedOnly(false); }}>Clear filters</button></div>}
      <p className="page-disclaimer"><Sparkles size={14} />Scores use your latest report's exact skill overlap when available; otherwise the displayed percentage is labeled as a sample score. No employer contact or application submission is connected.</p>
    </>
  );
}

function RoadmapPage({ completed, onToggleStep, careerGoal, onSelectGoal, missingSkills }: { completed: Set<string>; onToggleStep: (id: string) => void; careerGoal: string; onSelectGoal: (goal: string) => void; missingSkills: string[] }) {
  const [goalDraft, setGoalDraft] = useState(careerGoal);
  const gaps = missingSkills.slice(0, 3);
  const generatedSteps = createGoalRoadmap(careerGoal, missingSkills);

  if (!careerGoal) return <section className="panel roadmap-goal-empty"><div className="empty-state-art"><GraduationCap size={29} /></div><DemoTag>START HERE</DemoTag><h2>Choose a career direction</h2><p>Your weekly plan will use this goal and, when available, the keyword gaps from your latest local resume review.</p><label className="auth-field">Career goal<select value={goalDraft} onChange={(event) => setGoalDraft(event.target.value)}><option value="">Select a direction</option><option>Frontend Developer</option><option>Full Stack Developer</option><option>Software Engineer</option><option>Data Analyst</option><option>Product Designer</option></select></label><button className="button button-primary" type="button" disabled={!goalDraft} onClick={() => onSelectGoal(goalDraft)}>Build my sample roadmap <ArrowRight size={15} /></button></section>;
  return (
    <div className="roadmap-page-grid">
      <div className="roadmap-plan-column"><div className="roadmap-goal-bar"><div><span>CAREER GOAL</span><strong>{careerGoal}</strong></div><label className="goal-change-label">Change goal<select value={careerGoal} onChange={(event) => { setGoalDraft(event.target.value); onSelectGoal(event.target.value); }}><option>Frontend Developer</option><option>Full Stack Developer</option><option>Software Engineer</option><option>Data Analyst</option><option>Product Designer</option></select></label></div><RoadmapCard completed={completed} onToggle={onToggleStep} steps={generatedSteps} /></div>
      <aside className="panel roadmap-context">
        <div className="context-illustration"><BookOpenCheck size={25} /></div>
        <DemoTag>EXAMPLE PLAN</DemoTag>
        <h2>A path, not a prescription.</h2>
        <p>This browser-generated sample plan is based on your selected goal{gaps.length ? ' and up to three unmatched target-description terms from your latest review' : ''}. Resources are external learning references, not personalized AI advice.</p>
        <div className="context-divider" />
        <div className="context-meta"><span><Clock3 size={14} />6 core learning milestones</span><span><ListChecks size={14} />3 stages · {gaps.length ? `${gaps.length} optional skill practices` : 'goal-based practice'}</span></div>
      </aside>
    </div>
  );
}

function HistoryPage({ reports, onView, onDelete }: { reports: ResumeReport[]; onView: (report: ResumeReport) => void; onDelete: (report: ResumeReport) => void }) {
  const navigate = useNavigate();
  if (!reports.length) return <section className="panel empty-state-panel"><div className="empty-state-art"><FileCheck2 size={30} /></div><DemoTag>LOCAL REPORTS</DemoTag><h2>Your review history will appear here</h2><p>Run a rule-based demo review to save its score and summary in this browser. The original resume text is not retained.</p><button className="button button-primary" type="button" onClick={() => navigate(pagePaths.analyzer)}>Analyze a resume <ArrowRight size={15} /></button></section>;
  return <section className="panel history-panel"><div className="panel-heading"><div className="panel-heading-copy"><h2>Saved resume reviews</h2><p>{reports.length} local {reports.length === 1 ? 'report' : 'reports'} · summaries only</p></div><DemoTag>THIS BROWSER</DemoTag></div><div className="history-table-wrap"><table className="history-table"><thead><tr><th>Resume</th><th>Date reviewed</th><th>Score</th><th>Identified skills</th><th>Report actions</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td><strong>{report.fileName}</strong><small>{report.isSample ? 'Sample resume' : report.scoreLabel}</small></td><td><time dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString()}</time></td><td><span className="history-score">{report.score}/100</span></td><td><span className="history-skill-list">{report.skills.length ? report.skills.join(', ') : 'No supported skills detected'}</span></td><td><div className="history-actions"><button type="button" className="button button-outline" onClick={() => onView(report)}>View report</button><button type="button" className="icon-button" aria-label={`Delete report for ${report.fileName}`} title="Delete report" onClick={() => onDelete(report)}><X size={16} /></button></div></td></tr>)}</tbody></table></div><p className="history-privacy-note"><LockKeyhole size={14} />Resume text and uploaded files are not included in these saved summaries.</p></section>;
}

function ReportDialog({ report, onClose }: { report: ResumeReport; onClose: () => void }) {
  return <div className="dialog-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="job-dialog report-dialog" role="dialog" aria-modal="true" aria-labelledby="history-report-title" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}><button className="icon-button dialog-close" type="button" aria-label="Close saved report" onClick={onClose}><X size={19} /></button><DemoTag>{report.isSample ? 'SAMPLE REPORT' : 'RULE-BASED DEMO REPORT'}</DemoTag><h2 id="history-report-title">{report.fileName}</h2><p className="dialog-company">{new Date(report.createdAt).toLocaleString()} · Original resume text is not stored</p><div className="history-dialog-score"><strong>{report.score}<small>/100</small></strong><span>{report.scoreLabel}</span></div><h3>Skills detected</h3><p>{report.skills.join(', ') || 'No supported skill terms detected.'}</p><h3>Education</h3><p>{(report.education ?? []).join(' · ') || 'No education detail detected.'}</p><h3>Experience</h3><ul>{(report.experience ?? []).map((item) => <li key={item}>{item}</li>)}</ul><h3>Strengths</h3><ul>{report.strengths.map((item) => <li key={item}>{item}</li>)}</ul><h3>Weaknesses and suggestions</h3><ul>{(report.weaknesses ?? report.suggestions).map((item) => <li key={item}>{item}</li>)}</ul><button className="button button-primary dialog-done" type="button" onClick={onClose}>Done</button></section></div>;
}

function SettingsPage({ compactMode, onToggleCompact, theme, onToggleTheme, profile, onSaveProfile, notificationPrefs, onNotificationChange, onClearData }: { compactMode: boolean; onToggleCompact: () => void; theme: Theme; onToggleTheme: () => void; profile: DemoUser; onSaveProfile: (profile: Partial<DemoUser>) => void; notificationPrefs: { analysis: boolean; jobs: boolean; roadmap: boolean }; onNotificationChange: (key: keyof typeof notificationPrefs, value: boolean) => void; onClearData: () => void }) {
  const [saved, setSaved] = useState(false);
  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const preferredRole = String(form.get('preferredRole') ?? '');
    const targetSkills = String(form.get('targetSkills') ?? '').split(',').map((skill) => skill.trim()).filter(Boolean);
    onSaveProfile({ name: String(form.get('name') ?? '').trim(), email: String(form.get('email') ?? '').trim(), preferredRole, careerGoal: preferredRole, targetSkills });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  return (
    <div className="settings-content">
      <form className="panel profile-settings-panel" onSubmit={saveProfile}><div className="settings-group-heading"><div><h2>Demo profile</h2><p>Profile details stay in this browser only.</p></div><UserRoundPlus size={20} /></div><div className="profile-settings-grid"><label className="auth-field">Name<input name="name" defaultValue={profile.name} required minLength={2} /></label><label className="auth-field">Email<input name="email" type="email" defaultValue={profile.email} required /></label><label className="auth-field">Preferred job role<select name="preferredRole" defaultValue={profile.preferredRole ?? profile.careerGoal ?? ''}><option value="">Not selected</option><option>Frontend Developer</option><option>Full Stack Developer</option><option>Software Engineer</option><option>Data Analyst</option><option>Product Designer</option></select></label><label className="auth-field">Target skills<input name="targetSkills" defaultValue={(profile.targetSkills ?? []).join(', ')} placeholder="React, HTML, CSS, Git" /><small>Separate skills with commas. Used for local job matches.</small></label></div><div className="settings-form-actions"><span className="demo-only-note"><ShieldCheck size={13} />Demo profile only · saved in this browser</span><button className="button button-primary" type="submit">{saved ? <><Check size={15} />Saved</> : 'Save profile'}</button></div></form>
      <section className="panel settings-panel">
        <div className="settings-group-heading"><div><h2>Workspace preferences</h2><p>Adjust the dashboard presentation.</p></div><Settings2 size={20} /></div>
        <div className="setting-row"><div className="setting-symbol"><Sun size={17} /></div><div className="setting-copy"><strong>Light appearance</strong><span>Switch between dark and light themes.</span></div><button className={`switch${theme === 'light' ? ' on' : ''}`} type="button" role="switch" aria-checked={theme === 'light'} aria-label="Light appearance" onClick={onToggleTheme}><span /></button></div>
        <div className="setting-row"><div className="setting-symbol"><LayoutDashboard size={17} /></div><div className="setting-copy"><strong>Compact dashboard</strong><span>Reduce spacing to see more at once.</span></div><button className={`switch${compactMode ? ' on' : ''}`} type="button" role="switch" aria-checked={compactMode} aria-label="Compact dashboard" onClick={onToggleCompact}><span /></button></div>
        <div className="setting-row"><div className="setting-symbol"><Sparkles size={17} /></div><div className="setting-copy"><strong>Demo data</strong><span>Example scores and content are currently displayed.</span></div><span className="enabled-pill"><span />Enabled</span></div>
        <div className="setting-row"><div className="setting-symbol"><ShieldCheck size={17} /></div><div className="setting-copy"><strong>Resume privacy</strong><span>Files selected in Step 1 stay in your browser.</span></div><span className="local-pill"><LockKeyhole size={12} />Local only</span></div>
      </section>
      <section className="panel settings-panel notification-settings"><div className="settings-group-heading"><div><h2>Notification preferences</h2><p>Control in-app demo activity notices.</p></div><Bell size={19} /></div>{([['analysis', 'Resume reviews'], ['jobs', 'Saved job updates'], ['roadmap', 'Learning milestones']] as const).map(([key, label]) => <div className="setting-row" key={key}><div className="setting-copy"><strong>{label}</strong><span>Show this type of local demo activity.</span></div><button className={`switch${notificationPrefs[key] ? ' on' : ''}`} type="button" role="switch" aria-checked={notificationPrefs[key]} aria-label={label} onClick={() => onNotificationChange(key, !notificationPrefs[key])}><span /></button></div>)}</section>
      <section className="panel account-panel"><div className="panel-heading"><div className="panel-heading-icon account-heading-icon"><CircleHelp size={18} /></div><div className="panel-heading-copy"><h2>About this preview</h2><p>SkillBridge AI · Step 1</p></div></div><p>This is a frontend prototype. AI resume analysis, real job matching, account management, and saved history are not connected yet.</p></section>
      <section className="panel clear-data-panel"><div><strong>Reset demo workspace</strong><span>Clears local reports, saved sample jobs, activity, learning progress, preferred role, and target skills. Your demo name, email, and theme remain.</span></div><button className="button button-danger" type="button" onClick={onClearData}><X size={14} />Reset demo data</button></section>
    </div>
  );
}

function JobDialog({ job, onClose, savedJob, onToggleSave, onStatusChange, resumeSkills }: { job: Job; onClose: () => void; savedJob?: SavedJob; onToggleSave: (job: Job) => void; onStatusChange: (jobId: string, status: SavedJob['status']) => void; resumeSkills: string[] }) {
  const skillMatch = getJobSkillMatch(job, resumeSkills);
  const match = resumeSkills.length ? skillMatch.percentage : job.match;
  return (
    <div className="dialog-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="job-dialog" role="dialog" aria-modal="true" aria-labelledby="job-dialog-title" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
        <button className="icon-button dialog-close" type="button" aria-label="Close job details" onClick={onClose}><X size={19} /></button>
        <div className={`company-mark dialog-company-mark ${job.color}`} aria-hidden="true">{job.company.slice(0, 1)}</div>
        <DemoTag>DEMO ROLE</DemoTag>
        <h2 id="job-dialog-title">{job.title}</h2>
        <p className="dialog-company">{job.company} <span>·</span> {job.location} <span>·</span> {job.type}</p>
        <div className="dialog-match"><div><span>{resumeSkills.length ? `${skillMatch.matching.length} of ${job.skills.length} required skills overlap` : 'Sample listing score'}</span><strong>{match}%</strong></div><div className="dialog-match-track"><span style={{ width: `${match}%` }} /></div><small>{resumeSkills.length ? `Matching: ${skillMatch.matching.join(', ') || 'none yet'}. Missing: ${skillMatch.missing.join(', ') || 'none detected'}.` : 'Illustrative sample percentage; add profile skills or run the demo resume for a personalized comparison.'}</small></div>
        {resumeSkills.length > 0 && skillMatch.missing.length > 0 && <p className="sample-vacancy-note">Suggested next step: choose one missing skill and practice it in a small project before adding it to your resume.</p>}
        <h3>Example required skills</h3>
        <div className="job-skills dialog-skills">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
        <p className="dialog-summary">{job.summary}</p>
        <p className="sample-vacancy-note">Sample listing only. This project does not verify vacancy availability or submit applications.</p>
        <div className="dialog-job-actions"><button className="button button-outline" type="button" aria-pressed={Boolean(savedJob?.saved)} onClick={() => onToggleSave(job)}><Heart size={15} fill={savedJob?.saved ? 'currentColor' : 'none'} />{savedJob?.saved ? 'Unsave listing' : 'Save listing'}</button>{savedJob?.saved && <label className="job-status-field">Local status<select value={savedJob.status} onChange={(event) => onStatusChange(job.id, event.target.value as SavedJob['status'])}><option>Saved</option><option>Interested</option><option>Applied</option></select></label>}</div>
        <button className="button button-primary dialog-done" type="button" onClick={onClose}>Done</button>
      </section>
    </div>
  );
}

function LoginPage({ theme, onToggleTheme, onAuthenticate }: { theme: Theme; onToggleTheme: () => void; onAuthenticate: (user: DemoUser, remember: boolean) => void }) {
  const [view, setView] = useState<'signin' | 'create' | 'forgot'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const switchView = (nextView: 'signin' | 'create' | 'forgot') => {
    setView(nextView);
    setError('');
    setMessage('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email') ?? '').trim();
    if (view === 'forgot') {
      setMessage('Password recovery is unavailable because this demo has no account service. No email was sent.');
      return;
    }
    const password = String(values.get('password') ?? '');
    if (password.length < 8) {
      setError('Use at least 8 characters for the demo password.');
      return;
    }
    if (view === 'create') {
      const name = String(values.get('name') ?? '').trim();
      const confirmPassword = String(values.get('confirmPassword') ?? '');
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please try again.');
        return;
      }
      onAuthenticate({ name, email }, true);
      return;
    }
    onAuthenticate({ name: email.split('@')[0] || 'Demo Candidate', email }, remember);
  };

  const isSignIn = view === 'signin';
  const isCreate = view === 'create';
  const title = isSignIn ? 'Welcome back' : isCreate ? 'Create your workspace' : 'Reset your password';

  return (
    <main className="auth-screen">
      <div className="auth-atmosphere" aria-hidden="true" />
      <header className="auth-topbar">
        <a className="auth-brand" href="#welcome" aria-label="SkillBridge AI home"><span className="auth-brand-mark"><Sparkles size={20} strokeWidth={2.1} /></span><span>SkillBridge <strong>AI</strong></span></a>
        <button className="theme-toggle auth-theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
      </header>

      <div className="auth-layout" id="welcome">
        <section className="auth-intro" aria-labelledby="auth-welcome-title">
          <span className="auth-kicker"><span /> CAREER GROWTH, MADE CLEAR</span>
          <h1 id="auth-welcome-title">Make your next<br /><span>move count.</span></h1>
          <p className="auth-tagline">Your AI-powered career companion.</p>
          <p className="auth-intro-detail">A focused workspace to explore your strengths, discover opportunities, and plan what comes next.</p>
          <div className="auth-feature-list">
            <div><span className="auth-feature-icon"><FileSearch size={17} /></span><span><strong>Resume insights</strong><small>See the experience you bring</small></span></div>
            <div><span className="auth-feature-icon"><BriefcaseBusiness size={17} /></span><span><strong>Career possibilities</strong><small>Explore roles and new directions</small></span></div>
            <div><span className="auth-feature-icon"><GraduationCap size={17} /></span><span><strong>A clearer next step</strong><small>Turn goals into a learning plan</small></span></div>
          </div>
          <div className="auth-demo-note"><ShieldCheck size={15} /><span>Portfolio preview · Sample content only</span></div>
        </section>

        <section className="auth-card" aria-labelledby="auth-form-title">
          <div className="auth-card-heading"><div className="auth-card-icon">{isCreate ? <UserRoundPlus size={19} /> : view === 'forgot' ? <LockKeyhole size={19} /> : <LogIn size={19} />}</div><div><p>SKILLBRIDGE AI</p><h2 id="auth-form-title">{title}</h2></div></div>
          <p className="auth-form-detail">{isSignIn ? 'Sign in to continue to your career dashboard.' : isCreate ? 'Set up a local demo profile to get started.' : 'Enter your email to check password recovery options.'}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {isCreate && <label className="auth-field"><span>Full name</span><input name="name" type="text" autoComplete="name" placeholder="Your name" required minLength={2} /></label>}
            <label className="auth-field"><span>Email address</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            {view !== 'forgot' && <>
              <label className="auth-field"><span>Password</span><span className="password-input-wrap"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={isCreate ? 'new-password' : 'current-password'} placeholder="At least 8 characters" required minLength={8} /><button className="password-visibility" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
              {isCreate && <label className="auth-field"><span>Confirm password</span><input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter your password again" required minLength={8} /></label>}
            </>}
            {isSignIn && <div className="auth-form-options"><label className="remember-option"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span></label><button type="button" className="auth-link" onClick={() => switchView('forgot')}>Forgot password?</button></div>}
            {error && <p className="auth-message error" role="alert">{error}</p>}
            {message && <p className="auth-message info" role="status">{message}</p>}
            <button className="auth-submit" type="submit">{isSignIn ? 'Sign in to demo' : isCreate ? 'Create demo profile' : 'Check recovery options'}<ArrowRight size={16} /></button>
          </form>
          <div className="auth-switch-view">{isSignIn ? <>New to SkillBridge? <button type="button" className="auth-link" onClick={() => switchView('create')}>Create account</button></> : <>Already have a demo profile? <button type="button" className="auth-link" onClick={() => switchView('signin')}>Sign in</button></>}</div>
          <div className="auth-security-note"><LockKeyhole size={13} /><span>Demo access only. No password is stored or sent.</span></div>
        </section>
      </div>
      <footer className="auth-footer"><span>© 2026 SkillBridge AI</span><span>Frontend portfolio preview · Not a real account service</span></footer>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(readDemoUser);
  const activePage = pathPages[location.pathname] ?? 'dashboard';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedReport, setSelectedReport] = useState<ResumeReport | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => new Set(readStored<string[]>('skillbridge-roadmap-complete', [])));
  const [reports, setReports] = useState<ResumeReport[]>(() => readStored<ResumeReport[]>('skillbridge-reports', []));
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>(() => readStored<SavedJob[]>('skillbridge-saved-jobs', []));
  const [activity, setActivity] = useState<ActivityItem[]>(() => readStored<ActivityItem[]>('skillbridge-activity', []));
  const [notificationPrefs, setNotificationPrefs] = useState(() => readStored('skillbridge-notification-prefs', { analysis: true, jobs: true, roadmap: true }));
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastId = useRef(0);
  const activePageInfo = pageInfo[activePage];

  useEffect(() => {
    const closeSidebarOnDesktop = () => {
      if (window.innerWidth > 700) setMobileOpen(false);
    };
    window.addEventListener('resize', closeSidebarOnDesktop);
    closeSidebarOnDesktop();
    return () => window.removeEventListener('resize', closeSidebarOnDesktop);
  }, []);

  useEffect(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && activeElement.id === 'job-search') activeElement.blur();
  }, [location.pathname]);

  useEffect(() => {
    if (!demoUser && location.pathname !== '/login') {
      navigate('/login', { replace: true });
      return;
    }
    if (demoUser && location.pathname === '/login') {
      navigate(pagePaths.dashboard, { replace: true });
      return;
    }
    if (demoUser && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (demoUser && location.pathname !== '/login' && !pathPages[location.pathname]) {
      navigate('/dashboard', { replace: true });
    }
  }, [demoUser, location.pathname, navigate]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('skillbridge-theme', theme);
    } catch {
      // The selected theme still applies for this session if storage is unavailable.
    }
  }, [theme]);

  useEffect(() => writeStored('skillbridge-reports', reports), [reports]);
  useEffect(() => writeStored('skillbridge-saved-jobs', savedJobs), [savedJobs]);
  useEffect(() => writeStored('skillbridge-roadmap-complete', [...completedSteps]), [completedSteps]);
  useEffect(() => writeStored('skillbridge-activity', activity.slice(0, 30)), [activity]);
  useEffect(() => writeStored('skillbridge-notification-prefs', notificationPrefs), [notificationPrefs]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!selectedJob) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedJob(null); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedJob]);

  useEffect(() => {
    const onSearchShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('job-search')?.focus();
      }
    };
    document.addEventListener('keydown', onSearchShortcut);
    return () => document.removeEventListener('keydown', onSearchShortcut);
  }, []);

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');
  const authenticateDemo = (user: DemoUser, remember: boolean) => {
    setDemoUser(user);
    navigate(pagePaths.dashboard, { replace: true });
    try {
      sessionStorage.removeItem('skillbridge-demo-user');
      localStorage.removeItem('skillbridge-demo-user');
      (remember ? localStorage : sessionStorage).setItem('skillbridge-demo-user', JSON.stringify(user));
    } catch {
      // The demo session can still continue in memory without browser storage.
    }
  };
  const signOutDemo = () => {
    setDemoUser(null);
    setProfileOpen(false);
    navigate('/login', { replace: true });
    try {
      sessionStorage.removeItem('skillbridge-demo-user');
      localStorage.removeItem('skillbridge-demo-user');
    } catch {
      // Nothing else is required when browser storage is unavailable.
    }
  };

  if (!demoUser) return <LoginPage theme={theme} onToggleTheme={toggleTheme} onAuthenticate={authenticateDemo} />;
  const userInitials = demoUser.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const profileSkills = getUserSkills(reports, demoUser.targetSkills ?? []);

  const showToast = (message: string) => {
    toastId.current += 1;
    setToast({ id: toastId.current, text: message });
  };

  const recordActivity = (label: string, detail: string, kind: ActivityItem['kind']) => {
    setActivity((current) => [{ id: crypto.randomUUID(), label, detail, createdAt: new Date().toISOString(), kind }, ...current].slice(0, 30));
  };

  const saveReport = (report: ResumeReport) => {
    setReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
    recordActivity('Resume review completed', `${report.score}/100 · ${report.fileName}`, 'analysis');
  };

  const toggleSavedJob = (job: Job) => {
    const existing = savedJobs.some((item) => item.id === job.id);
    setSavedJobs((current) => existing ? current.filter((item) => item.id !== job.id) : [...current, { id: job.id, saved: true, status: 'Saved' as const }]);
    recordActivity(existing ? 'Sample job removed' : 'Sample job saved', `${job.title} · ${job.company}`, 'job');
    if (notificationPrefs.jobs) showToast(existing ? 'Sample job removed from saved roles.' : 'Sample job saved locally.');
  };

  const updateJobStatus = (jobId: string, status: SavedJob['status']) => {
    setSavedJobs((current) => current.map((item) => item.id === jobId ? { ...item, saved: true, status } : item));
    const job = jobs.find((item) => item.id === jobId);
    if (job) recordActivity('Sample job status updated', `${job.title} · ${status}`, 'job');
    if (notificationPrefs.jobs) showToast(`Local sample listing status: ${status}.`);
  };

  const toggleStep = (id: string) => {
    setCompletedSteps((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    const step = [...roadmap, ...(demoUser.careerGoal ? createGoalRoadmap(demoUser.careerGoal, reports[0]?.missingKeywords ?? []) : [])].find((item) => item.id === id);
    if (step && notificationPrefs.roadmap) showToast(`${completedSteps.has(id) ? 'Reopened' : 'Completed'} sample step: ${step.title}`);
    if (step) recordActivity(completedSteps.has(id) ? 'Learning goal reopened' : 'Learning goal completed', step.title, 'roadmap');
  };

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(pagePaths.matcher);
    setProfileOpen(false);
  };

  const navigateToPage = (page: PageId) => {
    if (page !== activePage) navigate(pagePaths[page]);
    setProfileOpen(false);
  };

  const updateDemoProfile = (updates: Partial<DemoUser>) => {
    setDemoUser((current) => {
      if (!current) return current;
      const next = { ...current, ...updates };
      try {
        const target = localStorage.getItem('skillbridge-demo-user') !== null ? localStorage : sessionStorage;
        target.setItem('skillbridge-demo-user', JSON.stringify(next));
      } catch {
        // Keep the in-memory profile usable when browser storage is unavailable.
      }
      return next;
    });
    showToast('Demo profile updated in this browser.');
  };

  const clearDemoData = () => {
    if (!window.confirm('Clear saved reports, jobs, activity, and learning progress from this browser? Your demo profile and theme will remain.')) return;
    setReports([]);
    setSavedJobs([]);
    setActivity([]);
    setCompletedSteps(new Set());
    setQuery('');
    setDemoUser((current) => {
      if (!current) return current;
      const next = { ...current, careerGoal: '', preferredRole: '', targetSkills: [] };
      try {
        (localStorage.getItem('skillbridge-demo-user') !== null ? localStorage : sessionStorage).setItem('skillbridge-demo-user', JSON.stringify(next));
      } catch {
        // Keep the demo profile usable in memory if browser storage is unavailable.
      }
      return next;
    });
    showToast('Saved demo workspace data was cleared.');
  };

  const goBack = () => {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) navigate(-1);
    else navigate(pagePaths.dashboard);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage query={query} onNavigate={navigateToPage} onJobDetails={setSelectedJob} completed={completedSteps} onToggleStep={toggleStep} onToast={showToast} reports={reports} savedCount={savedJobs.filter((job) => job.saved).length} activity={activity} savedJobs={savedJobs} onToggleSave={toggleSavedJob} onStatusChange={updateJobStatus} careerGoal={demoUser.preferredRole ?? demoUser.careerGoal ?? ''} profileName={demoUser.name} targetSkills={demoUser.targetSkills ?? []} />;
      case 'analyzer':
        return <AnalyzerPage onToast={(message) => { if (notificationPrefs.analysis) showToast(message); }} onComplete={saveReport} />;
      case 'matcher':
        return <MatcherPage query={query} onJobDetails={setSelectedJob} savedJobs={savedJobs} onToggleSave={toggleSavedJob} onStatusChange={updateJobStatus} resumeSkills={profileSkills} />;
      case 'roadmap':
        return <RoadmapPage completed={completedSteps} onToggleStep={toggleStep} careerGoal={demoUser.preferredRole ?? demoUser.careerGoal ?? ''} onSelectGoal={(careerGoal) => updateDemoProfile({ careerGoal, preferredRole: careerGoal })} missingSkills={reports[0]?.missingKeywords ?? []} />;
      case 'history':
        return <HistoryPage reports={reports} onView={setSelectedReport} onDelete={(report) => { if (window.confirm(`Delete the local report for ${report.fileName}?`)) { setReports((current) => current.filter((item) => item.id !== report.id)); showToast('Local report deleted.'); } }} />;
      case 'settings':
        return <SettingsPage compactMode={compactMode} onToggleCompact={() => setCompactMode((value) => !value)} theme={theme} onToggleTheme={toggleTheme} profile={demoUser} onSaveProfile={updateDemoProfile} notificationPrefs={notificationPrefs} onNotificationChange={(key, value) => setNotificationPrefs((current) => ({ ...current, [key]: value }))} onClearData={clearDemoData} />;
      default:
        return <DashboardPage query={query} onNavigate={navigateToPage} onJobDetails={setSelectedJob} completed={completedSteps} onToggleStep={toggleStep} onToast={showToast} reports={reports} savedCount={savedJobs.filter((job) => job.saved).length} activity={activity} savedJobs={savedJobs} onToggleSave={toggleSavedJob} onStatusChange={updateJobStatus} careerGoal={demoUser.preferredRole ?? demoUser.careerGoal ?? ''} profileName={demoUser.name} targetSkills={demoUser.targetSkills ?? []} />;
    }
  };

  return (
    <div className={`app-shell${compactMode ? ' compact-mode' : ''}`}>
      <Sidebar activePage={activePage} onNavigate={navigateToPage} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} userName={demoUser.name} userInitials={userInitials} />
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-heading">
            <button className="icon-button mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <button className="icon-button back-button" type="button" aria-label="Go back" title="Go back" onClick={goBack}><ArrowLeft size={18} /></button>
            <div className="topbar-title-block"><div className="page-crumbs"><button className="breadcrumb-home" type="button" onClick={() => navigateToPage('dashboard')}>Dashboard</button>{activePage !== 'dashboard' && <><span aria-hidden="true">/</span><span aria-current="page">{pageInfo[activePage].title}</span></>}</div><h1>{activePageInfo.title}</h1><p>{activePageInfo.subtitle}</p></div>
          </div>
          <div className="topbar-actions">
            <form className="search-form" role="search" onSubmit={onSearchSubmit}>
              <Search size={17} aria-hidden="true" />
              <label className="visually-hidden" htmlFor="job-search">Search demo jobs and skills</label>
              <input id="job-search" type="search" placeholder="Search roles, skills..." value={query} onChange={(event) => setQuery(event.target.value)} />
              <kbd>⌘ K</kbd>
            </form>
            <button className="icon-button notification-button" type="button" aria-label="Notifications" title="Notifications" onClick={() => showToast('You’re all caught up. No unread notifications.')}><Bell size={18} /></button>
            <button className="icon-button home-button" type="button" aria-label="Go to dashboard" title="Dashboard" onClick={() => navigateToPage('dashboard')}><LayoutDashboard size={17} /></button>
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
            <div className="profile-menu-wrap">
              <button className="profile-button" type="button" aria-label="Open demo profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
                <span className="avatar">{userInitials}</span><span className="profile-name">{demoUser.name}</span><ChevronDown size={15} />
              </button>
              {profileOpen && <div className="profile-popover"><div className="popover-head"><span className="avatar">{userInitials}</span><div><strong>{demoUser.name}</strong><span>Demo profile · {demoUser.email}</span></div></div><div className="popover-divider" /><button type="button" onClick={() => navigateToPage('settings')}>Workspace settings <ArrowUpRight size={14} /></button><button type="button" onClick={signOutDemo}>Sign out <LogIn size={14} /></button><p>Demo profile only. No account service is connected.</p></div>}
            </div>
          </div>
        </header>

        <main className="main-content" id="main-content" tabIndex={-1}>
          <div key={activePage} className="page-transition">{renderPage()}</div>
          <footer className="app-footer"><span><span className="footer-mark"><Sparkles size={13} /></span>SkillBridge AI <span className="footer-separator">·</span> Frontend preview</span><span>Built for your next step <ArrowUpRight size={13} /></span></footer>
        </main>
      </div>

      {selectedJob && <JobDialog job={selectedJob} onClose={() => setSelectedJob(null)} savedJob={savedJobs.find((item) => item.id === selectedJob.id)} onToggleSave={toggleSavedJob} onStatusChange={updateJobStatus} resumeSkills={profileSkills} />}
      {selectedReport && <ReportDialog report={selectedReport} onClose={() => setSelectedReport(null)} />}
      {toast && <div className="toast" key={toast.id} role="status" aria-live="polite"><CheckCircle2 size={17} /><span>{toast.text}</span><button type="button" aria-label="Dismiss message" onClick={() => setToast(null)}><X size={16} /></button></div>}
    </div>
  );
}
export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  match: number;
  skills: string[];
  color: 'blue' | 'green' | 'orange';
  summary: string;
  category: string;
  experience: 'Entry' | 'Mid' | 'Senior';
  source: 'Sample listing';
};

export function getJobSkillMatch(job: Job, userSkills: string[]): { percentage: number; matching: string[]; missing: string[] } {
  const normalizedSkills = new Set(userSkills.map((skill) => skill.toLowerCase().trim()));
  const matching = job.skills.filter((skill) => normalizedSkills.has(skill.toLowerCase()));
  return {
    percentage: job.skills.length ? Math.round((matching.length / job.skills.length) * 100) : 0,
    matching,
    missing: job.skills.filter((skill) => !matching.includes(skill)),
  };
}

export const jobs: Job[] = [
  {
    id: 'northstar-frontend',
    title: 'Frontend Developer',
    company: 'Northstar Studio',
    location: 'Remote',
    type: 'Full-time',
    match: 92,
    skills: ['HTML', 'CSS', 'JavaScript', 'React'],
    color: 'blue',
    summary: 'Build thoughtful, accessible interfaces for products used by growing teams. Partner with product and design, contribute reusable UI patterns, and improve responsive experiences.',
    category: 'Engineering',
    experience: 'Entry',
    source: 'Sample listing',
  },
  {
    id: 'fieldnote-python',
    title: 'Python Developer',
    company: 'Fieldnote Labs',
    location: 'Hybrid',
    type: 'Full-time',
    match: 78,
    skills: ['Python', 'SQL', 'APIs', 'Git'],
    color: 'green',
    summary: 'Help shape reliable data tools and useful services for modern businesses. Work with analysts to build tested Python services and SQL-backed reporting workflows.',
    category: 'Engineering',
    experience: 'Mid',
    source: 'Sample listing',
  },
  {
    id: 'commonground-fullstack',
    title: 'Full Stack Developer',
    company: 'Common Ground',
    location: 'New York, NY',
    type: 'Contract',
    match: 71,
    skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
    color: 'orange',
    summary: 'Work across the stack to bring a collaborative community platform to life. Build product features with React, Node.js, and SQL alongside a small cross-functional team.',
    category: 'Engineering',
    experience: 'Mid',
    source: 'Sample listing',
  },
  {
    id: 'northstar-product-design',
    title: 'Product Designer',
    company: 'Northstar Studio',
    location: 'Remote',
    type: 'Full-time',
    match: 64,
    skills: ['Figma', 'Accessibility', 'Communication', 'Research'],
    color: 'blue',
    summary: 'Shape usable workflows through research, prototyping, and close collaboration. Create clear Figma concepts and test them with users while advocating for accessibility.',
    category: 'Design',
    experience: 'Entry',
    source: 'Sample listing',
  },
  {
    id: 'fieldnote-data-analyst',
    title: 'Data Analyst',
    company: 'Fieldnote Labs',
    location: 'Hybrid · Boston',
    type: 'Full-time',
    match: 69,
    skills: ['SQL', 'Python', 'Excel', 'Data Analysis'],
    color: 'green',
    summary: 'Turn operational data into clear reports and practical recommendations. Query trusted datasets, check data quality, and communicate findings with spreadsheets and dashboards.',
    category: 'Data',
    experience: 'Entry',
    source: 'Sample listing',
  },
  {
    id: 'commonground-engineering-lead',
    title: 'Engineering Lead',
    company: 'Common Ground',
    location: 'On-site · New York, NY',
    type: 'Full-time',
    match: 58,
    skills: ['Leadership', 'TypeScript', 'React', 'Project Management'],
    color: 'orange',
    summary: 'Support a small product team with technical direction and thoughtful delivery. Coach engineers, guide TypeScript architecture, and coordinate reliable project execution.',
    category: 'Engineering',
    experience: 'Senior',
    source: 'Sample listing',
  },
];

export const skills = [
  { name: 'HTML', level: 'Advanced', progress: 88, tone: 'blue' },
  { name: 'CSS', level: 'Proficient', progress: 76, tone: 'violet' },
  { name: 'JavaScript', level: 'Learning', progress: 58, tone: 'amber' },
  { name: 'Python', level: 'Learning', progress: 42, tone: 'green' },
  { name: 'SQL', level: 'Getting started', progress: 28, tone: 'rose' },
] as const;

export const roadmap = [
  { id: 'html-foundations', stage: 'Beginner', title: 'HTML foundations', detail: 'Build semantic pages with accessible structure and forms.', duration: 'Week 1', resource: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content' },
  { id: 'css-layout', stage: 'Beginner', title: 'CSS and responsive layout', detail: 'Practice the box model, Flexbox, Grid, and mobile-first styling.', duration: 'Week 2', resource: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics' },
  { id: 'javascript-core', stage: 'Intermediate', title: 'JavaScript essentials', detail: 'Work with functions, arrays, events, modules, and async data.', duration: 'Weeks 3-4', resource: 'https://javascript.info/' },
  { id: 'react-apps', stage: 'Intermediate', title: 'React projects', detail: 'Create components, manage state, and build a small routed app.', duration: 'Weeks 5-6', resource: 'https://react.dev/learn' },
  { id: 'git-github', stage: 'Intermediate', title: 'Git and GitHub workflow', detail: 'Practice commits, branches, pull requests, and clear project READMEs.', duration: 'Week 7', resource: 'https://docs.github.com/en/get-started/quickstart' },
  { id: 'interview-prep', stage: 'Advanced', title: 'Portfolio and interview preparation', detail: 'Polish one project, explain tradeoffs, and rehearse role-focused examples.', duration: 'Week 8', resource: 'https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Learning_content' },
];
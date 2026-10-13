/// <reference types="vite/client" />
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export type ResumeReport = {
  id: string;
  createdAt: string;
  fileName: string;
  score: number;
  scoreLabel: string;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  education: string[];
  experience: string[];
  missingKeywords: string[];
  sectionChecks: { label: string; present: boolean }[];
  targetRole: string;
  isSample?: boolean;
};

export type AnalysisInput = {
  text: string;
  fileName: string;
  targetDescription: string;
};

const skillTerms = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML', 'CSS', 'Python', 'SQL', 'Java', 'C++',
  'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'REST API', 'GraphQL', 'Figma', 'Agile', 'Scrum',
  'Excel', 'Power BI', 'Tableau', 'Machine Learning', 'Data Analysis', 'Communication', 'Leadership',
  'Project Management', 'Problem Solving', 'Customer Service', 'Accessibility', 'Testing', 'CI/CD',
];

const sectionPatterns: [string, RegExp][] = [
  ['Contact details', /\b(email|phone|linkedin|github|portfolio|@)\b/i],
  ['Professional summary', /\b(summary|profile|objective|about me)\b/i],
  ['Work experience', /\b(experience|employment|work history|professional history)\b/i],
  ['Education', /\b(education|university|college|bachelor|master|degree)\b/i],
  ['Skills', /\b(skills|technical skills|core competencies|competencies)\b/i],
];

export const demoResumeText = `Alex Morgan
alex.morgan@example.com | 555-0142 | linkedin.com/in/alexmorgan | github.com/alexmorgan

Professional Summary
Early-career frontend developer building accessible, responsive web products with React and TypeScript. Enjoys collaborating with design and product teams to turn user needs into clear experiences.

Skills
HTML, CSS, JavaScript, TypeScript, React, Git, GitHub, REST API, Accessibility, Testing, Communication, Agile

Work Experience
Frontend Developer Intern | Northstar Studio | Jan 2025 - Aug 2025
- Built reusable React and TypeScript interface components for a student planning product.
- Improved mobile task completion by 24% after refining responsive forms with the design team.
- Wrote component tests and documented shared patterns for a five-person product team.

Web Development Volunteer | Community Learning Lab | Sep 2024 - Dec 2024
- Created accessible event pages that helped more than 300 local learners find workshops.
- Coordinated weekly feedback sessions and shipped updates with Git and GitHub.

Education
Bachelor of Science in Information Technology | Lakeside University | 2025
Relevant study: Web Development, Human-Computer Interaction, Data Structures`;

function normalizeText(text: string) {
  return text.replace(/\u0000/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export async function extractResumeText(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();
  const isPdf = lowerName.endsWith('.pdf') && (!file.type || file.type === 'application/pdf');
  const isDocx = lowerName.endsWith('.docx') && (!file.type || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  if (!isPdf && !isDocx) throw new Error('Choose a PDF or DOCX file. Older .doc files are not supported.');
  if (file.size > 10 * 1024 * 1024) throw new Error('This file is larger than 10 MB. Choose a smaller resume.');
  if (file.size === 0) throw new Error('This file is empty. Choose a valid resume file.');

  let text = '';
  if (isPdf) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    }
    text = pages.join('\n');
    if (!normalizeText(text)) throw new Error('No selectable text was found. This PDF may be scanned; OCR is not available in this demo. Paste the text or use a text-based PDF.');
  } else {
      const { strFromU8, unzipSync } = await import('fflate');
    let archive: ReturnType<typeof unzipSync>;
    try {
      archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
    } catch {
      throw new Error('This DOCX is invalid or damaged. Try exporting it again from your document editor.');
    }
      const documentXml = archive['word/document.xml'];
      if (!documentXml) throw new Error('This DOCX does not contain a readable document. Try exporting it again from your document editor.');
      const parsed = new DOMParser().parseFromString(strFromU8(documentXml), 'application/xml');
      if (parsed.querySelector('parsererror')) throw new Error('This DOCX contains invalid document markup. Try exporting it again from your document editor.');
      const paragraphs = [...parsed.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p')];
      text = paragraphs.map((paragraph) => paragraph.textContent ?? '').join('\n');
  }
  const normalized = normalizeText(text);
  if (normalized.length < 80) throw new Error('The document contains too little readable text to analyze. Check the file or paste your resume text.');
  return normalized;
}

export function analyzeResume({ text, fileName, targetDescription }: AnalysisInput): ResumeReport {
  const normalized = normalizeText(text);
  const lowerText = normalized.toLowerCase();
  const foundSkills = skillTerms.filter((skill) => lowerText.includes(skill.toLowerCase()));
  const sectionChecks = sectionPatterns.map(([label, pattern]) => ({ label, present: pattern.test(normalized) }));
  const quantified = /\b\d+\s?%|\$\s?\d|\b\d+\+?\s?(users|customers|projects|clients|hours|people|teams|reports)\b/i.test(normalized);
  const actionVerbCount = (normalized.match(/\b(led|built|developed|improved|created|managed|delivered|designed|launched|reduced|increased|automated|implemented|analyzed)\b/gi) ?? []).length;
  const sectionPoints = sectionChecks.filter((section) => section.present).length * 10;
  const skillPoints = Math.min(20, foundSkills.length * 2);
  const impactPoints = (quantified ? 10 : 0) + Math.min(10, actionVerbCount * 2);
  const lengthPoints = normalized.length >= 1200 && normalized.length <= 9000 ? 10 : normalized.length >= 500 ? 6 : 2;
  const score = Math.min(100, Math.max(0, sectionPoints + skillPoints + impactPoints + lengthPoints));
  const targetTerms = targetDescription.match(/[A-Za-z][A-Za-z0-9+#.-]{2,}/g) ?? [];
  const ignored = new Set(['the', 'and', 'for', 'with', 'you', 'our', 'are', 'will', 'this', 'that', 'from', 'have', 'has', 'your', 'role', 'work', 'team', 'years', 'ability', 'experience', 'skills', 'looking', 'required', 'preferred', 'using', 'who', 'what', 'not', 'all', 'can', 'into', 'across', 'about', 'more', 'than', 'their', 'they', 'them', 'while', 'including', 'such', 'other', 'strong', 'excellent', 'good']);
  const keywords = [...new Set(targetTerms.map((term) => term.toLowerCase()).filter((term) => !ignored.has(term) && term.length > 2))].slice(0, 40);
  const missingKeywords = keywords.filter((term) => !lowerText.includes(term)).slice(0, 12);
  const suggestions: string[] = [];
  if (!sectionChecks[0].present) suggestions.push('Add clear contact details and links to relevant work.');
  if (!sectionChecks[1].present) suggestions.push('Add a short professional summary tailored to your target role.');
  if (!sectionChecks[2].present) suggestions.push('Add a dedicated experience section with role titles and dates.');
  if (!sectionChecks[3].present) suggestions.push('Include your education, qualification, or relevant training.');
  if (!sectionChecks[4].present) suggestions.push('List relevant technical and transferable skills in a scannable section.');
  if (!quantified) suggestions.push('Add measurable outcomes where accurate, such as time saved or users supported.');
  if (actionVerbCount < 3) suggestions.push('Start experience bullets with specific action verbs and describe your contribution.');
  if (targetDescription && missingKeywords.length) suggestions.push(`If accurate for your background, consider addressing these target keywords: ${missingKeywords.slice(0, 5).join(', ')}.`);
  const strengths: string[] = [];
  if (foundSkills.length) strengths.push(`${foundSkills.length} recognizable skill${foundSkills.length === 1 ? '' : 's'} found: ${foundSkills.slice(0, 6).join(', ')}.`);
  if (quantified) strengths.push('At least one measurable result appears in the resume text.');
  if (actionVerbCount >= 3) strengths.push('Several experience statements use clear action verbs.');
  if (sectionChecks.filter((section) => section.present).length >= 4) strengths.push('Most standard resume sections are represented.');
  if (!strengths.length) strengths.push('Resume text was extracted and is ready for a more complete review.');
  const experience = normalized.split('\n').map((line) => line.trim()).filter((line) => /\b(intern|developer|engineer|designer|analyst|manager|volunteer|specialist|assistant|lead)\b/i.test(line) && line.length < 150).slice(0, 6);
  const education = normalized.split('\n').map((line) => line.trim()).filter((line) => /\b(bachelor|master|associate|diploma|university|college|degree|certification)\b/i.test(line) && line.length < 180).slice(0, 5);
  const weaknesses = suggestions.slice(0, 5);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    fileName,
    score,
    scoreLabel: score >= 75 ? 'Strong structure' : score >= 50 ? 'Room to strengthen' : 'Needs more detail',
    skills: foundSkills,
    strengths,
    weaknesses,
    suggestions,
    education,
    experience,
    missingKeywords,
    sectionChecks,
    targetRole: targetDescription.trim() ? targetDescription.trim().slice(0, 90) : '',
  };
}

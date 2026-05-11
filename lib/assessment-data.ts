import type { AssessmentQuestion } from './types'

export const INDUSTRIES = [
  'Finance / Banking',
  'Healthcare / Insurance',
  'Manufacturing / Logistics',
  'Retail / E-commerce',
  'SaaS / Technology',
  'Other',
]

export const EMPLOYEE_RANGES = [
  '1-50',
  '51-500',
  '501-5000',
  '5000+',
]

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Process dimension
  {
    id: 'q1',
    category: 'process',
    question: 'How many repetitive, rule-based tasks does your team handle manually each week?',
    options: [
      { label: 'Very few', value: 1 },
      { label: 'Some', value: 2 },
      { label: 'Many', value: 3 },
      { label: 'The majority', value: 4 },
    ],
  },
  {
    id: 'q2',
    category: 'process',
    question: 'How well documented are your current business processes?',
    options: [
      { label: 'Mostly undocumented', value: 1 },
      { label: 'Some documentation', value: 2 },
      { label: 'Most processes documented', value: 3 },
      { label: 'Fully mapped', value: 4 },
    ],
  },
  {
    id: 'q3',
    category: 'process',
    question: 'How much manual data movement happens between systems?',
    options: [
      { label: 'Almost none', value: 1 },
      { label: 'Occasional', value: 2 },
      { label: 'Frequent', value: 3 },
      { label: 'Constant', value: 4 },
    ],
  },
  // Tech dimension
  {
    id: 'q4',
    category: 'tech',
    question: 'What core systems does your company mainly use?',
    options: [
      { label: 'Spreadsheets & email', value: 1 },
      { label: 'Mix of SaaS + legacy', value: 2 },
      { label: 'ERP/CRM (SAP, Salesforce)', value: 3 },
      { label: 'Microsoft 365 / Azure', value: 4 },
    ],
  },
  {
    id: 'q5',
    category: 'tech',
    question: 'Do your key systems have APIs or stable web interfaces?',
    options: [
      { label: 'Mostly legacy', value: 1 },
      { label: 'Some have APIs', value: 2 },
      { label: 'Most have APIs', value: 3 },
      { label: 'Full API coverage', value: 4 },
    ],
  },
  {
    id: 'q6',
    category: 'tech',
    question: "What is your company's cloud adoption level?",
    options: [
      { label: 'Mostly on-premise', value: 1 },
      { label: 'Partial cloud', value: 2 },
      { label: 'Mostly cloud', value: 3 },
      { label: 'Cloud-first', value: 4 },
    ],
  },
  // Org dimension
  {
    id: 'q7',
    category: 'org',
    question: 'Is there executive support for automation?',
    options: [
      { label: 'No real support', value: 1 },
      { label: 'Interested but no budget', value: 2 },
      { label: 'Budget discussions', value: 3 },
      { label: 'Strong C-level support', value: 4 },
    ],
  },
  {
    id: 'q8',
    category: 'org',
    question: 'Do you have IT staff capable of supporting automation?',
    options: [
      { label: 'No dedicated IT', value: 1 },
      { label: 'Small generalist team', value: 2 },
      { label: 'Some automation experience', value: 3 },
      { label: 'Dedicated automation team', value: 4 },
    ],
  },
  {
    id: 'q9',
    category: 'org',
    question: 'How does your organisation respond to new technology?',
    options: [
      { label: 'Resistant', value: 1 },
      { label: 'Cautious', value: 2 },
      { label: 'Open with ROI', value: 3 },
      { label: 'Agile & fast', value: 4 },
    ],
  },
  // ROI dimension
  {
    id: 'q10',
    category: 'roi',
    question: 'How many employees spend significant time on repetitive tasks?',
    options: [
      { label: 'Fewer than 5', value: 1 },
      { label: '5-20', value: 2 },
      { label: '20-100', value: 3 },
      { label: 'More than 100', value: 4 },
    ],
  },
  {
    id: 'q11',
    category: 'roi',
    question: 'Primary motivation for considering RPA?',
    options: [
      { label: 'Just exploring', value: 1 },
      { label: 'Cut costs', value: 3 },
      { label: 'Reduce errors / compliance', value: 3 },
      { label: 'Scale without hiring', value: 4 },
    ],
  },
  {
    id: 'q12',
    category: 'roi',
    question: 'What is your industry?',
    options: [
      { label: 'Retail / E-commerce', value: 2 },
      { label: 'Manufacturing / Logistics', value: 4 },
      { label: 'Finance / Healthcare / Insurance', value: 4 },
      { label: 'SaaS / Technology', value: 3 },
    ],
  },
  // Size dimension
  {
    id: 'q13',
    category: 'size',
    question: 'How many employees does your company have?',
    options: [
      { label: '1-50 (Small)', value: 2 },
      { label: '51-500 (Mid-size)', value: 4 },
      { label: '501-5000 (Large)', value: 5 },
      { label: '5000+ (Enterprise)', value: 6 },
    ],
  },
  // More tech
  {
    id: 'q14',
    category: 'tech',
    question: 'Approximately how many different business applications do you use?',
    options: [
      { label: '1-5', value: 2 },
      { label: '6-15', value: 4 },
      { label: '16-30', value: 5 },
      { label: '30+', value: 6 },
    ],
  },
  // More org
  {
    id: 'q15',
    category: 'org',
    question: 'Have you already tried any automation tools?',
    options: [
      { label: 'Never tried', value: 1 },
      { label: 'Simple tools (Zapier)', value: 3 },
      { label: 'Used RPA before', value: 5 },
      { label: 'Have live bots', value: 7 },
    ],
  },
  // More ROI
  {
    id: 'q16',
    category: 'roi',
    question: 'What is your expected timeline for RPA implementation?',
    options: [
      { label: 'No timeline yet', value: 1 },
      { label: '3-6 months', value: 4 },
      { label: '1-3 months', value: 6 },
      { label: 'ASAP (next 4 weeks)', value: 8 },
    ],
  },
]

export const DIMENSION_NAMES: Record<string, string> = {
  process: 'Process Fit',
  tech: 'Tech Stack',
  org: 'Org Readiness',
  roi: 'ROI Potential',
  size: 'Scale Factor',
}

export const ADVICE_MAP: Record<string, string> = {
  high: "You're well-positioned to start immediately. A Ukrainian RPA team can have your first bots live within 4-6 weeks.",
  good: "Strong foundations in place. A few quick wins in process documentation will unlock your full potential.",
  early: "Good starting point. Focus on your top 3 repetitive processes - that's where the biggest ROI lives.",
  explore: "Every automation journey starts somewhere. Our experts can help you identify the right first step.",
}

export const TESTIMONIALS = [
  {
    quote: "We went from processing 75 invoices a day to over 500. The Ukrainian team had bots live in 6 weeks. I didn't think it was possible at that speed.",
    author: "Michael R.",
    role: "CFO",
    company: "Insurance Company, Germany",
    initials: "MR",
  },
  {
    quote: "The assessment took 3 minutes but gave us a roadmap. We identified 12 automatable processes immediately. ROI was clear before we even started.",
    author: "Sarah L.",
    role: "Head of Operations",
    company: "SaaS, UK",
    initials: "SL",
  },
  {
    quote: "Hiring a local RPA team would have cost 3x more. The Ukrainian experts were just as skilled, communicated perfectly, and delivered ahead of schedule.",
    author: "Jan K.",
    role: "CTO",
    company: "Logistics Group, Netherlands",
    initials: "JK",
  },
  {
    quote: "Our finance team spent 60% of their week on data entry. Now bots handle it overnight. We scaled revenue without adding a single headcount.",
    author: "Anna P.",
    role: "Finance Director",
    company: "Manufacturing, Poland",
    initials: "AP",
  },
  {
    quote: "I was skeptical about outsourcing automation. The readiness score showed exactly where we stood and the matched team fit our tech stack perfectly.",
    author: "David M.",
    role: "IT Manager",
    company: "Healthcare, USA",
    initials: "DM",
  },
  {
    quote: "Error rate on order processing dropped from 8% to near zero. Compliance audits are now automated. This changed how we operate fundamentally.",
    author: "Olga B.",
    role: "COO",
    company: "E-commerce Platform, UAE",
    initials: "OB",
  },
]

export const CASE_STUDIES = [
  {
    industry: "Finance & Banking",
    title: "Invoice Processing Automation for a European Bank",
    challenge: "A mid-size bank was processing 400+ vendor invoices monthly - manually, across 3 systems. Errors caused payment delays and compliance risk.",
    metrics: [
      { value: "86%", label: "Time saved per invoice" },
      { value: "0", label: "Manual errors post-deploy" },
      { value: "5 wk", label: "Time to live bots" },
      { value: "4.2x", label: "ROI in year one" },
    ],
  },
  {
    industry: "Manufacturing & Logistics",
    title: "Supply Chain Sync Across 6 ERP Systems",
    challenge: "A logistics group had staff manually reconciling inventory data between SAP, Oracle, and 4 legacy systems - 3 hours per site, every day.",
    metrics: [
      { value: "97%", label: "Reduction in manual effort" },
      { value: "24/7", label: "Bot uptime" },
      { value: "€480k", label: "Annual savings" },
      { value: "8 wk", label: "Full deployment" },
    ],
  },
  {
    industry: "Healthcare & Insurance",
    title: "Claims Processing Bot for US Insurance Provider",
    challenge: "Claims team processed 75 cases/day manually. Backlogs hit 3 weeks during peak periods. Patient satisfaction was declining due to delays.",
    metrics: [
      { value: "500+", label: "Claims processed daily" },
      { value: "99.6%", label: "Accuracy rate" },
      { value: "3 days", label: "Backlog cleared" },
      { value: "6x", label: "Throughput increase" },
    ],
  },
]

export const STATS = [
  { value: "70%", label: "Average reduction in manual work" },
  { value: "4-8x", label: "Faster process completion" },
  { value: "6 mo", label: "Average ROI payback period" },
  { value: "200+", label: "Companies assessed globally" },
]

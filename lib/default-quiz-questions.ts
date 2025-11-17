export interface QuizOption {
  text: string
  value: number
}

export interface QuizQuestion {
  id: string
  text: string
  type: 'multiple-choice' | 'text'
  options?: QuizOption[]
}

export const DEFAULT_AI_READINESS_QUESTIONS: QuizQuestion[] = [
  {
    id: '1',
    text: 'How much of your team\'s time is spent on repetitive manual tasks?',
    type: 'multiple-choice',
    options: [
      { text: '0–25%', value: 10 },
      { text: '25–50%', value: 7 },
      { text: '50–75%', value: 4 },
      { text: '75%+', value: 1 },
    ],
  },
  {
    id: '2',
    text: 'Do you currently use a CRM or customer database?',
    type: 'multiple-choice',
    options: [
      { text: 'Yes, fully integrated', value: 10 },
      { text: 'Yes, but limited', value: 6 },
      { text: 'No', value: 2 },
      { text: 'Unsure', value: 0 },
    ],
  },
  {
    id: '3',
    text: 'How much data do you have sitting in your systems?',
    type: 'multiple-choice',
    options: [
      { text: '10k+ records', value: 10 },
      { text: '1–10k records', value: 7 },
      { text: '<1k records', value: 4 },
      { text: 'Very little', value: 1 },
    ],
  },
  {
    id: '4',
    text: 'Which best describes your current AI usage?',
    type: 'multiple-choice',
    options: [
      { text: 'Advanced - using multiple AI tools', value: 10 },
      { text: 'Some tools adopted', value: 7 },
      { text: 'Experimenting', value: 4 },
      { text: 'None', value: 0 },
    ],
  },
  {
    id: '5',
    text: 'How confident are you that your team knows where AI could save time or costs?',
    type: 'multiple-choice',
    options: [
      { text: 'Very confident', value: 10 },
      { text: 'Somewhat confident', value: 6 },
      { text: 'Not confident', value: 3 },
      { text: 'No idea', value: 0 },
    ],
  },
  {
    id: '6',
    text: 'Do you use AI for customer communication (chatbots, automated replies, etc.)?',
    type: 'multiple-choice',
    options: [
      { text: 'Yes and it works well', value: 10 },
      { text: 'Yes but basic', value: 6 },
      { text: 'Not yet', value: 2 },
      { text: 'No', value: 0 },
    ],
  },
  {
    id: '7',
    text: 'How effective is your lead reactivation process?',
    type: 'multiple-choice',
    options: [
      { text: 'Very effective', value: 10 },
      { text: 'Somewhat effective', value: 6 },
      { text: 'Weak', value: 3 },
      { text: 'None', value: 0 },
    ],
  },
  {
    id: '8',
    text: 'Which area of your business could AI help most?',
    type: 'multiple-choice',
    options: [
      { text: 'Marketing', value: 10 },
      { text: 'Sales', value: 8 },
      { text: 'Operations', value: 6 },
      { text: 'Customer Service', value: 5 },
    ],
  },
  {
    id: '9',
    text: 'What\'s your biggest concern about adopting AI?',
    type: 'multiple-choice',
    options: [
      { text: 'Unsure where to start', value: 10 },
      { text: 'Complexity', value: 7 },
      { text: 'Cost', value: 5 },
      { text: 'Data security', value: 3 },
    ],
  },
  {
    id: '10',
    text: 'If you could automate one task tomorrow, what would it be?',
    type: 'multiple-choice',
    options: [
      { text: 'Lead follow-up', value: 10 },
      { text: 'Customer service', value: 8 },
      { text: 'Admin/operations', value: 6 },
      { text: 'Other', value: 5 },
    ],
  },
]

export const SCORING_MESSAGES = {
  high: {
    range: [80, 100],
    title: 'High AI Readiness',
    message: 'You\'re ahead of the curve — your systems and mindset are primed for AI.',
  },
  medium: {
    range: [40, 79],
    title: 'Medium AI Readiness',
    message: 'You\'re experimenting but missing efficiency gains. We\'ll show you where to focus.',
  },
  low: {
    range: [0, 39],
    title: 'Low AI Readiness',
    message: 'You\'re missing out on AI\'s advantages. The audit will show where to start for maximum impact.',
  },
}

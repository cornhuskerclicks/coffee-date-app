export interface AuditQuestion {
  id: string
  category: string
  question: string
  type: 'text' | 'textarea'
}

export const AI_AUDIT_QUESTIONS: AuditQuestion[] = [
  // Business Overview
  {
    id: 'business_name',
    category: 'Business Overview',
    question: 'What is your business name?',
    type: 'text',
  },
  {
    id: 'website_url',
    category: 'Business Overview',
    question: "What's your website URL?",
    type: 'text',
  },
  {
    id: 'business_description',
    category: 'Business Overview',
    question: 'Briefly describe what your business does and who your main customers are.',
    type: 'textarea',
  },
  {
    id: 'business_goals',
    category: 'Business Overview',
    question: 'What are your main business goals over the next 12 months? (e.g., growth, efficiency, scaling, cost reduction)',
    type: 'textarea',
  },
  {
    id: 'current_tools',
    category: 'Business Overview',
    question: 'What software, apps, or tools are currently essential to running your business? (e.g., Salesforce, HubSpot, Airtable)',
    type: 'textarea',
  },

  // Marketing & Lead Generation
  {
    id: 'lead_generation',
    category: 'Marketing & Lead Generation',
    question: 'How do you currently generate leads? (e.g., Google Ads, SEO, referrals, cold outreach, events)',
    type: 'textarea',
  },
  {
    id: 'lead_capture',
    category: 'Marketing & Lead Generation',
    question: 'Do you have a consistent way of capturing leads (forms, CRM, chatbots)?',
    type: 'textarea',
  },
  {
    id: 'lead_followup',
    category: 'Marketing & Lead Generation',
    question: 'How are leads followed up with once they come in?',
    type: 'textarea',
  },
  {
    id: 'old_leads',
    category: 'Marketing & Lead Generation',
    question: "Are there old leads sitting in your database that haven't been contacted recently?",
    type: 'textarea',
  },
  {
    id: 'marketing_spend',
    category: 'Marketing & Lead Generation',
    question: 'How much time or money do you currently spend each month on marketing and lead generation?',
    type: 'textarea',
  },

  // Sales & Customer Journey
  {
    id: 'sales_process',
    category: 'Sales & Customer Journey',
    question: 'Describe your sales process from first contact to closed deal.',
    type: 'textarea',
  },
  {
    id: 'sales_steps',
    category: 'Sales & Customer Journey',
    question: 'How many steps are involved, and who is responsible for each?',
    type: 'textarea',
  },
  {
    id: 'manual_tasks',
    category: 'Sales & Customer Journey',
    question: 'Which parts of your sales process are manual or repetitive (e.g., follow-ups, proposals, scheduling)?',
    type: 'textarea',
  },
  {
    id: 'sales_metrics',
    category: 'Sales & Customer Journey',
    question: 'Do you track sales metrics (conversion rate, deal value, response time)?',
    type: 'textarea',
  },
  {
    id: 'sales_cycle',
    category: 'Sales & Customer Journey',
    question: 'How long does it usually take for a new lead to become a paying customer?',
    type: 'textarea',
  },

  // Operations & Delivery
  {
    id: 'time_consuming_tasks',
    category: 'Operations & Delivery',
    question: 'What are the most time-consuming operational tasks in your business right now?',
    type: 'textarea',
  },
  {
    id: 'automation_candidates',
    category: 'Operations & Delivery',
    question: 'Which of these tasks could be automated or streamlined with the right system?',
    type: 'textarea',
  },
  {
    id: 'recurring_admin',
    category: 'Operations & Delivery',
    question: 'Do you have recurring admin processes (reports, scheduling, invoicing, reminders) that take staff time?',
    type: 'textarea',
  },
  {
    id: 'team_communication',
    category: 'Operations & Delivery',
    question: 'How do you manage communication and task tracking across your team?',
    type: 'textarea',
  },
  {
    id: 'scaling_bottleneck',
    category: 'Operations & Delivery',
    question: "What's the biggest bottleneck stopping your business from scaling faster?",
    type: 'textarea',
  },

  // Customer Service & Retention
  {
    id: 'customer_support',
    category: 'Customer Service & Retention',
    question: 'How do customers currently reach you for support or questions?',
    type: 'textarea',
  },
  {
    id: 'support_automation',
    category: 'Customer Service & Retention',
    question: 'Do you use chatbots, automated responses, or help desk software?',
    type: 'textarea',
  },
  {
    id: 'repetitive_questions',
    category: 'Customer Service & Retention',
    question: 'How much time is spent each week on answering the same or repetitive questions?',
    type: 'textarea',
  },
  {
    id: 'customer_feedback',
    category: 'Customer Service & Retention',
    question: 'How do you collect and use customer feedback or reviews?',
    type: 'textarea',
  },
  {
    id: 'customer_retention',
    category: 'Customer Service & Retention',
    question: 'Do you have systems in place for re-engaging past customers or upselling?',
    type: 'textarea',
  },

  // AI Awareness & Readiness
  {
    id: 'ai_experience',
    category: 'AI Awareness & Readiness',
    question: "What's your experience level with AI tools so far? (Beginner / Experimenting / Actively Using / Advanced)",
    type: 'text',
  },
  {
    id: 'automation_explored',
    category: 'AI Awareness & Readiness',
    question: 'Have you explored any automation tools already? If yes, which ones and what was the outcome?',
    type: 'textarea',
  },
  {
    id: 'ai_hesitation',
    category: 'AI Awareness & Readiness',
    question: "What's your biggest hesitation about using AI in your business?",
    type: 'textarea',
  },
  {
    id: 'automate_tomorrow',
    category: 'AI Awareness & Readiness',
    question: 'If you could automate one thing tomorrow, what would it be?',
    type: 'textarea',
  },
  {
    id: 'success_metric',
    category: 'AI Awareness & Readiness',
    question: 'What result would make adopting AI a success for you? (e.g., save 10 hours/week, reduce costs by 20%, grow leads)',
    type: 'textarea',
  },
]

export function getQuestionsByCategory() {
  const categories = new Map<string, AuditQuestion[]>()
  
  AI_AUDIT_QUESTIONS.forEach((question) => {
    const existing = categories.get(question.category) || []
    categories.set(question.category, [...existing, question])
  })
  
  return Array.from(categories.entries())
}

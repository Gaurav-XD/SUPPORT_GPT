import type {
  AgentPreview,
  ConversationPreview,
  KnowledgeDocument,
  Metric,
  TicketPreview,
} from '@/lib/types';

export const metrics: Metric[] = [
  { label: 'Resolution rate', value: '94.8%', change: '+3.4%', trend: 'up' },
  { label: 'Ticket volume', value: '1,284', change: '+12.1%', trend: 'up' },
  { label: 'AI accuracy', value: '91.2%', change: '+1.8%', trend: 'up' },
  { label: 'Avg. first response', value: '38s', change: '-14s', trend: 'down' },
];

export const conversations: ConversationPreview[] = [
  {
    id: 'conv_001',
    customer: 'Avery Johnson',
    subject: 'Reset password for billing portal',
    status: 'Awaiting follow-up',
    updatedAt: '2 minutes ago',
    citations: 4,
  },
  {
    id: 'conv_002',
    customer: 'Morgan Lee',
    subject: 'Incorrect invoice total',
    status: 'Resolved',
    updatedAt: '21 minutes ago',
    citations: 2,
  },
  {
    id: 'conv_003',
    customer: 'Priya Shah',
    subject: 'Upload PDF knowledge article',
    status: 'Escalated',
    updatedAt: 'Today, 09:12',
    citations: 6,
  },
];

export const tickets: TicketPreview[] = [
  { id: 'TCK-4021', title: 'Invoice copy request', priority: 'High', status: 'In progress', assignee: 'Nina Patel' },
  { id: 'TCK-4018', title: 'Google OAuth callback failing', priority: 'Urgent', status: 'Open', assignee: 'Unassigned' },
  { id: 'TCK-4007', title: 'SLA escalation rule review', priority: 'Medium', status: 'Waiting', assignee: 'Ethan Cole' },
];

export const documents: KnowledgeDocument[] = [
  { name: 'Support Handbook.pdf', status: 'Ready', chunks: 42, source: 'Knowledge Base' },
  { name: 'Billing FAQ.docx', status: 'Ready', chunks: 19, source: 'Help Center' },
  { name: 'Release Notes.txt', status: 'Processing', chunks: 7, source: 'Product Docs' },
];

export const agents: AgentPreview[] = [
  { name: 'Atlas Support Agent', model: 'gpt-4.1-mini', kb: 'Product Knowledge Base', temperature: '0.3', responses: '12.4k' },
  { name: 'Billing Concierge', model: 'gpt-4.1-mini', kb: 'Billing Docs', temperature: '0.2', responses: '4.7k' },
  { name: 'Onboarding Guide', model: 'gpt-4.1-mini', kb: 'Customer Success', temperature: '0.4', responses: '3.1k' },
];

export const activityFeed = [
  {
    title: 'Document parsed',
    detail: 'Support Handbook.pdf embedded into pgvector with 42 chunks.',
    time: '4m ago',
  },
  {
    title: 'Ticket escalated',
    detail: 'TCK-4018 moved to Urgent after OAuth callback failures.',
    time: '12m ago',
  },
  {
    title: 'Agent updated',
    detail: 'Atlas Support Agent received a new system prompt version.',
    time: '28m ago',
  },
];

export const organizations = [
  {
    name: 'SupportGPT',
    slug: 'supportgpt',
    role: 'Admin',
    members: 12,
    health: 'Excellent',
  },
  {
    name: 'Northwind Support',
    slug: 'northwind-support',
    role: 'Manager',
    members: 8,
    health: 'Healthy',
  },
  {
    name: 'Acme Helpdesk',
    slug: 'acme-helpdesk',
    role: 'Viewer',
    members: 4,
    health: 'Monitoring',
  },
];


export type Metric = {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
};

export type ConversationPreview = {
  id: string;
  customer: string;
  subject: string;
  status: string;
  updatedAt: string;
  citations: number;
};

export type TicketPreview = {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: string;
  assignee: string;
};

export type KnowledgeDocument = {
  name: string;
  status: 'Processing' | 'Ready' | 'Failed';
  chunks: number;
  source: string;
};

export type AgentPreview = {
  name: string;
  model: string;
  kb: string;
  temperature: string;
  responses: string;
};

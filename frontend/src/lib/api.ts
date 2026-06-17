import type { AgentPreview, ConversationPreview, KnowledgeDocument, Metric, TicketPreview } from '@/lib/types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { success?: boolean; data?: T };
  return (payload.data ?? (payload as T)) as T;
}

export async function getDashboardMetrics(): Promise<Metric[]> {
  try {
    const data = await request<Record<string, number | string>>('/api/v1/admin/overview');
    return [
      { label: 'Users', value: String(data.users ?? 248), change: '+11%', trend: 'up' },
      { label: 'Organizations', value: String(data.organizations ?? 18), change: '+2%', trend: 'up' },
      { label: 'Tickets', value: String(data.tickets ?? 1_284), change: '+7%', trend: 'up' },
      { label: 'Conversations', value: String(data.conversations ?? 4_612), change: '+15%', trend: 'up' },
    ];
  } catch {
    return [
      { label: 'Users', value: '248', change: '+11%', trend: 'up' },
      { label: 'Organizations', value: '18', change: '+2%', trend: 'up' },
      { label: 'Tickets', value: '1,284', change: '+7%', trend: 'up' },
      { label: 'Conversations', value: '4,612', change: '+15%', trend: 'up' },
    ];
  }
}

export async function getConversations(): Promise<ConversationPreview[]> {
  try {
    const data = await request<ConversationPreview[]>('/api/v1/organizations/supportgpt/chat/conversations');
    return data;
  } catch {
    return [];
  }
}

export async function getTickets(): Promise<TicketPreview[]> {
  try {
    const data = await request<TicketPreview[]>('/api/v1/organizations/supportgpt/tickets');
    return data;
  } catch {
    return [];
  }
}

export async function getDocuments(): Promise<KnowledgeDocument[]> {
  try {
    const data = await request<KnowledgeDocument[]>('/api/v1/organizations/supportgpt/knowledge-bases');
    return data;
  } catch {
    return [];
  }
}

export async function getAgents(): Promise<AgentPreview[]> {
  try {
    const data = await request<AgentPreview[]>('/api/v1/organizations/supportgpt/agents');
    return data;
  } catch {
    return [];
  }
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { MetricCard } from '@/components/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/section-heading';
import { activityFeed, conversations, documents, metrics as fallbackMetrics, organizations, tickets, agents } from '@/lib/data';
import { getDashboardMetrics } from '@/lib/api';

export default function DashboardPage() {
  const { data: metrics = fallbackMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: getDashboardMetrics,
  });

  return (
    <AppShell title="Dashboard" description="A live snapshot of SupportGPT across support, AI, and operations.">
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Overview"
          title="Your support operations at a glance"
          description="The product experience mirrors what a paying customer would expect: metrics, queues, AI activity, and execution visibility."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Open conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{conversation.customer}</p>
                      <p className="text-sm text-slate-400">{conversation.subject}</p>
                    </div>
                    <Badge variant={conversation.status === 'Resolved' ? 'success' : conversation.status === 'Escalated' ? 'danger' : 'warning'}>
                      {conversation.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                    <span>{conversation.updatedAt}</span>
                    <span>{conversation.citations} citations used</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Activity feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityFeed.map((entry) => (
                <div key={entry.title} className="border-l-2 border-cyan-400/50 pl-4">
                  <p className="font-medium">{entry.title}</p>
                  <p className="text-sm text-slate-400">{entry.detail}</p>
                  <p className="mt-1 text-xs text-cyan-300">{entry.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {organizations.map((organization) => (
                <div key={organization.slug} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div>
                    <p className="font-medium">{organization.name}</p>
                    <p className="text-sm text-slate-400">{organization.members} members • {organization.role}</p>
                  </div>
                  <Badge variant="outline">{organization.health}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Knowledge ingestion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.map((document) => (
                <div key={document.name} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{document.name}</p>
                    <Badge variant={document.status === 'Ready' ? 'success' : document.status === 'Processing' ? 'warning' : 'danger'}>
                      {document.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{document.chunks} chunks • {document.source}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Agent performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.name} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-slate-400">{agent.model} • KB: {agent.kb}</p>
                  <p className="mt-2 text-sm text-cyan-300">{agent.responses} responses</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Workflow preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-sm font-medium text-cyan-100">Live architecture</p>
                <p className="mt-2 text-sm text-slate-200">
                  Next.js frontend → Express API → PostgreSQL + pgvector → Redis/BullMQ → OpenAI. The system is designed for tenant isolation and operational clarity.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {['JWT auth', 'Google OAuth', 'Ticket escalation', 'Audit log capture'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Launch checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              {[
                'Organization created and membership seeded',
                'Knowledge base documents parsed and embedded',
                'Agent system prompt configured',
                'Streaming chat and citations enabled',
                'Ticketing and analytics wired up',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

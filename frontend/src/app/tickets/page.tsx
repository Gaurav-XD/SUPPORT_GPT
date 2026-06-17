import { AppShell } from '@/components/app-shell';
import { SectionHeading } from '@/components/section-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tickets } from '@/lib/data';

export default function TicketsPage() {
  return (
    <AppShell title="Tickets" description="Support issue tracking with assignment, priority, and escalation workflows.">
      <SectionHeading
        eyebrow="Workflow"
        title="A support queue that behaves like a real product"
        description="The ticket model is suitable for customer-facing issue intake and internal escalation flows."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="border-white/10 bg-white/5 text-white">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{ticket.id}</p>
                <Badge variant={ticket.priority === 'Urgent' ? 'danger' : ticket.priority === 'High' ? 'warning' : 'secondary'}>{ticket.priority}</Badge>
              </div>
              <p className="text-sm text-slate-300">{ticket.title}</p>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>{ticket.status}</span>
                <span>{ticket.assignee}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

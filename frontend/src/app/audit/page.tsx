import { AppShell } from '@/components/app-shell';
import { SectionHeading } from '@/components/section-heading';
import { Card, CardContent } from '@/components/ui/card';

const logs = [
  'Admin invited a manager to SupportGPT',
  'Knowledge base document uploaded and processed',
  'Agent system prompt updated',
  'Ticket TCK-4018 escalated to urgent',
];

export default function AuditPage() {
  return (
    <AppShell title="Audit Logs" description="Immutable operational trace for compliance and debugging.">
      <SectionHeading
        eyebrow="Governance"
        title="Every meaningful action leaves a trace"
        description="Auditability is central to the platform story and is especially important in multi-tenant environments."
      />
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="space-y-3 p-5">
          {logs.map((entry) => (
            <div key={entry} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
              {entry}
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}

import { AppShell } from '@/components/app-shell';
import { SectionHeading } from '@/components/section-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { agents } from '@/lib/data';

export default function AgentsPage() {
  return (
    <AppShell title="AI Agents" description="Create specialized support personas with prompts and knowledge source assignments.">
      <SectionHeading
        eyebrow="Agents"
        title="Prompted for support, tuned for consistency"
        description="Each agent can own a tone, a knowledge base, and a model configuration suitable for a specific support workflow."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.name} className="border-white/10 bg-white/5 text-white">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{agent.name}</p>
                <Badge>{agent.model}</Badge>
              </div>
              <p className="text-sm text-slate-400">Knowledge base: {agent.kb}</p>
              <div className="grid gap-2 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">Temperature: {agent.temperature}</div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">Responses: {agent.responses}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

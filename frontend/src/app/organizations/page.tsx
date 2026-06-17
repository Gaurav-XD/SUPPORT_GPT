import { AppShell } from '@/components/app-shell';
import { SectionHeading } from '@/components/section-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { organizations } from '@/lib/data';

export default function OrganizationsPage() {
  return (
    <AppShell title="Organizations" description="Tenants, roles, and team visibility for the SaaS workspace.">
      <SectionHeading
        eyebrow="Multi-tenancy"
        title="Organizational boundaries stay explicit"
        description="Each workspace has its own users, agents, knowledge sources, tickets, and audit history."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {organizations.map((organization) => (
          <Card key={organization.slug} className="border-white/10 bg-white/5 text-white">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{organization.name}</p>
                  <p className="text-sm text-slate-400">{organization.slug}</p>
                </div>
                <Badge>{organization.role}</Badge>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                {organization.members} active members
              </div>
              <p className="text-sm text-cyan-300">Workspace health: {organization.health}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

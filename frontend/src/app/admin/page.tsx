import { AppShell } from '@/components/app-shell';
import { SectionHeading } from '@/components/section-heading';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  'System health and uptime monitoring',
  'Organization lifecycle controls',
  'Global analytics and usage oversight',
  'API key management and revocation',
];

export default function AdminPage() {
  return (
    <AppShell title="Admin" description="High-privilege platform controls and operational oversight.">
      <SectionHeading
        eyebrow="Operations"
        title="Admin controls that feel production-ready"
        description="The admin area demonstrates the sort of visibility teams expect when they are paying for a platform."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature} className="border-white/10 bg-white/5 text-white">
            <CardContent className="p-5 text-sm text-slate-300">{feature}</CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

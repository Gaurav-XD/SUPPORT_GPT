import { AppShell } from '@/components/app-shell';
import { SectionHeading } from '@/components/section-heading';
import { Card, CardContent } from '@/components/ui/card';
import { metrics } from '@/lib/data';

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics" description="Measure resolution rate, ticket volume, AI quality, and operational throughput.">
      <SectionHeading
        eyebrow="Reporting"
        title="Metrics that explain the support system"
        description="The dashboard emphasizes the numbers that matter to stakeholders and interviewers alike: adoption, accuracy, and efficiency."
      />
      <div className="grid gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-white/5 text-white">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
              <p className="mt-1 text-sm text-cyan-300">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

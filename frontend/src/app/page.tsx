import Link from 'next/link';
import { ArrowRight, Bot, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { metrics } from '@/lib/data';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">SupportGPT</p>
              <p className="text-xs text-slate-400">AI customer support platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-200 hover:bg-white/5">
                Sign in
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                Launch dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-8">
            <Badge variant="success" className="w-fit">
              Built for senior full-stack portfolios
            </Badge>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
                A production-grade AI support platform that feels ready for paying customers.
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                SupportGPT combines multi-tenant SaaS workflows, RAG-powered chat, ticketing, analytics, and auditability into one polished product story.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                  Create workspace <Sparkles className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                  Explore demo
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-5">
                  <p className="text-sm text-slate-400">Architecture</p>
                  <p className="mt-2 text-xl font-semibold">Multi-tenant SaaS</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-5">
                  <p className="text-sm text-slate-400">AI</p>
                  <p className="mt-2 text-xl font-semibold">RAG + citations</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-5">
                  <p className="text-sm text-slate-400">Ops</p>
                  <p className="mt-2 text-xl font-semibold">Docker + CI/CD</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-white/10 bg-slate-950/70 shadow-glow">
            <CardContent className="space-y-5 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                    <p className="mt-1 text-sm text-emerald-300">{metric.change}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-sm font-medium text-cyan-100">Live platform signals</p>
                <div className="mt-3 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-950/50 p-3">Streaming chat responses</div>
                  <div className="rounded-xl bg-slate-950/50 p-3">Knowledge base ingestion queue</div>
                  <div className="rounded-xl bg-slate-950/50 p-3">Team invitations + RBAC</div>
                  <div className="rounded-xl bg-slate-950/50 p-3">Audit logs for every action</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                Designed for real-world SaaS expectations, not just a demo.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 border-t border-white/10 py-8 sm:grid-cols-3">
          {[
            ['Auth', 'Register, login, reset, Google OAuth'],
            ['Knowledge', 'Upload PDFs, DOCX, TXT and index them'],
            ['Support', 'Tickets, chat, notifications, analytics'],
          ].map(([title, body]) => (
            <Card key={title} className="border-white/10 bg-white/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Workflow className="h-4 w-4" />
                  <p className="text-sm font-medium">{title}</p>
                </div>
                <p className="mt-3 text-sm text-slate-300">{body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}

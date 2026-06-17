'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Bell, Bot, BookOpen, Building2, ChartNoAxesCombined, CircleUserRound, Gauge, Headphones, ShieldCheck, Ticket, Workflow } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/chat', label: 'AI Chat', icon: Headphones },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { href: '/audit', label: 'Audit Logs', icon: Workflow },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
] as const;

export function AppShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-4 lg:p-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-glow backdrop-blur xl:flex">
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">SupportGPT</p>
                <p className="text-xs text-slate-400">Customer support OS</p>
              </div>
            </div>
            <Badge variant="success" className="mt-4 w-fit">
              Production demo
            </Badge>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                    active ? 'bg-cyan-400/15 text-cyan-100' : 'text-slate-400 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/85 shadow-glow backdrop-blur">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">SupportGPT</p>
              <h1 className="text-xl font-semibold text-white">{title}</h1>
              <p className="text-sm text-slate-400">{description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 md:flex">
                <CircleUserRound className="h-4 w-4" />
                Admin User
              </div>
              <button className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="px-5 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

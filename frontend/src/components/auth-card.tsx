import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-slate-950/80 text-white shadow-glow">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">SupportGPT</p>
        <CardTitle className="text-2xl text-white">{title}</CardTitle>
        <CardDescription className="text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {children}
        <div className="text-sm text-slate-400">{footer}</div>
      </CardContent>
    </Card>
  );
}

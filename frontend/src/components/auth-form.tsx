'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export function AuthForm({
  mode,
  onSubmit,
}: {
  mode: 'login' | 'register' | 'reset';
  onSubmit?: (values: FormValues) => void;
}) {
  const router = useRouter();
  const { register, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'admin@supportgpt.dev',
      password: 'SupportGPT123!',
    },
  });

  return (
    <Card className="border-white/10 bg-white/5 text-white shadow-glow">
      <CardContent className="space-y-4 p-6">
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            if (onSubmit) {
              onSubmit(values);
            } else {
              router.push('/dashboard');
            }
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Email</label>
            <Input type="email" placeholder="admin@supportgpt.dev" className="border-white/10 bg-slate-950/60 text-white" {...register('email')} />
          </div>
          {mode !== 'reset' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Password</label>
              <Input type="password" placeholder="••••••••" className="border-white/10 bg-slate-950/60 text-white" {...register('password')} />
            </div>
          )}
          <Button type="submit" className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
          </Button>
        </form>
        <div className="flex items-center justify-between text-sm text-slate-400">
          <Link href="/dashboard" className="text-cyan-300 hover:text-cyan-200">
            Open demo dashboard
          </Link>
          {mode !== 'reset' ? (
            <Link href="/forgot-password" className="hover:text-white">
              Forgot password?
            </Link>
          ) : (
            <Link href="/login" className="hover:text-white">
              Back to login
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

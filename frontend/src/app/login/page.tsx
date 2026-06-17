import { AuthForm } from '@/components/auth-form';
import { AuthCard } from '@/components/auth-card';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <AuthCard
          title="Welcome back"
          description="Sign in to manage your workspace, agents, knowledge bases, and support operations."
          footer={
            <>
              Don’t have an account?{' '}
              <a href="/register" className="text-cyan-300 hover:text-cyan-200">
                Create one
              </a>
              .
            </>
          }
        >
          <AuthForm mode="login" />
        </AuthCard>
      </div>
    </main>
  );
}

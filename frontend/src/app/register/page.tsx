import { AuthForm } from '@/components/auth-form';
import { AuthCard } from '@/components/auth-card';

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <AuthCard
          title="Create your workspace"
          description="Spin up SupportGPT and start organizing teams, knowledge, and AI support workflows."
          footer={
            <>
              Already have an account?{' '}
              <a href="/login" className="text-cyan-300 hover:text-cyan-200">
                Sign in
              </a>
              .
            </>
          }
        >
          <AuthForm mode="register" />
        </AuthCard>
      </div>
    </main>
  );
}

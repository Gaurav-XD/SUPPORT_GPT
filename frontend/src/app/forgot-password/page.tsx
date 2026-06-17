import { AuthForm } from '@/components/auth-form';
import { AuthCard } from '@/components/auth-card';

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <AuthCard
          title="Reset your password"
          description="We’ll email a secure reset link if the account exists."
          footer={
            <>
              Remembered it?{' '}
              <a href="/login" className="text-cyan-300 hover:text-cyan-200">
                Back to sign in
              </a>
              .
            </>
          }
        >
          <AuthForm mode="reset" />
        </AuthCard>
      </div>
    </main>
  );
}

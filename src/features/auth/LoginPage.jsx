import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { useMockApp } from '@/features/mock/MockAppProvider';
import { ar } from '@/locales/ar';
import { AuthCard } from './AuthCard';

// Static form (Phase 3). Formik + Yup validation and Supabase Auth arrive in Phase 5.
export default function LoginPage() {
  const t = ar.auth;
  const { signIn } = useMockApp();

  // After signing in, GuestRoute redirects to a safe returnTo or the dashboard.
  const handleSubmit = (event) => {
    event.preventDefault();
    signIn();
  };

  return (
    <AuthCard title={t.login.title} subtitle={t.login.subtitle}>
      <form noValidate onSubmit={handleSubmit} className="grid gap-4">
        <Input label={t.email} type="email" name="email" autoComplete="email" required />
        <Input label={t.password} type="password" name="password" autoComplete="current-password" required />
        <Button type="submit">{t.login.submit}</Button>
      </form>
      <div className="mt-5 grid gap-2 text-sm">
        <Link to="/forgot-password" className="font-semibold text-primary-700 underline underline-offset-4">
          {t.login.forgot}
        </Link>
        <p className="text-ink-muted">
          {t.login.noAccount}{' '}
          <Link to="/register" className="font-semibold text-primary-700 underline underline-offset-4">
            {t.login.toRegister}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

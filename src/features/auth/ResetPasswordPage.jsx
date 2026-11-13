import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { ar } from '@/locales/ar';
import { AuthCard } from './AuthCard';

// Reached from the e-mailed link in the real app (Phase 5). Static for now.
export default function ResetPasswordPage() {
  const t = ar.auth;
  const navigate = useNavigate();

  return (
    <AuthCard title={t.reset.title}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          navigate('/login');
        }}
        className="grid gap-4"
      >
        <Input label={t.reset.password} type="password" name="password" autoComplete="new-password" hint={t.register.passwordHint} required />
        <Input label={t.reset.confirm} type="password" name="confirm" autoComplete="new-password" required />
        <Button type="submit">{t.reset.submit}</Button>
      </form>
    </AuthCard>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { useMockApp } from '@/features/mock/MockAppProvider';
import { ar } from '@/locales/ar';
import { AuthCard } from './AuthCard';

export default function RegisterPage() {
  const t = ar.auth;
  const { register } = useMockApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // After registering, GuestRoute -> dashboard -> OnboardingGuard sends a new account to /onboarding.
  const handleSubmit = (event) => {
    event.preventDefault();
    register({ name: name.trim() || ar.mock.userName, email: email.trim() || 'new@example.com' });
  };

  return (
    <AuthCard title={t.register.title} subtitle={t.register.subtitle}>
      <form noValidate onSubmit={handleSubmit} className="grid gap-4">
        <Input label={t.register.fullName} name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label={t.email} type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label={t.password} type="password" name="password" autoComplete="new-password" hint={t.register.passwordHint} required />
        <Button type="submit">{t.register.submit}</Button>
      </form>
      <p className="mt-5 text-sm text-ink-muted">
        {t.register.haveAccount}{' '}
        <Link to="/login" className="font-semibold text-primary-700 underline underline-offset-4">
          {t.register.toLogin}
        </Link>
      </p>
    </AuthCard>
  );
}

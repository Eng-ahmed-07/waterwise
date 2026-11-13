import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { ar } from '@/locales/ar';
import { AuthCard } from './AuthCard';

export default function ForgotPasswordPage() {
  const t = ar.auth;
  const [sent, setSent] = useState(false);

  return (
    <AuthCard title={t.forgot.title} subtitle={t.forgot.body}>
      {sent ? (
        <p role="status" className="rounded-control bg-secondary-50 px-3 py-2 text-sm font-medium text-secondary-900">
          {t.forgot.sent}
        </p>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
          className="grid gap-4"
        >
          <Input label={t.email} type="email" name="email" autoComplete="email" required />
          <Button type="submit">{t.forgot.submit}</Button>
        </form>
      )}
      <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-primary-700 underline underline-offset-4">
        {t.forgot.back}
      </Link>
    </AuthCard>
  );
}

import { useState } from 'react';
import { Button, Card, Input, Select } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { ERROR_CODES } from '@/features/calculator/domain/errorCodes';
import { describeError } from '@/features/calculator/domain/messages';
import { useMockApp } from '@/features/mock/MockAppProvider';
import { VALIDATION_LIMITS } from '@/lib/constants';
import { INPUT_STATUS, parseNumericInput } from '@/lib/numberInput';
import { ar } from '@/locales/ar';

const { MIN_HOUSEHOLD_SIZE, MAX_HOUSEHOLD_SIZE } = VALIDATION_LIMITS;

// Household setup (first sign-in only). Basic checks only; Formik + Yup arrive in Phase 5.
export default function OnboardingPage() {
  const t = ar.onboarding;
  const { saveHousehold } = useMockApp();
  const [values, setValues] = useState({ name: '', size: '', governorate: '' });
  const [errors, setErrors] = useState({});

  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const size = parseNumericInput(values.size);
    const sizeOk = size.status === INPUT_STATUS.VALID && Number.isInteger(size.value) && size.value >= MIN_HOUSEHOLD_SIZE && size.value <= MAX_HOUSEHOLD_SIZE;
    const next = {};
    if (values.name.trim() === '') next.name = t.nameRequired;
    if (!sizeOk) next.size = describeError({ code: ERROR_CODES.HOUSEHOLD_SIZE_INVALID, params: { min: MIN_HOUSEHOLD_SIZE, max: MAX_HOUSEHOLD_SIZE } });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // OnboardingPageGuard then redirects accounts that now have a household to /dashboard.
    saveHousehold({ name: values.name.trim(), size: size.value, governorate: values.governorate || null });
  };

  return (
    <PageContainer className="py-12">
      <Card as="section" title={t.title} description={t.description} className="mx-auto max-w-md">
        <form noValidate onSubmit={handleSubmit} className="grid gap-4">
          <Input label={t.name} hint={t.nameHint} value={values.name} onChange={set('name')} error={errors.name} required />
          <Input label={t.size} inputMode="numeric" value={values.size} onChange={set('size')} error={errors.size} required />
          <Select label={t.governorate} placeholder={t.governoratePlaceholder} options={ar.governorates} value={values.governorate} onChange={set('governorate')} />
          <Button type="submit">{t.submit}</Button>
        </form>
      </Card>
    </PageContainer>
  );
}

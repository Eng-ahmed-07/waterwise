// DEV-ONLY component showcase (route /dev/ui, removed from production builds).
// Arabic copy is inline here on purpose: this page is a tool for developers, not part of the product UI.
import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { BasisBadge, Button, Card, CoverageNote, Input, MetricValue, Modal, Select, Skeleton, useToast } from '@/components/ui';
import { MIN_COMPLETE_DAYS_FOR_PROJECTION } from '@/lib/constants';

// Class names are written out in full so Tailwind can detect them.
const SWATCH_GROUPS = [
  {
    title: 'الأساسية',
    items: [
      ['canvas', 'bg-canvas border border-line'],
      ['surface', 'bg-surface border border-line'],
      ['ink', 'bg-ink'],
      ['ink-muted', 'bg-ink-muted'],
      ['line', 'bg-line'],
      ['line-strong', 'bg-line-strong'],
    ],
  },
  {
    title: 'الأساسي primary',
    items: [
      ['50', 'bg-primary-50 border border-line'],
      ['100', 'bg-primary-100'],
      ['200', 'bg-primary-200'],
      ['300', 'bg-primary-300'],
      ['400', 'bg-primary-400'],
      ['500', 'bg-primary-500'],
      ['600', 'bg-primary-600'],
      ['700', 'bg-primary-700'],
      ['800', 'bg-primary-800'],
      ['900', 'bg-primary-900'],
    ],
  },
  {
    title: 'الثانوي secondary',
    items: [
      ['50', 'bg-secondary-50 border border-line'],
      ['100', 'bg-secondary-100'],
      ['200', 'bg-secondary-200'],
      ['300', 'bg-secondary-300'],
      ['400', 'bg-secondary-400'],
      ['500', 'bg-secondary-500'],
      ['600', 'bg-secondary-600'],
      ['700', 'bg-secondary-700'],
      ['800', 'bg-secondary-800'],
      ['900', 'bg-secondary-900'],
    ],
  },
  {
    title: 'تنبيه amber / خطأ danger',
    items: [
      ['amber-50', 'bg-amber-50 border border-line'],
      ['amber-100', 'bg-amber-100'],
      ['amber-500', 'bg-amber-500'],
      ['amber-700', 'bg-amber-700'],
      ['amber-800', 'bg-amber-800'],
      ['danger-50', 'bg-danger-50 border border-line'],
      ['danger-600', 'bg-danger-600'],
      ['danger-700', 'bg-danger-700'],
    ],
  },
];

const TYPE_SCALE = [
  ['xs', 'text-xs'],
  ['sm', 'text-sm'],
  ['base', 'text-base'],
  ['lg', 'text-lg'],
  ['xl', 'text-xl'],
  ['2xl', 'text-2xl'],
  ['3xl', 'text-3xl'],
  ['4xl', 'text-4xl'],
  ['5xl', 'text-5xl'],
];

const GOVERNORATES = [
  { value: 'cairo', label: 'القاهرة' },
  { value: 'giza', label: 'الجيزة' },
  { value: 'gharbia', label: 'الغربية' },
];

function Section({ title, description, children }) {
  return (
    <Card title={title} description={description}>
      {children}
    </Card>
  );
}

export function UiShowcase() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [governorate, setGovernorate] = useState('');
  const [buttonLoading, setButtonLoading] = useState(false);

  return (
    <PageContainer as="main" className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-ink">معرض المكوّنات</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          صفحة للتطوير فقط. كل الأرقام هنا توضيحية، مأخوذة من مثال الخطة، وليست معايير رسمية لمصر.
        </p>
      </header>

      <div className="grid gap-6">
        <Section
          title="تسمية الأرقام: BasisBadge"
          description="النص وشكل الحدّ يحملان المعنى، وليس اللون وحده: متصل = تقديري، متقطع = متوقع."
        >
          <div className="flex flex-wrap items-center gap-3">
            <BasisBadge basis="estimated" />
            <BasisBadge basis="projected" />
            <BasisBadge basis="estimated" size="sm" />
            <BasisBadge basis="projected" size="sm" />
          </div>
        </Section>

        <Section
          title="عرض الأرقام: MetricValue"
          description="مثال الخطة: 8 أيام مكتملة من 30. التوقع الشهري = المتوسط اليومي × عدد الأيام."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricValue label="متوسط يومي تقديري" value={517.75} unit="literPerDay" basis="estimated" />
            <MetricValue label="تقدير للفرد (4 أفراد)" value={129.44} unit="literPerPersonDay" basis="estimated" />
            <MetricValue label="مجموع تقديري للأيام المكتملة" value={4142} unit="liter" basis="estimated">
              <CoverageNote covered={8} total={30} />
            </MetricValue>
            <MetricValue
              label="توقع شهري"
              value={15.5325}
              unit="cubicMeter"
              basis="projected"
              formula="المتوسط اليومي التقديري × عدد أيام الشهر"
            >
              <CoverageNote covered={8} total={30} />
            </MetricValue>
            <MetricValue label="بدون قيمة" value={null} unit="liter" basis="estimated" />
            <MetricValue label="أثناء التحميل" value={null} unit="liter" basis="estimated" isLoading />
          </div>
          <div className="mt-4">
            <MetricValue label="حجم كبير" value={517.75} unit="literPerDay" basis="estimated" size="lg" />
          </div>
        </Section>

        <Section
          title="تغطية الأيام: CoverageNote"
          description={`الحد الأدنى للتوقع الشهري: ${MIN_COMPLETE_DAYS_FOR_PROJECTION} أيام مكتملة (قاعدة منتج وليست عتبة علمية).`}
        >
          <CoverageNote covered={3} total={MIN_COMPLETE_DAYS_FOR_PROJECTION} showBar className="max-w-sm" />
        </Section>

        <Section title="الأزرار: Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button>أساسي</Button>
            <Button variant="secondary">ثانوي</Button>
            <Button variant="ghost">نصّي</Button>
            <Button variant="danger">حذف</Button>
            <Button disabled>معطّل</Button>
            <Button
              loading={buttonLoading}
              onClick={() => {
                setButtonLoading(true);
                setTimeout(() => setButtonLoading(false), 1500);
              }}
            >
              حفظ كسجل مكتمل
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm">صغير</Button>
            <Button size="md">متوسط</Button>
            <Button size="lg">كبير</Button>
          </div>
        </Section>

        <Section title="الحقول: Input و Select">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="اسم المنزل" hint="مثال: منزل العائلة" />
            <Input label="عدد أفراد الأسرة" required inputMode="decimal" defaultValue="4" />
            <Input label="البريد الإلكتروني" type="email" placeholder="name@example.com" />
            <Input label="كلمة المرور" type="password" error="كلمة المرور يجب ألا تقل عن 8 أحرف." />
            <Input label="حقل معطّل" disabled defaultValue="غير متاح" />
            <Select
              label="المحافظة"
              placeholder="اختر المحافظة"
              options={GOVERNORATES}
              value={governorate}
              onChange={(event) => setGovernorate(event.target.value)}
            />
          </div>
        </Section>

        <Section title="النوافذ والإشعارات: Modal و Toast">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              فتح نافذة
            </Button>
            <Button variant="secondary" onClick={() => toast.success('تم حفظ السجل.')}>
              إشعار نجاح
            </Button>
            <Button variant="secondary" onClick={() => toast.info('يمكنك تعديل الافتراضات من الإعدادات.')}>
              إشعار معلومة
            </Button>
            <Button variant="secondary" onClick={() => toast.error('تعذّر الحفظ. حاول مرة أخرى.')}>
              إشعار خطأ
            </Button>
          </div>
        </Section>

        <Section title="التحميل: Skeleton">
          <div className="grid gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Section>

        <Section title="الألوان" description="الألوان الأساسية من المختصر، وباقي التدرجات مشتقة منها ومفحوصة التباين.">
          <div className="grid gap-5">
            {SWATCH_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="mb-2 text-sm font-semibold text-ink">{group.title}</h3>
                <div className="flex flex-wrap gap-3">
                  {group.items.map(([name, classes]) => (
                    <div key={name} className="w-16 text-center">
                      <div className={`h-12 rounded-control ${classes}`} />
                      <p className="mt-1 text-xs text-ink-muted" dir="ltr">
                        {name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="سلّم الخطوط" description="IBM Plex Sans Arabic. لا مسافات بين الحروف، ولا خط مائل.">
          <div className="grid gap-2">
            {TYPE_SCALE.map(([name, classes]) => (
              <p key={name} className={`${classes} text-ink`}>
                <span className="me-3 text-xs text-ink-muted" dir="ltr">
                  {name}
                </span>
                مياه نظيفة لكل بيت
              </p>
            ))}
          </div>
        </Section>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تأكيد الحذف"
        description="سيتم حذف السجل نهائيًا ولا يمكن التراجع."
        footer={
          <>
            <Button
              variant="danger"
              onClick={() => {
                setModalOpen(false);
                toast.success('تم حذف السجل.');
              }}
            >
              حذف
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">هذا مثال لنافذة تأكيد. ضغط Esc أو النقر خارج النافذة يغلقها.</p>
      </Modal>
    </PageContainer>
  );
}

// react-router "lazy" route convention.
export const Component = UiShowcase;
export default UiShowcase;

import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import type { SupportedLocale } from '@/i18n';

const OPTIONS: { value: SupportedLocale; label: string }[] = [
  { value: 'id', label: 'ID' },
  { value: 'en', label: 'EN' },
];

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppContext();

  return (
    <div
      role="group"
      aria-label={t('language.switcherLabel')}
      className="inline-flex items-center gap-1 rounded-md border bg-background p-0.5"
    >
      <span className="px-2 text-muted-foreground" aria-hidden>
        <Languages className="h-4 w-4" />
      </span>
      {OPTIONS.map((opt) => {
        const active = language === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            variant={active ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={active}
            onClick={() => setLanguage(opt.value)}
            className="h-7 px-2"
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

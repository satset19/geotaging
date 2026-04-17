import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
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
      className="inline-flex items-center rounded-full border border-border bg-background/80 p-0.5 shadow-sm backdrop-blur"
    >
      {OPTIONS.map((opt) => {
        const active = language === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => setLanguage(opt.value)}
            className={cn(
              'relative inline-flex h-7 min-w-[32px] items-center justify-center rounded-full px-2 text-[11px] font-bold tracking-wide transition-all touch-manipulation',
              active
                ? 'bg-brand text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

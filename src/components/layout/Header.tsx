import { useTranslation } from 'react-i18next';
import { BrandLogo } from '@/components/common/BrandLogo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useAppContext } from '@/context/AppContext';
import { useOnline } from '@/hooks/useOnline';
import { cn } from '@/lib/utils';

export function Header() {
  const { t } = useTranslation();
  const { position } = useAppContext();
  const online = useOnline();

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60 safe-top">
      <div className="flex h-14 w-full items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandLogo size={34} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-bold tracking-tight">
              {t('app.name')}
            </p>
            <p className="hidden truncate text-[11px] font-medium text-muted-foreground sm:block">
              {t('app.tagline')}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <StatusPill online={online} hasPosition={Boolean(position)} />
          <LanguageSwitcher />
        </div>
      </div>
      {/* Brand accent garis tipis */}
      <div
        aria-hidden
        className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
    </header>
  );
}

function StatusPill({
  online,
  hasPosition,
}: {
  online: boolean;
  hasPosition: boolean;
}) {
  const tone = !online
    ? { dot: 'bg-destructive', text: 'offline' }
    : hasPosition
      ? { dot: 'bg-emerald-500', text: 'live' }
      : { dot: 'bg-amber-500', text: 'GPS...' };

  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur"
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full pulse-dot',
          tone.dot,
          online && hasPosition ? 'text-emerald-500' : 'text-transparent'
        )}
      />
      {tone.text}
    </span>
  );
}

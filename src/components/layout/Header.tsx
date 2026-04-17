import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useAppContext } from '@/context/AppContext';
import { useOnline } from '@/hooks/useOnline';

export function Header() {
  const { t } = useTranslation();
  const { position } = useAppContext();
  const online = useOnline();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur safe-top">
      <div className="flex h-14 w-full items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {t('app.name')}
            </p>
            <p className="hidden truncate text-xs text-muted-foreground leading-tight sm:block">
              {t('app.tagline')}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusDot online={online} hasPosition={Boolean(position)} />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

function StatusDot({
  online,
  hasPosition,
}: {
  online: boolean;
  hasPosition: boolean;
}) {
  const color =
    online && hasPosition
      ? 'bg-green-500'
      : online
        ? 'bg-yellow-500'
        : 'bg-destructive';
  const title = online
    ? hasPosition
      ? 'online + GPS'
      : 'online'
    : 'offline';
  return (
    <span
      role="status"
      aria-label={title}
      title={title}
      className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}
    />
  );
}

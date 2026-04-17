import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/common/BrandLogo';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * Banner install PWA. Muncul di atas TabBar, hilang 7 hari bila user dismiss.
 */
export function InstallPrompt() {
  const { t } = useTranslation();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const until = Number(localStorage.getItem('installPromptDismissedUntil') ?? '0');
      if (Date.now() < until) return;
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      'installPromptDismissedUntil',
      String(Date.now() + weekMs)
    );
    setVisible(false);
  };

  const accept = async () => {
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setVisible(false);
      setDeferred(null);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[84px] z-50 flex justify-center px-4 safe-bottom">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-brand backdrop-blur-xl">
        <BrandLogo size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{t('app.name')}</p>
          <p className="truncate text-xs text-muted-foreground">
            {t('install.prompt')}
          </p>
        </div>
        <Button size="sm" className="bg-brand" onClick={() => void accept()}>
          <Download className="h-3.5 w-3.5" aria-hidden />
          {t('install.accept')}
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('install.dismiss')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

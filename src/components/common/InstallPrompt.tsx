import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

// Tipe resmi beforeinstallprompt.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * Banner "Install app" PWA yang muncul saat browser menembak beforeinstallprompt.
 * Jika user dismiss, simpan preferensi di localStorage agar tidak muncul lagi 7 hari.
 */
export function InstallPrompt() {
  const { t } = useTranslation();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Cegah auto-prompt dari browser Chrome.
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
    // Tidak muncul lagi selama 7 hari.
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
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 safe-bottom md:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg border bg-card p-3 shadow-lg">
        <Download className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="flex-1 text-sm">{t('install.prompt')}</p>
        <Button size="sm" onClick={() => void accept()}>
          {t('install.accept')}
        </Button>
        <Button size="icon" variant="ghost" aria-label={t('install.dismiss')} onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

import { Camera, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAppContext, type AppTab } from '@/context/AppContext';

const tabs: { id: AppTab; labelKey: string; icon: typeof Map }[] = [
  { id: 'map', labelKey: 'tabs.map', icon: Map },
  { id: 'camera', labelKey: 'tabs.camera', icon: Camera },
];

export function TabBar() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab } = useAppContext();

  return (
    <nav
      role="tablist"
      aria-label="Primary navigation"
      className="sticky bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl safe-bottom"
    >
      <ul className="mx-auto flex w-full max-w-3xl px-2 py-1.5">
        {tabs.map(({ id, labelKey, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${id}`}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'group relative flex w-full flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-semibold tracking-wide transition-all duration-200',
                  'touch-manipulation active:scale-[0.96]',
                  active
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-brand shadow-brand"
                  />
                ) : null}
                <span
                  aria-hidden
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    active ? 'text-white' : ''
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform',
                      active ? 'scale-110' : 'group-hover:scale-105'
                    )}
                    aria-hidden
                  />
                </span>
                <span
                  className={cn(
                    'relative transition-colors',
                    active ? 'text-white' : ''
                  )}
                >
                  {t(labelKey)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

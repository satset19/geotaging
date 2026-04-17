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
      className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur safe-bottom"
    >
      <ul className="mx-auto flex w-full max-w-3xl">
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
                  'flex w-full flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon
                  className={cn('h-5 w-5', active && 'stroke-[2.4]')}
                  aria-hidden
                />
                <span>{t(labelKey)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

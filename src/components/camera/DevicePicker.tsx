import { SwitchCamera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CameraFacing } from '@/hooks/useCamera';

interface Props {
  facing: CameraFacing;
  onSwitch: () => void;
  disabled?: boolean;
}

export function DevicePicker({ facing, onSwitch, disabled }: Props) {
  const { t } = useTranslation();
  const label =
    facing === 'environment' ? t('camera.backCamera') : t('camera.frontCamera');
  return (
    <button
      type="button"
      onClick={onSwitch}
      disabled={disabled}
      aria-label={`${t('camera.switch')} (${label})`}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95 disabled:opacity-40 touch-manipulation"
    >
      <SwitchCamera className="h-5 w-5" aria-hidden />
    </button>
  );
}

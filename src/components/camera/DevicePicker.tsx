import { SwitchCamera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onSwitch}
      disabled={disabled}
      className="bg-white/15 text-white backdrop-blur hover:bg-white/25"
    >
      <SwitchCamera className="mr-1 h-4 w-4" aria-hidden />
      {t('camera.switch')} ({label})
    </Button>
  );
}

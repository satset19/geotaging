import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import type { GeoAddress, GeoError, GeoPosition } from '@/types/geo';
import type { SupportedLocale } from '@/i18n';

export type AppTab = 'map' | 'camera';

interface AppContextValue {
  // Tab navigation.
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // Geolocation state.
  position: GeoPosition | null;
  positionError: GeoError | null;
  positionLoading: boolean;
  positionSamples: number;
  refreshPosition: () => void;

  // Reverse geocode state.
  address: GeoAddress | null;
  addressLoading: boolean;
  addressError: string | null;

  // Language.
  language: SupportedLocale;
  setLanguage: (lng: SupportedLocale) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<AppTab>('map');

  // Geolocation: watchPosition selalu aktif agar baik map maupun kamera dapat data fresh.
  // Default options useGeolocation sudah optimal untuk akurasi (high accuracy,
  // maximumAge=0, timeout 30s, best-so-far filter).
  const {
    position,
    error: positionError,
    isLoading: positionLoading,
    samples: positionSamples,
    refresh,
  } = useGeolocation({ watch: true });

  // Reverse geocoding memakai bahasa aktif untuk format alamat sesuai locale.
  const {
    address,
    isLoading: addressLoading,
    error: addressError,
  } = useReverseGeocode(position, { language: i18n.language });

  const setLanguage = useCallback(
    (lng: SupportedLocale) => {
      void i18n.changeLanguage(lng);
    },
    [i18n]
  );

  const language = (i18n.language?.startsWith('en') ? 'en' : 'id') as SupportedLocale;

  const value = useMemo<AppContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      position,
      positionError,
      positionLoading,
      positionSamples,
      refreshPosition: refresh,
      address,
      addressLoading,
      addressError,
      language,
      setLanguage,
    }),
    [
      activeTab,
      position,
      positionError,
      positionLoading,
      positionSamples,
      refresh,
      address,
      addressLoading,
      addressError,
      language,
      setLanguage,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

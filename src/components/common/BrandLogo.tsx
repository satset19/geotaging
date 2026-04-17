import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

// Logo GeoDjengs: pin gradient dengan inner ring cyan.
// Inline SVG agar crisp di retina tanpa asset tambahan.
export function BrandLogo({ size = 32, className }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GeoDjengs logo"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="brand-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#brand-bg)" />
      <path
        d="M32 10c-8.837 0-16 7.163-16 16 0 10.5 16 28 16 28s16-17.5 16-28c0-8.837-7.163-16-16-16Z"
        fill="url(#brand-grad)"
      />
      <circle cx="32" cy="26" r="6" fill="#0f172a" />
      <circle cx="32" cy="26" r="2.6" fill="#22d3ee" />
    </svg>
  );
}

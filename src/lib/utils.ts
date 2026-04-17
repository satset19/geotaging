import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper standar shadcn/ui untuk menggabungkan classnames dengan resolusi konflik Tailwind.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

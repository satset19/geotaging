import * as React from 'react';
import { cn } from '@/lib/utils';

// Komponen Button minimal (port dari shadcn/ui new-york).
// Tidak menggunakan Slot/Radix karena kebutuhan proyek ini sederhana.
type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type Size = 'default' | 'sm' | 'lg' | 'icon';

const variantStyles: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive:
    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline:
    'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary:
    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};

const sizeStyles: Record<Size, string> = {
  default: 'h-11 px-4 py-2', // 44px minimum touch target untuk mobile
  sm: 'h-9 rounded-md px-3 text-xs',
  lg: 'h-12 rounded-lg px-8 text-base',
  icon: 'h-11 w-11',
};

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 select-none touch-manipulation';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return <button className={cn(variantClassMap[variant], className)} {...props} />;
}

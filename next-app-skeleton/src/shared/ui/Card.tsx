import type { PropsWithChildren } from 'react';

import { cn } from '@/shared/lib/utils';

interface CardProps extends PropsWithChildren {
  className?: string;
  title?: string;
}

export function Card({ className, title, children }: CardProps) {
  return (
    <section className={cn('card', className)}>
      {title ? <h3 className="card-title">{title}</h3> : null}
      {children}
    </section>
  );
}

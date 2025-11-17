'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/components/ui/utils';

interface AppIconHomeLinkProps {
  className?: string;
  size?: number;
}

export function AppIconHomeLink({ className, size = 32 }: AppIconHomeLinkProps) {
  const router = useRouter();
  const locale = useLocale();

  const handleClick = () => {
    router.push(`/${locale}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition hover:opacity-90',
        className
      )}
      aria-label="Go to home"
    >
      <Image
        src="/golfgun-180.png"
        alt="Golfgun home"
        width={size}
        height={size}
        priority
        className="rounded-full"
      />
    </button>
  );
}



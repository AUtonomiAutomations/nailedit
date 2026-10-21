import Link from 'next/link';
import { BRAND } from '@/lib/utils';

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }} aria-hidden>
      {/* a nail, head up */}
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="4" rx="1.5" fill="var(--accent)" />
        <path d="M10.5 7h3v10l-1.5 4-1.5-4z" fill="var(--bg)" />
      </svg>
    </span>
  );
}
export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="logo"><LogoMark />{BRAND}</Link>
  );
}

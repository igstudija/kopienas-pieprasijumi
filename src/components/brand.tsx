import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Specifiskie prasījumi — sākums">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      {!compact && <span>Specifiskie<br /><strong>prasījumi</strong></span>}
    </Link>
  );
}

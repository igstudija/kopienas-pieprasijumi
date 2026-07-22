import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Kopienas pieprasījumi — sākums">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      {!compact && <span>Kopienas<br /><strong>pieprasījumi</strong></span>}
    </Link>
  );
}

/**
 * RAGX mark — stacked retrieval layers.
 * Three chunk rows in a precision tile; the middle row is pulled
 * right in Apple blue: the retrieved context.
 */

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="RAGX logo"
    >
      <rect x="1" y="1" width="30" height="30" rx="8.5" fill="#1D1D1F" />
      <rect x="8" y="9.5" width="16" height="3.5" rx="1.75" fill="#fff" opacity="0.55" />
      <rect x="8" y="14.25" width="19" height="3.5" rx="1.75" fill="#0071E3" />
      <rect x="8" y="19" width="13" height="3.5" rx="1.75" fill="#fff" opacity="0.55" />
    </svg>
  );
}

export function Logo({
  size = 24,
  className = "",
  wordmark = true,
}: {
  size?: number;
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {wordmark && (
        <span className="text-[17px] font-semibold tracking-[-0.02em]">RAGX</span>
      )}
    </span>
  );
}

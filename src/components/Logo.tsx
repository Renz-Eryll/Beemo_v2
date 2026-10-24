export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-ink" />
        <path
          d="M16 6.5 24.2 11.2v9.6L16 25.5l-8.2-4.7v-9.6Z"
          fill="none"
          strokeWidth="2.2"
          strokeLinejoin="round"
          className="stroke-honey"
        />
        <circle cx="16" cy="16" r="3" className="fill-honey" />
      </svg>
      BeeMo
    </span>
  );
}

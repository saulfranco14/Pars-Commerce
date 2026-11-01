/** The «TLACO» pill from the video, so the worker knows who is talking. */
export function TlacoAiTag() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 py-0.5 pl-1 pr-2 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
      <svg viewBox="0 0 32 32" className="h-3 w-3" aria-hidden>
        <circle cx="16" cy="16" r="11" fill="none" stroke="var(--coin-face)" strokeWidth="9" />
        <path d="M16 1.5a14.5 14.5 0 0 1 0 29v-9a5.5 5.5 0 0 0 0-11z" fill="var(--coin-edge)" />
      </svg>
      Tlaco IA
    </span>
  );
}

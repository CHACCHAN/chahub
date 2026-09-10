export function Spinner() {
  return <svg aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".25" />
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}

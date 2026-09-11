type Props = {
  className?: string
  label?: string
}

export function MediaPlaceholder({ className, label = 'Kein Bild hinterlegt' }: Props) {
  return (
    <div className={className ? `ff-media-placeholder ${className}` : 'ff-media-placeholder'}>
      <svg
        aria-hidden="true"
        className="size-5 shrink-0 text-neutral-400"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m21 16-4.5-4.5L9 19" />
      </svg>
      <span>{label}</span>
    </div>
  )
}

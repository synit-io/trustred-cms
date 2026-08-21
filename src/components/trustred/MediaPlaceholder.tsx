type Props = {
  className?: string
  label?: string
}

export function MediaPlaceholder({ className, label = 'Kein Bild hinterlegt' }: Props) {
  return (
    <div className={className ? `ff-media-placeholder ${className}` : 'ff-media-placeholder'}>
      <span>{label}</span>
    </div>
  )
}

import { readLexicalText } from '@/lib/trustred/lexical'
import type { Form } from '@/payload-types'

type Props = {
  action: (formData: FormData) => Promise<void>
  className?: string
  description?: string
  form: Form
  hideHeader?: boolean
}

export function PublicForm({ action, className, description, form, hideHeader = false }: Props) {
  return (
    <form action={action} className={className ? `${className} grid gap-6` : 'ff-card grid gap-6'}>
      {!hideHeader ? (
        <div>
          <p className="ff-kicker">Formular</p>
          <h2 className="text-[clamp(1.6rem,3vw,2.6rem)]">{form.title}</h2>
          {description ? <p className="mt-3 text-sm leading-7 text-neutral-700">{description}</p> : null}
        </div>
      ) : null}

      <div className="ff-form-grid">
        {(form.fields ?? []).map((field, index) => {
          if (field.blockType === 'message') {
            const message = readLexicalText(field.message)

            return (
              <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700" key={`message-${index}`}>
                {message || 'Hinweis'}
              </div>
            )
          }

          const widthClass = field.width && field.width <= 50 ? 'md:col-span-1' : 'md:col-span-2'
          const label = field.label || field.name
          const required = Boolean(field.required)

          if (field.blockType === 'textarea') {
            return (
              <label className={widthClass} key={field.name}>
                {label}
                <textarea
                  className="ff-input min-h-36"
                  defaultValue={String(field.defaultValue ?? '')}
                  name={field.name}
                  required={required}
                  rows={6}
                />
              </label>
            )
          }

          if (field.blockType === 'select') {
            return (
              <label className={widthClass} key={field.name}>
                {label}
                <select className="ff-input" defaultValue={field.defaultValue || ''} name={field.name} required={required}>
                  {!field.defaultValue ? (
                    <option disabled value="">
                      {field.placeholder || 'Bitte auswählen'}
                    </option>
                  ) : null}
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )
          }

          if (field.blockType === 'checkbox') {
            return (
              <label className={`${widthClass} flex items-start gap-3 rounded-[1.1rem] border border-neutral-200 bg-neutral-50 px-4 py-4`} key={field.name}>
                <input
                  className="mt-1 h-4 w-4 accent-[var(--brand-500)]"
                  defaultChecked={Boolean(field.defaultValue)}
                  name={field.name}
                  required={required}
                  type="checkbox"
                />
                <span className="text-sm leading-7 text-neutral-800">{label}</span>
              </label>
            )
          }

          return (
            <label className={widthClass} key={field.name}>
              {label}
              <input
                className="ff-input"
                defaultValue={'defaultValue' in field ? String(field.defaultValue ?? '') : ''}
                name={field.name}
                placeholder={'placeholder' in field ? String(field.placeholder ?? '') : undefined}
                required={required}
                type={field.blockType === 'email' ? 'email' : field.blockType === 'number' ? 'number' : 'text'}
              />
            </label>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="ff-btn-accent" type="submit">
          {form.submitButtonLabel || 'Absenden'}
        </button>
      </div>
    </form>
  )
}

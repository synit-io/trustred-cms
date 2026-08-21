import { redirect } from 'next/navigation'

import { PublicForm } from '@/components/trustred/PublicForm'
import { getRenderablePublicForm, submitConfiguredForm } from '@/lib/trustred/public-forms'
import type { PublicFormReference } from '@/lib/trustred/public-forms'
import { toRelationId } from '@/lib/trustred/page-builder'

type Props = {
  block: {
    blockName?: string | null
    eyebrow?: string | null
    form?: number | { id?: number | null } | null
    formMode?: 'custom' | 'preset' | null
    headline: string
    intro?: string | null
    presetKey?: 'contact' | 'join' | null
    successMessage?: string | null
  }
  index: number
  pathname: string
  submittedForm?: string | null
}

export async function PageFormBlock({ block, index, pathname, submittedForm }: Props) {
  const formReference: PublicFormReference | null =
    block.formMode === 'custom'
      ? (() => {
          const formId = toRelationId(block.form)
          return typeof formId === 'number' ? { id: formId, kind: 'custom' as const } : null
        })()
      : {
          key: block.presetKey === 'join' ? 'join' : 'contact',
          kind: 'preset' as const,
        }

  if (!formReference) {
    return (
      <section className="ff-section">
        <div className="site-container">
          <div className="ff-card border-amber-200 bg-amber-50 text-sm text-amber-950">
            Für diesen Formular-Block ist noch kein Formular ausgewählt.
          </div>
        </div>
      </section>
    )
  }

  const resolvedFormReference: PublicFormReference = formReference
  const resolvedForm = await getRenderablePublicForm(resolvedFormReference)
  if (!resolvedForm) {
    return (
      <section className="ff-section">
        <div className="site-container">
          <div className="ff-card border-amber-200 bg-amber-50 text-sm text-amber-950">
            Das ausgewählte Formular konnte nicht geladen werden.
          </div>
        </div>
      </section>
    )
  }

  const successToken = String(
    block.blockName?.trim() || `form-${formReference.kind === 'preset' ? formReference.key : resolvedForm.form.id}-${index}`,
  )
  const successMessage = block.successMessage?.trim() || resolvedForm.successMessage
  const isSubmitted = submittedForm === successToken

  async function submitAction(formData: FormData) {
    'use server'

    await submitConfiguredForm(resolvedFormReference, formData)
    redirect(`${pathname}?submittedForm=${encodeURIComponent(successToken)}`)
  }

  return (
    <section className="ff-section">
      <div className="site-container grid gap-6">
        <div className="ff-section-head">
          {block.eyebrow ? <p className="ff-kicker">{block.eyebrow}</p> : null}
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)]">{block.headline}</h2>
          {block.intro ? <p className="text-lg leading-8 text-neutral-700">{block.intro}</p> : null}
        </div>

        <div className="grid gap-4">
          {isSubmitted ? (
            <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}
          <PublicForm
            action={submitAction}
            description={block.intro?.trim() || resolvedForm.description}
            form={resolvedForm.form}
          />
        </div>
      </div>
    </section>
  )
}

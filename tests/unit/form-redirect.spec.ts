import { describe, expect, it } from 'vitest'

import { safeFormRedirectPath } from '@/lib/trustred/form-redirect'

describe('form confirmation destinations', () => {
  it('keeps local paths and rejects external destinations', () => {
    expect(safeFormRedirectPath('/danke?source=form')).toBe('/danke?source=form')
    expect(safeFormRedirectPath('https://evil.example/danke')).toBeNull()
    expect(safeFormRedirectPath('//evil.example/danke')).toBeNull()
    expect(safeFormRedirectPath('/\\evil.example/danke')).toBeNull()
  })
})

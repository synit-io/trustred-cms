import { describe, expect, it } from 'vitest'

import { findDuplicateFormFieldName, nextUniqueFormFieldName } from '@/lib/trustred/form-field-names'

describe('form field names', () => {
  it('assigns a distinct name when adding or duplicating a field', () => {
    const fields = [{ blockType: 'text', name: 'first' }, { blockType: 'email', name: 'first_2' }]
    expect(nextUniqueFormFieldName('first', fields)).toBe('first_3')
    expect(findDuplicateFormFieldName([...fields, { blockType: 'text', name: 'first_3' }])).toBeNull()
  })
})

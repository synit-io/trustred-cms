type NamedField = { blockType?: string | null; name?: string | null }

export function normalizeFormFieldName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function nextUniqueFormFieldName(base: string, fields: NamedField[]) {
  const normalized = normalizeFormFieldName(base) || 'field'
  const used = new Set(fields.map((field) => normalizeFormFieldName(field.name ?? '')))
  let candidate = normalized
  let suffix = 2
  while (used.has(candidate)) {
    candidate = `${normalized}_${suffix}`
    suffix += 1
  }
  return candidate
}

export function findDuplicateFormFieldName(fields: NamedField[]) {
  const seen = new Set<string>()
  for (const field of fields) {
    if (field.blockType === 'message') continue
    const name = normalizeFormFieldName(field.name ?? '')
    if (!name) continue
    if (seen.has(name)) return name
    seen.add(name)
  }
  return null
}

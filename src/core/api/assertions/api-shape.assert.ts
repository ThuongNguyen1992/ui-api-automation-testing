import { expect } from '@playwright/test'

/**
 * Response shape check without a schema library: every key of the shape must exist with the given type.
 * Catches a removed / renamed / retyped field (spot checks with toHaveProperty do not).
 *
 *   const COUNTRY: Shape = { id: 'string', name: 'string', isActive: 'boolean', code: ['string', 'null'] }
 *   expectShape(item, COUNTRY, 'country')
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
export type Shape = Record<string, FieldType | FieldType[]>

const typeOf = (value: unknown): FieldType =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : (typeof value as FieldType)

export function expectShape(obj: unknown, shape: Shape, label = 'response') {
  expect(typeOf(obj), `${label} is an object`).toBe('object')
  const record = obj as Record<string, unknown>
  const wrong = Object.entries(shape)
    .filter(([key, type]) => !(Array.isArray(type) ? type : [type]).includes(key in record ? typeOf(record[key]) : ('missing' as FieldType)))
    .map(([key, type]) => `${key}: expected ${[type].flat().join(' | ')}, got ${key in record ? typeOf(record[key]) : 'missing'}`)
  expect(wrong, `${label} shape`).toEqual([])
}

/** Every item of a list has the shape (empty list → fails: use with lists that must have data) */
export function expectEachShape(items: unknown, shape: Shape, label = 'item') {
  expect(Array.isArray(items) && items.length > 0, `${label} list is a non-empty array`).toBe(true)
  ;(items as unknown[]).forEach((item, i) => expectShape(item, shape, `${label}[${i}]`))
}

import { describe, it, expect } from 'vitest'
import { generateTransferNote, parseTransferNote } from '../transfer-note'

describe('generateTransferNote', () => {
  it('produces DONATE-<shortId>-<random> format', () => {
    const note = generateTransferNote('clz1234567890')
    expect(note).toMatch(/^DONATE-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })
  it('uses first 4 uppercase chars of userId', () => {
    const note = generateTransferNote('abcd-rest')
    expect(note.startsWith('DONATE-ABCD-')).toBe(true)
  })
  it('falls back to GUEST for null userId', () => {
    const note = generateTransferNote(null)
    expect(note.startsWith('DONATE-GUES-')).toBe(true)
  })
})

describe('parseTransferNote', () => {
  it('extracts note from bank content with surrounding text', () => {
    const content = 'CK tu NGUYEN VAN A noi dung DONATE-U5K7-AB12 cam on'
    expect(parseTransferNote(content)).toBe('DONATE-U5K7-AB12')
  })
  it('returns null when no note present', () => {
    expect(parseTransferNote('chuyen tien an trua')).toBeNull()
  })
  it('is case-insensitive on input but returns uppercase', () => {
    expect(parseTransferNote('donate-u5k7-ab12')).toBe('DONATE-U5K7-AB12')
  })
})

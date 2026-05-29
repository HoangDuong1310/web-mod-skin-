const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomBlock(len = 4): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)]
  }
  return out
}

export function generateTransferNote(userId: string | null): string {
  const raw = (userId ?? 'guest').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const shortId = (raw.slice(0, 4) || 'GUES').padEnd(4, 'X')
  return `DONATE-${shortId}-${randomBlock(4)}`
}

const NOTE_REGEX = /DONATE-[A-Z0-9]{4}-[A-Z0-9]{4}/i

export function parseTransferNote(bankContent: string): string | null {
  const match = bankContent.match(NOTE_REGEX)
  return match ? match[0].toUpperCase() : null
}

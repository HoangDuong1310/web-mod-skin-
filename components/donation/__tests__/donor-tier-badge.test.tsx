// components/donation/__tests__/donor-tier-badge.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DonorTierBadge } from '../donor-tier-badge'

describe('DonorTierBadge', () => {
  it('renders the tier label', () => {
    render(<DonorTierBadge tier="GOLD" />)
    expect(screen.getByText('Gold')).toBeInTheDocument()
  })
  it('renders nothing for null tier', () => {
    const { container } = render(<DonorTierBadge tier={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})

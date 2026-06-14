import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { PostDownloadDonateModal } from '@/components/donation/post-download-donate-modal'
import { useDonation } from '@/hooks/use-donation'

// DonateForm fetches settings on mount; stub it to a simple marker
vi.mock('@/components/donation/donate-form', () => ({
  DonateForm: () => <div data-testid="donate-form" />,
}))

describe('PostDownloadDonateModal', () => {
  beforeEach(() => {
    // reset store to closed state
    act(() => {
      useDonation.getState().closeModal()
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('is hidden when no modal context is set', () => {
    render(<PostDownloadDonateModal />)
    expect(screen.queryByTestId('donate-form')).not.toBeInTheDocument()
  })

  it('is hidden when the context is not post-download', () => {
    act(() => {
      useDonation.getState().openModal('header')
    })
    render(<PostDownloadDonateModal />)
    expect(screen.queryByTestId('donate-form')).not.toBeInTheDocument()
  })

  it('renders the donate form when context is post-download', () => {
    act(() => {
      useDonation.getState().openModal('post-download')
    })
    render(<PostDownloadDonateModal />)
    expect(screen.getByTestId('donate-form')).toBeInTheDocument()
  })

  it('closes the store when dismissed via Maybe later', async () => {
    act(() => {
      useDonation.getState().openModal('post-download')
    })
    render(<PostDownloadDonateModal />)

    const laterButton = screen.getByRole('button', { name: /maybe later|để sau/i })
    await act(async () => {
      laterButton.click()
    })

    expect(useDonation.getState().isModalOpen).toBe(false)
    expect(useDonation.getState().modalContext).toBeNull()
  })
})

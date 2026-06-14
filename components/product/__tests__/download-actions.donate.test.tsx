import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import DownloadActions from '@/components/product/download-actions'
import { useDonation } from '@/hooks/use-donation'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

// The component fetches '/api/settings/download' on mount and
// '/api/products/:id/download' on click. Return delay-disabled settings so the
// "Download Now" button triggers handleDownload directly (no 30s countdown),
// and route the download call to the caller-supplied response.
function stubFetch(downloadResponse: { ok: boolean; json: () => Promise<unknown> }) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (typeof url === 'string' && url.includes('/api/settings/download')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ downloadDelayEnabled: false, downloadDelaySeconds: 0 }),
        })
      }
      return Promise.resolve(downloadResponse)
    })
  )
}

describe('DownloadActions post-download donate trigger', () => {
  beforeEach(() => {
    act(() => useDonation.getState().closeModal())
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('opens the post-download donate modal after a successful download', async () => {
    const openSpy = vi.spyOn(useDonation.getState(), 'openModal')
    stubFetch({
      ok: true,
      json: async () => ({ downloadUrl: 'https://example.com/file.zip', filename: 'file.zip' }),
    })

    render(<DownloadActions productId="prod_1" hasDownloadUrl hasExternalUrl={false} />)

    const button = await screen.findByRole('button', { name: /download now/i })
    await act(async () => {
      fireEvent.click(button)
    })

    expect(openSpy).toHaveBeenCalledWith('post-download')
  })

  it('does not open the modal when the download fails', async () => {
    const openSpy = vi.spyOn(useDonation.getState(), 'openModal')
    stubFetch({ ok: false, json: async () => ({ error: 'nope' }) })

    render(<DownloadActions productId="prod_1" hasDownloadUrl hasExternalUrl={false} />)

    const button = await screen.findByRole('button', { name: /download now/i })
    await act(async () => {
      fireEvent.click(button)
    })

    expect(openSpy).not.toHaveBeenCalled()
  })
})

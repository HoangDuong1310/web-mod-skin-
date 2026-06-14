import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import MyDownloads from '@/components/user/my-downloads'
import { useDonation } from '@/hooks/use-donation'

describe('MyDownloads post-download donate trigger', () => {
  beforeEach(() => {
    act(() => useDonation.getState().closeModal())
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('opens the donate modal after a successful re-download', async () => {
    const openSpy = vi.spyOn(useDonation.getState(), 'openModal')

    const fetchMock = vi
      .fn()
      // initial /api/user/downloads load
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          downloads: [
            {
              id: 'd1',
              softwareName: 'Test',
              softwareSlug: 'test',
              softwareId: 'sw1',
              category: 'Tools',
              downloadDate: new Date().toISOString(),
              version: '1.0',
              size: '1 MB',
              averageRating: 0,
              totalReviews: 0,
            },
          ],
          stats: {},
        }),
      })
      // /api/products/sw1/download-info
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ downloadUrl: 'https://example.com/test.zip', filename: 'test.zip' }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      render(<MyDownloads />)
    })

    const button = await screen.findByRole('button', { name: /download/i })
    await act(async () => {
      fireEvent.click(button)
    })

    expect(openSpy).toHaveBeenCalledWith('post-download')
  })
})

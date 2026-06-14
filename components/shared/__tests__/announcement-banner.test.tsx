import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { AnnouncementBanner } from '@/components/shared/announcement-banner'

// next-auth/react is globally mocked in tests/setup.ts (unauthenticated)

function mockFetchOk() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ banners: [] }),
  })
}

describe('AnnouncementBanner refresh behavior', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('re-fetches banners every 60 seconds', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    // Fake only timer APIs BEFORE mount so the polling interval is registered
    // on the fake clock (and thus advanceable), while leaving the React 18
    // scheduler (queueMicrotask/MessageChannel/performance) on real timers.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] })

    await act(async () => {
      render(<AnnouncementBanner position="TOP" />)
    })

    const initialCalls = fetchMock.mock.calls.length
    expect(initialCalls).toBeGreaterThanOrEqual(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60 * 1000)
    })

    expect(fetchMock.mock.calls.length).toBe(initialCalls + 1)
  })

  it('re-fetches when the tab becomes visible', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      render(<AnnouncementBanner position="TOP" />)
    })

    const initialCalls = fetchMock.mock.calls.length

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(fetchMock.mock.calls.length).toBe(initialCalls + 1)
  })

  it('cleans up the interval and listener on unmount', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    let unmount: () => void = () => {}
    await act(async () => {
      const result = render(<AnnouncementBanner position="TOP" />)
      unmount = result.unmount
    })

    await act(async () => {
      unmount()
    })

    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))

    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] })
    const callsAfterUnmount = fetchMock.mock.calls.length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120 * 1000)
    })
    expect(fetchMock.mock.calls.length).toBe(callsAfterUnmount)
  })
})

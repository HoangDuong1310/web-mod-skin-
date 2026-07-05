# Banner Refresh & Post-Download Donate Modal — Design Spec

**Date:** 2026-06-14
**Status:** Approved for planning
**Author:** Claude (brainstorming session)

## Overview

Two independent improvements to the web app:

1. **Banner refresh delay** — When an admin updates or creates a banner, users with an already-open tab wait a long time before the new content appears, even though the update saves successfully and shows immediately on page reload.
2. **Post-download donate modal** — The site survives on donations. Show a clear, dismissible donate modal (VietQR + Ko-fi) every time a user downloads, across all download surfaces.

These are unrelated features that happen to be requested together. They share no code and can be implemented and shipped independently.

---

## Feature 1: Banner Refresh Delay

### Root Cause

The banner data is correct on reload, which rules out the API, database, and write path. The API route [`app/api/banners/route.ts`](app/api/banners/route.ts) is `force-dynamic` and returns `Cache-Control: no-cache, no-store, must-revalidate`, so a fresh fetch always returns current data.

The delay comes entirely from the client polling interval:

- [`components/shared/announcement-banner.tsx`](components/shared/announcement-banner.tsx) re-fetches on a `setInterval` of **5 minutes**. An open tab can therefore show stale content for up to 5 minutes.
- [`components/shared/banner-modal.tsx`](components/shared/banner-modal.tsx) fetches **once on mount** and never re-polls. An open tab never sees a new modal banner until reload.

### Design

Make both components refresh more responsively without adding server infrastructure.

**Polling interval (both components):**
- Reduce the announcement-banner poll interval from 5 minutes to **60 seconds**.
- Add the same 60-second polling to the banner-modal, which currently has none.

**Focus-based refresh (both components):**
- Add a `visibilitychange` listener. When the tab becomes visible again (`document.visibilityState === 'visible'`), trigger an immediate re-fetch.
- This covers the most common real-world case: the admin updates a banner, then switches back to a tab that was left open — it refreshes instantly instead of waiting for the next interval tick.

**Cleanup:**
- Both the interval and the event listener must be removed on unmount to avoid leaks and duplicate timers.

### Components Touched

| File | Change |
|------|--------|
| [`components/shared/announcement-banner.tsx`](components/shared/announcement-banner.tsx) | Interval 5min → 60s; add `visibilitychange` refresh; ensure cleanup |
| [`components/shared/banner-modal.tsx`](components/shared/banner-modal.tsx) | Add 60s polling; add `visibilitychange` refresh; ensure cleanup |

### Data Flow

```
Admin saves banner (PATCH /api/banners/:id) → DB updated
        │
Open tab, every 60s OR on tab-focus
        │
        ▼
GET /api/banners?position=... (no-store, force-dynamic)
        │
        ▼
setBanners(...) → re-render with fresh content
```

### Error Handling

- Keep existing `try/catch` around fetches; on error, log and keep the current banners (no flicker, no crash).
- A failed poll is non-fatal; the next tick retries.

### Edge Cases

- Modal already dismissed: the existing `dismissedModalBanners` localStorage logic still applies after a re-fetch, so a re-poll won't re-show a banner the user already closed (within the 24h window).
- A banner that becomes inactive/expired disappears on the next poll because the public API filters by `isActive` and the start/end window.

### Out of Scope

- Server push (SSE/WebSocket) — rejected as overkill for occasional banner changes.
- Changing the API or DB — they already behave correctly.

---

## Feature 2: Post-Download Donate Modal

### Existing Foundation

Much of the plumbing already exists from the donate-first redesign:

- [`hooks/use-donation.ts`](hooks/use-donation.ts) already defines `ModalContext = 'header' | 'post-download' | null` and exposes `openModal(ctx)` / `closeModal()` plus `isModalOpen` and `modalContext` state.
- [`components/donation/donate-form.tsx`](components/donation/donate-form.tsx) already renders a unified donate form supporting VietQR + Ko-fi via the donation store.
- No component currently consumes the `post-download` context, and no download flow triggers `openModal`. This feature wires those together.

### Design

**Shared global modal:**
- Create `components/donation/post-download-donate-modal.tsx`. It reads `isModalOpen` and `modalContext` from the donation store and renders only when `modalContext === 'post-download'`.
- Built on the existing `Dialog` UI primitive, consistent with [`components/shared/banner-modal.tsx`](components/shared/banner-modal.tsx).
- Content: a short thank-you/support message, the existing `<DonateForm>` (VietQR + Ko-fi), and a clearly visible close control. The modal is dismissible (overlay click, X button, and an explicit "Maybe later" action).
- Mounted once in the shared layout so it is available on every page that has download actions.

**Trigger helper:**
- Add a small helper to trigger the modal after a successful download. Each of the three download surfaces calls it immediately after the download is confirmed started.
- The helper simply calls `useDonation.getState().openModal('post-download')` (or the hook's `openModal` where a hook is already in use).

**Frequency:**
- Per the approved decision, the modal shows on **every** successful download. No cooldown/throttle for this feature. (The separate 7-day `shouldShowNudge` logic in the store is unrelated and untouched.)

**Trigger timing:**
- Fire only after the download has successfully started (inside the success branch), never on a failed/aborted download.

### Components Touched

| File | Change |
|------|--------|
| `components/donation/post-download-donate-modal.tsx` | **New** — shared modal consuming `post-download` context |
| Shared layout (e.g. [`app/(marketing)/layout.tsx`](app/(marketing)/layout.tsx) and/or the app layout that hosts My Downloads) | Mount `<PostDownloadDonateModal />` once |
| [`components/product/download-actions.tsx`](components/product/download-actions.tsx) | Call `openModal('post-download')` in the download success branch |
| [`components/custom-skins/download-button.tsx`](components/custom-skins/download-button.tsx) | Call `openModal('post-download')` after a successful download (both protocol and direct-download success paths) |
| [`components/user/my-downloads.tsx`](components/user/my-downloads.tsx) | Call `openModal('post-download')` after a successful re-download |

### Data Flow

```
User clicks download (any of 3 surfaces)
        │
        ▼
Download request succeeds (file/redirect starts)
        │
        ▼
openModal('post-download')  → donation store: isModalOpen=true, modalContext='post-download'
        │
        ▼
<PostDownloadDonateModal> renders → user donates (VietQR/Ko-fi) or dismisses
```

### Error Handling

- The modal trigger runs only in the success path. If a download fails, the existing error toast shows and the modal does not open.
- The modal itself reuses the donate form's existing error handling for donation submission.

### Edge Cases

- Rapid repeated downloads: opening an already-open modal is idempotent (state stays open); no stacking.
- Custom skins protocol path: the download "succeeds" optimistically when the protocol handler is invoked; the modal opens at that point, consistent with the user's "every download" choice.
- Server-rendered product page: the modal is a client component mounted in the layout, so it works regardless of which page triggered it.

### Security / Privacy

- No new endpoints, no auth changes. The modal reuses existing public donation settings already exposed via `/api/donations/settings`.

### Out of Scope

- Cooldown/throttling of the post-download modal (explicitly chosen to show every time).
- Changes to the donate form, tier system, or donation verification.
- The header donate nudge (`shouldShowNudge`) remains as-is.

---

## Testing Strategy

**Feature 1 (banners):**
- Component tests (React Testing Library + fake timers): assert a re-fetch fires after 60s, and that a `visibilitychange` to visible triggers an immediate re-fetch. Assert interval and listener are cleaned up on unmount.

**Feature 2 (donate modal):**
- Component test for `post-download-donate-modal.tsx`: renders when `modalContext === 'post-download'`, hidden otherwise; dismiss control closes it.
- Tests for each download surface: mock a successful download and assert `openModal('post-download')` is called; mock a failure and assert it is not called.

---

## Rollout

Both features are low-risk, additive, and independently shippable. No database migrations, no new environment variables, no infrastructure changes.

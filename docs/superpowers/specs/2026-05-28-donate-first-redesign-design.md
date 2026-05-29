# Donate-First Website Redesign — Design Spec

**Date:** 2026-05-28  
**Status:** Draft  
**Sub-project:** 1 of 3 (Donation Core Redesign)

---

## 1. Context & Decision

WebModSkin chuyển sang mô hình **donate-first hoàn toàn**:

- Mọi features, skins, downloads đều miễn phí
- Doanh thu 100% từ donations tự nguyện
- Gỡ bỏ paid plans, orders, checkout (Sub-project 3)
- Tier system (Bronze/Silver/Gold) thay thế license keys — perks là cosmetic + community, không gate features

**Payment methods:** VietQR (chính, audience VN) + Ko-fi (phụ, quốc tế). Bỏ YeuMoney.

**Prompt strategy:** Balanced — header CTA, hero section, post-download modal (7-day cooldown), footer goal progress.

**Visual style:** Minimal, monochrome (black/white/gray), typography-driven. Không gradient, không emoji, không glow effects. Tham khảo: Stripe, Linear, Vercel.

---

## 2. Architecture

### 2.1 Approach: Hybrid (Unified Core + Micro-widgets)

```
┌─────────────────────────────────────────────────┐
│              DONATION CORE                        │
├─────────────────────────────────────────────────┤
│  hooks/use-donation.ts    → Zustand store        │
│  lib/donor-tiers.ts       → tier calculation     │
│  lib/vietqr.ts            → QR generation (keep) │
│  lib/kofi.ts              → Ko-fi redirect       │
│  api/donations/*          → REST endpoints       │
│  prisma/schema            → Donation, User tier   │
└──────────────────────┬──────────────────────────┘
                       │ consumed by
    ┌──────────────────┼──────────────────────┐
    ▼                  ▼                      ▼
┌──────────┐   ┌─────────────┐   ┌──────────────────┐
│DonateBtn │   │DonateForm   │   │PostDownloadModal │
│(header)  │   │(/donate)    │   │(after download)  │
└──────────┘   └─────────────┘   └──────────────────┘
    ┌──────────────┐    ┌───────────────────┐
    │GoalProgress  │    │DonorWall          │
    │(footer)      │    │(/donate, homepage)│
    └──────────────┘    └───────────────────┘
```

All UI components consume the unified `useDonation()` hook. No duplicated logic.

### 2.2 Files to Create

```
components/donation/
├── donate-button.tsx         # Header CTA, opens modal or navigates
├── donate-modal.tsx          # Lightweight modal wrapper
├── donate-form.tsx           # Core form (amount, message, QR/Ko-fi tabs)
├── donate-hero.tsx           # Hero block for /donate page
├── tier-ladder.tsx           # 3-column tier comparison
├── donor-tier-badge.tsx      # Small badge (xs/sm/md variants)
├── goal-progress.tsx         # Thin progress bar
├── donor-wall.tsx            # Recent donors list
├── post-download-modal.tsx   # "Enjoyed it?" nudge after download

hooks/
├── use-donation.ts           # Zustand store (replaces use-donation-overlay.ts)

lib/
├── donor-tiers.ts            # Tier constants + calculateTier()
├── vietqr.ts                 # Keep existing, minor refactor
├── kofi.ts                   # Keep existing
```

### 2.3 Files to Delete

```
components/shared/donation-form.tsx          # wrapper → replaced
components/shared/donation-form-new.tsx      # unused variant
components/shared/donation-form-clean.tsx    # merged into new donate-form.tsx
components/shared/donation-overlay.tsx       # replaced by donate-modal.tsx
components/shared/donation-provider.tsx      # replaced by layout-level integration
components/shared/donation-trigger.tsx       # replaced by donate-button.tsx
components/shared/donation-messages.tsx      # merged into donor-wall.tsx
components/shared/kofi-embed.tsx             # simplified into donate-form.tsx tab
hooks/use-donation-overlay.ts                # replaced by use-donation.ts
lib/yeumoney.ts                              # deleted (YeuMoney removed)
```

---

## 3. Tier System

### 3.1 Tier Definitions

| Tier | Min (VND) | Perks |
|------|-----------|-------|
| Bronze | 50.000₫ | Badge on profile, name on Donor Wall, thank-you email |
| Silver | 200.000₫ | All Bronze + Silver badge, early access skins (7 days), Discord supporter role |
| Gold | 500.000₫ | All Silver + Gold badge, priority support 24h, vote feature priority, name in app credits |

- Tier is **cumulative** (total of all verified donations)
- Tier is **permanent** (never downgrades)
- No license keys, no feature gating

### 3.2 Tier Calculation

```ts
// lib/donor-tiers.ts
export type DonorTier = 'BRONZE' | 'SILVER' | 'GOLD'

export const TIER_THRESHOLDS = {
  BRONZE: 50_000,
  SILVER: 200_000,
  GOLD: 500_000,
} as const

export function calculateTier(totalVND: number): DonorTier | null {
  if (totalVND >= TIER_THRESHOLDS.GOLD) return 'GOLD'
  if (totalVND >= TIER_THRESHOLDS.SILVER) return 'SILVER'
  if (totalVND >= TIER_THRESHOLDS.BRONZE) return 'BRONZE'
  return null
}

export function getNextTier(currentTier: DonorTier | null): { tier: DonorTier; remaining: number } | null {
  // Returns next tier and how much more VND needed
}
```

---

## 4. Donation Lifecycle

```
[CREATED] → POST /api/donations → transferNote generated
    │
    ▼
[PENDING] → user shown QR + bank info + transferNote
    │
    ├──► Bank webhook (Sepay/Casso) matches transferNote
    │    └──► [VERIFIED] → totalDonated += amount → tier recalculated → email sent
    │
    ├──► Admin manual verify (fallback)
    │    └──► [VERIFIED] → same flow
    │
    └──► 24h timeout → [EXPIRED]
```

### 4.1 TransferNote Format

```
DONATE-{USER_SHORT_ID}-{RANDOM_4}
```

Example: `DONATE-U5K7-AB12`

- Unique per donation
- Used as matching key for bank webhook
- Stored in `Donation.transferNote` (unique index)

---

## 5. API Surface

### 5.1 Keep (refactor)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/donations` | POST | Optional | Create pending donation |
| `/api/donations` | GET | Admin | List all donations |
| `/api/donations/[id]` | GET | Owner/Admin | Single donation status |
| `/api/donations/goals` | GET | Public | Active goal + progress |
| `/api/donations/settings` | GET | Public | VietQR config, Ko-fi username |
| `/api/donations/stats` | GET | Public | Totals, counts |

### 5.2 New

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/donations/donor-wall` | GET | Public | Recent verified donors (paginated) |
| `/api/donations/leaderboard` | GET | Public | Top donors all-time + monthly |
| `/api/donations/my-tier` | GET | User | Current tier + progress to next |
| `/api/webhooks/bank-transfer` | POST | Webhook secret | Sepay/Casso bank notification |

### 5.3 Remove

- `/api/webhooks/kofi` — simplify to log-only or remove
- `/api/webhooks/payment` — YeuMoney webhook, delete
- `/api/pay2s-webhook` — delete

---

## 6. DB Schema Changes

```prisma
// Add to User model
model User {
  // ... existing fields
  totalDonatedVND  Int       @default(0)
  donorTier        String?                  // BRONZE | SILVER | GOLD
  donorSince       DateTime?
  showOnDonorWall  Boolean   @default(true)
  
  donations        Donation[]
}

// Refactor Donation model
model Donation {
  id             String    @id @default(cuid())
  userId         String?
  amount         Int                        // VND, integer
  message        String?   @db.Text
  paymentMethod  String                     // VIETQR | KOFI
  
  status         String    @default("PENDING")  // PENDING | VERIFIED | EXPIRED
  transferNote   String?   @unique
  verifiedAt     DateTime?
  bankTxId       String?
  
  goalId         String?
  tierAtTime     String?
  isAnonymous    Boolean   @default(false)
  
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  user           User?     @relation(fields: [userId], references: [id])
  goal           DonationGoal? @relation(fields: [goalId], references: [id])
  
  @@index([userId, status])
  @@index([status, createdAt])
  @@index([transferNote])
}
```

Migration: existing USD donations converted to VND at snapshot rate (27,000), marked with `legacy` flag via a data migration script.

---

## 7. UI Components Detail

### 7.1 DonateButton (header)

- Black pill button "Donate" in header nav
- On click: navigates to `/donate` (desktop) or opens `DonateModal` (mobile)
- Always visible on non-admin pages

### 7.2 DonateForm

- Two tabs: VietQR (default) | Ko-fi
- VietQR tab: preset amounts grid (20k, 50k, 100k, 200k, 500k, 1M) + custom input + message textarea + QR preview
- Ko-fi tab: redirect button to Ko-fi page
- Tier hint below amount: "Mức X₫ tương ứng tier Y"
- Submit: "Tôi đã chuyển khoản" → creates PENDING donation → shows confirmation

### 7.3 TierLadder

- 3-column grid (responsive: stack on mobile)
- Each column: tier name (uppercase label), amount, perks list, CTA button
- "Phổ biến" tag on Silver
- Clicking CTA scrolls to form with amount pre-filled

### 7.4 GoalProgress (footer)

- Thin horizontal bar (1.5px height)
- Shows: current/target amount + percentage + donor count
- Fetches from `/api/donations/goals`
- Updates every 60s via polling (not real-time)

### 7.5 DonorWall

- Text-based list (not avatar grid)
- Each row: name, tier label, time ago
- Anonymous donors shown as italic "Anonymous"
- Paginated, default 8 shown

### 7.6 PostDownloadModal

- Triggered 3 seconds after any download completes
- Slide-in from bottom (not blocking overlay)
- Copy: "Bạn vừa tải [product]. Nó miễn phí nhờ sự ủng hộ của cộng đồng."
- Two buttons: [Để sau] [Ủng hộ]
- Dismissed → cookie `donate_nudge_dismissed` with 7-day expiry
- Respects `shouldShowOverlay()` logic (max 1 per 7 days)

---

## 8. Pages

### 8.1 /donate (redesign)

Layout (top to bottom):
1. DonateHero — headline, description, goal progress
2. DonateForm — centered, VietQR/Ko-fi tabs
3. TierLadder — 3-column comparison
4. DonorWall — recent supporters
5. FAQ — accordion

### 8.2 /donate/thank-you (keep, refactor)

- Shows donation status (polling `/api/donations/[id]`)
- States: "Đang chờ xác nhận..." → "Đã xác nhận! Tier: X"
- Share buttons (optional)

### 8.3 /donate/donors (new)

- Full leaderboard page
- Tabs: All-time | This month
- Sortable by total amount

### 8.4 Homepage changes

- Hero CTA: "Download Now" → "Tải miễn phí" (primary) + "Ủng hộ" (secondary)
- Add GoalProgress section below features
- Add DonorWall preview (4 recent) with "Xem tất cả" link

---

## 9. Bank Webhook Integration

### 9.1 Recommended: Sepay (sepay.vn)

- Free tier: 100 webhooks/month
- Setup: register bank account → get webhook URL → configure in Sepay dashboard
- Webhook payload includes: amount, transferContent, bankTxId, timestamp
- Match logic: `transferContent.includes(donation.transferNote)`

### 9.2 Fallback: Manual Admin Verification

- Dashboard page `/dashboard/donations` already exists
- Add "Verify" button per pending donation
- Admin pastes bank reference → marks verified
- Same `verifyDonation()` service function used by both paths

### 9.3 Webhook Endpoint

```ts
// POST /api/webhooks/bank-transfer
// Headers: x-webhook-secret (configured in env)
// Body: { amount, transferContent, bankTxId, timestamp }

// Logic:
// 1. Validate webhook secret
// 2. Extract transferNote from transferContent via regex
// 3. Find donation by transferNote where status = PENDING
// 4. Verify amount matches (±5% tolerance for bank fees)
// 5. Call verifyDonation(donationId, bankTxId)
```

---

## 10. State Management

Single Zustand store replaces current `use-donation-overlay.ts`:

```ts
// hooks/use-donation.ts
interface DonationStore {
  // Modal
  isModalOpen: boolean
  modalContext: 'header' | 'post-download' | null
  openModal: (ctx: ModalContext) => void
  closeModal: () => void
  
  // Form
  amount: number | null
  message: string
  paymentMethod: 'VIETQR' | 'KOFI'
  setAmount: (vnd: number) => void
  setMessage: (msg: string) => void
  setPaymentMethod: (m: PaymentMethod) => void
  
  // Settings (fetched once, cached)
  settings: DonationSettings | null
  goal: DonationGoal | null
  fetchSettings: () => Promise<void>
  
  // User tier
  myTier: DonorTier | null
  myTotalDonated: number
  fetchMyTier: () => Promise<void>
  
  // Nudge logic
  shouldShowNudge: () => boolean
  dismissNudge: () => void
  
  // Submit
  submit: () => Promise<DonationResult>
}
```

---

## 11. Error Handling

| Scenario | Handling |
|----------|----------|
| VietQR settings not configured | Show "Liên hệ admin" message, hide QR tab |
| Bank webhook fails to match | Log to error table, admin reviews manually |
| User donates without account | Allow guest donation (userId = null), no tier upgrade |
| Duplicate transferNote match | Reject second match, log warning |
| Amount mismatch (webhook vs donation) | Accept if within ±5%, flag for admin review otherwise |

---

## 12. Testing Strategy

- **Unit tests:** `calculateTier()`, `generateTransferNote()`, amount formatting
- **Integration tests:** POST /api/donations → verify DB state, webhook → verify tier upgrade
- **E2E (manual):** Full flow from form → QR → bank transfer → verification → tier display

---

## 13. Sub-project Scope Boundaries

**This spec covers (Sub-project 1):**
- New donation components
- Tier system
- API refactoring
- DB schema migration
- /donate page redesign
- Bank webhook integration

**Deferred to Sub-project 2:**
- Homepage hero redesign
- Post-download modal integration
- Footer goal progress
- Header donate button placement

**Deferred to Sub-project 3:**
- Remove /pricing, /cart, /checkout
- Remove orders system
- Remove paid plans
- Repurpose /profile/licenses → /profile/perks
- Delete YeuMoney code
- Legacy data migration

---

## 14. Mockup Reference

Visual mockup: `docs/superpowers/specs/mockups/donate-page-mockup-v2.html`

Open in browser to preview the approved minimal design.

# League Skins Dashboard - UI/UX Pro-Max Overhaul Plan

## 📋 Current State Summary

The current [`league-skins-management.tsx`](../components/dashboard/league-skins-management.tsx) is a basic 648-line component with:
- Two views (Champions table / Skins table) toggled by buttons
- Basic search, pagination, upload/delete functionality
- Minimal stats cards without icons
- No edit capabilities despite API support
- No filtering beyond search
- Poor mobile experience (tables only)

## 🎯 Goals

Transform the League Skins Dashboard into a **professional, fully-featured admin panel** with pro-max UI/UX using existing shadcn/ui components.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    A[League Skins Page] --> B[LeagueSkinsManagement - Main Component]
    B --> C[Stats Dashboard Section]
    B --> D[Tabs: Champions | All Skins | Upload Center]
    
    D --> E[Champions Tab]
    D --> F[All Skins Tab]
    D --> G[Upload Center Tab]
    
    E --> E1[Advanced Filters + Search]
    E --> E2[Champions Table / Card Grid]
    E --> E3[Champion Detail Sheet - slide-out panel]
    
    F --> F1[Advanced Filters: status + hasFile + champion + sort]
    F --> F2[Skins Table with inline actions]
    F --> F3[Edit Skin Dialog]
    F --> F4[Bulk Actions Bar]
    
    G --> G1[Drag and Drop Upload Zone]
    G --> G2[Upload Queue with Progress]
    G --> G3[Upload History and Results]
    
    C --> C1[Total Champions card with icon]
    C --> C2[Total Skins card with icon]
    C --> C3[Skins with Files card + progress bar]
    C --> C4[Total File Size card]
```

---

## 📝 Detailed Feature Plan

### 1. Enhanced Stats Dashboard
**File:** `components/dashboard/league-skins-management.tsx` (stats section)

- **4 stat cards** with proper icons, colors, and micro-animations:
  - 🏆 Total Champions (with Gamepad2 icon, blue accent)
  - 🎨 Total Skins (with Palette icon, purple accent)  
  - 📦 Skins with Files (with FileArchive icon, green accent + Progress bar showing %)
  - 💾 Total File Size (with HardDrive icon, orange accent) — *requires API enhancement*
- Each card has a subtle gradient background and hover effect
- Coverage progress bar under "Skins with Files" card

### 2. Tab-Based Navigation (Replace button toggle)
**File:** `components/dashboard/league-skins-management.tsx`

Replace the current Champions/Skins button toggle with `Tabs` component:
- **Tab 1: Champions** — Champion management with detail panel
- **Tab 2: All Skins** — Full skin management with filters
- **Tab 3: Upload Center** — Dedicated upload area with drag-drop

### 3. Champions Tab - Enhanced
**File:** `components/dashboard/league-skins-management.tsx`

- **Search bar** with debounced input (keep existing)
- **Table improvements:**
  - Champion avatar/icon placeholder (first letter badge)
  - Name EN + Name VI in stacked layout
  - Skins count with visual badge
  - File coverage as mini progress bar (e.g., "8/12 skins have files")
  - Quick actions: View Skins, Delete Champion
- **Champion Detail Sheet** (slide-out `Sheet` component):
  - Shows all skins of the selected champion in a mini-table
  - Quick upload/toggle/delete per skin
  - Coverage summary at top
  - Click champion row to open sheet instead of switching tabs

### 4. All Skins Tab - Full-Featured
**File:** `components/dashboard/league-skins-management.tsx`

- **Advanced Filter Bar:**
  - Search (existing)
  - Filter by Champion (Select dropdown)
  - Filter by File Status: All / Has File / No File
  - Filter by Active Status: All / Active / Inactive
  - Sort by: Skin ID / Champion / Name / File Size / Version
  - Items per page: 10 / 20 / 50 / 100
  - Clear all filters button
- **Bulk Selection:**
  - Checkbox on each row
  - Select all checkbox in header
  - Bulk actions bar appears when items selected:
    - Toggle Active/Inactive
    - Delete Selected Files
    - Delete Selected Skins
- **Table improvements:**
  - Skin ID as monospace badge
  - Champion name as clickable link (opens champion sheet)
  - Active status as Switch toggle (inline toggle)
  - File status with colored indicator + size
  - Version badge
  - Actions: Upload/Replace, Download, Edit Metadata, Delete File, Delete Skin
- **Edit Skin Dialog:**
  - Edit `nameEn`, `nameVi`
  - Toggle `isActive` with Switch
  - Preview current file info (size, hash, version)
  - Save/Cancel buttons

### 5. Upload Center Tab - Pro Upload Experience  
**File:** `components/dashboard/league-skins-management.tsx`

- **Drag & Drop Zone:**
  - Large drop area with visual feedback (border animation on drag-over)
  - Accept .zip files
  - File naming convention hint: "Name files as {skinId}.zip for auto-matching"
- **Upload Queue:**
  - List of selected files before upload
  - Show matched skin ID from filename
  - Show if skin exists in DB (green check) or not found (red x)
  - Remove individual files from queue
  - Progress bar per file during upload
- **Upload Results:**
  - Summary: X uploaded, Y skipped, Z errors
  - Expandable details for each file
  - Color-coded status badges

### 6. Manifest Management Enhancement
**File:** `components/dashboard/league-skins-management.tsx`

- Move "Generate Manifest" to a dedicated section/card in the header area
- Show last manifest generation time (if available)
- Show manifest stats preview before generation
- Confirmation dialog before generating
- Success toast with manifest URL (copyable)

### 7. Delete Confirmations - Improved
**File:** `components/dashboard/league-skins-management.tsx`

- Add confirmation dialog for file-only deletion (currently missing)
- Show what will be affected (e.g., "This will remove the file from R2 storage")
- Differentiate destructive levels visually:
  - File delete: Warning (amber)
  - Skin delete: Danger (red)
  - Champion delete: Critical (red with extra warning about cascade)

### 8. Mobile Responsive Design
**File:** `components/dashboard/league-skins-management.tsx`

- Card-based layout on mobile (< 768px) instead of tables
- Stacked filter controls
- Touch-friendly action buttons
- Collapsible stat cards
- Bottom sheet for actions on mobile

### 9. API Enhancement (Backend)
**File:** `app/api/admin/league-skins/route.ts`

- Add `totalFileSize` to stats response (SUM of all fileSize)
- Add filter support: `hasFile=true|false`, `isActive=true|false`
- Add sort support: `sortBy=skinId|championId|nameEn|fileSize|version`, `sortOrder=asc|desc`
- Add champion list endpoint for filter dropdown

### 10. Data Refresh & Loading States
**File:** `components/dashboard/league-skins-management.tsx`

- Add refresh button in header
- Skeleton loading states for tables (instead of single spinner)
- Optimistic updates for toggle actions
- Auto-refresh after upload/delete operations (already partially exists)

---

## 📁 Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `components/dashboard/league-skins-management.tsx` | **Rewrite** | Complete UI/UX overhaul with all features above |
| `app/api/admin/league-skins/route.ts` | **Enhance** | Add totalFileSize stat, filters, sorting, champion list for dropdown |
| `app/(app)/dashboard/league-skins/page.tsx` | **Minor** | May need layout adjustments |

---

## 🎨 UI/UX Pro-Max Design Principles

1. **Visual Hierarchy** — Stats at top, then tabs, then content with clear sections
2. **Micro-interactions** — Hover effects, smooth transitions, loading skeletons
3. **Contextual Actions** — Right actions at right time (bulk bar only when selected)
4. **Feedback** — Toast notifications, progress bars, confirmation dialogs
5. **Accessibility** — Keyboard navigation, screen reader labels, focus management
6. **Responsive** — Works on desktop, tablet, and mobile
7. **Consistent** — Match existing dashboard patterns from orders-client, enhanced-software-management

---

## 🔄 Implementation Order

1. Enhance API route with new filters, sorting, totalFileSize stat
2. Rewrite the main component with Tabs structure
3. Build Stats Dashboard section
4. Build Champions Tab with detail Sheet
5. Build All Skins Tab with filters, bulk actions, inline toggles, edit dialog
6. Build Upload Center Tab with drag-drop and queue
7. Add delete confirmation improvements
8. Add mobile responsive design
9. Test all functionality end-to-end

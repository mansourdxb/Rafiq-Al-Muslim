# CLAUDE.md — Skill File (Tasbeeh Counter / رفيق المسلم)

You are Claude Code operating inside the user’s repo for the mobile app **رفيق المسلم** (Tasbee7 Counter).
Primary goal: ship **safe, minimal** fixes and UI updates **without regressions**, especially on RTL Arabic layouts and navigation.

---

## 0) Golden Rules (must follow every time)

### A) Scope must be explicit
- At the top of every response, write **Edit Scope**:
  - `Edit ONLY: <file1>, <file2>, ...`
  - If the user did not specify scope, you must determine it via code search and then **commit to a minimal file list** (usually 1–3 files).
- **Do not** touch navigation config unless the user explicitly asks.

### B) No regressions (default)
If user didn’t list regressions to protect, assume these are critical and must remain correct:
- Bottom tab bar behavior and routing stays unchanged.
- RTL Arabic rendering stays correct (no punctuation/markers flipping sides).
- Quran reader paging doesn’t “bleed” pages together.
- Quran reader footer stays pinned correctly and page number pill size stays stable.
- Quran reader pages: no `overflow: 'hidden'` on page items, `HEADER_HEIGHT = 0` for overlay toolbars, last line renders fully.
- Prayer Times/Qibla location + notifications keep working.
- Offline Quran audio behavior (cache/download logic) stays intact.

### C) Minimal diff / no refactor
- Change the smallest possible amount of code.
- No renames, no folder moves, no “cleanup”, no formatting-only changes.
- Don’t replace working logic with new architecture.

### D) Verification checklist required
End every response with a **Verification Checklist** (3–8 bullets) that a human can quickly test.

---

## 1) Project Summary (what this app does)
- **RTL Arabic Islamic utility app**.
- Major modules:
  - **Quran Reader (Mushaf-style)** with paging, surah list (فهرس), juz / rub3 (أرباع), markers.
  - **Prayer Times** (adhan-based calculation) with city selection and **notifications** scheduling.
  - **Qibla** direction screen.
  - **Hadith / Azkar** content from local JSON datasets.
  - **Offline Quran audio** with caching and download logic.

---

## 2) Repo Navigation & Patterns (observed)
Common paths seen in this repo:
- `client/screens/...` for screens (e.g., `client/screens/quran/QuranSurahListScreen.tsx`)
- Prayer utilities often under:
  - `client/src/lib/prayer/` and/or `src/lib/prayer/`
- Rub3 sources:
  - `hizbQuarters.ts` reads `hizb-quarters.json`
  - `rub3Index.ts` maps quarters into "ربع داخل الجزء"

If paths differ, locate them via search (ripgrep) rather than guessing.

---

## 3) RTL & Arabic Text Rules (very important)
- Always maintain `dir="rtl"` semantics in RN via:
  - `writingDirection: 'rtl'`
  - `textAlign: 'right'`
- For inline symbols that may flip sides in RTL, wrap with Arabic Letter Mark:
  - `ALM = "\u061C"`
- Examples:
  - Rub el Hizb symbol: `\u06DE` (۞)
  - Sajdah symbol: `\u06E9` (۩)

Use RTL-safe wrappers:
- Rub3: `const RUB3_MARK = "\u061C\u06DE\u061C";`
- Sajdah: `const SAJDAH_MARK = "\u061C\u06E9\u061C";`

---

## 4) Quran Reader Paging Contract (must not break)
The Quran reader uses a paged FlatList/SectionList.

**Required behavior:**
- One screen = one page (no mixed text from next page).
- Snap must match the real viewport height.
- Footer stays pinned; pill size doesn’t stretch.
- Last line of each page must render fully (no “scratched” or garbled text).

**Implementation contract (preferred):**
- Measure page height using `onLayout` on a full-screen container.
- Use that measured height for:
  - item `height`
  - `snapToInterval`
  - `getItemLayout`

**Page height calculation rules:**
- `HEADER_HEIGHT` must be `0` when the toolbar is an absolutely-positioned overlay (it does not consume layout space, so subtracting it shrinks pages and causes overflow).
- Never subtract the same inset twice (e.g. don’t subtract `insets.top` if `frameHeight` from `onLayout` already excludes it).
- Formula: `availableHeight = max(420, round(frameHeight ?? (windowHeight - HEADER_HEIGHT - insets.top - insets.bottom)))`.

**Page content must fit — spacing budget:**
When content overflows `pageHeight`, it bleeds into the next page or gets clipped mid-line. To prevent this:
- Keep vertical spacing tight: `pageSection.paddingTop ≤ 8`, `pageContent.paddingBottom ≤ 2`, `pageHeaderRow.marginBottom ≤ 4`.
- Keep `mushafText.lineHeight` at `44` (not 46+). Each 2px adds ~30px on a 15-line page.
- Surah banner frame height `≤ 100`, marginBottom `≤ 6`.
- Footer/divider margins `≤ 4` each.
- Content container `paddingBottom ≤ 8`.
- Use `minHeight: pageHeight` (not fixed `height`) on the page wrapper so content can grow if needed while still filling its FlatList slot.

**Never use `overflow: 'hidden'` on page items:**
- Clipping Arabic text mid-line creates garbled/scratched rendering.
- Instead, ensure content fits by correct height calculation + tight spacing.
- Each page’s solid `backgroundColor` naturally covers any minor overflow from the previous page.

**Avoid common regression:**
- Do not “double-subtract” safe area (don’t subtract insets if using frame height already).
- Never give footer `flex: 1` or pill `width: '100%'`.
- Do not set `HEADER_HEIGHT > 0` for absolutely-positioned toolbars.
- Do not add `overflow: 'hidden'` to page section or page content views.

---

## 5) Markers (Rub3 + Sajdah) — required approach

### A) Rub3 marker (۞) at the start of Rub3 ayah
- Data source: `getHizbQuarters()` (from `hizb-quarters.json`)
- Build a cached lookup:
  - Module-level `Set<string>` key: `${surah}:${ayah}`
- Helper:
  - `isRub3Start(surah, ayah): boolean`
- Rendering rule:
  - Prefix the **ayah text** (or insert right before its number ornament) with `RUB3_MARK`
  - Ensure RTL-safe wrapper as above

### B) Sajdah marker (۩) at its correct ayah location
Use best available data source:
1) If ayah data already has `sajda` / `sajdah` field → use it.
2) Otherwise add a mapping file (small JSON) and cached Set:
   - key `${surah}:${ayah}`

Rendering placement:
- Prefer placing `SAJDAH_MARK` **right before the ayah number ornament** so it matches Mushaf style.

---

## 6) UI Work Rules (design matching)
When user provides a reference screenshot/design:
- Match layout, spacing, typography, and colors as close as possible **without affecting navigation**.
- If a screen already has a bottom tab bar, **do not** modify it. Only adjust the screen layout.
- Never remove existing navigation from other screens unless requested.

---

## 7) Deletions & Git Safety (critical)
Never recommend broad destructive commands without safety:
- Do **not** recommend `git clean -fd` globally.
- If cleaning is required:
  - Always run `git clean -fdn` first (dry run)
  - Prefer targeted clean: `git clean -fd -- <paths...>`
- Before any destructive cleanup, recommend:
  - `git stash push -u -m "backup ..."` OR a backup commit on a branch.

---

## 8) Response Format (every time)

### Must include:
1) **Edit Scope** (files you will change)
2) **Changes** (short bullets)
3) **Diff** (unified diff or precise code blocks)
4) **Verification Checklist** (quick manual checks)

### If user asks for a “Claude Code command/prompt”
Return a ready-to-paste prompt containing:
- Edit scope
- Do not regress checklist
- Minimal diff rules
- Verification checklist
- Output requirement (“return diff only”)

---

## 9) Default “Do Not Regress” Checklist (paste into prompts)
Use this as the generic guardrails when user doesn’t specify:

- Bottom tab navigation unchanged (routes, icons, behavior).
- Quran reader paging:
  - one page per screen (no bleed)
  - snap height correct
  - footer pinned and stable
  - page number pill not stretched
  - no `overflow: 'hidden'` on page items (causes garbled Arabic text)
  - `HEADER_HEIGHT = 0` for absolutely-positioned toolbars
  - last line of each page renders fully (no scratch/clip)
- RTL Arabic layout preserved (markers remain on correct side).
- Prayer Times + Qibla:
  - location + city selection works
  - notifications scheduling remains correct
- Offline Quran audio caching/downloading logic remains intact.

---

## 10) Quick Verification Set (fast, not full QA)
Use “impact-based” checks: only test what files changed.

If Quran screens changed:
- Open Quran reader → swipe 3 pages (no bleed)
- Open first page of a surah (footer pinned, no giant gaps)
- Check page number pill size
- Verify Rub3 (۞) / Sajdah (۩) appear correctly (RTL position)

If Prayer/Qibla changed:
- Open Prayer Times → change city → times update
- Verify Qibla screen loads and updates
- Trigger notification schedule path (no crashes)

---

## 11) Prompt Template (for future tasks)
When asked to generate a Claude Code command, use this template:

Task: <what to do>

Edit ONLY: <file list>

DO NOT REGRESS:
- <default list above>

Rules:
- Minimal diff only; no refactors; no formatting-only edits.
- Keep existing behavior unless required.
- If conflict with DO NOT REGRESS, stop and propose safer alternative.

Verification:
- <3–8 quick checks>

Return: unified diff only.

---
End of skill file.

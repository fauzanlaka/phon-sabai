# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev & Deploy

**Local dev:** `python3 -m http.server 8743` then open `http://localhost:8743`

**Deploy:** push to `main` — GitHub Pages serves directly from the root of `main` (`https://fauzanlaka.github.io/phon-sabai/`). No build step.

**After any change to `index.html`, `styles.css`, or `app.js`:** bump the cache version in `sw.js` (`const CACHE = "phon-sabai-vN"`) so returning users get fresh files. Without this, the service worker serves the old cached version.

**Verify live:** use Playwright (`npx playwright install chromium` once, then `node script.js`) with `chromium.launch({ headless: true })` against `http://localhost:8743` for local or the live URL.

## Architecture

No framework, no build toolchain. Three files do everything:

- **`index.html`** — markup + `<template id="planRowTpl">` (cloned per compare-plan row)
- **`styles.css`** — CSS custom properties for theming (`--primary`, `--surface`, etc.), dark-mode via `[data-theme="dark"]` on `<html>`
- **`app.js`** — single IIFE, no modules

### Calculation model (Flat rate)

```
financed      = price − down
monthlyInterest = financed × (rate / 100)
totalInterest   = monthlyInterest × months
monthlyPayment  = (financed + totalInterest) / months
totalAmount     = price + totalInterest   ← includes down in grand total
```

Down payment is capped at 70% of price (`MAX_DOWN_PCT = 0.7`), enforced in `capDown()`.

### app.js structure

| Area | Key functions |
|---|---|
| Theme | `applyTheme()`, `effectiveTheme()` — persisted in `localStorage` |
| Formatting | `formatPrice()`, `formatRate()`, `formatPct()`, `formatMonths()` |
| Core calc | `calculate()` — controls visibility of `#result` and `#compare` |
| Down chips | `updateDownChips()` — syncs preset buttons + custom `#downPct` input (two-way) |
| Compare plans | `computePlan()`, `updateRowDisplay()`, `renderPlans()`, `refreshAllDisplays()` |
| Persistence | Plans saved to `localStorage` key `phon-sabai:plans:v1` |

### Visibility rules

- `#result` hidden until `price > 0 && months > 0`
- `#compare` hidden until `price > 0 && rate > 0 && months > 0`
- Both controlled exclusively in `calculate()`

### Service worker

Stale-while-revalidate strategy: serves from cache immediately, updates cache in background. Cache name is the only versioning mechanism — incrementing `CACHE` in `sw.js` triggers eviction of old assets on next activate.

### CSS conventions

- `[hidden] { display: none !important }` overrides any `display: flex` on hidden sections
- Animations: `revealUp` for result/compare sections, `rowIn` for plan rows
- Dark mode tokens declared in `[data-theme="dark"]` block

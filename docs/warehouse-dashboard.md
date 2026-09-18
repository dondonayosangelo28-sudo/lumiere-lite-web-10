# WOM Warehouse Dashboard

## Overview

A warm cream, minimalist dashboard for the WOM (Warehouse Operations Manager) account. The page presents warehouse KPIs, a monthly event and ingress calendar, and a grouped upcoming-events roster.

## Layout

- Full-height desktop dashboard with a dark charcoal left navigation rail.
- Cream/off-white main canvas with generous whitespace and thin warm-gray borders.
- Use rounded cards, restrained shadows, serif display typography, and compact uppercase labels.
- Responsive behavior should collapse the four-card KPI row to two columns and stack the calendar and event roster on smaller screens.

## Navigation Rail

- Dark background: near-black charcoal.
- LUMIERE wordmark at the top in bronze serif lettering with wide tracking.
- Short muted divider beneath the wordmark.
- Vertical navigation items:
  - Dashboard — active, bronze filled rounded rectangle.
  - Asset Catalog.
  - Replenishment & Deficits — truncate gracefully when space is limited.
  - Vendor Management.
  - Dispatch & Logistics.
- Navigation icons are small, monochrome, and aligned consistently with labels.

## Dashboard Header

- Eyebrow: `WAREHOUSE OPERATIONS MANAGER` in small uppercase bronze text.
- Heading: `Good to see you, Warehouse.` in a large dark serif font.
- Right-side controls:
  - Rounded search field with search icon and placeholder `Search anything`.
  - Circular notification button.
  - Circular profile/account button.

## KPI Summary Cards

Display four equal-width cards in one row on desktop:

1. **TOTAL ASSETS**
   - Value: `24`
   - Supporting text: `Registered inventory`
   - Top-right icon: asset/cube cluster.
   - Bronze accent border.

2. **AVAILABLE ASSETS**
   - Value: `14`
   - Supporting text: `Ready for allocation`
   - Top-right icon: checkmark in a circle.
   - Green accent border.

3. **CRITICAL DEFICITS**
   - Value: `1` in red.
   - Supporting text: `Requires attention`
   - Top-right icon: warning triangle.
   - Soft red-tinted background and red accent border.

4. **PENDING PROCUREMENT**
   - Value: `28`
   - Supporting text: `Open replenishment items`
   - Top-right icon: currency/dollar badge.
   - Amber accent border.

Card styling:

- Warm white card background.
- 1px rounded border with subtle shadow.
- Uppercase labels with compact letter spacing.
- Large values use a dark serif font.
- Supporting text uses small muted sans-serif text.

## Calendar Panel

- Large rounded card titled `SEPTEMBER 2026`.
- Subtitle: `MONTHLY EVENT & INGRESS ROSTER`.
- Calendar icon in a soft beige square.
- Previous and next month buttons in the upper-right.
- Divider below the header.
- Legend:
  - Blue dot: `Ingress/Egress`.
  - Orange star: `Actual Event`.
- Seven-column month grid from Sunday through Saturday.
- Highlight September 18 with a bronze circular date marker and soft tinted cell.
- Event chips appear inside relevant dates, truncated when necessary.

## Upcoming Events Panel

- Separate rounded card to the right of the calendar.
- Title: `Upcoming Events (21)`.
- Subtitle: `MONTH-GROUPED ROSTER`.
- Scrollable event list grouped by month.
- September group label: `SEPTEMBER 2026 (4)`.
- Each event item includes:
  - Event title.
  - Venue/location.
  - Date.
  - Status or countdown badge.
- Example statuses:
  - `COMPLETED` in muted gray.
  - `2 DAYS LEFT` in pink/red.
  - `6 DAYS LEFT` and `1 WEEK LEFT` in amber.
- Continue with an `OCTOBER 2026 (6)` group below.

## Visual Direction

- Palette: charcoal rail, warm cream canvas, warm white cards, bronze primary accent, muted gray text, green availability accent, red deficit accent, amber procurement accent.
- Typography: serif for the LUMIERE wordmark, page heading, and KPI values; clean sans-serif for labels, navigation, metadata, and controls.
- Keep the interface quiet and operational: no gradients, no decorative illustrations, and no excessive motion.
- Maintain strong contrast and visible focus states for all controls.

## Dashboard Scope

This specification covers only the WOM Warehouse Dashboard screen: navigation rail, dashboard header, KPI cards, calendar panel, and upcoming-events panel. It does not define the detailed Asset Catalog, Vendor Management, Replenishment, Dispatch, or Audit Log screens.

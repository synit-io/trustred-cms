# TrustRed Frontend Design Spec

- **Version:** 1.0
- **Maintainer:** [synit.io](https://www.synit.io/products/trustred)
- **Audience:** Frontend developers, design system engineers, product designers
- **Scope:** Shared UI foundation for all TrustRed products serving aid
  organizations, including Feuerwehr, THW, Rettungsdienst, Katastrophenschutz,
  Wasserrettung, Bergrettung, and mixed-agency tools
- **License:** [PolyForm Noncommercial 1.0.0](../LICENSE)

---

## 1. Purpose

This document defines the implementation guardrails for the TrustRed frontend
design system. It is intended as a handoff-ready specification that developers
can use to build consistent, accessible, and organization-neutral interfaces
across the full TrustRed product family.

The system must support:

- public information products
- authenticated operational tools
- admin and coordination interfaces
- mobile-first field usage
- multi-organization deployments

The design language must feel:

- authoritative
- calm
- operational
- accessible
- trustworthy
- clear under stress

It must **not** feel:

- overly branded
- firefighter-exclusive
- decorative
- startup-like
- entertainment-oriented
- alarmist by default

---

## 2. Foundational principles

### 2.1 Calm is the default state

The interface should feel stable and readable in normal operation. Strong visual
urgency must appear only when content requires it.

### 2.2 Semantic meaning beats visual branding

Severity states such as warning, error, all-clear, and info must always use
semantic tokens, never organization branding tokens.

### 2.3 One family, many organizations

All products share the same layout, spacing, typography, components, and
accessibility rules. Organization-specific styling is limited to accents, logos,
and small identity surfaces.

### 2.4 Function over decoration

Use whitespace, borders, structure, and typography as primary design tools.
Decorative gradients, excessive shadows, and ornamental UI treatments are not
part of the system baseline.

### 2.5 Stress-resilient readability

Products must remain usable:

- on mobile devices
- outdoors in bright light
- with gloves or reduced dexterity where relevant
- under cognitive load
- by older and less technical users

### 2.6 Color is never the only carrier of meaning

Status and severity must always be paired with text and usually an icon.

### 2.7 Public products still need desirability

The family system must not become visually sterile on attendee-facing or
citizen-facing products.

Public-facing products should still feel:

- credible
- inviting
- polished
- conversion-capable where relevant

This desirability should come from:

- strong typography
- clear hierarchy
- well-composed factual modules
- disciplined brand emphasis

It should **not** come from:

- decorative blue structural highlights
- excessive gradients
- playful illustration-heavy treatment
- ad hoc marketing colors outside the semantic system

---

## 3. Product-family model

TrustRed uses a three-layer visual model.

### 3.1 Layer A: Shared family system

Always shared:

- typography
- spacing
- radii
- borders
- interaction states
- focus treatment
- alert semantics
- page layout logic
- form behavior
- component API patterns

### 3.2 Layer B: Product family brand

Used to identify TrustRed as the product family. This is the default primary
action color, but it is **not** the same thing as emergency severity.

Brand should also be the default shell emphasis for:

- primary call-to-action buttons
- top shell accent line
- selective public-page emphasis
- hover/active emphasis for non-semantic key actions

### 3.3 Layer C: Organization accent

Optional accent tokens for Feuerwehr, THW, Rettungsdienst, or other
organizations. These may be used for identity and navigation accents, but not
for warning/error semantics.

---

## 4. Design token architecture

All UI styling must be driven by semantic tokens. Do not hardcode ad hoc hex
values inside components.

### 4.1 Token categories

Use these groups:

- `brand-*`
- `neutral-*`
- `status-*`
- `org-accent-*`
- `focus-*`
- `surface-*`
- `border-*`
- `chart-*` optional

### 4.2 Core theme tokens

```css
@import "tailwindcss";

@theme {
  /* Brand */
  --color-brand-50: #fef2f2;
  --color-brand-100: #fee2e2;
  --color-brand-500: #ef4444;
  --color-brand-600: #dc2626;
  --color-brand-700: #b91c1c;
  --color-brand-900: #7f1d1d;

  /* Neutral */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  /* Info */
  --color-status-info-bg: #eff6ff;
  --color-status-info-border: #93c5fd;
  --color-status-info-fg: #1d4ed8;

  /* Success / Safe */
  --color-status-success-bg: #f0fdf4;
  --color-status-success-border: #86efac;
  --color-status-success-fg: #166534;

  /* Warning */
  --color-status-warning-bg: #fffbeb;
  --color-status-warning-border: #fcd34d;
  --color-status-warning-fg: #b45309;

  /* Danger / Error */
  --color-status-danger-bg: #fef2f2;
  --color-status-danger-border: #fca5a5;
  --color-status-danger-fg: #b91c1c;

  /* Neutral status */
  --color-status-muted-bg: #f8fafc;
  --color-status-muted-border: #cbd5e1;
  --color-status-muted-fg: #475569;

  /* Surface aliases */
  --color-surface-page: #f8fafc;
  --color-surface-card: #ffffff;
  --color-surface-panel: #ffffff;
  --color-surface-inverse: #0f172a;

  /* Border aliases */
  --color-border-subtle: #e2e8f0;
  --color-border-default: #cbd5e1;
  --color-border-strong: #94a3b8;

  /* Interaction */
  --color-focus-ring: #2563eb;
  --color-disabled-bg: #e2e8f0;
  --color-disabled-fg: #94a3b8;

  /* Optional org accent defaults */
  --color-org-accent-50: #eff6ff;
  --color-org-accent-100: #dbeafe;
  --color-org-accent-600: #2563eb;
  --color-org-accent-700: #1d4ed8;
}
```

### 4.3 Semantic rules

#### Mandatory

- `brand-*` = product-family identity and default primary action
- `status-danger-*` = errors, acute warnings, destructive actions
- `status-warning-*` = caution, preparation, elevated attention
- `status-success-*` = success, safe, completed, available
- `status-info-*` = non-urgent contextual information
- `neutral-*` = core interface foundation

#### Practical mapping guidance

- shell and product identity should default to `brand-*`, not `status-info-*`
- `status-info-*` should be reserved for informational states such as
  "gestartet", advisory notes, system context, and non-blocking updates
- if a screen feels generally "blue", the implementation is likely mixing
  information semantics with structural emphasis

#### Forbidden

- using `brand-*` to represent error or acute danger
- using org accent colors as warning, error, or success colors
- using raw color names in component API like `red`, `blue`, `yellow`

---

## 5. Organization accent model

Each product may define an organization accent layer.

### 5.1 Intended use

Allowed:

- active navigation indicator
- org label badge
- chart palette
- small decorative separators
- top shell accent line
- optional page icon highlight

Conditionally allowed:

- active navigation indicator when an org-specific deployment explicitly
  requires it
- selected shell accents only when they do not compete with the family brand

Not allowed:

- alerts
- inline validation
- destructive actions
- warning banners
- safe/success states

### 5.2 Example mapping

- Feuerwehr deployment: org accent may be controlled red/orange
- THW deployment: org accent may be blue
- Rettungsdienst deployment: org accent may be blue, teal, or controlled red
- Katastrophenschutz deployment: org accent may be muted blue/neutral

### 5.3 Implementation note

Organization accent is an optional theme override, not a structural redesign.

In products without a strong organization-specific theming requirement, prefer
family brand for shell emphasis and reserve org accent for secondary identity
moments only.

---

## 6. Layout system

### 6.1 Standard page shell

All application pages should follow this order:

1. app shell or site header
2. primary navigation
3. page header with title and optional status context
4. main content grouped into sections
5. support/footer/help area if needed

### 6.2 Container widths

- reading-heavy pages: `max-w-[75ch]`
- dashboard pages: `max-w-screen-2xl`
- forms: `max-w-2xl` unless the form is multi-column
- operational detail pages: `max-w-5xl` or grid layout

### 6.3 Grid rules

Use predictable responsive grids:

- single column on mobile by default
- two-column detail layouts from `lg`
- wider analytical dashboards may use three or four columns, but primary tasks
  must remain obvious

### 6.4 Section spacing

Recommended section vertical rhythm:

- small separation: `py-4` / `gap-4`
- default separation: `py-6` / `gap-6`
- major section separation: `py-8` to `py-12`

Do not mix arbitrary spacing without purpose.

### 6.5 Density modes

- `comfortable` is the family default
- `compact` is optional and limited to expert/admin views

Compact density must not reduce readability or hit target sizes for critical
actions.

---

## 7. Typography

Typography is the primary hierarchy mechanism.

### 7.1 General rules

- use strong weight and tight tracking for headings
- use normal or medium weight for body copy
- use relaxed line height for reading comfort
- use uppercase only for short metadata labels
- do not use light weights for instructional copy

### 7.2 Recommended type scale

```css
/* Suggested semantic classes */
.type-display {
  @apply text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900;
}

.type-h1 {
  @apply text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900;
}

.type-h2 {
  @apply text-2xl md:text-3xl font-bold tracking-tight text-neutral-900;
}

.type-h3 {
  @apply text-xl md:text-2xl font-bold text-neutral-900;
}

.type-h4 {
  @apply text-lg font-semibold text-neutral-900;
}

.type-body {
  @apply text-base leading-relaxed text-neutral-800;
}

.type-body-sm {
  @apply text-sm leading-6 text-neutral-800;
}

.type-meta {
  @apply text-sm font-medium text-neutral-600;
}

.type-label {
  @apply text-xs font-bold uppercase tracking-wide text-neutral-700;
}
```

### 7.3 Text width

- keep long-form text around 65–75 characters
- avoid extremely wide paragraphs in desktop layouts
- avoid center-aligned body text in operational interfaces

### 7.4 Copy style

UI copy should be:

- direct
- concise
- plain-language
- action-oriented
- non-dramatic unless urgency is real

---

## 8. Surface, border, and elevation rules

### 8.1 Surfaces

- page background: `bg-surface-page`
- cards and panels: `bg-surface-card`
- dense content surfaces: `bg-white`
- inverse sections: `bg-surface-inverse text-white`

### 8.1.1 Surface hierarchy guidance

The default TrustRed look should be built from neutral surfaces first.

Recommended hierarchy:

- page = neutral and quiet
- main cards = white or near-white
- supporting fact modules = neutral-50 / subtle containment
- status messaging = semantic background tokens only where meaning requires it

Avoid giving every card a colored or accented identity surface.

### 8.2 Borders

Borders are preferred over heavy shadows.

- use `border-border-subtle` for standard containment
- use `border-border-default` for input fields and stronger grouping
- use `border-border-strong` sparingly

### 8.3 Elevation

Default product UI should use minimal elevation.

Allowed:

- none
- subtle shadow on overlays and dropdowns
- slight shadow on persistent sticky headers if separation is needed

Not allowed:

- layered shadow stacks
- floating card aesthetics
- large blurred shadows on dense mobile layouts

Public-facing products may use slightly richer elevation than backend tools, but
the difference must stay subtle and systematic.

### 8.4 Radius

- default interactive radius: `rounded-lg`
- card radius: `rounded-xl`
- chips and small badges: `rounded-full` or `rounded-md` depending on density

---

## 9. Accessibility baseline

### 9.1 Contrast

All interfaces must meet WCAG AA at minimum. Aim higher for critical actions and
instructional content.

### 9.2 Focus visibility

Every interactive component must support visible keyboard focus.

Required focus pattern:

```html
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
focus-visible:ring-offset-2 focus-visible:ring-offset-white
```

For dark surfaces:

```html
focus-visible:ring-offset-neutral-900
```

### 9.3 Hit area

Minimum target size:

- 44x44px for touch controls

### 9.4 Status meaning

Never rely on color alone. Pair with:

- icon
- title
- label
- helper text

### 9.5 Motion sensitivity

Honor reduced motion preferences. Critical UI must remain fully understandable
without animation.

### 9.6 Form accessibility

- labels always visible
- required state must be explicit
- error text must be programmatically tied to fields
- icon-only buttons require accessible names

---

## 10. Component standards

## 10.1 Buttons

### Variants

- `primary`
- `secondary`
- `tertiary`
- `destructive`

### Rules

- one clear primary action per region
- destructive actions must not visually compete with main submit flows
- icon-only buttons are non-default and must be justified
- public pages may use slightly stronger primary emphasis than backend pages,
  but the component recipe must remain the same

### Primary button

```html
<button
 class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:bg-disabled-bg disabled:text-disabled-fg"

 Speichern
</button
```

### Secondary button

```html
<button
 class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"

 Abbrechen
</button
```

### Tertiary button

```html
<button
 class="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-semibold text-brand-700 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"

 Details anzeigen
</button
```

### Destructive button

```html
<button
 class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-status-danger-fg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"

 Löschen
</button
```

## 10.2 Alerts

### Variants

- `info`
- `success`
- `warning`
- `danger`
- `neutral`

### Structure

Every alert should support:

- icon
- title
- body
- optional action
- optional dismiss, only for non-critical content

### Example

```html
<div class="rounded-lg border border-status-warning-border bg-status-warning-bg p-4"
 <div class="flex gap-3"
   <svg class="mt-0.5 size-5 shrink-0 text-status-warning-fg" aria-hidden="true"</svg
   <div
     <h3 class="text-sm font-bold text-status-warning-fg"Vorbereitung empfohlen</h3
     <p class="mt-1 text-sm leading-6 text-status-warning-fg"
       Prüfen Sie Fahrzeuge, Material und Erreichbarkeit bis 18:00 Uhr.
     </p
   </div
 </div
</div
```

### Rules

- danger alerts must be visually persistent
- toasts must never be the only carrier of critical instructions
- warning and danger alerts should not look decorative

## 10.3 Cards

Use cards for grouping related content, not for creating a dashboard “tile wall”
with unnecessary emphasis.

### Base card

```html
<article class="rounded-xl border border-border-subtle bg-surface-card p-6"
 ...
</article
```

### Rules

- card title at top
- metadata separated cleanly
- actions aligned consistently
- hover states optional, only when card is interactive

### Public card guidance

For attendee-facing products, cards may feel more premium through:

- stronger title treatment
- clearer status placement
- compact factual submodules
- disciplined CTA hierarchy

Do not use arbitrary blue rails or decorative accent bars for public cards
unless blue is the intended organization accent for that deployment.

## 10.4 Badges

### Badge types

- status badge
- type badge
- organization badge

### Rules

- use semantic status tokens for status badges
- use org accent for organization badges
- do not create decorative badge colors

### Status badge guidance

Badges should be visually strong enough to support quick scanning.

Recommendations:

- increase badge contrast before increasing decoration
- prefer slightly stronger padding over visual noise
- use `status-info-*` for informational progress states like "gestartet"
- use `status-success-*` for available/open/healthy states
- use `status-muted-*` for archived, cancelled, or inactive context

### Example

```html
<span class="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-800"
 Einsatz
</span
```

## 10.5 Inputs and form fields

### Required states

- default
- hover
- focus
- disabled
- invalid
- read-only

### Base input

```html
<input
 class="min-h-11 w-full rounded-lg border border-border-default bg-white px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:bg-neutral-100 disabled:text-neutral-500"
/
```

### Error state

```html
<input
 aria-invalid="true"
 class="min-h-11 w-full rounded-lg border border-status-danger-border bg-white px-3 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger-fg focus-visible:ring-offset-2"
/
<p class="mt-2 text-sm text-status-danger-fg"Bitte geben Sie eine gültige Telefonnummer ein.</p
```

### Form rules

- labels above fields
- placeholders are supplementary only
- helper and validation text below field
- group related controls with fieldsets when needed
- never rely on red border alone for invalid state

## 10.6 Checkboxes and radios

Rules:

- hit area must be generous
- label must be clickable
- use clear selected state
- validation must appear at group level when appropriate

## 10.7 Selects and comboboxes

Rules:

- support keyboard selection
- show current value clearly
- use searchable combobox for long personnel/equipment lists
- avoid overly compact dropdown rows

## 10.8 Tabs

Tabs are allowed only for closely related content panels.

Rules:

- active tab must be obvious by shape, weight, and border, not color alone
- do not use tabs for deeply hierarchical navigation
- mobile tabs must remain tappable and scrollable without clipping meaning

## 10.9 Navigation

### Top navigation

- clear left-to-right structure
- persistent visibility on desktop
- strong active state
- avoid hiding important sections in overflow menus too early
- family brand should be the default structural accent in the top navigation
- avoid letting info-blue become the dominant navbar highlight unless the org
  accent for that deployment is explicitly blue

### Side navigation

Recommended for operational tools with many sections.

Rules:

- active item may use org accent border or background tint
- active state must also use text weight or icon treatment
- section headings should be visible, not collapsed by default in core admin
  tools

### Navigation example

```html
<a
 href="#"
 aria-current="page"
 class="flex min-h-11 items-center gap-3 rounded-lg border-l-4 border-org-accent-600 bg-org-accent-50 px-4 text-sm font-semibold text-neutral-900"

 Lagemeldungen
</a
```

## 10.10 Tables

### Rules

- prioritize readability over maximum density
- use sticky headers for long tables
- sort state must be visible
- row actions should be consistently placed
- statuses require text or badge, not color dot alone
- never truncate critical identifiers without recovery access

### Base table structure

```html
<div class="overflow-x-auto rounded-xl border border-border-subtle bg-white"
 <table class="min-w-full divide-y divide-border-subtle"
   <thead class="bg-neutral-50"
     <tr
       <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-700"Status</th
       <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-700"Einheit</th
       <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-700"Ort</th
     </tr
   </thead
   <tbody class="divide-y divide-border-subtle"
     ...
   </tbody
 </table
</div
```

### Mobile rule

When tables do not fit meaningfully on mobile, switch to stacked cards. Do not
preserve desktop table structure at the cost of readability.

## 10.10.1 Operational emphasis

Backend tables and admin cards should feel calmer than public cards, but they
must still show clear action priority, readable statuses, and visible grouping.

## 10.11 Timelines and incident logs

Used for:

- incident history
- operational timelines
- communication history
- audit trails

Each entry should include:

- timestamp
- source/person/unit
- event type
- description
- optional severity

### Rules

- chronology must be explicit
- spacing and alignment should be clean and mechanical
- avoid decorative vertical timeline artwork

## 10.12 Toasts and notifications

### Allowed use

- save confirmation
- background job started
- clipboard copied
- draft restored

### Not allowed as sole mechanism for

- acute hazards
- major validation failures
- destructive confirmations
- blocking operational state changes

## 10.13 Modals and dialogs

Use dialogs sparingly.

Good uses:

- destructive confirmation
- short focused forms
- controlled multi-step confirmation

Bad uses:

- long reading flows
- large data entry workflows
- critical instructions that need persistence

### Rules

- clear title
- visible close action unless unsafe
- trap focus correctly
- primary and cancel actions aligned consistently

## 10.14 Empty states

Empty states must be calm and actionable.

Include:

- title
- short explanation
- recommended next step
- optional CTA

Avoid illustration-heavy playful empty states in operational products.

## 10.15 Loading states

Use skeletons or reserved layout space for dense content. Avoid spinning
indicators as the only sign of progress when the wait is significant.

---

## 11. Severity model

This model is universal across all aid organizations.

### 11.1 Severity levels

#### Neutral

System state, archived information, inactive state, background context.

#### Info

General update, advisory, contextual note, routine system message.

#### Success / Safe

Completed action, all clear, available, healthy state.

#### Warning

Preparation needed, elevated attention, partial issue, limited risk.

#### Danger

Blocking problem, acute hazard, destructive action, failed state requiring
intervention.

### 11.2 Severity implementation rules

- severity is semantic, never organizational
- organization color must never override severity color
- severity patterns must be consistent in banners, badges, table cells, and
  inline messages

---

## 12. Maps and geospatial UI

Many aid products contain maps. The design system must support them without
turning the map into the only source of truth.

### Rules

- every map layer must have a text fallback or list representation
- legends must be accessible and easy to reopen
- markers must differ by shape and label, not only color
- critical overlays must use the same semantic colors as the rest of the product
- map actions must meet touch target standards

### Map UI components

- legend panel
- layer switcher
- marker popup
- list/map toggle
- incident summary panel

---

## 13. Charts and data visualization

Charts are secondary tools. They must not replace explicit operational lists
when precision matters.

### Rules

- neutral-first visual language
- use org accent for non-semantic series if needed
- use semantic colors only when the data itself expresses status/severity
- always label axes and units clearly
- provide table fallback for important operational data

### Recommended usage

- readiness over time
- incident distribution
- resource utilization
- response metrics

---

## 14. Responsive behavior

### 14.1 Mobile-first baseline

All components must work from narrow screens upward.

### 14.2 Mobile priorities

- essential action first
- title and status visible without deep scrolling
- avoid multi-column forms unless necessary
- convert dense tables to cards
- avoid hover-only behavior

### 14.3 Desktop priorities

- show supporting context side-by-side when useful
- preserve clear action hierarchy
- maintain readable line lengths

### 14.4 Public page composition guidance

For attendee-facing pages such as booking, registration, or public course
discovery, prefer this rhythm:

1. title and core promise
2. immediate primary action
3. compact factual support modules
4. scannable offer cards or next-step sections

This keeps the experience attractive and useful without drifting into
marketing-only design.

---

## 15. Motion guidelines

### Allowed

- subtle panel expand/collapse
- filter and sort transitions
- route continuity
- low-intensity status confirmation

### Not allowed

- bouncing warning banners
- high-energy entrance animations
- decorative parallax
- animated urgency patterns in critical flows

### Reduced motion

All non-essential motion must be disabled or softened when reduced-motion is
requested.

---

## 16. Iconography

### Rules

- use simple, recognizable line icons
- pair icons with text for important actions and statuses
- keep icon metaphors conventional
- avoid relying on icons alone to convey operational severity

### Common icon categories

- warning
- location
- communication
- personnel
- equipment
- vehicle
- document
- clock
- checklist
- weather

---

## 17. Content and microcopy

### 17.1 Tone

- direct
- respectful
- plain-language
- task-focused

### 17.2 Button labels

Prefer explicit actions:

- `Speichern`
- `Bericht senden`
- `Lagemeldung aktualisieren`
- `Ausrüstung prüfen`

Prefer not:

- `Weiter`
- `OK`
- `Bestätigen` when more specific wording is possible

### 17.3 Warnings

Warnings should explain:

- what happened
- what it means
- what to do next

---

## 18. Component API guidance

Frontend components should expose semantic variants.

### 18.1 Recommended types

```ts
type AlertVariant = "info" | "success" | "warning" | "danger" | "neutral";
type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
type BadgeVariant = "status" | "type" | "organization";
type DensityMode = "comfortable" | "compact";
```

### 18.2 Avoid

```ts
variant = "red";
variant = "yellow";
variant = "blue";
```

### 18.3 Theme override policy

Products may override:

- org accent tokens
- logo
- chart series palette
- selected shell accents

Products may not override:

- severity mapping
- focus pattern
- spacing scale
- button hierarchy
- typography hierarchy
- accessibility behavior

---

## 19. Reference utility recipes

### 19.1 Page section

```html
<section class="py-8 md:py-12"
 <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
   ...
 </div
</section
```

### 19.2 Page header

```html
<header class="border-b border-border-subtle bg-white"
 <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
   <p class="text-xs font-bold uppercase tracking-wide text-neutral-700"Lagezentrum</p
   <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900"Aktuelle Einsatzlage</h1
   <p class="mt-2 max-w-3xl text-base leading-relaxed text-neutral-800"
     Übersicht über laufende Meldungen, Ressourcen und priorisierte Maßnahmen.
   </p
 </div
</header
```

### 19.3 Standard content card

```html
<article class="rounded-xl border border-border-subtle bg-white p-6"
 <div class="flex items-center gap-3"
   <span class="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-800"Info</span
   <time class="text-sm text-neutral-600"31.03.2026</time
 </div
 <h2 class="mt-4 text-xl font-bold text-neutral-900"Materialprüfung abgeschlossen</h2
 <p class="mt-2 text-base leading-relaxed text-neutral-800"
   Alle Standorte haben die Prüfung fristgerecht bestätigt.
 </p
</article
```

### 19.4 Public course or offering card

```html
<article class="rounded-xl border border-border-subtle bg-white p-5"
 <div class="flex items-start justify-between gap-3"
   <h3 class="text-xl font-bold text-neutral-900"Erste-Hilfe-Kurs</h3
   <span class="inline-flex items-center rounded-full border border-status-success-border bg-status-success-bg px-3 py-1 text-xs font-bold uppercase tracking-wide text-status-success-fg"Offen</span
 </div
 <p class="mt-3 text-sm leading-6 text-neutral-800"
   Kurzbeschreibung des Angebots mit direktem Nutzen für die Zielgruppe.
 </p
 <div class="mt-4 grid gap-2 sm:grid-cols-2"
   <div class="rounded-lg border border-border-subtle bg-neutral-50 p-3"
     <p class="text-xs font-bold uppercase tracking-wide text-neutral-600"Ort</p
     <p class="mt-1 text-sm font-semibold text-neutral-900"Haschbach</p
   </div
   <div class="rounded-lg border border-border-subtle bg-neutral-50 p-3"
     <p class="text-xs font-bold uppercase tracking-wide text-neutral-600"Beginn</p
     <p class="mt-1 text-sm font-semibold text-neutral-900"31.03.2026, 10:00</p
   </div
 </div
 <div class="mt-5 flex items-center gap-3"
   <a class="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"Jetzt anmelden</a
   <a class="inline-flex min-h-11 items-center rounded-md px-1 text-sm font-semibold text-brand-700 hover:underline underline-offset-4"Details</a
 </div
</article
```

---

## 20. QA checklist for implementation

Before shipping a screen or component, verify:

### Visual semantics

- brand and severity are clearly separated
- organization accent is used only where allowed
- color is not the only state indicator

### Accessibility

- keyboard focus is visible
- tap targets are large enough
- text contrast is sufficient
- labels exist for all controls
- reduced-motion behavior is acceptable

### Layout and readability

- content remains readable on mobile
- long text widths are controlled
- section grouping is obvious
- table fallbacks exist where needed

### Component consistency

- spacing follows the scale
- buttons use approved hierarchy
- alerts use semantic tokens
- forms show inline validation correctly

### Product-family consistency

- does not feel firefighter-exclusive unless intentionally org-themed
- still looks like a TrustRed product
- alert semantics match other family products
- shell accent color is intentional and not accidentally driven by info-blue
- public pages feel attractive through hierarchy and composition, not decorative
  color usage

---

## 21. Non-negotiable rules

1. **Do not use brand red as the universal error and warning color.**
2. **Do not let org branding override semantic severity.**
3. **Do not hardcode one-off colors into components.**
4. **Do not rely on shadows and decoration to create hierarchy.**
5. **Do not hide critical meaning behind icons only.**
6. **Do not use compact dense UI as the default experience.**
7. **Do not make the family visually exclusive to firefighters.**

---

## 22. Short implementation summary

If developers remember only the core model, it is this:

- build the product mostly from **neutral institutional surfaces**
- use **brand** for normal primary action and family recognition
- use **semantic status colors** for warnings, errors, success, and info
- use **org accent** only as a controlled identity layer
- prioritize **readability, touch usability, and operational clarity**

# Customizing the CSS

The widgets ship a neutral skin driven entirely by **CSS custom properties**.
You theme them by overriding those variables — you never fork or edit the
component stylesheets. This keeps upgrades painless: new versions can restyle
internals as long as the variable contract holds.

## How the styles are layered

Three things stack, in this order:

1. **Library base CSS** — `choices.js` and `flatpickr`'s own stylesheets. They
   own layout (positioning, sizing, the calendar grid). Import them first.
2. **This package's skin** — `styles/select.css` and `styles/flatpickr.css`.
   They restate only colour, radius, and border, each value reading a `--sw-*`
   variable.
3. **Your theme** — the `--sw-*` variables you set. `styles/variables.css` ships
   defaults; your overrides win by coming later or by higher specificity.

```js
import "choices.js/public/assets/styles/choices.css";
import "flatpickr/dist/flatpickr.css";
import "@propitech/stimulus-widgets/styles/all.css"; // variables + both skins
```

`all.css` is `variables.css` + `select.css` + `flatpickr.css`. Import the pieces
individually if you only use one widget.

## Variable reference

| Variable                | Default (light) | Paints                                 |
| ----------------------- | --------------- | -------------------------------------- |
| `--sw-surface`          | `#ffffff`       | Control and calendar background        |
| `--sw-surface-emphasis` | `#f3f4f6`       | Hover / raised rows                    |
| `--sw-surface-inset`    | `#f9fafb`       | Dropdown and popup panel               |
| `--sw-text`             | `#111827`       | Primary text                           |
| `--sw-muted`            | `#6b7280`       | Weekdays, disabled days, separators    |
| `--sw-border`           | `#d1d5db`       | Hairlines                              |
| `--sw-border-strong`    | `#9ca3af`       | Emphasised borders                     |
| `--sw-accent`           | `#4f46e5`       | Selected fill, focus ring, "today"     |
| `--sw-accent-contrast`  | `#ffffff`       | Text/number on an accent fill          |
| `--sw-accent-soft`      | `#e0e7ff`       | In-range tint                          |
| `--sw-accent-emphasis`  | `#4338ca`       | Accent hover                           |
| `--sw-radius`           | `0.5rem`        | Corner radius                          |
| `--sw-ring-width`       | `1px`           | Focus ring width                       |
| `--sw-shadow`           | (elevation)     | Calendar / dropdown shadow             |
| `--sw-font`             | `inherit`       | Calendar header month/year font family |

`styles/variables.css` also ships a `.dark` block that flips every colour, so a
single rule set serves both themes — you do not write light and dark rules, only
light and dark **variable values**.

## Recipe A — plain CSS

Set the variables in your own stylesheet. Put dark values under whatever selector
your app toggles for dark mode (here, a `.dark` class on an ancestor):

```css
:root {
  --sw-surface: #fffdf9;
  --sw-text: #2b2118;
  --sw-accent: #84446f; /* your brand */
  --sw-accent-contrast: #ffffff;
  --sw-accent-soft: #f0e2ec;
  --sw-radius: 0.75rem;
}

.dark {
  --sw-surface: #241c22;
  --sw-text: #f4ecf1;
  --sw-accent: #b57fa3;
  --sw-accent-soft: #3a2a34;
}
```

Prefer OS-driven dark mode? Move the dark values into a media query instead of a
class:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --sw-surface: #241c22;
    /* … */
  }
}
```

## Recipe B — Tailwind

Two options, depending on how your design tokens are defined.

**Point the variables at your tokens.** If your palette is exposed as CSS
variables (Tailwind v4 `@theme`, or any token layer), just map them:

```css
:root {
  --sw-surface: var(--color-surface-50);
  --sw-text: var(--color-surface-900);
  --sw-accent: var(--color-primary-700);
  --sw-accent-contrast: #ffffff;
  --sw-accent-soft: var(--color-primary-100);
}
.dark {
  --sw-surface: var(--color-surface-800);
  --sw-accent: var(--color-primary-600);
}
```

**Re-skin with `@apply`.** If you would rather write Tailwind utilities against
the class hooks, do it in a **cascade layer that comes after `utilities`** so
your rules win by layer order without a specificity fight. This is how
dance_school themes flatpickr:

```css
@layer theme, base, components, utilities, widgets;

@layer widgets {
  .flatpickr-day.selected {
    @apply bg-primary-700 text-white dark:bg-primary-600;
  }
}
```

Import the library base CSS and this package's skin into the `components` layer,
your `@apply` overrides into the later `widgets` layer.

## Class-hook reference

For structural tweaks the variables don't cover, target these stable classes.
They are the libraries' own defaults, restated in `src/choices_config.js`
(Choices) and used as-is by flatpickr.

**Choices** — `.choices`, `.choices__inner`, `.choices.is-focused`,
`.choices__list--dropdown`, `.choices__item--choice`, `.is-highlighted`,
`.choices__list--multiple .choices__item`, `.choices__placeholder`,
`.has-no-results`.

**flatpickr** — `.flatpickr-calendar`, `.flatpickr-months`, `.flatpickr-weekday`,
`.flatpickr-day`, `.flatpickr-day.today`, `.flatpickr-day.selected`,
`.flatpickr-day.inRange`, `.flatpickr-time`, `.flatpickr-time .numInput`.

## Dark mode & contrast

The selected day / chip uses `--sw-accent` as the fill and `--sw-accent-contrast`
as the text on it. When you retheme, keep that pair AA-legible (≥ 4.5:1 for the
day number) — it is the one place a low-contrast accent shows up as an
unreadable selection.

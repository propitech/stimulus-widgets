# @propitech/stimulus-widgets

Turbo-safe [Stimulus](https://stimulus.hotwired.dev) controllers that wrap
[Choices.js](https://github.com/Choices-js/Choices) selects and
[flatpickr](https://flatpickr.js.org) date/time pickers, with a themeable,
variable-driven CSS skin.

The hard part these controllers solve is not calling the library — it is keeping
it alive under Turbo. A widget library like Choices or flatpickr **reparents its
host element** (Choices moves your `<select>` into its own container; flatpickr
wraps the input and injects a calendar beside it). Stimulus reads a DOM move as
`disconnect` + `connect`, so a controller bound to the moved element that calls
`destroy()` on `disconnect` re-enters `connect()` forever and **hangs the
browser**. Every controller here is bound to a **stable wrapper**, tears the
widget down before Turbo caches the page, and re-initialises on a clean element
after a back/forward restore. That contract lives in one base class
(`WidgetController`) so you cannot get it wrong when you extend it.

## Install

This package is consumed as a **git dependency** — it is not published to a
registry. Pin a tag (or a commit SHA) so upgrades are deliberate:

```sh
npm install github:propitech/stimulus-widgets#v0.2.0
npm install @hotwired/stimulus choices.js flatpickr   # peer dependencies
```

That records `"@propitech/stimulus-widgets": "github:propitech/stimulus-widgets#v0.2.0"`
in your `package.json`. Bump the ref to take a new version.

`@hotwired/stimulus`, `choices.js`, and `flatpickr` are **peer dependencies** —
your app owns their versions and bundles them once. This package ships ES module
source (no build step) and is bundled by your existing pipeline (esbuild, Vite,
Rollup, Webpack).

## Quick start

Register the controllers on your Stimulus application:

```js
import { Application } from "@hotwired/stimulus";
import { registerWidgets } from "@propitech/stimulus-widgets";

const application = Application.start();
registerWidgets(application);
```

Import the styles — the two library base stylesheets first, then this package's
skin on top:

```js
import "choices.js/public/assets/styles/choices.css";
import "flatpickr/dist/flatpickr.css";
import "@propitech/stimulus-widgets/styles/all.css";
```

Then use the markup. **Always mount `data-controller` on the wrapper, and target
the child element** — the widget replaces or reparents that child.

```html
<!-- Choices.js select -->
<div data-controller="stimulus-select">
  <select name="fruit">
    <option value="apple">Apple</option>
    <option value="pear">Pear</option>
  </select>
</div>

<!-- flatpickr date -->
<div data-controller="datepicker">
  <input type="text" data-datepicker-target="input" autocomplete="off" />
</div>

<!-- flatpickr time -->
<div data-controller="timepicker" data-timepicker-increment-value="15">
  <input type="text" data-timepicker-target="input" autocomplete="off" />
</div>
```

The pickers use a plain `type="text"` input, not `type="date"`/`type="time"`, so
the calendar is the skinned flatpickr one on every device rather than the
browser's native, off-brand control.

## Options

Set options declaratively with Stimulus values on the wrapper.

| Controller        | Value attribute                                 | Default | Effect                                   |
| ----------------- | ----------------------------------------------- | ------- | ---------------------------------------- |
| `stimulus-select` | `data-stimulus-select-search-enabled-value`     | `true`  | Show the type-to-filter search box       |
| `stimulus-select` | `data-stimulus-select-remove-item-button-value` | `false` | Show a remove (×) button on chosen items |
| `stimulus-select` | `data-stimulus-select-placeholder-value`        | —       | Placeholder text for an empty control    |
| `datepicker`      | `data-datepicker-date-format-value`             | `Y-m-d` | flatpickr date format                    |
| `datepicker`      | `data-datepicker-min-date-value`                | —       | Earliest selectable date                 |
| `datepicker`      | `data-datepicker-max-date-value`                | —       | Latest selectable date                   |
| `timepicker`      | `data-timepicker-increment-value`               | `5`     | Minute step                              |
| `timepicker`      | `data-timepicker-date-format-value`             | `H:i`   | flatpickr time format (24h when `H:i`)   |

For options not surfaced as values, subclass a controller and override the
`options` getter — see [docs/customizing-js.md](docs/customizing-js.md).

## The lifecycle contract

If you extend or replace these controllers, keep the contract that makes them
Turbo-safe. `WidgetController` (the base class) enforces it:

1. **Mount on a stable wrapper**, never the element the library moves. A
   controller on the moved element loops `connect`/`disconnect` forever.
2. **Build the widget on a child element** (`buildWidget()` in a subclass).
3. **Tear down on `turbo:before-cache`** so Turbo snapshots clean markup; a
   restore then re-inits on a plain element, not over the widget's own injected
   DOM.
4. **Guard re-init** — never build twice.

A regression here _hangs the browser_, so the test suite asserts the
wrapper-not-element invariant headlessly (`test/lifecycle.spec.js`) — a fast fail
instead of a hung CI run.

## Customizing

- **[docs/customizing-css.md](docs/customizing-css.md)** — theme the widgets by
  overriding CSS custom properties (plain CSS and Tailwind recipes), plus the
  stable class-hook reference.
- **[docs/customizing-js.md](docs/customizing-js.md)** — controller options,
  the `options` escape hatch, subclassing safely, and registration variants.

## Compatibility

- Stimulus `>= 3.0`, Turbo (any version — the controllers only listen for
  `turbo:before-cache`; without Turbo that event never fires and they still work)
- `choices.js` `>= 10`, `flatpickr` `>= 4.6`
- `disableMobile: true` keeps the skinned flatpickr calendar on touch devices
  rather than falling back to the OS picker.

## Rails / SimpleForm

The repository also ships a small Ruby gem, **`stimulus_widgets`**, so an ERB
template never hand-writes the wrapper/target markup (and never mounts
`data-controller` on the moved input by mistake). The gem is versioned in
lockstep with the JS package — consume both at the same tag:

```ruby
# Gemfile
gem "stimulus_widgets", github: "propitech/stimulus-widgets", tag: "v0.2.0"
```

```jsonc
// package.json — same tag
"@propitech/stimulus-widgets": "github:propitech/stimulus-widgets#v0.2.0"
```

It registers three SimpleForm inputs (`simple_form` `>= 5.0`) in SimpleForm's own
lookup namespace, so `as:` resolves them with plain `simple_form_for` or an app's
custom `SimpleForm::FormBuilder` — no `map_type` wiring:

```erb
<%= simple_form_for @lesson do |f| %>
  <%= f.input :starts_on, as: :datepicker %>
  <%= f.input :opens_at,  as: :timepicker %>
  <%= f.input :studio_id, as: :stimulus_select, collection: Studio.all %>
<% end %>
```

Each input emits **only** the lifecycle contract: `data-controller` on the
SimpleForm wrapper, and `data-<id>-target="input"` on the field (the select
controller finds its own `<select>`, so that input gets no target). Everything
else stays yours — pass Stimulus value options and design classes through the
usual `input_html:` / `wrapper_html:`, which are preserved:

```erb
<%= f.input :opens_at, as: :timepicker,
      input_html: { data: { timepicker_increment_value: 15 } } %>
```

The gem styles nothing; your app owns the input classes (via its SimpleForm
wrapper config or `input_html: { class: … }`) and the CSS skin.

## License

[MIT](LICENSE)

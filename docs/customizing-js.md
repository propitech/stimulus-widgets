# Customizing the JavaScript

## Options via Stimulus values

The common options are exposed as Stimulus values on the wrapper — no JavaScript
required. See the [options table in the README](../README.md#options). Examples:

```html
<!-- A select without the search box, with a remove button on chips -->
<div
  data-controller="stimulus-select"
  data-stimulus-select-search-enabled-value="false"
  data-stimulus-select-remove-item-button-value="true"
>
  <select multiple name="tags">
    …
  </select>
</div>

<!-- A datepicker bounded to this year, day/month/year format -->
<div
  data-controller="datepicker"
  data-datepicker-date-format-value="d/m/Y"
  data-datepicker-min-date-value="2026-01-01"
  data-datepicker-max-date-value="2026-12-31"
>
  <input type="text" data-datepicker-target="input" autocomplete="off" />
</div>
```

## The `options` escape hatch

Choices and flatpickr accept far more options than are surfaced as values. To
pass any of them, subclass the controller and override the `options` getter — it
is merged **last**, so it wins over the defaults and the values:

```js
import { DatepickerController } from "@propitech/stimulus-widgets";

export default class extends DatepickerController {
  get options() {
    return { weekNumbers: true, locale: { firstDayOfWeek: 1 } };
  }
}
```

Register it under any identifier you like:

```js
import RangeDatepicker from "./controllers/range_datepicker_controller.js";
application.register("range-datepicker", RangeDatepicker);
```

## Extending safely — keep the contract

Every controller extends `WidgetController`, which owns the Turbo-safe lifecycle.
When you subclass, **implement `buildWidget()` and nothing else about the
lifecycle** — do not override `connect`, `disconnect`, or add your own
`turbo:before-cache` listener. `buildWidget()` returns the library instance (or a
falsy value if its target is missing); the base class builds it once, tears it
down on `turbo:before-cache` and `disconnect`, and re-inits on restore.

```js
import { WidgetController } from "@propitech/stimulus-widgets";
import SomeLibrary from "some-library";

// data-controller="some-widget" on a WRAPPER; the library reparents the input.
export default class extends WidgetController {
  static targets = ["input"];

  buildWidget() {
    if (!this.hasInputTarget) return null;
    return new SomeLibrary(this.inputTarget, { ...this.options });
  }
}
```

The rule this preserves: **the controller sits on a stable wrapper, never the
element the library moves.** Break it — bind the controller to the input the
library reparents, and destroy it on `disconnect` — and you get an infinite
`connect`/`disconnect` loop that hangs the browser. That is the bug this whole
package exists to prevent; the base class is how it stays prevented.

## Registration variants

**One call, everything** (the quick-start path):

```js
import { registerWidgets } from "@propitech/stimulus-widgets";
registerWidgets(application);
```

**A subset:**

```js
registerWidgets(application, { only: ["datepicker", "timepicker"] });
```

**Manual, for full control or custom identifiers:**

```js
import {
  SelectController,
  DatepickerController,
  TimepickerController,
} from "@propitech/stimulus-widgets";

application.register("stimulus-select", SelectController);
application.register("datepicker", DatepickerController);
application.register("timepicker", TimepickerController);
```

The default identifiers are `stimulus-select`, `datepicker`, and `timepicker`.
Keep them if you want the markup examples to work verbatim; change them if they
collide with controllers you already have.

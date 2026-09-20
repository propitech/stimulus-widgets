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

## Extending the avatar upload

`AvatarUploadController` is itself a base built on `WidgetController`. It wires the
shared Uppy kernel — inline Dashboard, image editor, ActiveStorage upload,
`signed_id` capture, and the same Turbo-safe lifecycle — and leaves the richer,
app-specific behaviour to a subclass through four hooks. Override the hooks, never
the lifecycle: do not touch `connect`, `disconnect`, or `buildWidget`'s teardown.

- `coreOptions`, `dashboardOptions`, `imageEditorOptions` — getters merged over
  the base Uppy / Dashboard / ImageEditor options.
- `onUppy(uppy)` — runs after the base plugins are wired, to `.use()` extra
  plugins and bind extra events on the instance.
- `uploadSucceeded(file, response)` — runs after the `signed_id` is written to the
  hidden input, e.g. to submit the form.

```js
import { AvatarUploadController } from "@propitech/stimulus-widgets";
import Webcam from "@uppy/webcam";

// data-controller="avatar-upload" on the wrapper (see the README markup).
export default class extends AvatarUploadController {
  get dashboardOptions() {
    return { height: 600, plugins: ["Webcam", "ImageEditor"] };
  }

  onUppy(uppy) {
    uppy.use(Webcam, { target: "Dashboard", modes: ["picture"] });
  }

  uploadSucceeded() {
    this.element.closest("form")?.requestSubmit();
  }
}
```

Register the subclass under `avatar-upload` (or any identifier you like). Keep
app-only plugins such as `@uppy/webcam` in your app's own dependencies — the
package peers only the base kernel, so consumers that do not add a webcam never
pull it.

## Using the ActiveStorage uploader outside `AvatarUploadController`

A widget that builds its own Uppy instance instead of subclassing
`AvatarUploadController` (a dropzone, say) still needs the same ActiveStorage
upload plugin. It ships as its own export, so it never has to be installed
separately:

```js
import Uppy from "@uppy/core";
import { ActiveStorageUpload } from "@propitech/stimulus-widgets";

const uppy = new Uppy();
uppy.use(ActiveStorageUpload, { directUploadUrl });
```

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

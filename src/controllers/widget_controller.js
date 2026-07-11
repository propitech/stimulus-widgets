import { Controller } from "@hotwired/stimulus";

// Base for a Stimulus controller that wraps an external JS library which
// *reparents or rebuilds its host element* — Choices.js, flatpickr, Tom Select,
// air-datepicker, and friends. It encodes the one lifecycle contract those
// libraries require to survive Turbo, so a subclass only has to say how to build
// the widget, never how to keep it alive:
//
//   1. Mount `data-controller` on a STABLE WRAPPER, never the element the
//      library moves. Stimulus reads a DOM move as disconnect+connect, so a
//      controller bound to the moved element plus a destroy() on disconnect
//      re-enters connect() forever and hangs the browser.
//   2. Build the widget on a child element (subclass `buildWidget`).
//   3. Tear the widget down on `turbo:before-cache` so Turbo snapshots clean
//      markup; a back/forward restore then re-inits on a plain element instead
//      of over the widget's own injected DOM.
//   4. Guard re-init — never build twice.
//
// Subclass and implement `buildWidget()`: return the library instance (anything
// exposing a `destroy()` method), or a falsy value if the target is missing.
// Do not override connect/disconnect — that is where the contract lives.
export default class WidgetController extends Controller {
  connect() {
    this.mountWidget();
    // Revert to plain markup before Turbo caches the page: a restore re-inits on
    // clean DOM rather than re-mounting the library over its own injected nodes.
    this.beforeCache = () => this.unmountWidget();
    document.addEventListener("turbo:before-cache", this.beforeCache);
  }

  disconnect() {
    document.removeEventListener("turbo:before-cache", this.beforeCache);
    this.unmountWidget();
  }

  mountWidget() {
    if (this.widget) return;
    this.widget = this.buildWidget();
  }

  unmountWidget() {
    this.widget?.destroy();
    this.widget = null;
  }

  buildWidget() {
    throw new Error(
      "WidgetController subclass must implement buildWidget() and return a library instance",
    );
  }

  // Escape hatch: a subclass merges these last into its library options, and so
  // may a consumer's subclass, to pass options the controller doesn't surface as
  // Stimulus values. Kept empty here.
  get options() {
    return {};
  }
}

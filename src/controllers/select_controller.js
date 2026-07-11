import Choices from "choices.js";
import WidgetController from "./widget_controller.js";
import classNames from "../choices_config.js";

// Connects to data-controller="stimulus-select".
//
// Enhances a native <select> with a Choices.js combobox. Mount this on a stable
// wrapper around the <select>, never the <select> itself — Choices moves the
// element into its own container on init and back out on destroy, and a
// controller on the moved element would loop forever (see WidgetController).
//
//   <div data-controller="stimulus-select">
//     <select>…</select>
//   </div>
//
// Options via Stimulus values:
//   data-stimulus-select-search-enabled-value="false"   (default true)
//   data-stimulus-select-remove-item-button-value="true" (default false)
//   data-stimulus-select-placeholder-value="Pick one"
export default class SelectController extends WidgetController {
  static values = {
    searchEnabled: { type: Boolean, default: true },
    removeItemButton: { type: Boolean, default: false },
    placeholder: String,
  };

  buildWidget() {
    const element = this.element.querySelector("select");
    if (!element) return null;

    return new Choices(element, {
      searchEnabled: this.searchEnabledValue,
      removeItemButton: this.removeItemButtonValue,
      ...(this.hasPlaceholderValue
        ? { placeholder: true, placeholderValue: this.placeholderValue }
        : {}),
      classNames,
      ...this.options,
    });
  }
}

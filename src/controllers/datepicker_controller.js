import flatpickr from "flatpickr";
import WidgetController from "./widget_controller.js";

// Connects to data-controller="datepicker".
//
// A flatpickr calendar over a plain text input, so the picker is yours to skin
// (styles/flatpickr.css) rather than the browser's native, off-brand
// `<input type="date">`. Mount on a stable wrapper and point it at a child
// input target — with `static: true` flatpickr wraps the input in a
// `.flatpickr-wrapper` and injects the calendar as its sibling, which Stimulus
// reads as a reparent, so a controller on the input would loop (see
// WidgetController). `static` also keeps the calendar inside the page's landmark
// region (WCAG / axe `region`), and `disableMobile` keeps the skinned calendar
// on touch devices instead of falling back to the OS picker.
//
//   <div data-controller="datepicker">
//     <input type="text" data-datepicker-target="input" autocomplete="off">
//   </div>
//
// Options via Stimulus values:
//   data-datepicker-date-format-value="d/m/Y"   (default "Y-m-d")
//   data-datepicker-min-date-value="2020-01-01"
//   data-datepicker-max-date-value="today"
//
// `allowInput` lets a user type into the field; flatpickr commits the typed
// value on Enter or blur and discards an unparseable edit.
export default class DatepickerController extends WidgetController {
  static targets = ["input"];
  static values = {
    dateFormat: { type: String, default: "Y-m-d" },
    minDate: String,
    maxDate: String,
  };

  buildWidget() {
    if (!this.hasInputTarget) return null;

    return flatpickr(this.inputTarget, {
      dateFormat: this.dateFormatValue,
      ...(this.hasMinDateValue ? { minDate: this.minDateValue } : {}),
      ...(this.hasMaxDateValue ? { maxDate: this.maxDateValue } : {}),
      allowInput: true,
      disableMobile: true,
      static: true,
      ...this.options,
    });
  }
}

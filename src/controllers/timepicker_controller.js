import flatpickr from "flatpickr";
import WidgetController from "./widget_controller.js";

// Connects to data-controller="timepicker".
//
// A flatpickr time popup (no calendar) over a plain text input, skinned in
// styles/flatpickr.css. Same wrapper-mount contract as the datepicker (see
// WidgetController): mount on the wrapper, target a child input. `static`
// renders the popup inline next to the input rather than appended to <body>, so
// it stays inside the page's landmark region (axe `region`).
//
//   <div data-controller="timepicker">
//     <input type="text" data-timepicker-target="input" autocomplete="off">
//   </div>
//
// Options via Stimulus values:
//   data-timepicker-increment-value="15"        (minute step, default 5)
//   data-timepicker-date-format-value="h:i K"   (default "H:i", 24h)
export default class TimepickerController extends WidgetController {
  static targets = ["input"];
  static values = {
    increment: { type: Number, default: 5 },
    dateFormat: { type: String, default: "H:i" },
  };

  buildWidget() {
    if (!this.hasInputTarget) return null;

    return flatpickr(this.inputTarget, {
      noCalendar: true,
      enableTime: true,
      time_24hr: this.dateFormatValue === "H:i",
      dateFormat: this.dateFormatValue,
      minuteIncrement: this.incrementValue,
      allowInput: true,
      disableMobile: true,
      static: true,
      ...this.options,
    });
  }
}

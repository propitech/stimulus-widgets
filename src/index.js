import WidgetController from "./controllers/widget_controller.js";
import SelectController from "./controllers/select_controller.js";
import DatepickerController from "./controllers/datepicker_controller.js";
import TimepickerController from "./controllers/timepicker_controller.js";
import AvatarUploadController from "./controllers/avatar_upload_controller.js";

export {
  WidgetController,
  SelectController,
  DatepickerController,
  TimepickerController,
  AvatarUploadController,
};

// Identifier → controller map. The identifiers are the `data-controller` names
// the widgets ship with; keeping them stable means existing markup keeps working
// after adoption.
//
// AvatarUploadController is deliberately absent: it is a base most consumers
// subclass (to add a webcam, a zoom slider, theme sync, …) and register
// themselves under `avatar-upload`, so auto-registering the bare base would
// usually be the wrong controller. Import and register it explicitly instead.
export const controllers = {
  "stimulus-select": SelectController,
  datepicker: DatepickerController,
  timepicker: TimepickerController,
};

// Register every widget on a Stimulus Application in one call:
//
//   import { Application } from "@hotwired/stimulus";
//   import { registerWidgets } from "@propitech/stimulus-widgets";
//
//   const application = Application.start();
//   registerWidgets(application);
//
// Pass `{ only: ["datepicker"] }` to register a subset. To register manually
// instead, import a controller and call application.register yourself.
export function registerWidgets(application, { only } = {}) {
  const entries = Object.entries(controllers).filter(
    ([identifier]) => !only || only.includes(identifier),
  );
  for (const [identifier, controller] of entries) {
    application.register(identifier, controller);
  }
}

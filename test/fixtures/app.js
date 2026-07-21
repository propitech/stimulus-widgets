import { Application } from "@hotwired/stimulus";
import { registerWidgets, AvatarUploadController } from "../../src/index.js";

// Library base styles + our skin — exactly the import order a consumer uses.
import "choices.js/public/assets/styles/choices.css";
import "flatpickr/dist/flatpickr.css";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import "@uppy/image-editor/css/style.min.css";
import "../../styles/all.css";

const application = Application.start();
registerWidgets(application);

// AvatarUploadController is not auto-registered (it is a base most apps
// subclass), so the fixture registers the bare base under `avatar-upload` to
// exercise its Turbo-safe lifecycle directly.
application.register("avatar-upload", AvatarUploadController);

window.stimulus = application;

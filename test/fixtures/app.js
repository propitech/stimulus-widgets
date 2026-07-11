import { Application } from "@hotwired/stimulus";
import { registerWidgets } from "../../src/index.js";

// Library base styles + our skin — exactly the import order a consumer uses.
import "choices.js/public/assets/styles/choices.css";
import "flatpickr/dist/flatpickr.css";
import "../../styles/all.css";

const application = Application.start();
registerWidgets(application);
window.stimulus = application;

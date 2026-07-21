import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import ImageEditor from "@uppy/image-editor";
import ActiveStorageUpload from "@excid3/uppy-activestorage-upload";
import WidgetController from "./widget_controller.js";

// Base for an avatar / single-image upload built on Uppy's inline Dashboard +
// ImageEditor (Cropper.js), uploading through Rails ActiveStorage. Uppy is a
// DOM-mutating library like Choices.js and flatpickr, so this rides
// WidgetController's Turbo-safe lifecycle (rails-conventions:stimulus-external-lib,
// PRO-992): a single guarded mount, teardown on both `disconnect` and
// `turbo:before-cache`, and — the one step WidgetController's own teardown does
// not cover — a cleared container, so Turbo caches an empty target rather than
// Uppy's injected Dashboard. Without the before-cache teardown a back/forward
// restore re-inits over dirty markup and stacks a second live Uppy; without
// `destroy()` the cropper's resize/rAF work (and any camera MediaStream a
// subclass adds) never stops and CPU climbs across a persisted session.
//
// Mount on a stable wrapper with a `dashboard` target for the Dashboard and a
// `signedId` hidden input for the ActiveStorage signed id:
//
//   <div data-controller="avatar-upload"
//        data-avatar-upload-direct-upload-url-value="/rails/active_storage/direct_uploads">
//     <div data-avatar-upload-target="dashboard"></div>
//     <input type="hidden" name="user[avatar]" data-avatar-upload-target="signedId" />
//   </div>
//
// Subclass to add capability without touching the lifecycle: override the option
// getters (`coreOptions`, `dashboardOptions`, `imageEditorOptions`), add plugins
// and events in `onUppy(uppy)`, and react to a completed upload in
// `uploadSucceeded()`. Do not override `connect`/`disconnect` or `buildWidget`'s
// lifecycle — that is what the base guarantees.
export default class AvatarUploadController extends WidgetController {
  static targets = ["dashboard", "signedId"];
  static values = {
    directUploadUrl: String,
    allowedFileTypes: { type: Array, default: ["image/png", "image/jpeg"] },
    maxFileSize: Number,
  };

  buildWidget() {
    if (!this.hasDashboardTarget) return null;

    const uppy = new Uppy(this.coreOptions);

    uppy.use(Dashboard, {
      inline: true,
      target: this.dashboardTarget,
      proudlyDisplayPoweredByUppy: false,
      ...this.dashboardOptions,
    });

    uppy.use(ImageEditor, {
      target: Dashboard,
      ...this.imageEditorOptions,
    });

    uppy.use(ActiveStorageUpload, {
      directUploadUrl: this.directUploadUrl,
    });

    uppy.on("upload-success", (file, response) =>
      this.#handleUploadSuccess(file, response),
    );
    uppy.on("error", (error) => console.error("Uppy error:", error));

    // Post-build hook: a subclass adds its own plugins (Webcam) and events
    // (zoom slider, downscale, deferred submit) here, after the base wiring.
    this.onUppy(uppy);

    return uppy;
  }

  // WidgetController.unmountWidget only calls `widget.destroy()`. The Dashboard
  // also injected DOM into our target element, so clear it after destroy so
  // Turbo caches an empty container, not the widget's injected markup.
  unmountWidget() {
    super.unmountWidget();
    if (this.hasDashboardTarget) this.dashboardTarget.replaceChildren();
  }

  // ---- Overridable surface --------------------------------------------------

  // Uppy constructor options. One file, no auto-upload, image-type + size
  // restrictions from the Stimulus values.
  get coreOptions() {
    return {
      autoProceed: false,
      allowMultipleUploads: false,
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: this.allowedFileTypesValue,
        ...(this.hasMaxFileSizeValue
          ? { maxFileSize: this.maxFileSizeValue }
          : {}),
      },
    };
  }

  // Extra `@uppy/dashboard` options, merged over the base defaults.
  get dashboardOptions() {
    return {};
  }

  // Extra `@uppy/image-editor` options (actions, cropperOptions, quality),
  // merged over `{ target: Dashboard }`.
  get imageEditorOptions() {
    return {};
  }

  // Hook for subclasses: `.use()` extra plugins and bind extra events on the
  // built Uppy instance. Runs after the base plugins are wired. Default no-op.
  onUppy(_uppy) {}

  // Hook for subclasses: react to a successful upload (e.g. submit the form).
  // The signed id is already written to the hidden input before this runs.
  uploadSucceeded(_file, _response) {}

  // The ActiveStorage direct-upload URL: the Stimulus value first, then a
  // `<meta name="direct-upload-url">` fallback.
  get directUploadUrl() {
    if (this.hasDirectUploadUrlValue && this.directUploadUrlValue) {
      return this.directUploadUrlValue;
    }
    const meta = document.querySelector("meta[name='direct-upload-url']");
    return meta ? meta.getAttribute("content") : null;
  }

  #handleUploadSuccess(file, response) {
    if (this.hasSignedIdTarget) {
      this.signedIdTarget.value = response.signed_id;
    }
    this.uploadSucceeded(file, response);
  }
}

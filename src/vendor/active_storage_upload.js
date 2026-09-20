// Vendored from @excid3/uppy-activestorage-upload, commit
// c660fda179c9fde1ff7926293c967069b55bf662 (MIT license; see the
// src/vendor/active_storage_upload.js section of LICENSE for the upstream
// copyright notice). Departures from that commit: the import below moved
// from `@uppy/utils` to `@uppy/core/utils` (Uppy 6); the stall-timeout
// message is built directly instead of through `this.i18n()`, which
// BasePlugin never assigns here; the `limit` option wraps a queue through
// `RateLimitedQueue#wrapPromiseFunction` instead of using the queue
// instance as the limiter function; log lines take their id from
// `file.id` instead of a minted one; the `upload-cancel` listener is
// dropped, since core 6 never emits that event (per-file cancellation goes
// through `removeFile`, which the `file-removed` listener already covers);
// and the success-path file-state write is dropped, since core's own
// `upload-success` listener replaces it with the blob before anything can
// read it.
import { BasePlugin } from "@uppy/core";
import { RateLimitedQueue } from "@uppy/core/utils";
import { DirectUpload } from "@rails/activestorage";

export default class ActiveStorageUpload extends BasePlugin {
  constructor(uppy, opts) {
    super(uppy, opts);

    this.id = opts.id || "ActiveStorageUpload";
    this.title = opts.title || "ActiveStorageUpload";
    this.type = "uploader";

    const defaultOptions = {
      limit: 0,
      timeout: 30 * 1000,
      directUploadUrl: null,
    };

    this.opts = Object.assign({}, defaultOptions, opts);

    // Simultaneous upload limiting is shared across all uploads with this plugin.
    if (typeof this.opts.limit === "number" && this.opts.limit !== 0) {
      const queue = new RateLimitedQueue(this.opts.limit);
      this.limitUploads = (fn) => queue.wrapPromiseFunction(fn);
    } else {
      this.limitUploads = (fn) => fn;
    }

    this.handleUpload = this.handleUpload.bind(this);
  }

  install() {
    const { capabilities } = this.uppy.getState();
    this.individualCancellationBackup = capabilities.individualCancellation;
    this.uppy.setState({
      capabilities: {
        ...capabilities,
        individualCancellation: false,
      },
    });

    this.uppy.addUploader(this.handleUpload);
  }

  uninstall() {
    const { capabilities } = this.uppy.getState();
    this.uppy.setState({
      capabilities: {
        ...capabilities,
        individualCancellation: this.individualCancellationBackup,
      },
    });

    this.uppy.removeUploader(this.handleUpload);
  }

  handleUpload(fileIDs) {
    if (fileIDs.length === 0) {
      this.uppy.log("[ActiveStorage] No files to upload!");
      return Promise.resolve();
    }

    this.uppy.log("[ActiveStorage] Uploading...");
    const files = fileIDs.map((fileID) => this.uppy.getFile(fileID));

    return this.uploadFiles(files).then(() => null);
  }

  upload(file, current, total) {
    this.uppy.log(`uploading ${current} of ${total}`);

    return new Promise((resolve, reject) => {
      const timer = this.createProgressTimeout(this.opts.timeout, (error) => {
        this.uppy.emit("upload-error", file, error);
        reject(error);
      });

      const directHandlers = {
        directUploadWillStoreFileWithXHR: null,
        directUploadDidProgress: null,
      };
      directHandlers.directUploadDidProgress = (ev) => {
        this.uppy.log(
          `[XHRUpload] ${file.id} progress: ${ev.loaded} / ${ev.total}`,
        );
        timer.progress();

        if (ev.lengthComputable) {
          this.uppy.emit("upload-progress", file, {
            uploader: this,
            bytesUploaded: ev.loaded,
            bytesTotal: ev.total,
          });
        }
      };
      directHandlers.directUploadWillStoreFileWithXHR = (request) => {
        request.upload.addEventListener("progress", (event) =>
          directHandlers.directUploadDidProgress(event),
        );
      };

      const { data, meta } = file;

      if (!data.name && meta.name) {
        data.name = meta.name;
      }

      const upload = new DirectUpload(
        data,
        this.opts.directUploadUrl,
        directHandlers,
      );

      upload.create((error, blob) => {
        this.uppy.log(`[XHRUpload] ${file.id} finished`);
        timer.done();

        if (error) {
          const response = {
            status: "error",
          };

          this.uppy.setFileState(file.id, { response });

          this.uppy.emit("upload-error", file, error);
          return reject(error);
        } else {
          this.uppy.emit("upload-success", file, blob);

          return resolve(file);
        }
      });

      this.uppy.on("file-removed", (removedFile) => {
        if (removedFile.id === file.id) {
          timer.done();
          upload.abort && upload.abort();
        }
      });

      this.uppy.on("cancel-all", () => {
        timer.done();
        upload.abort && upload.abort();
      });
    });
  }

  uploadFiles(files) {
    const actions = files.map((file, i) => {
      const current = parseInt(i, 10) + 1;
      const total = files.length;

      if (file.error) {
        return () => Promise.reject(new Error(file.error));
      } else {
        this.uppy.emit("upload-start", [file]);
        return this.upload.bind(this, file, current, total);
      }
    });

    const promises = actions.map((action) => {
      const limitedAction = this.limitUploads(action);
      return limitedAction();
    });

    return Promise.allSettled(promises);
  }

  // Aborts an upload request once it has made no progress for `timeout` ms.
  // Create with `timer = createProgressTimeout(10000, onTimeout)`, call
  // `timer.progress()` on any progress, and `timer.done()` once the upload
  // completes.
  createProgressTimeout(timeout, timeoutHandler) {
    const uppy = this.uppy;
    let isDone = false;

    function onTimedOut() {
      uppy.log("[XHRUpload] timed out");
      const error = new Error(
        `Upload stalled for ${Math.ceil(timeout / 1000)} seconds`,
      );
      timeoutHandler(error);
    }

    let aliveTimer = null;
    function progress() {
      // Some browsers fire another progress event when the upload is
      // cancelled, so ignore progress after the timer was told to stop.
      if (isDone) return;

      if (timeout > 0) {
        if (aliveTimer) clearTimeout(aliveTimer);
        aliveTimer = setTimeout(onTimedOut, timeout);
      }
    }

    function done() {
      uppy.log("[XHRUpload] timer done");
      if (aliveTimer) {
        clearTimeout(aliveTimer);
        aliveTimer = null;
      }
      isDone = true;
    }

    return {
      progress,
      done,
    };
  }
}

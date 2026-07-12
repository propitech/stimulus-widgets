# frozen_string_literal: true

module StimulusWidgets
  module SimpleForm
    # Shared behaviour for the SimpleForm inputs that wrap a DOM-mutating widget
    # (Choices.js, flatpickr). It emits exactly the lifecycle contract the
    # Stimulus controllers require (PRO-992):
    #
    #   * `data-controller="<identifier>"` goes on the SimpleForm **wrapper**, the
    #     stable element the library never moves.
    #   * `data-<identifier>-target="input"` goes on the **input**, so the
    #     controller finds the field the library reparents. Selects are the
    #     exception — the select controller locates its `<select>` itself, so it
    #     needs no target (`target?` returns false).
    #
    # Never `data-controller` on the moved element: a controller bound there plus
    # the controller's own `destroy()` on disconnect re-enters `connect()` forever
    # and hangs the browser. Including inputs only declare the identifier; the
    # merge below keeps any caller-supplied `wrapper_html` / `input_html`
    # (design classes, Stimulus value attributes) intact via deep_merge.
    module WrapperMount
      def input(wrapper_options = nil)
        mount_on_wrapper
        target_input if target?
        super
      end

      private

      # The `data-controller` identifier the widget ships with. Also names the
      # target namespace for date/time inputs.
      def widget_identifier
        raise NotImplementedError, "#{self.class} must define #widget_identifier"
      end

      # Selects find their own `<select>`; date/time pickers need the input
      # target. Overridden to false in the select input.
      def target?
        true
      end

      def mount_on_wrapper
        wrapper_html = options[:wrapper_html] ||= {}
        wrapper_html.deep_merge!(data: { controller: widget_identifier })
      end

      def target_input
        # A skinned text field, not the browser's native date/time control, so
        # force type="text" (SimpleForm would otherwise emit type="<identifier>"
        # for the non-string `as:`) and drop the browser's autofill over the
        # flatpickr popup. input_html_options is the hash StringInput renders.
        input_html_options[:type] = "text"
        input_html_options[:autocomplete] ||= "off"
        input_html_options.deep_merge!(data: { "#{widget_identifier}_target" => "input" })
      end
    end
  end
end

# frozen_string_literal: true

require "simple_form"
require_relative "wrapper_mount"

# The inputs live in SimpleForm's own lookup namespace so `f.input :x, as: :…`
# resolves them with any builder — plain `simple_form_for` or an app's custom
# `SimpleForm::FormBuilder` subclass — without per-app `map_type` wiring.
#
#   f.input :starts_on, as: :datepicker
#   f.input :opens_at,  as: :timepicker
#   f.input :studio_id, as: :stimulus_select, collection: Studio.all
#
# Each input only emits the PRO-992 wrapper/target contract; pass Stimulus value
# options and design classes through the usual `input_html:` / `wrapper_html:`,
# which are preserved by deep_merge:
#
#   f.input :opens_at, as: :timepicker,
#           input_html: {data: {timepicker_increment_value: 15}}
module SimpleForm
  module Inputs
    # flatpickr calendar over a text input. data-controller="datepicker".
    class DatepickerInput < StringInput
      include ::StimulusWidgets::SimpleForm::WrapperMount

      private

      def widget_identifier
        "datepicker"
      end
    end

    # flatpickr time popup over a text input. data-controller="timepicker".
    class TimepickerInput < StringInput
      include ::StimulusWidgets::SimpleForm::WrapperMount

      private

      def widget_identifier
        "timepicker"
      end
    end

    # Choices.js combobox over a native <select>. data-controller="stimulus-select".
    # The select controller finds its own <select>, so no input target is emitted.
    class StimulusSelectInput < CollectionSelectInput
      include ::StimulusWidgets::SimpleForm::WrapperMount

      private

      def widget_identifier
        "stimulus-select"
      end

      def target?
        false
      end
    end
  end
end

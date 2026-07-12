# frozen_string_literal: true

require_relative "stimulus_widgets/version"

# Rails/SimpleForm companion to the @propitech/stimulus-widgets JS package.
#
# Requiring this file defines the SimpleForm inputs (`as: :datepicker`,
# `:timepicker`, `:stimulus_select`) that emit the PRO-992 wrapper/target markup
# the package's Stimulus controllers expect. In a Rails app with SimpleForm on
# the load path, Bundler requires this automatically; nothing else to wire up.
module StimulusWidgets
end

require_relative "stimulus_widgets/simple_form/inputs"

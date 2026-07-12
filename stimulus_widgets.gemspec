# frozen_string_literal: true

require_relative "lib/stimulus_widgets/version"

Gem::Specification.new do |spec|
  spec.name = "stimulus_widgets"
  spec.version = StimulusWidgets::VERSION
  spec.authors = ["Propitech"]
  spec.summary = "SimpleForm inputs for the @propitech/stimulus-widgets Stimulus controllers."
  spec.description = <<~DESC.strip
    Rails/SimpleForm companion to the @propitech/stimulus-widgets JS package.
    Ships `as: :datepicker`, `:timepicker`, and `:stimulus_select` inputs that
    emit the wrapper-mount + input-target markup the package's Turbo-safe
    Stimulus controllers require, so ERB never hand-wires the contract.
  DESC
  spec.homepage = "https://github.com/propitech/stimulus-widgets"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.1"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage
  spec.metadata["rubygems_mfa_required"] = "true"

  # Ruby surface only — the JS/CSS package files ship over npm/git, not the gem.
  spec.files = Dir["lib/**/*.rb", "README.md", "LICENSE"]
  spec.require_paths = ["lib"]

  spec.add_dependency "simple_form", ">= 5.0"
end

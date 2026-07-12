# frozen_string_literal: true

require "action_view"
require "action_controller"
require "active_model"
require "simple_form"
require "nokogiri"

require "stimulus_widgets"

# Boot enough of SimpleForm to render inputs without a full Rails app: a default
# wrapper whose outer tag carries wrapper_html, and the form helper mixed into
# the view (the Rails initializer that would do this never runs here).
SimpleForm.setup do |config|
  config.wrappers :default, tag: :div do |b|
    b.use :label
    b.use :input
  end
end
ActionView::Base.include(SimpleForm::ActionViewExtensions::FormHelper)

# Minimal model exposing the attributes the inputs bind to.
class DummyRecord
  include ActiveModel::Model

  attr_accessor :starts_on, :opens_at, :studio_id
end

module RenderHelper
  def view
    @view ||= begin
      controller = ActionController::Base.new
      controller.request = ActionDispatch::TestRequest.create
      controller.view_context
    end
  end

  # Render one SimpleForm input and return the parsed form fragment.
  def render_input(attribute, **opts)
    html = view.simple_form_for(DummyRecord.new, url: "/", html: { novalidate: true }) do |f|
      f.input(attribute, **opts)
    end
    Nokogiri::HTML5.fragment(html)
  end
end

RSpec.configure do |config|
  config.include RenderHelper
  config.disable_monkey_patching!
  config.expect_with(:rspec) { |c| c.syntax = :expect }
end

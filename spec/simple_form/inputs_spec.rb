# frozen_string_literal: true

require "spec_helper"

# The invariant these inputs exist to guarantee: `data-controller` lands on the
# SimpleForm wrapper (the element flatpickr/Choices never move), and — for the
# date/time pickers — `data-<id>-target="input"` lands on the field. A controller
# on the moved element would loop and hang the browser (PRO-992), so every
# example also asserts the input itself carries no `data-controller`.
RSpec.describe "SimpleForm stimulus-widgets inputs" do
  describe "as: :datepicker" do
    subject(:form) { render_input(:starts_on, as: :datepicker) }

    it "mounts the controller on the wrapper, not the input", :aggregate_failures do
      expect(form.at_css("div[data-controller='datepicker']")).not_to be_nil
      input = form.at_css("input[type='text']")
      expect(input["data-controller"]).to be_nil
      expect(input["data-datepicker-target"]).to eq("input")
    end

    it "renders a text input with autocomplete off", :aggregate_failures do
      input = form.at_css("input[type='text']")
      expect(input["type"]).to eq("text")
      expect(input["autocomplete"]).to eq("off")
    end

    it "keeps caller-supplied input_html data (Stimulus values) via deep_merge" do
      data = { datepicker_date_format_value: "d/m/Y" }
      form = render_input(:starts_on, as: :datepicker, input_html: { data: })
      input = form.at_css("input[type='text']")
      expect(input["data-datepicker-target"]).to eq("input")
      expect(input["data-datepicker-date-format-value"]).to eq("d/m/Y")
    end

    it "keeps caller-supplied wrapper_html data via deep_merge" do
      form = render_input(:starts_on, as: :datepicker,
                                      wrapper_html: { data: { turbo_permanent: true } })
      wrapper = form.at_css("div[data-controller='datepicker']")
      expect(wrapper["data-turbo-permanent"]).to eq("true")
    end
  end

  describe "as: :timepicker" do
    subject(:form) { render_input(:opens_at, as: :timepicker) }

    it "mounts the controller on the wrapper, not the input", :aggregate_failures do
      expect(form.at_css("div[data-controller='timepicker']")).not_to be_nil
      input = form.at_css("input[type='text']")
      expect(input["data-controller"]).to be_nil
      expect(input["data-timepicker-target"]).to eq("input")
    end

    it "carries a caller-supplied increment value" do
      form = render_input(:opens_at, as: :timepicker,
                                     input_html: { data: { timepicker_increment_value: 15 } })
      expect(form.at_css("input[type='text']")["data-timepicker-increment-value"]).to eq("15")
    end
  end

  describe "as: :stimulus_select" do
    subject(:form) do
      render_input(:studio_id, as: :stimulus_select, collection: ["Studio A", "Studio B"])
    end

    it "mounts the controller on the wrapper and emits no input target", :aggregate_failures do
      expect(form.at_css("div[data-controller='stimulus-select']")).not_to be_nil
      select = form.at_css("select")
      expect(select["data-controller"]).to be_nil
      expect(select["data-stimulus-select-target"]).to be_nil
    end

    it "renders the collection as a native <select> the controller enhances" do
      expect(form.css("select option").map(&:text)).to include("Studio A", "Studio B")
    end
  end
end

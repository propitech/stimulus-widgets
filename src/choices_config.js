// Choices.js class-name map. These are Choices' own default class names, restated
// here as the documented, stable skinning surface: the skin in styles/select.css
// targets exactly these hooks, and a consumer can override any entry to point the
// skin at their own markup. Passed to Choices under its `classNames` option by
// select_controller.js.
export default {
  containerOuter: ["choices"],
  containerInner: ["choices__inner"],
  input: ["choices__input"],
  inputCloned: ["choices__input--cloned"],
  list: ["choices__list"],
  listItems: ["choices__list--multiple"],
  listSingle: ["choices__list--single"],
  listDropdown: ["choices__list--dropdown"],
  item: ["choices__item"],
  itemSelectable: ["choices__item--selectable"],
  itemDisabled: ["choices__item--disabled"],
  itemChoice: ["choices__item--choice"],
  description: ["choices__description"],
  placeholder: ["choices__placeholder"],
  group: ["choices__group"],
  groupHeading: ["choices__heading"],
  button: ["choices__button"],
  activeState: ["is-active"],
  focusState: ["is-focused"],
  openState: ["is-open"],
  disabledState: ["is-disabled"],
  highlightedState: ["is-highlighted"],
  selectedState: ["is-selected"],
  flippedState: ["is-flipped"],
  loadingState: ["is-loading"],
  notice: ["choices__notice"],
  addChoice: ["choices__item--selectable", "add-choice"],
  noResults: ["has-no-results"],
  noChoices: ["has-no-choices"],
};

define([
  'jquery',
  './utils'
], function ($, Utils) {
  function Dropdown ($element, options) {
    this.$element = $element;
    this.options = options;

    Dropdown.__super__.constructor.call(this);
  }

  Utils.Extend(Dropdown, Utils.Observable);

  Dropdown.prototype.render = function () {
    var $dropdown = $(
      '<span class="select2-dropdown">' +
        '<span class="select2-results"></span>' +
      '</span>'
    );

    //[CSAM]
    //Check if the saved filter functionality has been turned on
    if (this.options.get("savedFilter")) {

      //Create a new link element
      var savedFilterHolder = document.createElement('div');
      savedFilterHolder.id = "select2-saved-filter-container";
      //Add a styling class to the holder div
      savedFilterHolder.classList.add("select2-saved-filter","select2-saved-filter--disabled");
      //Html for the saved filter button
      savedFilterHolder.innerHTML =
          "<a class='select2-saved-filter--link'>" +
              "Save Filter" +
          "</a>";

      //Add the saved filter html to the dropdown
      $dropdown.get(0).appendChild(savedFilterHolder);
    }

    $dropdown.attr('dir', this.options.get('dir'));

    this.$dropdown = $dropdown;

    return $dropdown;
  };

  Dropdown.prototype.bind = function () {
    // Should be implemented in subclasses
  };

  Dropdown.prototype.position = function ($dropdown, $container) {
    // Should be implmented in subclasses
  };

  Dropdown.prototype.destroy = function () {
    // Remove the dropdown from the DOM
    this.$dropdown.remove();
  };

  return Dropdown;
});

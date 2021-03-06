define([
  'jquery',
  './base',
  '../utils'
], function ($, BaseSelection, Utils) {
  function MultipleSelection ($element, options) {
    MultipleSelection.__super__.constructor.apply(this, arguments);
  }

  Utils.Extend(MultipleSelection, BaseSelection);

  MultipleSelection.prototype.render = function () {
    var self = this;
    var $selection = MultipleSelection.__super__.render.call(this);

    $selection.addClass('select2-selection--multiple');

    //[CSAM]
    //Add an arrow to end of the combo if the noArrow is false
    if (!self.options.options.noArrow) {
        $selection.html(
            '<ul class="select2-selection__rendered"></ul>' +
            '<span class="select2-selection__arrow dropDown-arrow-container" role="presentation"' +
            '> <b role="presentation"></b></span > '
        );
    } else {
        $selection.html(
            '<ul class="select2-selection__rendered"></ul>'
        );
    }

    return $selection;
  };

  MultipleSelection.prototype.bind = function (container, $container) {
    var self = this;
    var componentId = this.$element[0].id;

    MultipleSelection.__super__.bind.apply(this, arguments);

    this.$selection.on('click', function (evt) {
       //[CSAM]
       /*This is the search box which holds all the tags 
        and what the user has search for */
        var searchBox = self.$search.get(0);
        //If there is still text in the text box then don't close the box yet
        if(searchBox && searchBox.value.length)return;

        //Multi selection mode
        self.trigger('toggle',
        {
            originalEvent: evt
        });                 
      
    });

  this.$search.on('focus', function (evt) {
      //[CSAM]
      // User focuses on the container
      if (self.options.options.eventOnFocus)self.options.options.eventOnFocus(evt, componentId);
  });

  this.$search.on('blur', function (evt) {
      //[CSAM]
      // User exits the container
      if (self.options.options.eventOnBlur)self.options.options.eventOnBlur(evt, componentId);
  });

    this.$selection.on(
      'click',
      '.select2-selection__choice__remove',
      function (evt) {
        // Ignore the event if it is disabled
        if (self.options.get('disabled')) {
          return;
        }

        var $remove = $(this);
        var $selection = $remove.parent();

        var data = $selection.data('data');

        self.trigger('unselect', {
          originalEvent: evt,
          data: data
        });
      }
    );
  };

  MultipleSelection.prototype.clear = function () {
    this.$selection.find('.select2-selection__rendered').empty();
  };

  MultipleSelection.prototype.display = function (data, container) {
    var template = this.options.get('templateSelection');
    var escapeMarkup = this.options.get('escapeMarkup');

    return escapeMarkup(template(data, container));
  };

  MultipleSelection.prototype.selectionContainer = function () {
    var $container = $(
      '<li class="select2-selection__choice">' +
        '<span class="select2-selection__choice__remove" role="presentation">' +
          '&times;' +
        '</span>' +
      '</li>'
    );

    return $container;
  };

  /**
  * Non tag selection container for use in single 
  * @returns {} 
  */
 //[CSAM]
  MultipleSelection.prototype.nonTagSelectionContainer = function () {

    var $container = $(
      '<li class="select2-selection__choice singleSelection">' +
      '</span>' +
      '</li>'
    );

    return $container;
  };

  MultipleSelection.prototype.update = function (data) {
    var self = this;
    this.clear();

    if (data.length === 0) {
      return;
    }

    var $selections = [];

    for (var d = 0; d < data.length; d++) {
      var selection = data[d];
      var $selection;

      //[CSAM] If the no match found flag is activated
      if (self.options.options.noMatchFound &&
        //If the system is not in multple mode
        !self.options.options.multipleOrg) {
        //Use a container that does not have tagging
        $selection = this.nonTagSelectionContainer();
      } else {
        //Use the original container with tagging
        $selection = this.selectionContainer();
      }

      var formatted = this.display(selection, $selection);

      $selection.append(formatted);
      $selection.prop('title', selection.title || selection.text);

      $selection.data('data', selection);

      $selections.push($selection);
    }

    var $rendered = this.$selection.find('.select2-selection__rendered');

    Utils.appendMany($rendered, $selections);
    //[CSAM]
    //Close the dialogue at the end of the selection
    Utils.closeDialogueMessage(self);
  };

  return MultipleSelection;
});

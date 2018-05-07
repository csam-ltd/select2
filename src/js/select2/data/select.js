define([
  './base',
  '../utils',
  'jquery'
], function (BaseAdapter, Utils, $) {
  function SelectAdapter ($element, options) {
    this.$element = $element;
    this.options = options;

    SelectAdapter.__super__.constructor.call(this);
  }

  Utils.Extend(SelectAdapter, BaseAdapter);

  SelectAdapter.prototype.current = function (callback) {
    var data = [];
    var self = this;

    this.$element.find(':selected').each(function () {
      var $option = $(this);

      var option = self.item($option);

      data.push(option);
    });
    callback(data);
  };

  /**
   * This handles the main functionality for selection of a tag
   * @param {} data 
   * @returns {} 
   */
  SelectAdapter.prototype.select = function (data) {
    var self = this;

    //[CSAM]
    //If the saved filter functionality has been activated
    if(this.options.get("savedFilter")){
      //Get the selection container for the select2 component
      var selectionContainer = self.container.$selection[0];
      //Check to see if the clear button exists currently
      var existingBtn = selectionContainer.querySelector(".select2-clear-button");

      //If it exists we don't want to add it again
      if(!existingBtn){
          //Create a span element for the button
          var btnClear = document.createElement("span");
          //Add a class for styling
          btnClear.classList.add("select2-clear-button");
          btnClear.innerText = "Clear";

          //Add it before the tag selection
          selectionContainer.insertBefore(btnClear,selectionContainer.children[0]);
          //We need it to be displayed using flexbox
          selectionContainer.style.display = 'flex';
          //Add the unselect all function as an on click event handler
          btnClear.addEventListener('click',function(){
              self.unselectAll();
          });
      }
    }

    //Don't allow the tag to be selected if it is inactive
    if (Utils.isInactiveTag(data.text,self)) return;              
    data.selected = true;
    // Run the filter event, this filters the data from another combo based on what was chosen in this combo
    if (self.options.options.filterLink) self.options.options.filterLink(data, self.$element[0].id);
    
    data.selected = true;
    //Check the options to see if the system was meant to be single selection
    var isSingleSelection = !this.options.get("multipleOrg"),
        noMatchFound = this.options.get("noMatchFound");

    //Unselect all first
    if(isSingleSelection && noMatchFound)self.unselectAll();

    //If data.element is a DOM node, use it instead
    if ($(data.element).is('option')) {                   
        data.element.selected = true;
        this.$element.trigger('change');

        //[CSAM] We need to show the blinking cursor so that the user can see what they are typing
        Utils.toggleBlinkingCursorVisibility(self,false);
        return;
    }

    if (this.$element.prop('multiple')) {
        this.current(function (currentData) {
            var val = [];

            data = [data];
            
            //JB If the tag does not have a proper id yet then its a new tag
            if(data.id === data.text) data.newTag = true;

            data.push.apply(data, currentData);

            for (var d = 0; d < data.length; d++) {
                var id = data[d].id;

                if ($.inArray(id, val) === -1) {
                    val.push(id);
                }
            }
  
            self.$element.val(val);                      
            self.$element.trigger('change');
        });
    } else {
        var val = data.id;

        this.$element.val(val);
        this.$element.trigger('change');
    }
  };

  /**
   * This handles the main functionality for de selection of tag
   * @param {} data 
   * @returns {} 
   */
  SelectAdapter.prototype.unselect = function (data) {
      var self = this;

      if (!this.$element.prop('multiple')) {
          return;
      }

      //[CSAM]
      //Need to remove the clear button if there are no selected tags left
      if(this.options.get("savedFilter")){                    
        //Get all the currently selected items from the dropdown
        var selectedItems = self.container.$selection[0]
            .querySelectorAll("ul.select2-selection__rendered li.select2-selection__choice");
        //If there is one left it will be delete so we need to remove the clear button
        if(selectedItems.length < 2){
            //Remove the clear button from the selection container
            self.container.$selection[0]
                .removeChild(document.getElementsByClassName("select2-clear-button")[0]);
        }     
      }

      data.selected = false;

      if ($(data.element).is('option')) {
          data.element.selected = false;

          this.$element.trigger('change');

          return;
      }

      this.current(function (currentData) {
          var val = [];

          for (var d = 0; d < currentData.length; d++) {
              var id = currentData[d].id;

              if (id !== data.id && $.inArray(id, val) === -1) {
                  val.push(id);
              }
          }

          self.$element.val(val);

          self.$element.trigger('change');
      });
  };

   /**
   * JB Unselects all the items in the select 2 combo
   * @param {} data 
   * @returns {} 
   */
  SelectAdapter.prototype.unselectAll = function () {
      var self = this;    
      //This retrieve all the possible options from the select component
      var allOptions = self.$element.children().get();
      //Need to check for the nothing option
      if(allOptions[0].selected && allOptions[0].innerText === ""){
      //We have to make the an obj to be compatible with the unselect functon
          var nothingOption = {
              selected : true,
              element : allOptions[0],
          }
          self.unselect(nothingOption);
      }

      //If there are groupings in this select 2 instance we need to filter then out
      if(self.checkForGroup(allOptions)){
          allOptions = $(allOptions).find("option");
      }

      //We need to get just the options that have been selected by the user
      for(let i =0; i < allOptions.length; i++){
          var option = allOptions[i];
          if(!option) continue;
          
          //A selected option should then be removed
          if(option.selected) {
              //We have to make the an obj to be compatible with the unselect functon
              var data = {
                  selected : true,
                  element : option,
              }
              self.unselect(data);
          }
      }
  }

  /**
   * Checks to see if there any options in the 
   */
  SelectAdapter.prototype.checkForGroup = function(options){
      var groupsDetected = false;

      //Loop through all the options to get for optgroups
      for(let i=0; i < options.length; i++){
          var $option = $(options);
          if(! $option)return
          if($option.is("optgroup")) {
              //Set the flag is we have found something
              groupsDetected = true;
              break;
          }
      }
      return groupsDetected;
  }

  SelectAdapter.prototype.bind = function (container, $container) {
    var self = this;

    this.container = container;

    container.on('select', function (params) {
      self.select(params.data);
    });

    container.on('unselect', function (params) {
      self.unselect(params.data);
    });

    //jb
    //Un selects everything in the select 2
    container.on('unselectAll', function (params) {
      self.unselectAll(params.data);
    });
  };

  SelectAdapter.prototype.destroy = function () {
    // Remove anything added to child elements
    this.$element.find('*').each(function () {
      // Remove any custom data set by Select2
      $.removeData(this, 'data');
    });
  };

  SelectAdapter.prototype.query = function (params, callback) {
    var data = [];
    var self = this;

    var $options = this.$element.children();

    $options.each(function () {
      var $option = $(this);

      if (!$option.is('option') && !$option.is('optgroup')) {
        return;
      }

      var option = self.item($option);

      var matches = self.matches(params, option);

      if (matches !== null) {
        data.push(matches);
      }
    });

    callback({
      results: data
    });
  };

  SelectAdapter.prototype.addOptions = function ($options) {
    Utils.appendMany(this.$element, $options);
  };

  SelectAdapter.prototype.option = function (data) {
    var option;

    if (data.children) {
      option = document.createElement('optgroup');
      option.label = data.text;
    } else {
      option = document.createElement('option');

      if (option.textContent !== undefined) {
        option.textContent = data.text;
      } else {
        option.innerText = data.text;
      }
    }

    if (data.id !== undefined) {
      option.value = data.id;
    }

    if (data.disabled) {
      option.disabled = true;
    }

    if (data.selected) {
      option.selected = true;
    }

    if (data.title) {
      option.title = data.title;
    }

    var $option = $(option);

    var normalizedData = this._normalizeItem(data);
    normalizedData.element = option;

    // Override the option's data with the combined data
    $.data(option, 'data', normalizedData);

    return $option;
  };

  SelectAdapter.prototype.item = function ($option) {
    var data = {};

    data = $.data($option[0], 'data');

    if (data != null) {
      return data;
    }

    if ($option.is('option')) {
      data = {
        id: $option.val(),
        text: $option.text(),
        disabled: $option.prop('disabled'),
        selected: $option.prop('selected'),
        title: $option.prop('title')
      };
    } else if ($option.is('optgroup')) {
      data = {
        text: $option.prop('label'),
        children: [],
        title: $option.prop('title')
      };

      var $children = $option.children('option');
      var children = [];

      for (var c = 0; c < $children.length; c++) {
        var $child = $($children[c]);

        var child = this.item($child);

        children.push(child);
      }

      data.children = children;
    }

    data = this._normalizeItem(data);
    data.element = $option[0];

    $.data($option[0], 'data', data);

    return data;
  };

  SelectAdapter.prototype._normalizeItem = function (item) {
    if (!$.isPlainObject(item)) {
      item = {
        id: item,
        text: item
      };
    }

    item = $.extend({}, {
      text: ''
    }, item);

    var defaults = {
      selected: false,
      disabled: false
    };

    if (item.id != null) {
      item.id = item.id.toString();
    }

    if (item.text != null) {
      item.text = item.text.toString();
    }

    if (item._resultId == null && item.id && this.container != null) {
      item._resultId = this.generateResultId(this.container, item);
    }

    return $.extend({}, defaults, item);
  };

  SelectAdapter.prototype.matches = function (params, data) {
    var matcher = this.options.get('matcher');

    return matcher(params, data);
  };

  return SelectAdapter;
});

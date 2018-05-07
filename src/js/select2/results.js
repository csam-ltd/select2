define([
  'jquery',
  './utils'
], function ($, Utils) {
  function Results ($element, options, dataAdapter) {
    this.$element = $element;
    this.data = dataAdapter;
    this.options = options;

    Results.__super__.constructor.call(this);
  }

  Utils.Extend(Results, Utils.Observable);

  Results.prototype.render = function () {
    var $results = $(
      '<ul class="select2-results__options" role="tree"></ul>'
    );

    if (this.options.get('multiple')) {
      $results.attr('aria-multiselectable', 'true');
    }

    this.$results = $results;

    return $results;
  };

  Results.prototype.clear = function () {
    this.$results.empty();
  };

  Results.prototype.displayMessage = function (params) {
    var escapeMarkup = this.options.get('escapeMarkup');

    this.clear();
    this.hideLoading();

    var $message = $(
      '<li role="treeitem" aria-live="assertive"' +
      ' class="select2-results__option"></li>'
    );

    var message = this.options.get('translations').get(params.message);

    $message.append(
      escapeMarkup(
        message(params.args)
      )
    );
    
    $message[0].className += ' select2-results__message';

    this.$results.append($message);
  };

  Results.prototype.hideMessages = function () {
    this.$results.find('.select2-results__message').remove();
  };

  /**
   * Add an option to the current dropdown results
   */
  Results.prototype.append = function (data) {
    var self = this;
    this.hideLoading();
    var $options = [];

    //Display the no results is nothing has been found
    if (data.results == null || data.results.length === 0) {
        if (this.$results.children().length === 0) {
            this.trigger('results:message', {
                message: 'noResults'
            });
        }
        return;
    }

    //Alabetically sort the results
    data.results = this.sort(data.results);
    //order by the text property
    if (self.options.get("noMatchFound")) data.results = Utils.orderBy("text", data.results);
    //If an exact match has been found we don't want message saying to 
    var existMatchFound = false;
    var searchText = data.data || undefined;

    for (var d = 0; d < data.results.length; d++) {
        var item = data.results[d];
        var $option = this.option(item);
        //If an exist match has been found then don't add message asking the user to add it
        if (searchText &&
            searchText[0] &&
            searchText[0].text === item.text) existMatchFound = true;
        
        //[CSAM]
        //if the item is a saved search
        if (item.Type === 5){

          //Find all the the possible options in the dropdown list
          var options = $option.querySelectorAll("li.select2-results__option");

          for(let i=0; i < item.children.length; i++){
              //Find each data element which consists of metadata about each option
              var dataChild = item.children[i];
              if(!dataChild) continue;
              
              //Stamp the saved search unique identifier to the dataset
              var saveSearchData = self.stampUniqueSavedSearchId(dataChild.JsonCriteria,dataChild.SavedSearchId);
              //Add the data to the saved search data attr
              options[i].setAttribute("saved-search-data",saveSearchData);

          }

        }

        $options.push($option);
    }

    //Allows the user to add a result, if the no match found functionality is enabled
    if (self.options.get("noMatchFound") && !existMatchFound)
        self.userCreatedResult($options, self);

    this.$results.append($options);

  };

  /**
   * Stamps the saved search data element with its unique id
   */
  Results.prototype.stampUniqueSavedSearchId = function(dataJson, id){

    //Extract the obj from the Json
    var data = JSON.parse(dataJson);

    for(let i=0; i < data.length; i++){
        data[i].SavedSearchId = id
    }

    //Make a json string with the result
    return JSON.stringify(data);
  };

  /**
   * Adds remove filter link to a saved filter result
   * @param {$option}  
   */
  Results.prototype.addRemoveSavedFilterButton = function (option){

    //Create the anchor tag for the button
    var removeBtnHtml = document.createElement("a");
    //Add a class for styling
    removeBtnHtml.classList.add("select2-savedFilter-remove");
    removeBtnHtml.innerText = "Remove Filter";

    //Access the match container that contains the result match
    var matchContainer =  option.querySelector(".match-container");
    //Add the remove button to the match container
    matchContainer.append(removeBtnHtml);
    //We need to be display flex box 
    matchContainer.classList.add("row-flex");
  };

  //TODO Need to only do this is the new functionality
  /**
   * [CSAM]
   * Adds a result which asks the user if they want to create
   * a not currently existing item
   */
  Results.prototype.userCreatedResult = function (results,self) {
    if (!results || !results.length) return;

    /*Select 2 adds a result which matches the query
      exactly so it can be added by the user if it does
      not exist
      */
    var queryResult;
    for (let i = 0; i < results.length; i++) {
        var result = results[i];
        if (!result) continue;
        //The query result will not have an id, all others do
        if (result.getAttribute("Id")) continue;
        queryResult = result;
        break;
    }
    //Nothing was found, this usually means the user has not searched
    if (queryResult === undefined) return;
    
    /**To stop the inner text being display twice we need to remove 
     * the innerText that was there originally 
     */
    var queryResultText = queryResult.innerText;
    if (!queryResultText || queryResultText.length < 1) return;

    queryResult.innerText = "";
    //Update the html of the element
    queryResult.append(self.createResultElement(queryResultText));
  };

  /**
   * Generates the user create option html
   * @returns {} 
   */
  Results.prototype.createResultElement = function (optionText) {
    //Create the span elements that are needed for this component
    var spanElement = document.createElement("span");
    spanElement.innerHTML = '"' + optionText + '" doesn\'t exist. Click <span class="spanLink" >here</span> to create it.';
    //Create an attribute to identify this component as a user created result
    spanElement.setAttribute("addNewItemResult", "true");
    return spanElement;
  };

  Results.prototype.position = function ($results, $dropdown) {
    var $resultsContainer = $dropdown.find('.select2-results');
    $resultsContainer.append($results);
  };

  Results.prototype.sort = function (data) {
    var sorter = this.options.get('sorter');

    return sorter(data);
  };

  Results.prototype.highlightFirstItem = function () {
    var $options = this.$results
      .find('.select2-results__option[aria-selected]');

    var $selected = $options.filter('[aria-selected=true]');

    // Check if there are any selected options
    if ($selected.length > 0) {
      // If there are selected options, highlight the first
      $selected.first().trigger('mouseenter');
    } else {
      // If there are no selected options, highlight the first option
      // in the dropdown
      $options.first().trigger('mouseenter');
    }

    this.ensureHighlightVisible();
  };

  Results.prototype.setClasses = function () {
    var self = this;

    this.data.current(function (selected) {
      var selectedIds = $.map(selected, function (s) {
        return s.id.toString();
      });

      var $options = self.$results
        .find('.select2-results__option[aria-selected]');

      $options.each(function () {
        var $option = $(this);

        var item = $.data(this, 'data');

        // id needs to be converted to a string when comparing
        var id = '' + item.id;

        if ((item.element != null && item.element.selected) ||
            (item.element == null && $.inArray(id, selectedIds) > -1)) {
          $option.attr('aria-selected', 'true');
        } else {
          $option.attr('aria-selected', 'false');
        }
      });

    });
  };

  Results.prototype.showLoading = function (params) {
    this.hideLoading();

    var loadingMore = this.options.get('translations').get('searching');

    var loading = {
      disabled: true,
      loading: true,
      text: loadingMore(params)
    };
    var $loading = this.option(loading);
    $loading.className += ' loading-results';

    this.$results.prepend($loading);
  };

  Results.prototype.hideLoading = function () {
    this.$results.find('.loading-results').remove();
  };

  Results.prototype.option = function (data) {
    var option = document.createElement('li');
    option.className = 'select2-results__option';

    var attrs = {
      'role': 'treeitem',
      'aria-selected': 'false'
    };

    if (data.disabled) {
      delete attrs['aria-selected'];
      attrs['aria-disabled'] = 'true';
    }

    if (data.id == null) {
      delete attrs['aria-selected'];
    }

    if (data._resultId != null) {
      option.id = data._resultId;
    }

    if (data.title) {
      option.title = data.title;
    }

    if (data.children) {
      attrs.role = 'group';
      attrs['aria-label'] = data.text;
      delete attrs['aria-selected'];
    }

    for (var attr in attrs) {
      var val = attrs[attr];

      option.setAttribute(attr, val);
    }

    if (data.children) {
      var $option = $(option);

      var label = document.createElement('strong');
      label.className = 'select2-results__group';

      var $label = $(label);
      this.template(data, label);

      var $children = [];

      for (var c = 0; c < data.children.length; c++) {
        var child = data.children[c];

        var $child = this.option(child);

        //[CSAM]
        //If this element belongs to the saved search group
        if(this.options.get("savedFilter") && data.Type === 5)
        //We need to allow the user to remove it
        this.addRemoveSavedFilterButton($child);

        $children.push($child);
      }

      var $childrenContainer = $('<ul></ul>', {
        'class': 'select2-results__options select2-results__options--nested'
      });

      $childrenContainer.append($children);

      $option.append(label);
      $option.append($childrenContainer);
    } else {
      this.template(data, option);
    }

    $.data(option, 'data', data);

    return option;
  };

  Results.prototype.bind = function (container, $container) {
    var self = this;

    var id = container.id + '-results';

    this.$results.attr('id', id);

    container.on('results:all', function (params) {
      self.clear();
      self.append(params.data);
      if (container.isOpen()) {
        self.setClasses();
        self.highlightFirstItem();
      }
    });

    container.on('results:append', function (params) {
      self.append(params.data);

      if (container.isOpen()) {
        self.setClasses();
      }
    });

    container.on('query', function (params) {
      self.hideMessages();
      self.showLoading(params);
    });

    container.on('select', function () {
      if (!container.isOpen()) {
        return;
      }

      self.setClasses();
      self.highlightFirstItem();
    });

    container.on('unselect', function () {
      if (!container.isOpen()) {
        return;
      }

      self.setClasses();
      self.highlightFirstItem();
    });

    container.on('open', function () {
      // When the dropdown is open, aria-expended="true"
      self.$results.attr('aria-expanded', 'true');
      self.$results.attr('aria-hidden', 'false');

      self.setClasses();
      self.ensureHighlightVisible();
      //Remove any duplicate results that may have crept in on the last selection
      self.checkForDuplicateResults(self);
      //Hide the current selected item to give the user room to type
      self.toggleHiddenSelection(true);
    });

    container.on('close', function () {
      // When the dropdown is closed, aria-expended="false"
      self.$results.attr('aria-expanded', 'false');
      self.$results.attr('aria-hidden', 'true');
      self.$results.removeAttr('aria-activedescendant');
      //JB Show any content which may be hidden
      self.toggleHiddenSelection(false);
    });

    container.on('results:toggle', function () {
      var $highlighted = self.getHighlightedResults();

      if ($highlighted.length === 0) {
        return;
      }

      $highlighted.trigger('mouseup');
    });

    container.on('results:select', function () {
      var $highlighted = self.getHighlightedResults();

      if ($highlighted.length === 0) {
        return;
      }

      var data = $highlighted.data('data');

      if ($highlighted.attr('aria-selected') == 'true') {
        self.trigger('close', {});
      } else {
        self.trigger('select', {
          data: data
        });
      }
    });

    container.on('results:previous', function () {
      var $highlighted = self.getHighlightedResults();

      var $options = self.$results.find('[aria-selected]');

      var currentIndex = $options.index($highlighted);

      // If we are already at te top, don't move further
      if (currentIndex === 0) {
        return;
      }

      var nextIndex = currentIndex - 1;

      // If none are highlighted, highlight the first
      if ($highlighted.length === 0) {
        nextIndex = 0;
      }

      var $next = $options.eq(nextIndex);

      $next.trigger('mouseenter');

      var currentOffset = self.$results.offset().top;
      var nextTop = $next.offset().top;
      var nextOffset = self.$results.scrollTop() + (nextTop - currentOffset);

      if (nextIndex === 0) {
        self.$results.scrollTop(0);
      } else if (nextTop - currentOffset < 0) {
        self.$results.scrollTop(nextOffset);
      }
    });

    container.on('results:next', function () {
      var $highlighted = self.getHighlightedResults();

      var $options = self.$results.find('[aria-selected]');

      var currentIndex = $options.index($highlighted);

      var nextIndex = currentIndex + 1;

      // If we are at the last option, stay there
      if (nextIndex >= $options.length) {
        return;
      }

      var $next = $options.eq(nextIndex);

      $next.trigger('mouseenter');

      var currentOffset = self.$results.offset().top +
        self.$results.outerHeight(false);
      var nextBottom = $next.offset().top + $next.outerHeight(false);
      var nextOffset = self.$results.scrollTop() + nextBottom - currentOffset;

      if (nextIndex === 0) {
        self.$results.scrollTop(0);
      } else if (nextBottom > currentOffset) {
        self.$results.scrollTop(nextOffset);
      }
    });

    container.on('results:focus', function (params) {
      params.element.addClass('select2-results__option--highlighted');
    });

    container.on('results:message', function (params) {
      self.displayMessage(params);
    });

    if ($.fn.mousewheel) {
      this.$results.on('mousewheel', function (e) {
        var top = self.$results.scrollTop();

        var bottom = self.$results.get(0).scrollHeight - top + e.deltaY;

        var isAtTop = e.deltaY > 0 && top - e.deltaY <= 0;
        var isAtBottom = e.deltaY < 0 && bottom <= self.$results.height();

        if (isAtTop) {
          self.$results.scrollTop(0);

          e.preventDefault();
          e.stopPropagation();
        } else if (isAtBottom) {
          self.$results.scrollTop(
            self.$results.get(0).scrollHeight - self.$results.height()
          );

          e.preventDefault();
          e.stopPropagation();
        }
      });
    }

    this.$results.on('mouseup', '.select2-results__option[aria-selected]',
      function (evt) {

      //[C-SAM]
        //If the user has clicked on the rmeove filter button
      if(self.options.get("savedFilter") && evt.target.classList.contains("select2-savedFilter-remove")) {
          //Stop default behaviour
          evt.preventDefault();
          //If the remove function has been passed
          var removeFunction = self.options.get("removeFilterClick");
          //Call the function
          if(removeFunction) removeFunction(evt);
          //We don't want to run the normal behaviour so leave now
          return;
      }

      //If the saved filter setting is on
      if(self.options.get("savedFilter") && self.options.get("addTagsFunc")){
          
          var jsonObj = undefined, element = undefined;

          //If the clicked element has saved search data
          if(evt.target.hasAttribute("saved-search-data")){
              jsonObj = evt.target.getAttribute("saved-search-data");
              element = evt.target;
          }

          //The user can somethimes click on the child of the li element so check that too
          if(evt.target.parentElement.hasAttribute("saved-search-data")){
              jsonObj = evt.target.parentElement.getAttribute("saved-search-data");
              element = evt.target.parentElement;
          }

          //If the object was present in one of the above elements 
          if(jsonObj) { 
              //Update tags method                      
              var updateTags = self.options.get("addTagsFunc");
              //Add the tag to the select 2 component
              updateTags(JSON.parse(jsonObj),element);
          }
          
      }

      var $this = $(this);

      var data = $this.data('data');

      if ($this.attr('aria-selected') === 'true') {
        if (self.options.get('multiple')) {
          self.trigger('unselect', {
            originalEvent: evt,
            data: data
          });
        } else {
          self.trigger('close', {});
        }

        return;
      }

      self.trigger('select', {
        originalEvent: evt,
        data: data
      });
    });

    this.$results.on('mouseenter', '.select2-results__option[aria-selected]',
      function (evt) {
      var data = $(this).data('data');

      self.getHighlightedResults()
          .removeClass('select2-results__option--highlighted');

      self.trigger('results:focus', {
        data: data,
        element: $(this)
      });
    });
  };

  /**
   * Checks for duplicate results in the select2 dropdown
   */
  Results.prototype.checkForDuplicateResults = function(self){
    //Get all the possible options from select2
    var opts = self.$element.get(0).children;
    if(!opts || !opts.length) return;
    //The value that has been selected previously
    var selectedOpt = null;

    for(let i=0; i < opts.length; i++){
        //If the option is selected
        if(opts[i].selected) {
            //Set the selected option to the data for the option el
            selectedOpt = $(opts[i]).data().data;
            break;
        }
    }

    //We need to ignore blank values
    if(!selectedOpt || selectedOpt.text === "") return;

    for(let i=0; i < opts.length; i++){
        var optData = $(opts[i]).data().data;
        //We only want records that match the selected option
        if(!optData || optData.text !== selectedOpt.text)continue;

        //If there result ids are different this indicates duplicate data
        if(optData._resultId !== selectedOpt._resultId){
            //Remove the extra record
            self.$element.get(0).removeChild(optData.element);
            break;
        }
    }
  }


  /**
   * When a container is opened or closed 
   * we need to hide tags to give the user space to type
   * in the case of a single selection
   */
  Results.prototype.toggleHiddenSelection = function(isContainerOpen){
      var self = this;
      //Check that the no match found functionality is enabled
      if (!this.options.get("noMatchFound") || 
          //This should be a single selection drop box
          this.options.get("multipleOrg"))
          return;

      //We need to check to see if there any options that have been selected                            
      var selectedTags = $(self.data.container.$selection)
          .find(".select2-selection__choice")
          .get();
      if(! selectedTags ||! selectedTags.length)return;

      //Loop through all the tags, there is normally one but there might be more
      for(let i =0; i < selectedTags.length; i++){
          var $tag = $(selectedTags[i]);
          if(! $tag) continue;
          
          //Is the container opening
          if(isContainerOpen){
              //Hide the option that is currently selected
              $tag.css("display","none");
              $tag.addClass("hidden");
          }
          else{
              //The container is closing
              if($tag.hasClass("hidden")){
                  //Unhide the tag
                  $tag.css("display","inline")
                  $tag.removeClass("hidden");
              }
          }
      }
  };

  Results.prototype.getHighlightedResults = function () {
    var $highlighted = this.$results
    .find('.select2-results__option--highlighted');

    return $highlighted;
  };

  Results.prototype.destroy = function () {
    this.$results.remove();
  };

  Results.prototype.ensureHighlightVisible = function () {
    var $highlighted = this.getHighlightedResults();

    if ($highlighted.length === 0) {
      return;
    }

    var $options = this.$results.find('[aria-selected]');

    var currentIndex = $options.index($highlighted);

    var currentOffset = this.$results.offset().top;
    var nextTop = $highlighted.offset().top;
    var nextOffset = this.$results.scrollTop() + (nextTop - currentOffset);

    var offsetDelta = nextTop - currentOffset;
    nextOffset -= $highlighted.outerHeight(false) * 2;

    if (currentIndex <= 2) {
      this.$results.scrollTop(0);
    } else if (offsetDelta > this.$results.outerHeight() || offsetDelta < 0) {
      this.$results.scrollTop(nextOffset);
    }
  };

  Results.prototype.template = function (result, container) {
    var template = this.options.get('templateResult');
    var escapeMarkup = this.options.get('escapeMarkup');

    var content = template(result, container);

    if (content == null) {
      container.style.display = 'none';
    } else if (typeof content === 'string') {
      container.innerHTML = escapeMarkup(content);
    } else {
      $(container).append(content);
    }
  };

  return Results;
});

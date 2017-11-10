define([
  'jquery'
], function ($) {
  var Utils = {};

  Utils.Extend = function (ChildClass, SuperClass) {
    var __hasProp = {}.hasOwnProperty;

    function BaseConstructor () {
      this.constructor = ChildClass;
    }

    for (var key in SuperClass) {
      if (__hasProp.call(SuperClass, key)) {
        ChildClass[key] = SuperClass[key];
      }
    }

    BaseConstructor.prototype = SuperClass.prototype;
    ChildClass.prototype = new BaseConstructor();
    ChildClass.__super__ = SuperClass.prototype;

    return ChildClass;
  };

  function getMethods (theClass) {
    var proto = theClass.prototype;

    var methods = [];

    for (var methodName in proto) {
      var m = proto[methodName];

      if (typeof m !== 'function') {
        continue;
      }

      if (methodName === 'constructor') {
        continue;
      }

      methods.push(methodName);
    }

    return methods;
  }

  Utils.Decorate = function (SuperClass, DecoratorClass) {
    var decoratedMethods = getMethods(DecoratorClass);
    var superMethods = getMethods(SuperClass);

    function DecoratedClass () {
      var unshift = Array.prototype.unshift;

      var argCount = DecoratorClass.prototype.constructor.length;

      var calledConstructor = SuperClass.prototype.constructor;

      if (argCount > 0) {
        unshift.call(arguments, SuperClass.prototype.constructor);

        calledConstructor = DecoratorClass.prototype.constructor;
      }

      calledConstructor.apply(this, arguments);
    }

    DecoratorClass.displayName = SuperClass.displayName;

    function ctr () {
      this.constructor = DecoratedClass;
    }

    DecoratedClass.prototype = new ctr();

    for (var m = 0; m < superMethods.length; m++) {
        var superMethod = superMethods[m];

        DecoratedClass.prototype[superMethod] =
          SuperClass.prototype[superMethod];
    }

    var calledMethod = function (methodName) {
      // Stub out the original method if it's not decorating an actual method
      var originalMethod = function () {};

      if (methodName in DecoratedClass.prototype) {
        originalMethod = DecoratedClass.prototype[methodName];
      }

      var decoratedMethod = DecoratorClass.prototype[methodName];

      return function () {
        var unshift = Array.prototype.unshift;

        unshift.call(arguments, originalMethod);

        return decoratedMethod.apply(this, arguments);
      };
    };

    for (var d = 0; d < decoratedMethods.length; d++) {
      var decoratedMethod = decoratedMethods[d];

      DecoratedClass.prototype[decoratedMethod] = calledMethod(decoratedMethod);
    }

    return DecoratedClass;
  };

  var Observable = function () {
    this.listeners = {};
  };

  Observable.prototype.on = function (event, callback) {
    this.listeners = this.listeners || {};

    if (event in this.listeners) {
      this.listeners[event].push(callback);
    } else {
      this.listeners[event] = [callback];
    }
  }; 

  Observable.prototype.trigger = function (event) {
    var slice = Array.prototype.slice;
    var params = slice.call(arguments, 1);

    this.listeners = this.listeners || {};

    // Params should always come in as an array
    if (params == null) {
      params = [];
    }

    // If there are no arguments to the event, use a temporary object
    if (params.length === 0) {
      params.push({});
    }

    // Set the `_type` of the first object to the event
    params[0]._type = event;

    if (event in this.listeners) {
      this.invoke(this.listeners[event], slice.call(arguments, 1));
    }

    if ('*' in this.listeners) {
      this.invoke(this.listeners['*'], arguments);
    }
  };

  Observable.prototype.invoke = function (listeners, params) {
    for (var i = 0, len = listeners.length; i < len; i++) {
      listeners[i].apply(this, params);
    }
  };

  Utils.Observable = Observable;

  Utils.generateChars = function (length) {
    var chars = '';

    for (var i = 0; i < length; i++) {
      var randomChar = Math.floor(Math.random() * 36);
      chars += randomChar.toString(36);
    }

    return chars;
  };

  Utils.bind = function (func, context) {
    return function () {
      func.apply(context, arguments);
    };
  };

  Utils._convertData = function (data) {
    for (var originalKey in data) {
      var keys = originalKey.split('-');

      var dataLevel = data;

      if (keys.length === 1) {
        continue;
      }

      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];

        // Lowercase the first letter
        // By default, dash-separated becomes camelCase
        key = key.substring(0, 1).toLowerCase() + key.substring(1);

        if (!(key in dataLevel)) {
          dataLevel[key] = {};
        }

        if (k == keys.length - 1) {
          dataLevel[key] = data[originalKey];
        }

        dataLevel = dataLevel[key];
      }

      delete data[originalKey];
    }

    return data;
  };

  Utils.hasScroll = function (index, el) {
    // Adapted from the function created by @ShadowScripter
    // and adapted by @BillBarry on the Stack Exchange Code Review website.
    // The original code can be found at
    // http://codereview.stackexchange.com/q/13338
    // and was designed to be used with the Sizzle selector engine.

    var $el = $(el);
    var overflowX = el.style.overflowX;
    var overflowY = el.style.overflowY;

    //Check both x and y declarations
    if (overflowX === overflowY &&
        (overflowY === 'hidden' || overflowY === 'visible')) {
      return false;
    }

    if (overflowX === 'scroll' || overflowY === 'scroll') {
      return true;
    }

    return ($el.innerHeight() < el.scrollHeight ||
      $el.innerWidth() < el.scrollWidth);
  };

  Utils.escapeMarkup = function (markup) {
    var replaceMap = {
      '\\': '&#92;',
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;',
      '/': '&#47;'
    };

    // Do not try to escape the markup if it's not a string
    if (typeof markup !== 'string') {
      return markup;
    }

    return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
      return replaceMap[match];
    });
  };

  // Append an array of jQuery nodes to a given element.
  Utils.appendMany = function ($element, $nodes) {
    // jQuery 1.7.x does not support $.fn.append() with an array
    // Fall back to a jQuery object collection using $.fn.add()
    if ($.fn.jquery.substr(0, 3) === '1.7') {
      var $jqNodes = $();

      $.map($nodes, function (node) {
        $jqNodes = $jqNodes.add(node);
      });

      $nodes = $jqNodes;
    }

    $element.append($nodes);
  };

//<JB>

/**
* Tags that are known to be inactive
*/
var inactiveTagCache = [];

  /**
   * Registers a tag as inactive
   * @param {} tag 
   * @returns {} 
   */
  Utils.registerInactiveTag = function(tag) {
      inactiveTagCache.push(tag);
  }

  /**
   * Checks the inactive tag cache too check 
   * @param {} options 
   * @returns {} 
   */
  Utils.isInactiveTag = function (tag,self) {

      //There are no inactive tags registered
      if (!inactiveTagCache || !inactiveTagCache.length) return false;

      for (let i = 0; i < inactiveTagCache.length; i++) {
          //Return true only if we find the tag
          if (tag !== inactiveTagCache[i]) continue;

          //Warn the user, the tag is inactive
          self.trigger('results:message', {
              message: 'activeEntityWarning',
              args: tag
          });

          //Clear the search text
          self.container.$selection.get(0)
              .querySelectorAll(".select2-search__field")[0]
              .value = "";
              
          return true;
      }
      return false;
  }

  /**
   * Hide or show the visibility of the component
   */
  Utils.toggleBlinkingCursorVisibility = function (self, isVisible) {
    if(!self)return;

    //This is cached search field from the select 2 component
    var searchInput = Utils.getSearchInput(self);
    if (!searchInput) return;

    //What state is the cursor currently in
    var currentVisible = !searchInput.classList.contains("hide-blinking-cursor");
    if(isVisible){
        //Cursor needs to be show remove the class that hides it
        if(currentVisible) return;
        searchInput.classList.remove("hide-blinking-cursor");
    }
    else{
        //Cursor needs to be hidden add the class which hides it
        if(! currentVisible) return;
        searchInput.classList.add("hide-blinking-cursor");
    }
  }

  /**
   * This returns the current search input either from the select 2 cache 
   * or from the dom
   */
  Utils.getSearchInput = function(self){
      //If can be found in $search
      if(self.hasOwnProperty("$search")) return self.$search.get(0);
      //Retrieve from the current dom
      if(self.hasOwnProperty("data")) return self.data.container.selection.$search.get(0);
      return undefined;
  }

  /**
  * This closes any message windows which may be open at a given time
  * @returns {} 
  */
  Utils.closeDialogueMessage = function (self) {
    self.trigger('close', {});
  }

  /**
   * Toogles the validation error warning for the component
   * @param {} isApply 
   * @returns {} 
   */
  Utils.toggleValidationErrorClass = function (self,component) {
      if (!self || !component) return;

      //Check to see if the input validation error class has been added
      var isApply = component.classList.contains("input-validation-error"),
          componentName = component['name'];
      //Find the select 2 selection in the dom
      var selectionNode = self.$container.get(0).querySelector(".select2-selection");
      if (!selectionNode) return;

      //Are we applying or removing
      if (isApply) {
          //Add the input validation error at this level
          selectionNode.classList.add("input-validation-error");
      } else {
          //Remove if it is there
          if (selectionNode.classList.contains("input-validation-error")) {
              selectionNode.classList.remove("input-validation-error");
          }
          else return;
          
      }

      //Get the name attribute from the select2 obj
      if (!componentName || !componentName.length) return;

      //Find the label which matches this select2 component
      var lblTitle = $("label[for='" + componentName + "']").get(0);
      if (!lblTitle) return;

      //Are we applying or removing
      if (isApply) {
          //Add the label-validation error to the label
          lblTitle.classList.add("label-validation-error");
      } else {
          //Remove the label validation if its still there
          if (lblTitle.classList.contains("label-validation-error"))
              lblTitle.classList.remove("label-validation-error");
      }              
  }

/**
   * Orders an array of objects given a property in that object
   */
  Utils.orderBy = function(property,array){
    
      //Check that the property exists
    if(!property || property === "" || 
          //Check that the array exists and there is at least one element
        !array || ! array.length
        //Check that property exists in the array
        ||! array[0].hasOwnProperty(property))return undefined;
        
    var idDictionary = [], sortingArray = [], resultArray = [];
    var addNewItemResult = undefined;
    
    //Build up a dictionary
    for(let i=0; i < array.length; i++){
      var obj = array[i];
      if(!obj)continue;

      //If a result is found which tells the user to add it to the db
      if(!obj.element){
          addNewItemResult = obj;
          continue;
      }
          
      //Add the property and the entire obj
      idDictionary.push({id : obj[property], value : obj});
      //Adds to array to be sorted
      sortingArray.push(obj[property]);
    }
  
    //Sort the array either alphabetically or numerically depending on the data
    sortingArray = sortingArray.sort();
    //Make sure the new item result is not sorted and is instead added first
    if(addNewItemResult) resultArray.push(addNewItemResult);
  
    for(let i=0; i < sortingArray.length; i++){
      //Find the obj that matchs the id 
      var sObj = findByProperty(sortingArray[i]);
      if(!sObj)continue;
      //Add the obj in order to the final array
      resultArray.push(sObj);
  
    }
  
    /**
     * Finds the object based on the property
     */
    function findByProperty(property){
      //loop through the dictionary until we find the id
      for(let i=0; i < idDictionary.length; i++){
          //Return the value when we find it
          if(idDictionary[i].id === property)return idDictionary[i].value;
      }
  
      //nothing found
      return undefined;
    }
  
    return resultArray;
  }

  //</JB>

  return Utils;
});

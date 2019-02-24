class Letter {
  constructor(options) {
    this.element = options.element;
    this.game = options.game;
    this.input = options.element.querySelector(".letter__input");
    this.language = options.language;
    this.previous_value = options.previous_value;
    this.input.addEventListener("input", this.onInput.bind(this));
    this.input.addEventListener("keydown", this.onKeyDown.bind(this));
    this.input.addEventListener("focus", this.setFocusedState.bind(this, true));
    this.input.addEventListener("blur", this.setFocusedState.bind(this, false));
    this.id = this.getLetterId();
    this.x = null;
    this.y = null;
  }

  /**
   * Handles letter input
   * @return {undefined}
   */
  onInput(options) {
    this.game.something_changed = true;

    var trigger_type = false;
    var clearing_key = false;
    if(typeof options !== "undefined") {
      if(typeof options.trigger_type !== "undefined") {
        trigger_type = options.trigger_type;
      }
      if(typeof options.clearing_key !== "undefined") {
        clearing_key = options.clearing_key;
      }
    }

    if(trigger_type === "fromKeyDown") {
      return;
    }

    var previous_value = this.previous_value;
    var new_value = this.input.value;
    var clear_letter = false;

    if(new_value === "") {
      clear_letter = true;
      converted_letter = "";
    }

    var compatible_type = this.checkInputIsCompatible(new_value);
    if(converted_letter !== "" && !compatible_type) {
      this.setInputValue(this.previous_value);
      return;
    }

    if(!clear_letter) {
      new_value = new_value[0];
      var converted_letter = this.convertLetter(new_value);

      if(!converted_letter) {
        this.setInputValue("");
        this.game.refreshUsedLetters();
        return;
      }
      this.setInputValue(converted_letter);
    }
    var related_letters = this.getRelatedLetters();
    for(var i=0;i<related_letters.length;i++) {
      var related_letter = related_letters[i];
      related_letter.input.value = converted_letter;
      related_letter.element.classList[clear_letter ? "remove" : "add"]("letter__wrapper--filled");
    }
    this.game.refreshUsedLetters();
    if(!clear_letter) {
      var old_letters = this.game.getLettersByValue(converted_letter, this.id);
      if(old_letters.length) {
        for(var i=0;i<old_letters.length;i++) {
          var old_letter = old_letters[i];
          old_letter.input.value = "";
          old_letter.element.classList.add("letter__wrapper--changed");
          old_letter.element.classList.remove("letter__wrapper--filled");
        }
        setTimeout(function() {
          for(var i=0;i<old_letters.length;i++) {
            var old_letter = old_letters[i];
            old_letter.element.classList.remove("letter__wrapper--changed");
          }
        }, 3000);
      }

      var next_letter = this.game.getNextLetter(this);
      if(typeof next_letter !== "undefined") {
        setTimeout(function() {
          next_letter.input.focus();
        }, 50);
      }
    }
    if(trigger_type !== "fromKeyDown") {
      this.setPreviousInputValue(converted_letter);
    }
  }

  onKeyDown(e) {
    var key = e.key;

    var clearing_key = (key == 8 || key == 46);

    if(e.keyCode >= 37 && e.keyCode <= 40) {
      this.game.navigateWithCursors(this, e.keyCode);
      return;
    }

    var compatible_type = this.checkInputIsCompatible(key);

    if(this.convertLetter(key)) {
      if(compatible_type) {
        // this is done to set new letter without deleting the old letter
        // this.setInputValue("");
        this.input.value = "";
        this.element.classList.remove("letter__wrapper--wrong_type");
      } else {
        this.element.classList.add("letter__wrapper--wrong_type");
        if(Letter.getSlotType(this.id) === "c") {
          this.element.setAttribute("data-type-error-message", "Тут должна быть согласная");
        } else {
          this.element.setAttribute("data-type-error-message", "Тут должна быть гласная");
        }
        if(this.previous_value === "") {
          this.setInputValue("");
          this.element.classList.remove("letter__wrapper--filled");
        }
        return;
      }
    }

    this.onInput({
      "trigger_type": "fromKeyDown",
      "clearing_key": clearing_key
    });
  }

  /**
   * Sets or removes focused state for letter
   * @return {undefined}
   */
  setFocusedState(state) {
    var related_letters = this.getRelatedLetters();
    if(state) {
      this.game.focused_x = this.x;
      this.game.focused_y = this.y;
    } else {
      this.game.focused_x = null;
      this.game.focused_y = null;
    }
    for(var i=0;i<related_letters.length;i++) {
      var related_letter = related_letters[i];
      related_letter.element.classList[(state) ? "add" : "remove"]("letter__wrapper--focused");
      if(!state) {
        related_letter.element.classList.remove("letter__wrapper--wrong_type");
      }
    }
  }

  /**
   * Gets letter id
   * @return {undefined}
   */
  getLetterId() {
    if(typeof this.id === "undefined") {
      this.id = this.element.getAttribute("data-id");
    }
    return this.id;
  }

  /**
   * Gets array of letters with same id
   * @return {undefined}
   */
  getRelatedLetters() {
    return this.game.getLettersById(this.id);
  }

  /**
   * Converts foreign letters and symbols into cyrillic letters
   * @return {undefined}
   */
  convertLetter(key) {
    var lower_key = key.toLowerCase();
    if(!lower_key.match(/[a-zа-яё\[\]\;\'\,\.]/i)) {
      return false;
    }
    var russian_letters = "йцукенгшщзхъфывапролджэячсмитьбю";
    // if russian letter is found then let's not search for english conversion
    if(russian_letters.indexOf(lower_key) > -1) {
      return lower_key;
    }

    if(typeof Letter.english_to_russian[lower_key] === "undefined") {
      return false;
    }
    return Letter.english_to_russian[lower_key];
  }

  checkInputIsCompatible(letter) {
    letter = this.convertLetter(letter);
    var slot_type = Letter.getSlotType(this.id);
    var letter_type = Letter.letter_types_by_letters[letter];
    return slot_type === letter_type;
  }

  setInputValue(value) {
    this.setPreviousInputValue(value);
    this.input.value = value;
  }

  setPreviousInputValue(value) {
    this.previous_value = value;
  }

  /**
   * If slot is visible at current language
   * @return {boolean}
   */
  isCurrentlyVisible() {
    return (this.language == "both" || this.game.current_language == this.language);
  }
}


Letter.letter_types_by_ids = {
  "1": "c",
  "2": "v",
  "3": "c",
  "4": "v",
  "5": "c",
  "6": "v",
  "7": "c",
  "8": "c",
  "9": "v",
  "10": "c",
  "11": "c",
  "12": "v",
  "13": "c",
  "14": "c",
  "15": "v",
  "16": "v",
  "17": "v",
  "18": "c",
  "19": "v",
  "20": "c",
  "21": "c",
  "22": "c",
};

Letter.letter_types_by_letters = {
  "а": "v",
  "б": "c",
  "в": "c",
  "г": "c",
  "д": "c",
  "е": "v",
  "ё": "v",
  "ж": "c",
  "з": "c",
  "и": "v",
  "й": "c",
  "к": "c",
  "л": "c",
  "м": "c",
  "н": "c",
  "о": "v",
  "п": "c",
  "р": "c",
  "с": "c",
  "т": "c",
  "у": "v",
  "ф": "c",
  "х": "c",
  "ц": "c",
  "ч": "c",
  "ш": "c",
  "щ": "c",
  "ъ": "v",
  "ы": "v",
  "ь": "v",
  "э": "v",
  "ю": "v",
  "я": "v",
}

Letter.english_to_russian = {
  "q": "й",
  "w": "ц",
  "e": "у",
  "r": "к",
  "t": "е",
  "y": "н",
  "u": "г",
  "i": "ш",
  "o": "щ",
  "p": "з",
  "[": "х",
  "]": "ъ",
  "a": "ф",
  "s": "ы",
  "d": "в",
  "f": "а",
  "g": "п",
  "h": "р",
  "j": "о",
  "k": "л",
  "l": "д",
  ";": "ж",
  "'": "э",
  "z": "я",
  "x": "ч",
  "c": "с",
  "v": "м",
  "b": "и",
  "n": "т",
  "m": "ь",
  ",": "б",
  ".": "ю"
};

Letter.getSlotType = function(id) {
  return Letter.letter_types_by_ids[id];
};
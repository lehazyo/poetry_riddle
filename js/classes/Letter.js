class Letter {
  constructor(options) {
    this.element = options.element;
    this.game = options.game;
    this.input = options.element.querySelector(".letter__input");
    this.input.addEventListener("input", this.onInput.bind(this));
    this.input.addEventListener("focus", this.setFocusedState.bind(this, true));
    this.input.addEventListener("blur", this.setFocusedState.bind(this, false));
    this.id = this.getLetterId();
  }

  onInput(e) {
    var new_value = this.input.value;
    var clear_letter = false;
    if(new_value === "") {
      clear_letter = true;
      converted_letter = "";
    }
    if(!clear_letter) {
      new_value = new_value[0];
      var converted_letter = this.convertLetter(new_value);
      if(!converted_letter) {
        this.input.value = "";
        return;
      }
      this.input.value = converted_letter;
    }
    var related_letters = this.getRelatedLetters();
    for(var i=0;i<related_letters.length;i++) {
      var related_letter = related_letters[i];
      related_letter.input.value = converted_letter;
      related_letter.element.classList[clear_letter ? "remove" : "add"]("letter__wrapper--filled");
    }
  }

  setFocusedState(state) {
    var related_letters = this.getRelatedLetters();
    for(var i=0;i<related_letters.length;i++) {
      var related_letter = related_letters[i];
      related_letter.element.classList[(state) ? "add" : "remove"]("letter__wrapper--focused");
    }
  }

  getLetterId() {
    if(typeof this.id === "undefined") {
      this.id = this.element.getAttribute("data-id");
    }
    return this.id;
  }

  getRelatedLetters() {
    return this.game.getLettersById(this.id);
  }

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
    var english_to_russian = {
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

    if(typeof english_to_russian[lower_key] === "undefined") {
      return false;
    }
    return english_to_russian[lower_key];
  }
}
/**
 * Game object
 */
class Riddle {
  constructor() {
    this.letters = this.makeLetters();
    this.visible_letters = null;
    this.hint_inputs = this.makeHintInputs();

    this.initializeHowToSwitch();
    this.initializeAboutSwitch();

    this.found_letters = {};
    this.used_letters = {};
    this.crossed_letters = {};

    this.found_letters_wrapper = document.querySelector(".found__wrapper");
    this.found_letters_element = document.querySelector(".found__letters");

    this.current_language = null;

    this.rows_count = null;
    this.letters_by_coordinates = [];

    this.initializeLanguageSwitchers();

    this.focused_x = null;
    this.focused_y = null;

    this.readLocalStorage();
  }

  /**
   * Creates array of letter objects
   * @return {array}
   */
  makeLetters() {
    var letters_array = [];
    var letters = document.querySelectorAll(".game__wrapper .letter__wrapper");
    for(var i=0;i<letters.length;i++) {
      var letter_element = letters[i];
      var language = "both";
      if(letter_element.classList.contains("language_panel--old")) {
        language = "old";
      }
      var letter = new Letter({
        element: letter_element, 
        game: this,
        language: language,
        previous_value: ""
      });
      letters_array.push(letter);
    }
    return letters_array;
  }


  /**
   * Returns letters objects that have needed id
   * @return {array}
   */
  getLettersById(id) {
    var letters = [];
    for(var i=0;i<this.letters.length;i++) {
      var letter = this.letters[i];
      if(letter.id == id) {
        letters.push(letter);
      }
    }
    return letters;
  }

  /**
   * Returns letters objects that have needed letter as value
   * @return {array}
   */
  getLettersByValue(letter_to_find, id_to_exclude) {
    var letters = [];
    letter_to_find = letter_to_find.toLowerCase();
    for(var i=0;i<this.letters.length;i++) {
      var letter = this.letters[i];
      var value = letter.input.value.toLowerCase();
      if(value === letter_to_find && letter.id != id_to_exclude) {
        letters.push(letter);
      }
    }
    return letters;
  }

  /**
   * Adds event to switch language
   * @return {undefined}
   */
  initializeLanguageSwitchers() {
    var old_lang_switch = document.querySelector(".header_language__switcher[data-language='old']");
    var rus_lang_switch = document.querySelector(".header_language__switcher[data-language='rus']");
    
    old_lang_switch.addEventListener("click", this.setLanguage.bind(this, "old"));

    rus_lang_switch.addEventListener("click", this.setLanguage.bind(this, "rus"));
  }


  /**
   * Sets language for page
   * @return {undefined}
   */
  setLanguage(lang_code) {
    document.querySelector(".main_wrapper").setAttribute("data-language", lang_code);
    this.current_language = lang_code;

    this.visible_letters = this.makeVisibleLettersArray();

    this.refreshUsedLetters();

    this.sortLettersByCoordinates();

    var title_element = document.querySelector("title");
    var titles_by_langs = {
      "rus": "Задача и ребус НА ПРЕМИИ",
      "old": "Задача и ребусъ НА ПРЕМIИ"
    };

    title_element.textContent = titles_by_langs[lang_code];

    if(typeof localStorage !== "undefined") {
      localStorage.poetry_riddle__current_language = lang_code;
    }
  }

  /**
   * Returns chars per line count
   * @return {number}
   */
  getCharsPerLine() {
    var chars_per_line_by_language = {
      "old": 10,
      "rus": 10
    };
    return chars_per_line_by_language[this.current_language];
  }

  /**
   * Creates 2d array where letter inputs are sorted by their coordinates
   * @return {undefined}
   */
  sortLettersByCoordinates() {
    this.letters_by_coordinates = [];

    for(var i=0;i<this.letters.length;i++) {
      this.letters[i].x = null;
      this.letters[i].y = null;
    }

    var visible_letters = this.getVisibleLetters();

    var chars_per_line = this.getCharsPerLine();

    var x;
    var y;

    for(var i=0;i<visible_letters.length;i++) {
      x = i % chars_per_line;
      y = Math.floor(i / chars_per_line);
      if(typeof this.letters_by_coordinates[x] === "undefined") {
        this.letters_by_coordinates[x] = [];
      }
      this.letters_by_coordinates[x][y] = visible_letters[i];
      visible_letters[i].x = x;
      visible_letters[i].y = y;
    }

    this.rows_count = y + 1;
  }

  /**
   * Returns array of letters that are visible at current language
   * @return {array}
   */
  getVisibleLetters() {
    if(this.visible_letters === null) {
      this.visible_letters = this.makeVisibleLettersArray();
    }
    return this.visible_letters;
  }

  makeVisibleLettersArray() {
    var visible_letters_array = [];
    for(var i=0;i<this.letters.length;i++) {
      if(this.letters[i].isCurrentlyVisible()) {
        visible_letters_array.push(this.letters[i]);
      }
    }
    return visible_letters_array;
  }

  /**
   * Adds event to switch visibility of 'How to play' block
   * @return {undefined}
   */
  initializeHowToSwitch() {
    this.how_to_switch = document.querySelector(".how_to__switch");
    this.how_to_switch.addEventListener("click", function() {
      var how_to = document.querySelector(".how_to__wrapper");
      how_to.classList.toggle("how_to__wrapper--how_to");
      how_to.classList.remove("how_to__wrapper--about");
    });
  }

  /**
   * Adds event to switch 'About' block
   * @return {undefined}
   */
  initializeAboutSwitch() {
    this.how_to_switch = document.querySelector(".how_to__about");
    this.how_to_switch.addEventListener("click", function() {
      var how_to = document.querySelector(".how_to__wrapper");
      how_to.classList.toggle("how_to__wrapper--about");
      how_to.classList.remove("how_to__wrapper--how_to");
    });
  }

  makeHintInputs() {
    var hint_inputs_array = [];
    var hint_inputs = document.querySelectorAll(".hints__input");
    for(var i=0;i<hint_inputs.length;i++) {
      var hint_input = hint_inputs[i];
      var hint_id = hint_input.getAttribute("data-id");
      var hint_input_object = new HintInput({
        input: hint_input,
        id: hint_id,
        game: this
      });
      hint_inputs_array.push(hint_input_object);
    }

    return hint_inputs_array;
  }

  /**
   * Makes list of letters used in hint words
   * @return {undefined}
   */
  refreshFoundLetters() {
    var found_letters_line = "";
    for(var i=0;i<this.hint_inputs.length;i++) {
      var hint_input = this.hint_inputs[i];
      var value = hint_input.input.value;
      value = value.toLowerCase();
      var split_letters = value.split("");
      for(var j=0;j<split_letters.length;j++) {
        var letter = split_letters[j];
        if(found_letters_line.indexOf(letter) == -1) {
          found_letters_line += letter;
        }
      }
    }
    var found_letters_array = found_letters_line.split("");
    found_letters_array = found_letters_array.sort();

    this.found_letters = {};

    for(var i=0;i<found_letters_array.length;i++) {
      var found_letter = found_letters_array[i];
      this.found_letters[found_letter] = true;
    }

    this.checkLettersCrossings();
  }

  /**
   * Makes list of letters used in reboos
   * @return {undefined}
   */
  refreshUsedLetters() {
    var used_letters_line = "";
    var visible_letters = this.getVisibleLetters();
    for(var i=0;i<visible_letters.length;i++) {
      var letter_object = visible_letters[i];
      var letter_value = letter_object.input.value;
      if(used_letters_line.indexOf(letter_value) === -1) {
        used_letters_line += letter_value;
      }
    }

    this.used_letters = {};

    var used_letters_array = used_letters_line.split("");
    for(var i=0;i<used_letters_array.length;i++) {
      var used_letter = used_letters_array[i];
      this.used_letters[used_letter] = true;
    }

    this.checkLettersCrossings();
  }

  /**
   * Marks letters that are present both in used letters and suggested ones
   * @return {undefined}
   */
  checkLettersCrossings() {
    this.crossed_letters = {};

    for (var letter in this.used_letters) {
      if(typeof this.crossed_letters[letter] === "undefined") {
        this.crossed_letters[letter] = {};
      }
      this.crossed_letters[letter].used = true;
    }

    for (var letter in this.found_letters) {
      if(typeof this.crossed_letters[letter] === "undefined") {
        this.crossed_letters[letter] = {};
      }
      this.crossed_letters[letter].found = true;
    }


    var any_letters = (Object.keys(this.crossed_letters).length > 0);

    this.found_letters_wrapper.classList[(any_letters) ? "add" : "remove"]("found__wrapper--visible");
    this.found_letters_element.innerHTML = "";

    if(!any_letters) {
      return;
    }

    var temp_wrapper = document.createElement("div");

    var ordered = {};
    Object.keys(this.crossed_letters).sort().forEach(function(key) {
      ordered[key] = this.crossed_letters[key];
    }.bind(this));
    this.crossed_letters = ordered;

    for (var letter in this.crossed_letters) {
      var new_letter_element = document.createElement("span");
      var letter_text_container = document.createElement("span");
      letter_text_container.className = "found__letter_text";
      new_letter_element.classList.add("found__letter");
      if(typeof this.crossed_letters[letter].found !== "undefined" && this.crossed_letters[letter].found) {
        new_letter_element.classList.add("found__letter--found");
      }
      if(typeof this.crossed_letters[letter].used !== "undefined" && this.crossed_letters[letter].used) {
        new_letter_element.classList.add("found__letter--used");
      }
      letter_text_container.textContent = letter;
      new_letter_element.appendChild(letter_text_container);
      temp_wrapper.appendChild(new_letter_element);
    }
    this.found_letters_element.innerHTML = temp_wrapper.innerHTML;
    temp_wrapper = null;
  }

  navigateWithCursors(letter, key_code) {
    if(this.focused_x == null && this.focused_y == null) {
      return;
    }

    var direction = "";
    if(key_code == 37) {
      direction = "left";
    }
    if(key_code == 38) {
      direction = "up";
    }
    if(key_code == 39) {
      direction = "right";
    }
    if(key_code == 40) {
      direction = "down";
    }

    var x_modifier = 0;
    var y_modifier = 0;
    if(direction == "up") {
      y_modifier = -1;
    }
    if(direction == "right") {
      x_modifier = 1;
    }
    if(direction == "down") {
      y_modifier = 1;
    }
    if(direction == "left") {
      x_modifier = -1;
    }

    var x_to_focus = this.focused_x + x_modifier;
    var y_to_focus = this.focused_y + y_modifier;

    if(x_to_focus < 0) {
      x_to_focus = this.getCharsPerLine() - 1;
    }
    if(x_to_focus >= this.getCharsPerLine()) {
      x_to_focus = 0;
    }
    if(y_to_focus < 0) {
      y_to_focus = this.rows_count - 1;
    }
    if(y_to_focus >= this.rows_count) {
      y_to_focus = 0;
    }

    if(typeof this.letters_by_coordinates[x_to_focus] !== "undefined") {
      if(typeof this.letters_by_coordinates[x_to_focus][y_to_focus] === "undefined") {
        if(direction == "right") {
          x_to_focus = 0;
        }
        if(direction == "left") {
          var last_line_length = this.getVisibleLetters().length % this.getCharsPerLine();
          x_to_focus = last_line_length - 1;
        }
        if(direction == "down") {
          y_to_focus = 0;
        }
        if(direction == "up") {
          y_to_focus = Math.floor(this.getVisibleLetters().length / this.getCharsPerLine()) - 1;
        }
      }
    }

    var new_letter_element = this.letters_by_coordinates[x_to_focus][y_to_focus];
    new_letter_element.input.focus();
  }

  /**
   * Gets the next letter element after
   */
  getNextLetter(letter) {
    var current_letter_found = false;
    var visible_letters = this.getVisibleLetters();
    for(var i=0;visible_letters.length;i++) {
      if(visible_letters[i] === letter) {
        current_letter_found = true;
        continue;
      }
      if(current_letter_found) {
        return visible_letters[i];
      }
    }
  }

  /**
   * Gets the next letter element after
   */
  getPreviousLetter(letter) {
    var current_letter_found = false;
    var previous_letter = null;
    var visible_letters = this.getVisibleLetters();
    for(var i=0;visible_letters.length;i++) {
      if(visible_letters[i] === letter) {
        current_letter_found = true;
        continue;
      }
      if(current_letter_found) {
        return previous_letter;
      }
      previous_letter = visible_letters[i];
    }
  }


  /**
   * Checks the right answers and says about victory
   * @return {undefined}
   */
  checkVictory() {
    if(this.checkRightAnswers()) {
      this.sayAboutVictory();
    }
  }


  /**
   * Checks the right answers
   * @return {boolean}
   */
  checkRightAnswers() {
    // привет, мой любознательный друг! 
    // Да, тут содержатся правильные ответы на загадку и ребус
    var right_answers = {
      "upper": {
        "old": "пов[еѣ]рьстрадань[еѣ]нужнонамън[еѣ]испытавъ[еѣ]гон[еѣ]льзяпонятьисчастья",
        "rus": "поверьстраданьенужнонамнеиспытавегонельзяпонятьисчастья"
      },
      "lower": {
        1: "в[еѣ]совая",
        2: "гать",
        3: "до",
        4: "жан[еѣ]",
        5: "липа",
        6: "осень",
        7: "папирус(ъ)?",
        8: "рысь",
        9: "степь",
        10: "узел(ъ)?",
        11: "ярило",
        12: "ячмень"
      }
    }

    var upper_is_right = false;
    var lower_is_right = true; // will become false below

    var upper_letters = this.getVisibleLetters();
    var upper_letters_string = "";
    for(var i=0;i<upper_letters.length;i++) {
      var u_letter = upper_letters[i];
      var value = u_letter.input.value;
      value = value.toLowerCase();
      upper_letters_string += value;
    }

    var upper_regex = new RegExp("^" + right_answers.upper[this.current_language] + "$");
    if(upper_letters_string.match(upper_regex)) {
      upper_is_right = true;
    }

    var hint_inputs = this.hint_inputs;
    for(var i=0;i<hint_inputs.length;i++) {
      var hint_input = hint_inputs[i];
      var value = hint_input.input.value;
      value = value.toLowerCase();
      var hint_regex = new RegExp("^" + right_answers.lower[hint_input.id] + "$");
      if(!value.match(hint_regex)) {
        lower_is_right = false;
        break;
      }
    }

    return (upper_is_right && lower_is_right);
  }


  /**
   * Alerts victory message
   * @return {undefined}
   */
  sayAboutVictory() {
    var messages = {
      "old": "Поздравляю! Вы правильно разгадали загадку и ребусъ!",
      "rus": "Поздравляю! Вы правильно разгадали загадку и ребус!"
    };
    alert(messages[this.current_language]);
  }


  /**
   * Reads saved info from localStorage
   */
  readLocalStorage() {
    if(typeof localStorage === "undefined") {
      return;
    }

    if(typeof localStorage.poetry_riddle__current_language === "undefined") {
      localStorage.poetry_riddle__current_language = "old"; 
    }
      
    if(typeof localStorage.poetry_riddle__upper__1 === "undefined") {
      localStorage.poetry_riddle__upper__1 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__2 === "undefined") {
      localStorage.poetry_riddle__upper__2 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__3 === "undefined") {
      localStorage.poetry_riddle__upper__3 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__4 === "undefined") {
      localStorage.poetry_riddle__upper__4 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__5 === "undefined") {
      localStorage.poetry_riddle__upper__5 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__6 === "undefined") {
      localStorage.poetry_riddle__upper__6 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__7 === "undefined") {
      localStorage.poetry_riddle__upper__7 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__8 === "undefined") {
      localStorage.poetry_riddle__upper__8 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__9 === "undefined") {
      localStorage.poetry_riddle__upper__9 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__10 === "undefined") {
      localStorage.poetry_riddle__upper__10 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__11 === "undefined") {
      localStorage.poetry_riddle__upper__11 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__12 === "undefined") {
      localStorage.poetry_riddle__upper__12 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__13 === "undefined") {
      localStorage.poetry_riddle__upper__13 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__14 === "undefined") {
      localStorage.poetry_riddle__upper__14 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__15 === "undefined") {
      localStorage.poetry_riddle__upper__15 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__16 === "undefined") {
      localStorage.poetry_riddle__upper__16 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__17 === "undefined") {
      localStorage.poetry_riddle__upper__17 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__18 === "undefined") {
      localStorage.poetry_riddle__upper__18 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__19 === "undefined") {
      localStorage.poetry_riddle__upper__19 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__20 === "undefined") {
      localStorage.poetry_riddle__upper__20 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__21 === "undefined") {
      localStorage.poetry_riddle__upper__21 = ""; 
    }
    if(typeof localStorage.poetry_riddle__upper__22 === "undefined") {
      localStorage.poetry_riddle__upper__22 = ""; 
    }
    
    if(typeof localStorage.poetry_riddle__lower__1 === "undefined") {
      localStorage.poetry_riddle__lower__1 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__2 === "undefined") {
      localStorage.poetry_riddle__lower__2 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__3 === "undefined") {
      localStorage.poetry_riddle__lower__3 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__4 === "undefined") {
      localStorage.poetry_riddle__lower__4 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__5 === "undefined") {
      localStorage.poetry_riddle__lower__5 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__6 === "undefined") {
      localStorage.poetry_riddle__lower__6 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__7 === "undefined") {
      localStorage.poetry_riddle__lower__7 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__8 === "undefined") {
      localStorage.poetry_riddle__lower__8 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__9 === "undefined") {
      localStorage.poetry_riddle__lower__9 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__10 === "undefined") {
      localStorage.poetry_riddle__lower__10 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__11 === "undefined") {
      localStorage.poetry_riddle__lower__11 = ""; 
    }
    if(typeof localStorage.poetry_riddle__lower__12 === "undefined") {
      localStorage.poetry_riddle__lower__12 = ""; 
    }

    for(var i=0;i<this.letters.length;i++) {
      var letter_object = this.letters[i];
      var letter_to_set = localStorage["poetry_riddle__upper__" + letter_object.id];
      if(letter_to_set === "") {
        continue;
      }
      letter_to_set = letter_to_set.toLowerCase();
      if(Letter.russian_letters.indexOf(letter_to_set) == -1) {
        continue;
      }
      this.letters[i].input.value = letter_to_set;
      this.letters[i].element.classList.add("letter__wrapper--filled");
    }

    for(var i=0;i<this.hint_inputs.length;i++) {
      var hint_object = this.hint_inputs[i];
      var word_to_set = localStorage["poetry_riddle__lower__" + hint_object.id];
      if(word_to_set === "") {
        continue;
      }
      word_to_set = word_to_set.toLowerCase();
      if(word_to_set.length > 20) {
        word_to_set = word_to_set.substr(0, 20);
      }
      this.hint_inputs[i].input.value = word_to_set;
    }

    if(!localStorage.poetry_riddle__current_language.match(/(rus|old)/)) {
      localStorage.poetry_riddle__current_language = "old";
    }
    this.setLanguage(localStorage.poetry_riddle__current_language);

    this.refreshFoundLetters();
  }
}
/**
 * Game object
 */
class Riddle {
  constructor() {
    this.letters = this.makeLetters();

    this.initializeLanguageSwitchers();
    this.initializeHowToSwitch();
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
      var letter = new Letter({
        element: letter_element, 
        game: this
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
   * Adds event to switch language
   * @return {undefined}
   */
  initializeLanguageSwitchers() {
    this.language_switchers = document.querySelectorAll(".header_language__switcher");
    for(var i=0;i<this.language_switchers.length;i++) {
      var switcher = this.language_switchers[i];
      switcher.addEventListener("click", function() {
        var lang_id = this.getAttribute("data-language");
        document.querySelector(".main_wraper").setAttribute("data-language", lang_id);
      });
    }
  }

  /**
   * Adds event to switch visibility of 'How to play' block
   * @return {undefined}
   */
  initializeHowToSwitch() {
    this.how_to_switch = document.querySelector(".how_to__switch");
    this.how_to_switch.addEventListener("click", function() {
      document.querySelector(".how_to__wrapper").classList.toggle("how_to__wrapper--open");
    });
  }
}
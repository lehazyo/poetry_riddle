class HintInput {
  constructor(options) {
    this.input = options.input;
    this.id = options.id;
    this.game = options.game;

    this.input.addEventListener("input", this.onInput.bind(this));
  }

  onInput() {
    this.game.something_changed = true;

    var raw_value = this.input.value;
    var clean_value = raw_value;
    for (var english_letter in Letter.english_to_russian) {
      var russian_letter = Letter.english_to_russian[english_letter];
      clean_value = clean_value.replace(english_letter, russian_letter, "gi");
    }
    clean_value = clean_value.replace(/[^а-яёѣ]/gi, "");
    this.input.value = clean_value;
    this.game.refreshFoundLetters();

    if(typeof localStorage !== "undefined") {
      localStorage["poetry_riddle__lower__" + this.id] = clean_value;
    }

    this.game.checkVictory();
  }
}
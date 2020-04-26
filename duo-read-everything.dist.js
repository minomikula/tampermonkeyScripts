(function() {
  ("use strict");
  console.log("Main");
  clearInterval(window.duoTranslateEverithingInterval);
  window.duoTranslateEverithingInterval = setInterval(testPage, 100);
  let lastPlayed = null;
  const TYPE = {
    CHOICE: "CHOICE",
    WRITE: "WRITE",
    SELECT_MISSING: "SELECT_MISSING",
    SPEAK: "SPEAK"
  };
  const STATE = { PENDING: "PENDING", FAILED: "FAILED", CORRECT: "CORRECT" };
  const LANG = { FOREIGH: "FOREIGH", EN: "EN" };
  const ACTION = {
    CLICK_PLAY_BUTTON: "CLICK_PLAY_BUTTON",
    DO_NOTHING: "DO_NOTHING",
    ACTION_NOT_FOUND: "ACTION_NOT_FOUND"
  };

  function testPage() {
    const found = findText();
    if (found !== lastPlayed) {
      lastPlayed = found;
      console.log("Do/Play: " + found);
      if (found === ACTION.ACTION_NOT_FOUND || found === ACTION.DO_NOTHING) {
        return;
      }
      if (found === ACTION.CLICK_PLAY_BUTTON) {
        if (readCfg("clickPlayButton", false)) {
          playOriginalSpeakBtn();
        }
      } else {
        googleSay(found);
      }
    }
  }

  function getState() {
    const stateText = getAnswerHeadingEl().text();
    switch (stateText) {
      case "You are correct":
      case "Meaning:":
      case "Another correct solution:":
        return STATE.CORRECT;
      case "Pay attention to the accents.":
      case "You have a typo.":
      case "You have an extra space.":
      case "You missed a word.":
      case "You used the wrong word.":
      case "Correct solution:":
        return STATE.FAILED;
      default:
        return STATE.PENDING;
    }
  }
  function getChallengeType() {
    const titleText = jQuery('h1[data-test="challenge-header"]').text();
    if (titleText === "Mark the correct meaning") {
      return {
        lang: LANG.FOREIGH,
        type: TYPE.CHOICE
      };
    }

    if (titleText === "Select the missing word") {
      return {
        lang: LANG.FOREIGH,
        type: TYPE.SELECT_MISSING
      };
    }
    // Write “the chair” in Italian
    if (titleText.match(/Write .* in (Italian|French|German)/)) {
      return {
        lang: LANG.FOREIGH,
        type: TYPE.WRITE
      };
    }
    if (titleText === "Write this in English") {
      return {
        lang: LANG.EN,
        type: TYPE.WRITE
      };
    }
    if (titleText === "Speak this sentence") {
      return {
        lang: LANG.FOREIGH,
        type: TYPE.SPEAK
      };
    }
    return {};
  }

  function findText() {
    const challenge = getChallengeType();
    const type = challenge.type;
    const lang = challenge.lang;
    const state = getState();

    if (!lang || !type || !state) {
      return ACTION.DO_NOTHING;
    }

    // EN
    if (lang === LANG.EN) {
      if (type === TYPE.WRITE && state === STATE.PENDING) {
        return ACTION.CLICK_PLAY_BUTTON;
      }
      return ACTION.DO_NOTHING;
    }

    //IT/FR/DE
    if (state === STATE.PENDING) {
      if (type === TYPE.SPEAK) {
        return ACTION.CLICK_PLAY_BUTTON;
      }
      return ACTION.DO_NOTHING;
    }

    if (type === TYPE.CHOICE && state === STATE.FAILED) {
      return getCorrectSolutionText();
    }
    if (type === TYPE.CHOICE && state === STATE.CORRECT) {
      return getSelectedChoiceText();
    }
    if (type === TYPE.SELECT_MISSING && state === STATE.CORRECT) {
      return getSelectMissingChallengeText(getSelectedChoiceText());
    }
    if (type === TYPE.SELECT_MISSING && state === STATE.FAILED) {
      return getSelectMissingChallengeText(getCorrectSolutionText());
    }
    if (type === TYPE.WRITE && state === STATE.FAILED) {
      return getCorrectSolutionText();
    }
    if (type === TYPE.WRITE && state === STATE.CORRECT) {
      return getInputTextWithArticle();
    }

    return ACTION.ACTION_NOT_FOUND;
  }

  function getAnswerHeadingEl() {
    const nextBtn = jQuery('button[data-test="player-next"]');
    return nextBtn
      .parent()
      .prev()
      .find("h2")
      .first();
  }
  function findOneDifferent(arr) {
    const map = {};
    arr.forEach(x => (map[x] = (map[x] || 0) + 1));
    return arr.findIndex(x => map[x] === 1);
  }
  function getSelectedChoiceText() {
    const highlightClass = "_3u9BR";
    const labels = jQuery('label[data-test="challenge-choice"]').toArray();
    const classLists = labels.map(x => x.getAttribute("class"));
    const selectedIdx = findOneDifferent(classLists);
    return jQuery(labels[selectedIdx])
      .find('div[data-test="challenge-judge-text"]')
      .text();
  }
  function getInputText() {
    return (
      jQuery('input[data-test="challenge-text-input"]').val() ||
      jQuery('textarea[data-test="challenge-translate-input"]').val()
    );
  }
  function getInputTextWithArticle() {
    let article = getSelectedChoiceText() || "";
    if (article && !article.endsWith("'")) {
      article = article + " ";
    }
    return article + getInputText();
  }
  function getSelectMissingChallengeText(replacement) {
    // Io ___ la torta.
    const challenge = jQuery('div[data-test="challenge-form-prompt"]').data()
      .prompt;
    return challenge.replace(/_+/, replacement);
  }
  function getCorrectSolutionText() {
    return getAnswerHeadingEl()
      .next()
      .text();
  }

  function playOriginalSpeakBtn() {
    const originalSpeakBtn = jQuery(
      'div[data-test="challenge-translate-prompt"] button'
    );
    originalSpeakBtn.click();
  }

  function readCfg(setting, def) {
    const key = "duo-read-everything:" + setting;
    const val = JSON.parse(localStorage.getItem(key)) || def;
    localStorage.setItem(key, JSON.stringify(val));
    return val;
  }
  function googleSay(sentence) {
    var msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    // msg.voice = voices[10]; // Note: some voices don't support altering params
    msg.voiceURI = "native";
    msg.volume = readCfg("volume", 1); // 0 to 1
    msg.rate = readCfg("speed", 1); // 0.1 to 10
    msg.pitch = 1; //0 to 2
    msg.text = sentence;
    msg.lang = readCfg("lang","it-IT");

    msg.onend = function(e) {
      console.log("Finished in " + event.elapsedTime + " seconds.");
    };

    speechSynthesis.speak(msg);
  }
})();

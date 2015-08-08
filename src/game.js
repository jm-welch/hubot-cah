var _ = require('lodash');
var defaultData = {
  gameroom: null,
  scores: {},
  activePlayers: [],
  blackCard: null,
  czar: null,
  hands: {},
  answers: [],
  handsize: 7
};

var Game = function (robot) { 
  this.robot = robot;
  this.db = {};
};
module.exports = Game;

var hasProp = {}.hasOwnProperty;
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

var blackBlank = "_____";
var blackCards = require('./blackcards.coffee');
var whiteCards = require('./whitecards.coffee');

Game.prototype.init = function (data) {
  this.initialized = true;
  data.cah = data.cah || _.cloneDeep(defaultData);
  this.db = data.cah;
  this.db.blackCard = this.random_black_card();
};

Game.prototype.random_black_card = function () {
  var cardIndex;
  cardIndex = Math.floor(Math.random() * blackCards.length);
  return blackCards[cardIndex];
};

Game.prototype.random_white_card = function () {
  var cardIndex;
  cardIndex = Math.floor(Math.random() * whiteCards.length);
  return whiteCards[cardIndex];
};

Game.prototype.fix_hands = function () {
  var cardArray, name, newCard, newHands, ref;
  newHands = {};
  ref = this.db.hands;
  for (name in ref) {
    if (!hasProp.call(ref, name)) continue;
    cardArray = ref[name];
    if (indexOf.call(this.db.activePlayers, name) >= 0) {
      while (cardArray.length < this.db.handsize) {
        newCard = this.random_white_card();
        if (cardArray.indexOf(newCard) === -1) {
          cardArray.push(newCard);
        }
      }
      newHands[name] = cardArray;
    }
  }
  return this.db.hands = newHands;
};

Game.prototype.set_room = function (res) {
  return this.db.room = this.db.room || res.message.room;
};

Game.prototype.add_player = function (playerName) {
  var cards, newCard;
  if (this.db.activePlayers && indexOf.call(this.db.activePlayers, playerName) < 0) {
    this.db.activePlayers.push(playerName);
  }
  if (this.db.scores[playerName] == null) {
    this.db.scores[playerName] = 0;
  }
  cards = [];
  while (cards.length < this.db.handsize) {
    newCard = this.random_white_card();
    if (cards.indexOf(newCard) === -1) {
      cards.push(newCard);
    }
  }
  this.db.hands[playerName] = cards;
  if (this.db.activePlayers.length === 1) {
    this.db.czar = playerName;
    return this.db.blackCard = this.random_black_card();
  }
};

Game.prototype.remove_player = function (playerName) {
  var i;
  i = this.db.activePlayers.indexOf(playerName);
  if (i >= 0) {
    this.db.activePlayers.splice(i, 1);
  }
  if (this.db.hands[playerName] != null) {
    delete this.db.hands[playerName];
  }
  if (this.db.czar === playerName) {
    if (this.db.activePlayers.length === 0) {
      return this.db.czar = null;
    } else if (i >= this.db.activePlayers.length) {
      return this.db.czar = this.db.activePlayers[0];
    } else {
      return this.db.czar = this.db.activePlayers[i];
    }
  }
};

Game.prototype.show_answers = function (res, force) {
  var answers, answers_n, cards, i, j, ref, responseString, status, submitters_n;
  answers = this.db.answers;
  answers_n = answers.length;
  submitters_n = this.db.activePlayers.length - 1;
  status = answers_n + "/" + submitters_n;
  if (force || (answers_n >= submitters_n)) {
    responseString = "White card submissions so far (" + status + "):";
    for (i = j = 0, ref = answers_n; j < ref; i = j += 1) {
      cards = answers[i][1];
      responseString += "\n" + (i + 1) + ": " + (this.generate_phrase(this.db.blackCard, cards));
    }
    if (force) {
      return this.robot.messageRoom(this.sender(res), responseString);
    } else {
      return res.send(responseString);
    }
  } else {
    return res.reply("NOPE, not everyone has responded yet! (" + status + ")");
  }
};

Game.prototype.generate_phrase = function (blackCard, whiteCards) {
  var bi, blackBits, phrase, wi;
  phrase = "";
  blackBits = blackCard.split(blackBlank);
  if (blackBits.length === 1) {
    phrase += blackCard + " *" + whiteCards[0] + "*";
  } else {
    wi = 0;
    bi = 0;
    if (blackCard.substring(0, blackBlank.length) === blackBlank) {
      phrase += "*" + (whiteCards[0].match(/(.*[a-zA-Z0-9])[^a-zA-Z0-9]*$/i)[0]) + "*";
      wi = 1;
    }
    while (wi < whiteCards.length || bi < blackBits.length) {
      if (bi < blackBits.length) {
        phrase += blackBits[bi];
        bi++;
      }
      if (wi < whiteCards.length) {
        phrase += "*" + (whiteCards[wi].match(/(.*[a-zA-Z0-9])[^a-zA-Z0-9]*$/i)[0]) + "*";
        wi++;
      }
    }
  }
  return phrase;
};


Game.prototype.submit_answer = function (playerName, handIndices) {
  var card, cards, i, j, k, len, len1, playerHand;
  playerHand = this.db.hands[playerName];
  cards = [];
  for (j = 0, len = handIndices.length; j < len; j++) {
    i = handIndices[j];
    cards.push(playerHand[i]);
  }
  for (k = 0, len1 = cards.length; k < len1; k++) {
    card = cards[k];
    i = playerHand.indexOf(card);
    playerHand.splice(i, 1);
  }
  return this.db.answers.push([playerName, cards]);
};


Game.prototype.submit = function(res) {
  var expectedCount, i, j, k, l, m, numString, nums, ref, ref1, ref2, ref3;
  if (this.sender(res) === this.db.czar) {
    res.reply("You are currently the Card Czar!");
    return;
  }
  if (this.db.hands[this.sender(res)].length < this.db.handsize) {
    res.reply("You have already submitted cards for this round.");
    return;
  }
  numString = res.match[0].replace(/^[^\d]+/, '');
  nums = numString.split(" ");
  expectedCount = this.db.blackCard.split(blackBlank).length - 1;
  if (expectedCount === 0) {
    expectedCount = 1;
  }
  if (nums.length !== expectedCount) {
    return res.reply("You submitted " + nums.length + " cards, " + expectedCount + " expected.");
  } else {
    for (i = k = 0, ref = nums.length; k < ref; i = k += 1) {
      nums[i] = parseInt(nums[i], 10) - 1;
      if (nums[i] >= this.db.hands[this.sender(res)].length) {
        res.reply(nums[i] + " is not a valid card number.");
        return;
      }
    }
    for (i = l = 0, ref1 = nums.length; l < ref1; i = l += 1) {
      for (j = m = ref2 = i + 1, ref3 = nums.length; m < ref3; j = m += 1) {
        if (nums[i] === nums[j]) {
          res.reply("You cannot submit a single card more than once.");
          return;
        }
      }
    }
    this.submit_answer(this.sender(res), nums);
    return res.reply("Submission accepted.");
  }
};

Game.prototype.czar_choose_winner = function (answerIndex) {
  var answer, cards, czarIndex, j, len, ref, responseString, winner, winningPhrase;
  if (0 <= answerIndex && answerIndex < this.db.answers.length) {
    responseString = "Current round:";
    ref = this.db.answers;
    for (j = 0, len = ref.length; j < len; j++) {
      answer = ref[j];
      responseString += "\n" + answer[0] + ": " + (this.generate_phrase(this.db.blackCard, answer[1]));
    }
    winner = this.db.answers[answerIndex][0];
    cards = this.db.answers[answerIndex][1];
    winningPhrase = this.generate_phrase(this.db.blackCard, cards);
    responseString += "\n\n" + winner + " earns a point for\n*" + winningPhrase + "*";
    if (this.db.scores[winner] == null) {
      this.db.scores[winner] = 1;
    } else {
      this.db.scores[winner] = this.db.scores[winner] + 1;
    }
  }
  this.db.answers = [];
  this.fix_hands();
  this.db.blackCard = this.random_black_card();
  if (this.db.activePlayers.length === 0) {
    this.db.czar = null;
  } else if (this.db.czar == null) {
    this.db.czar = this.db.activePlayers[0];
  } else {
    czarIndex = this.db.activePlayers.indexOf(this.db.czar);
    if (czarIndex < 0 || czarIndex === this.db.activePlayers.length - 1) {
      this.db.czar = this.db.activePlayers[0];
    } else {
      this.db.czar = this.db.activePlayers[czarIndex + 1];
    }
  }
  return responseString + "\n\nNext round:\n" + this.game_state_string();
};

Game.prototype.who_hasnt_answered = function () {
  var self = this;
  var responders = this.db.activePlayers.filter(function (p) {
    return p !== self.db.czar;
  });
  var answered = this.db.answers.map(function (a) {
    return a[0];
  });
  return _.difference(responders, answered);
};

Game.prototype.game_state_string = function () {
  if (this.db.czar == null) {
    return "Waiting for players.";
  } else {
    var remaining = this.who_hasnt_answered();
    var message = "*" + this.db.blackCard + "* [czar: " + this.db.czar + "]";
    
    message += "\n[" + this.db.answers.length + "/" + (this.db.activePlayers.length - 1) + "] _Waiting on: " + (remaining ? remaining.join(', ') : "nobodyz") + "_";

    return message;
  }
};

Game.prototype.sender = function (res) {
  return res.message.user.name;
};

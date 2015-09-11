require('coffee-script');
var Game = require('../src/game');
var expect = require('chai').expect;
var _ = require('lodash');

describe('game logic', function () {

  it('should get a list of players who haven\'t answered', function () {
    var game = new Game({});
    game.init({
      cah: {
        "activePlayers": [
          "jordan",
          "nancy",
          "rhodes.json",
          "cfs",
          "richleland",
          "bobevans"
        ],
        "czar": "cfs",
        "answers": [
          ["richleland", ["A robust mongoloid."]],
          ["jordan", ["The invisible hand."]],
          ["rhodes.json", ["My collection of high-tech sex toys."]]
        ]
      }
    });

    expect(game.who_hasnt_answered()).to.deep.equal(['nancy', 'bobevans']);
  });

  it('should deal all the cards without repeating', function () {
    var game = new Game({}), nWhite, nBlack, card, dealt = [];
    game.shuffle();
    nWhite = game.db.decks.white.length;
    nBlack = game.db.decks.black.length;

    for (var i=0; i<nWhite; i++) {
      card = game.deal_card('white');
      expect(dealt).to.not.contain(card);
      dealt.push(card);
    }

    expect(game.db.decks.white.length).to.equal(0);
  });

  it('should shuffle the white and black cards', function () {
    var game = new Game({}), white, black;
    game.shuffle();
    white = game.db.decks.white[0];
    black = game.db.decks.black[0];
    game.shuffle();
    expect(white).to.not.equal(game.db.decks.white[0]);
    expect(black).to.not.equal(game.db.decks.black[0]);
  });

  it('should deal cards to all players without repeating', function () {
    var game = new Game({}), all;
    game.init({ cah: {
      activePlayers: ['player1', 'player2', 'player3', 'player4', 'player5'],
      hands: {
        player1: [],
        player2: [],
        player3: [],
        player4: [],
        player5: []
      }
    }});
    game.shuffle();
    game.fix_hands();
    all = _.reduce(game.db.hands, function (a, b) {
      return a.concat(b);
    }, []);
    expect(_.uniq(all).length).to.equal(game.db.activePlayers.length * game.db.handsize);
  });

});
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
    var game = new Game({});
    game.shuffle();
    var whites = game.db.decks.white.slice(0, 5);
    var blacks = game.db.decks.black.slice(0, 5);
    game.shuffle();
    expect(whites).to.not.deep.equal(game.db.decks.white.slice(0, 5));
    expect(blacks).to.not.deep.equal(game.db.decks.black.slice(0, 5));
  });

  it('should deal cards to all players without repeating', function () {
    var game = new Game({}), all, expectedN, startCount;
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

    expectedN = game.db.activePlayers.length * game.db.handsize;
    startCount = game.db.decks.white.length;

    game.fix_hands();
    all = _.reduce(game.db.hands, function (a, b) {
      return a.concat(b);
    }, []);
    expect(_.uniq(all).length).to.equal(expectedN);
    expect(game.db.decks.white.length).to.equal(startCount - expectedN);
  });

  it('should return a list of scores in numerical descending order', function () {
    var game = new Game({});
    game.init({ cah: {
      scores: {
        "max": 5,
        "jason": 22,
        "cole": 3,
        "old nancy": 0 
      }
    }});
    expect(game.get_leaderboard()).to.deep.equal([
      { name: 'jason', score: 22 },
      { name: 'max', score: 5 },
      { name: 'cole', score: 3 },
      { name: 'old nancy', score: 0 }
    ]);
  });

});
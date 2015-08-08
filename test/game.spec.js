require('coffee-script');
var Game = require('../src/game');
var expect = require('chai').expect;

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

});
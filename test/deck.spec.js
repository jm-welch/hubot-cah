var expect = require('chai').expect;
var _ = require('lodash');

describe('Deck', function() {
  var deck;

  beforeEach(function() {
    deck = require('../src/deck');
  });

  it('should have a single entry for empty mode', function() {
    expect(deck.whiteCards()).to.have.length(1);
    expect(deck.blackCards()).to.have.length(1);
  });

  it('should load decks based for truthy modes', function() {
    deck.setModes({base:true});
    expect(deck.whiteCards()).to.have.length.above(1);
    expect(deck.blackCards()).to.have.length.above(1);
  });

  it('should load decks based for falsey modes', function() {
    deck.setModes({base:false});
    expect(deck.whiteCards()).to.have.length(1);
    expect(deck.blackCards()).to.have.length(1);
  });

  it('should allow updating modes', function() {
    deck.setModes({base:true});
    expect(deck.whiteCards()).to.have.length.above(1);
    expect(deck.blackCards()).to.have.length.above(1);

    deck.setModes({base:false});
    expect(deck.whiteCards()).to.have.length(1);
    expect(deck.blackCards()).to.have.length(1);
  });

  it('should ignore unknown modes', function() {
    deck.setModes({alaMode:false});
    expect(deck.whiteCards()).to.have.length(1);
    expect(deck.blackCards()).to.have.length(1);
  });

  it('should list all decks', function() {
    var decks = deck.availableDecks();
    expect(decks).to.have.length.above(0);
  });

  it('should list available decks', function() {
    deck.setModes({base: true});
    var decks = deck.activeDecks();
    expect(decks).to.have.length(1);
    expect(decks).to.contain('base');
  });

});
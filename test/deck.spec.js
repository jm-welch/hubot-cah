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

  it('should load decks maind for truthy modes', function() {
    deck.setModes({main:true});
    expect(deck.whiteCards()).to.have.length.above(1);
    expect(deck.blackCards()).to.have.length.above(1);
  });

  it('should load decks maind for falsey modes', function() {
    deck.setModes({main:false});
    expect(deck.whiteCards()).to.have.length(1);
    expect(deck.blackCards()).to.have.length(1);
  });

  it('should allow updating modes', function() {
    deck.setModes({main:true});
    expect(deck.whiteCards()).to.have.length.above(1);
    expect(deck.blackCards()).to.have.length.above(1);

    deck.setModes({main:false});
    expect(deck.whiteCards()).to.have.length(1);
    expect(deck.blackCards()).to.have.length(1);
  });

  it('should ignore unknown modes', function() {
    deck.setModes({alaMode:false});
    expect(deck.whiteCards()).to.have.length(1);
    expect(deck.blackCards()).to.have.length(1);
  });

  it('should list available decks', function() {
    deck.setModes({main: true, cool_kids: false});
    var decks = deck.availableDecks();
    expect(decks.active).to.contain('main');
    expect(decks.inactive).to.contain('cool_kids');
  });

});
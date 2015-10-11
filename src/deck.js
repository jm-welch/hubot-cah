var modes = {};
var _ = require('lodash');
var requireAll = require('require-all');

var bigBlackDecks = requireAll({
  dirname: __dirname + '/decks',
  filter: /(.*)_black\.js$/,
  map: function (name) {
    return name.replace(/_.black\.js$/, '');
  }
});

var averageWhiteDecks = requireAll({
  dirname: __dirname + '/decks',
  filter: /(.*)_white\.js$/,
  map: function (name) {
    return name.replace(/_.white\.js$/, '');
  }
});


module.exports.whiteCards = function() {
  return getActiveCards(averageWhiteDecks);
};

module.exports.blackCards = function() {
  return getActiveCards(bigBlackDecks);
};

module.exports.setModes = function(md) {
  modes = md || {};
};

module.exports.availableDecks = availableDecks;

module.exports.activeDecks = activeDecks;

/**
 * An array all available decks
 * @returns {Array}
 */
function availableDecks() {
  return _.uniq(_.keys(averageWhiteDecks).concat(_.keys(bigBlackDecks)));
}

/**
 * Just the decks with a truthy mode
 * @returns {*}
 */
function activeDecks() {
  var activeModes = _.keys(_.pick(modes, function(value) { return !!value}));
  var allDecks = availableDecks();
  return _.intersection(activeModes, allDecks);
}

/**
 * creates an array of all cards for modes that are truthy
 * Ignores modes that don't have a corresponding deck
 * @param deckMap
 * @returns {Array}
 */
function getActiveCards(deckMap) {
  var cards = [];

  _.forEach(activeDecks(), function(deck) {
    cards = cards.concat(deckMap[deck] || []);
  });

  if(cards.length === 0) {
    cards.push('No decks active! Pick some from: ' + availableDecks().join(', '));
  }

  return _.shuffle(cards);
}
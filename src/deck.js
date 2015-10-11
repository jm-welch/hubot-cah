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

/**
 * An array all available decks
 * @returns {Array}
 */
function availableDecks() {
  var allDecks = _.uniq(_.keys(averageWhiteDecks).concat(_.keys(bigBlackDecks)));
  var partitioned = _.partition(allDecks, function(deck) {
    return !!modes[deck];
  });

  return {
    active: partitioned[0],
    inactive: partitioned[1]
  };
}

/**
 * creates an array of all cards for modes that are truthy
 * Ignores modes that don't have a corresponding deck
 * @param deckMap
 * @returns {Array}
 */
function getActiveCards(deckMap) {
  var cards = []
    , decks = availableDecks();

  _.forEach(decks.active, function(deck) {
    cards = cards.concat(deckMap[deck] || []);
  });

  if(cards.length === 0) {
    cards.push('No decks active! Pick some from: ' + decks.inactive.join(', '));
  }

  return _.shuffle(cards);
}
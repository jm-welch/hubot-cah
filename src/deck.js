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

/**
 * creates an array of all cards for modes that are truthy
 * Ignores modes that don't have a corresponding deck
 * @param modeToDeckMap
 * @returns {Array}
 */
function getActiveCards(modeToDeckMap) {
  var cards = [];
  var activeModes = _.keys(_.pick(modes, function(value) { return !!value}));

  _.forEach(activeModes, function(mode) {
    cards = cards.concat(modeToDeckMap[mode] || []);
  });

  if(cards.length === 0) {
    cards.push('No decks active! Pick some from: ' + _.keys(averageWhiteDecks).join(', '));
  }

  return _.shuffle(cards);
}
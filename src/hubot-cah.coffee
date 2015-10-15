helpSummary = "_hubot-cah commands:_"
helpSummary += "\ncah help - List cah commands"
helpSummary += "\ncah join - Add yourself to the game"
helpSummary += "\ncah leave - Remove yourself as an active player"
helpSummary += "\ncah kick - Remove another active player"
helpSummary += "\ncah czar - Display name of the current Card Czar"
helpSummary += "\ncah players - List active players"
helpSummary += "\ncah leaders - Top five score leaders"
helpSummary += "\ncah score - Display your score"
helpSummary += "\ncah hand - List cards in your hand"
helpSummary += "\ncah play <#> <#> ... - Indicate white cards to be submitted as an answer, applied to black card blanks in order"
helpSummary += "\ncah answers - List the submitted white cards once all have been submitted"
# helpSummary += "\ncah answers! - List the submitted white cards anytime (czar only)"
helpSummary += "\ncah choose <#> - Choose a winning answer (czar only)"
helpSummary += "\ncah status - Display summary of current game"
helpSummary += "\ncah skip - Discard current black card and assign a new Card Czar"
helpSummary += "\ncah toggle deck <deck> - Toggles a deck on or off. "
helpSummary += "\ncah decks - Lists all active and inactive decks. Decks can be toggled on and off `toggle deck`. "

Game = require('./game')
deck = require('./deck')
_ = require('lodash')

start = (robot, game) ->
  game.init robot.brain.data
  robot.hearspond new RegExp("cah (submit|play)( [1-" + game.db.handsize + "])+$", "i"), game.submit.bind(game)

module.exports = (robot) ->

  global.game = new Game(robot)

  robot.error (err, res) ->
    if res?
      res.reply "Someone broke me again: #{err.message}"
      robot.messageRoom '#debug', err.stack
    robot.logger.error err.message
    robot.logger.error err.stack
    robot.logger.error JSON.stringify(robot.brain.data.cah, null, '\t')

  robot.brain.on "loaded", =>
    start(robot, game)

  # combo hear and respond, prepends ^ to hear regex
  # good for allowing same commands in room and DM
  robot.hearspond = (regex, cb) ->
    alt = new RegExp('^' + regex.source, 'i')
    args = Array.prototype.slice(arguments, 1)
    this.hear.call(this, alt, cb)
    this.respond.call(this, regex, cb)

  robot.respond /message ([^\s]+) (.*)$/i, (res) ->
    robot.messageRoom(res.match[1], res.match[2]);

  robot.hearspond /cah db([a-z0-9_\.]*)? ?$/i, (res) ->
    response = game.db
    if (res.match[1])
      _.forEach res.match[1].split('.').slice(1), (m) ->
        response = response[m];
    res.send JSON.stringify(response, null, 2)

  robot.hearspond /cah debug (.*)/i, (res) ->
    game.debug(res.match[1])
    
  robot.hear /^cah reset-game$/i, (res) ->
    game.reset()
    res.send('\n\n===\nGAME RESET SUCCESSFULLY\n===\n\n')

  robot.hearspond /cah help$/i, (res) ->
    res.send helpSummary

  robot.hear /^cah join$/i, (res) ->
    game.set_room(res)
    name = game.sender(res)
    game.add_player(name)
    res.reply "You are now an active CAH player."

  robot.hear /^cah leave$/i, (res) ->
    name = game.sender(res)
    game.remove_player(name)
    res.send "#{name} is no longer a CAH player. Their score will be preserved should they decide to play again."

  robot.hear /^cah toggle (mode|deck) (.*)$/i, (res) ->
    mode = res.match[2].trim()
    res.send mode + ' ' + res.match[1].trim() + ' has been set to ' + game.toggle_mode(mode)

  robot.hear /^cah kick( [^\s]+)$/i, (res) ->
    name = res.match[1].trim()
    if (game.db.activePlayers.indexOf(name) == -1)
      res.reply "#{name} isn't a current player so... this is awkward"
      return
    game.remove_player(name)
    res.send "#{name} is no longer a CAH player. Their score will be preserved should they decide to play again."

  robot.hearspond /cah czar$/i, (res) ->
    if game.db.czar?
      res.send game.db.czar
    else
      res.send "No Card Czar yet, waiting for players."

  robot.hearspond /cah players$/i, (res) ->
    if game.db.activePlayers.length < 1
      res.send "Waiting for players."
    else
      responseString = "CAH Players: #{game.db.activePlayers[0]}"
      for i in [1...game.db.activePlayers.length] by 1
        responseString += ", #{game.db.activePlayers[i]}"
      res.send responseString

  robot.hearspond /cah leaders$/i, (res) ->
    responseString = "*CAH Leaderboard*"
    for player in game.get_leaderboard()
      responseString += "\n#{player.name}: #{player.score}"

    res.send responseString

  robot.hearspond /cah score$/i, (res) ->
    score = game.db.scores[game.sender(res)]
    if score?
      res.reply score
    else
      res.reply "No CAH score on record."

  robot.hearspond /cah (hand|cards)$/i, (res) ->
    cards = game.db.hands[game.sender(res)]
    responseString = "Your white CAH cards:"
    if cards?
      for i in [0...cards.length] by 1
        responseString += "\n#{i+1}: #{cards[i]}"
    responseString += "\nCurrent black card: *#{game.db.blackCard}*"
    robot.messageRoom game.sender(res), responseString


  robot.hear /^cah answers$/i, (res) ->
    game.show_answers res

  robot.hear /^cah answers!/i, (res) ->
    if (game.sender(res) != game.db.czar)
      res.reply "Whoa easy only the czar can force out the answers"
      return
    game.show_answers res, 'force, mother fucker'


  robot.hear /^cah (choose|pick) (\d+)$/i, (res) ->
    if game.sender(res) != game.db.czar
      res.reply "Only the Card Czar may choose a winner."
    else if game.db.answers.length == 0
      res.reply "No submissions to choose from yet."
    else
      num = parseInt(res.match[2]) - 1
      if num < 0 or num >= game.db.answers.length
        res.reply "That is not an valid choice, try again."
      else
        res.send game.czar_choose_winner num

  robot.hearspond /cah status ?$/i, (res) ->
    res.send game.game_state_string()

  robot.hear /^cah skip$/i, (res) ->
    game.db.answers = []
    game.db.blackCard = game.deal_card('black')
    res.send game.game_state_string()

  robot.hearspond /cah decks$/i, (res) ->
    decks = deck.availableDecks();
    res.send "Active decks: " + decks.active.join(', ') + "\nInactive decks: " + decks.inactive.join(', ')

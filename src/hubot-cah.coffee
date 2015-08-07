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

Game = require('./game')

start = (robot, game) ->
  game.init robot.brain.data
  robot.hearspond new RegExp("cah (submit|play)( [1-" + game.db.handsize + "])+$", "i"), game.submit.bind game

module.exports = (robot) ->

  global.game = new Game(robot)

  robot.error (err, res) ->
    if res?
      res.reply "Someone broke me again: #{err.message}"
      robot.messageRoom "#debug", "CAH Error:\n\n#{err.message}\n\n===\n\n#{err.stack}"
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

  robot.hearspond /cah db$/i, (res) ->
    res.reply JSON.stringify game.db

  robot.hear /^cah reset-game$/i, (res) ->
    delete robot.brain.data.cah
    global.game = new Game(robot)
    start(robot, game)
    res.reply "💥 the game has been reset 💥"

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
    scoreTuples = []
    for name,score of game.db.scores
      scoreTuples.push([name,score])
    scoreTuples.sort (a,b) ->
      a = a[1]
      b = b[1]
      return a < b ? -1 : (a > b ? 1 : 0)

    responseString = "CAH Leaders:"
    for i in [0...5] by 1
      if i >= scoreTuples.length
        break
      responseString += "\n#{scoreTuples[i][1]} #{scoreTuples[i][0]}"
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

  robot.hearspond /cah (status|question)$/i, (res) ->
    res.send game.game_state_string()

  robot.hear /^cah skip$/i, (res) ->
    res.send game.czar_choose_winner -1
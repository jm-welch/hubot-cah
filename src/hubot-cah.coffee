#
# Description:
#   Cards Against Humanity game managed by Hubot
#   https://github.com/coryallegory/hubot-cah
#
# Dependencies:
#   None
#
# Commands:
#   cah help - List cah commands
#   cah play - Add yourself to the game
#   cah retire - Remove yourself as an active player
#   cah czar - Display name of the current Card Czar
#   cah players - List active players
#   cah leaders - Top five score leaders
#   cah score - Display your score
#   cah hand - List cards in your hand
#   cah submit <#> <#> ... - Indicate white cards to be submitted as an answer, where # indicates card index in hand and amount of white cards submitted corresponds to the amount required by the current black card
#   cah answers - List the current white card submissions for the current black card (Card Czar only)
#   cah choose <#> - Choose a winning answer (Card Czar only)
#   cah status - Display summary of current game
#   cah skip - Discard current black card and assign a new Card Czar
#
# Author:
#   Cory Metcalfe (corymetcalfe@gmail.com)
#

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
helpSummary += "\ncah answers! - List the submitted white cards anytime (czar only)"
helpSummary += "\ncah choose <#> - Choose a winning answer (czar only)"
helpSummary += "\ncah status - Display summary of current game"
helpSummary += "\ncah skip - Discard current black card and assign a new Card Czar"


blackBlank = "_____"

blackCards = require('./blackcards.coffee')

whiteCards = require('./whitecards.coffee')

# @return black card text string
random_black_card = () ->
  cardIndex = Math.floor(Math.random()*blackCards.length)
  return blackCards[cardIndex]

# @return white card text string
random_white_card = () ->
  cardIndex = Math.floor(Math.random()*whiteCards.length)
  return whiteCards[cardIndex]

db = {
  scores:         {},                   # {<name>: <score>, ...}
  activePlayers:  [],                   # [<player name>, ...]
  blackCard:      random_black_card(),  # <card text>
  czar:           null,                 # <player name>
  hands:          {},                   # {<name>: [<card text>, <card text>, ...], ...}
  answers:        [],                   # [ [<player name>, [<card text>, ...]], ... ]
}

# prune inactive player hands, ensure everyone has five cards
fix_hands = () ->
  newHands = {}
  for own name, cardArray of db.hands
    if name in db.activePlayers
      while cardArray.length < 5
        cardArray.push random_white_card()
      newHands[name] = cardArray
  db.hands = newHands

# add player to active list
# fix their hand so it contains five cards
# if only player, make them czar
# @param playerName: name of player coming into game
add_player = (playerName) ->
  if playerName not in db.activePlayers
    db.activePlayers.push playerName
  if !db.scores[playerName]?
    db.scores[playerName] = 0
  cards = []
  while cards.length < 5
    cards.push random_white_card()
  db.hands[playerName] = cards
  if db.activePlayers.length == 1
    db.czar = playerName
    db.blackCard = random_black_card()

# remove player from active list
# remove any associated hands
# if they were czar, assign a new one
# @param playerName: name of player leaving the game
remove_player = (playerName) ->
  i = db.activePlayers.indexOf(playerName)
  if i >= 0
    db.activePlayers.splice(i,1)
  if db.hands[playerName]?
    delete db.hands[playerName]
  if db.czar == playerName
    if db.activePlayers.length == 0
      db.czar = null
    else if i >= db.activePlayers.length
      db.czar = db.activePlayers[0]
    else
      db.czar = db.activePlayers[i]

# combine black and white cards into complete phrase
# @param blackCard: black card text string
# @param whiteCards: array of white card text strings
# @return completed string
generate_phrase = (blackCard, whiteCards) ->
  phrase = ""
  blackBits = blackCard.split blackBlank
  if blackBits.length == 1
    phrase += "#{blackCard} *#{whiteCards[0]}*"
  else
    wi = 0
    bi = 0
    if blackCard.substring(0, blackBlank.length) == blackBlank
      phrase += "*#{whiteCards[0].match(/(.*[a-zA-Z0-9])[^a-zA-Z0-9]*$/i)[0]}*"
      wi = 1
    while wi < whiteCards.length or bi < blackBits.length
      if bi < blackBits.length
        phrase += blackBits[bi]
        bi++
      if wi < whiteCards.length
        phrase += "*#{whiteCards[wi].match(/(.*[a-zA-Z0-9])[^a-zA-Z0-9]*$/i)[0]}*"
        wi++
  return phrase

# remove cards from player hand and add to answers
# @param playerName: player submitting answer
# @param handIndices: indices of cards in player hand
submit_answer = (playerName, handIndices) ->
  playerHand = db.hands[playerName]
  cards = []
  for i in handIndices
    cards.push playerHand[i]
  for card in cards
    i = playerHand.indexOf(card)
    playerHand.splice(i,1)
  db.answers.push [playerName, cards]

# specify winning card and reset game for next round
# @param answerIndex: if value outside db.answers array range, no winner this round
# @return string for public display
czar_choose_winner = (answerIndex) ->
  if 0 <= answerIndex and answerIndex < db.answers.length
    responseString = "Current round:"
    for answer in db.answers
      responseString += "\n#{answer[0]}: #{generate_phrase(db.blackCard, answer[1])}"

    winner = db.answers[answerIndex][0]
    cards = db.answers[answerIndex][1]
    winningPhrase = generate_phrase(db.blackCard, cards)

    responseString += "\n\n#{winner} earns a point for\n*#{winningPhrase}*"

    if !db.scores[winner]?
      db.scores[winner] = 1
    else
      db.scores[winner] = db.scores[winner] + 1

  db.answers = []
  fix_hands()
  db.blackCard = random_black_card()
  if db.activePlayers.length == 0
    db.czar = null
  else if !db.czar?
    db.czar = db.activePlayers[0]
  else
    czarIndex = db.activePlayers.indexOf db.czar
    if czarIndex < 0 or czarIndex == db.activePlayers.length-1
      db.czar = db.activePlayers[0]
    else
      db.czar = db.activePlayers[czarIndex+1]
  return responseString + "\n\nNext round:\n" + game_state_string()

# generate string describing game state
# czar, black card, number of submissions
game_state_string = () ->
  if !db.czar?
    return "Waiting for players."
  else
    return "*#{db.blackCard}* [#{db.czar}, #{db.answers.length}/#{db.activePlayers.length-1}]"

# @param res: message object
# @return name of message sender
sender = (res) ->
  return res.message.user.name


module.exports = (robot) ->
  robot.error (err, res) ->
    if res?
      res.reply "Someone broke me again: #{err.message}"
    robot.logger.error err.message
    robot.logger.error err.stack
    robot.logger.error JSON.stringify(robot.brain.data.cah, null, '\t'))

  robot.brain.on "loaded", =>
    if !robot.brain.data.cah
      robot.brain.data.cah = db
    db = robot.brain.data.cah


  # display submitted answers
  # by default only works when all active players have submitted,
  # but can be overridden by passing true for force param
  show_answers = (res, force) ->
    answers = db.answers
    answers_n = answers.length
    submitters_n = db.activePlayers.length - 1
    status = "#{answers_n}/#{submitters_n}"
    if (force || (answers_n >= submitters_n))
      responseString = "White card submissions so far (#{status}):"
      for i in [0...answers_n] by 1
        cards = answers[i][1]
        responseString += "\n#{i+1}: #{generate_phrase(db.blackCard, cards)}"
      if (force)
        robot.messageRoom sender(res), responseString
      else
        res.send responseString
    else
      res.reply "NOPE, not everyone has responded yet! (#{status})\n(Czars can use 'cah answers!' to see answers early)"

  # combo hear and respond, prepends ^ to hear regex
  # good for allowing same commands in room and DM
  robot.hearspond = (regex, cb) ->
    alt = new RegExp('^' + regex.source, 'i')
    args = Array.prototype.slice(arguments, 1)
    this.hear.call(this, alt, cb)
    this.respond.call(this, regex, cb)

  robot.hearspond /cah help$/i, (res) ->
    res.send helpSummary

  robot.hear /^cah join$/i, (res) ->
    name = sender(res)
    add_player(name)
    res.reply "You are now an active CAH player."

  robot.hear /^cah leave$/i, (res) ->
    name = sender(res)
    remove_player(name)
    res.send "#{name} is no longer a CAH player. Their score will be preserved should they decide to play again."

  robot.hear /^cah kick( [^\s]+)$/i, (res) ->
    name = res.match[1].trim()
    if (db.activePlayers.indexOf(name) == -1)
      res.reply "#{name} isn't a current player so... this is awkward"
      return
    remove_player(name)
    res.send "#{name} is no longer a CAH player. Their score will be preserved should they decide to play again."

  robot.hearspond /cah czar$/i, (res) ->
    if db.czar?
      res.send db.czar
    else
      res.send "No Card Czar yet, waiting for players."

  robot.hearspond /cah players$/i, (res) ->
    if db.activePlayers.length < 1
      res.send "Waiting for players."
    else
      responseString = "CAH Players: #{db.activePlayers[0]}"
      for i in [1...db.activePlayers.length] by 1
        responseString += ", #{db.activePlayers[i]}"
      res.send responseString

  robot.hearspond /cah leaders$/i, (res) ->
    scoreTuples = []
    for name,score of db.scores
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
    score = db.scores[sender(res)]
    if score?
      res.reply score
    else
      res.reply "No CAH score on record."

  robot.hearspond /cah (hand|cards)$/i, (res) ->
    cards = db.hands[sender(res)]
    responseString = "Your white CAH cards:"
    if cards?
      for i in [0...cards.length] by 1
        responseString += "\n#{i+1}: #{cards[i]}"
    responseString += "\nCurrent black card: *#{db.blackCard}*"
    robot.messageRoom sender(res), responseString

  robot.hearspond /cah (submit|play)( [1-5])+$/i, (res) ->
    if sender(res) == db.czar
      res.reply "You are currently the Card Czar!"
      return
    if db.hands[sender(res)].length < 5
      res.reply "You have already submitted cards for this round."
      return
    numString = res.match[0].replace(/^[^\d]+/, '')
    nums = numString.split(" ")

    expectedCount = db.blackCard.split(blackBlank).length - 1
    if expectedCount == 0
      expectedCount = 1
    if nums.length != expectedCount
      res.reply "You submitted #{nums.length} cards, #{expectedCount} expected."
    else
      for i in [0...nums.length] by 1
        nums[i] = parseInt(nums[i], 10) - 1
        if nums[i] >= db.hands[sender(res)].length
          res.reply "#{nums[i]} is not a valid card number."
          return
      for i in [0...nums.length] by 1
        for j in [i+1...nums.length] by 1
          if nums[i] == nums[j]
            res.reply "You cannot submit a single card more than once."
            return
      submit_answer(sender(res), nums)
      res.reply "Submission accepted."


  robot.hearspond /cah answers$/i, (res) ->
    show_answers res

  robot.hearspond /cah answers!/i, (res) ->
    if (sender(res) != db.czar)
      res.reply "Whoa easy only the czar can force out the answers"
      return
    show_answers res, 'force, mother fucker'


  robot.hear /^cah (choose|pick) (\d+)$/i, (res) ->
    if sender(res) != db.czar
      res.reply "Only the Card Czar may choose a winner."
    else if db.answers.length == 0
      res.reply "No submissions to choose from yet."
    else
      num = parseInt(res.match[2]) - 1
      if num < 0 or num >= db.answers.length
        res.reply "That is not an valid choice, try again."
      else
        res.send czar_choose_winner num

  robot.hearspond /cah (status|question)$/i, (res) ->
    res.send game_state_string()

  robot.hear /^cah skip$/i, (res) ->
    res.send czar_choose_winner -1

  robot.hearspond /cah debug$/i, (res) ->
    res.send "Here's some json for you\n" + JSON.stringify(robot.brain.data.cah, null, '\t')
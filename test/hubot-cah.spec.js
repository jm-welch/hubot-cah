require('coffee-script');
var EE = require('events').EventEmitter
  , chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire').noCallThru()  // no call thru is needed because the cards files only export an array
  , _ = require('lodash');

chai.use(require('sinon-chai'));

function RobotMock() {
  this.hear = sinon.stub();
  this.respond = sinon.stub();
  this.messageRoom = sinon.stub();
  this.error = sinon.stub();
  this.logger = {
    error: sinon.stub()
  };
  this.brain = new EE();
  this.brain.data = {};
}

function ResMock() {
  this.send = sinon.stub();
  this.reply = sinon.stub();
  this.message = {
    room: '#cah',
    user: {
      name: 'billmurray'
    }
  };
}

describe('hubot-cah // cool kids fork', function () {
  var robotMock
    , resMock
    , gameMock
    , cachedDb
    , cah
    , cards = ['card 1','card 2','card 3','card 4','card 5','card 6','card 7'];

  before(function () {
    gameMock = function () {
      this.get_leaderboard = sinon.stub();
    };
    
    cah = proxyquire ('../src/hubot-cah', {
      './whitecards.coffee': cards,
      './lib/game': gameMock
    });

    // Get copy of what inner db is like at start, to reset in afterEach
    var robot = new RobotMock();
    cah(robot);
    robot.brain.emit('loaded');
    cachedDb = JSON.stringify(robot.brain.data.cah);
  });

  beforeEach(function () {
    robotMock = new RobotMock();    
    resMock = new ResMock();
    cah(robotMock);
    robotMock.brain.emit('loaded');
  });

  afterEach(function () {
    // Reset inner db to it's original state
    robotMock.brain.data.cah = JSON.parse(cachedDb);
    robotMock.brain.emit('loaded');
  });

  it('should log on robot error', function () {
    var errorMock = new Error('afraid i cant do that');
    robotMock.error.yields(errorMock, resMock);
    
    cah(robotMock);

    expect(resMock.reply).to.have.been.calledWith('Someone broke me again: afraid i cant do that');
    expect(robotMock.logger.error.callCount).to.equal(3);
  });

  it('should load default data to brain, if none exists', function () {
    cah(robotMock);
    robotMock.brain.emit('loaded');

    expect(robotMock.brain.data.cah.czar).to.be.null;
    expect(robotMock.brain.data.cah.hands).to.exist;
    expect(robotMock.brain.data.cah.activePlayers).to.exist;
  });

  it('should load pre-existing brain data', function () {
    var preExistingData = { fake: 'data' };
    robotMock.brain.data.cah = preExistingData;

    cah(robotMock);
    robotMock.brain.emit('loaded');

    expect(robotMock.brain.data.cah).to.deep.equal(preExistingData);
  });

  it('should create a hearspond frankensteinian monstrosity', function () {
    cah(robotMock);
    expect(robotMock.hearspond).to.be.a('function');
    robotMock.hearspond(/test/, 'cb');
    expect(robotMock.hear).to.have.been.calledWith(/^test/i, 'cb');
    expect(robotMock.respond).to.have.been.calledWith(/test/, 'cb');
  });

  it('should print help text command list', function () {
    robotMock.respond.withArgs(/cah help$/i).yields(resMock);
    cah(robotMock);
    robotMock.brain.emit('loaded');
    expect(resMock.send).to.have.been.calledWithMatch(/^_hubot-cah commands:_/);
  });

});

require('coffee-script');
var EE = require('events').EventEmitter;
var chai = require('chai');
var expect = require('chai').expect;
var sinon = require('sinon');
var cah = require('../src/hubot-cah');

chai.use(require('sinon-chai'));

describe('hubot-cah // cool kids fork', function () {
  var robotMock;
  var resMock;

  beforeEach(function () {

    robotMock = {
      hear: sinon.stub(),
      respond: sinon.stub(),
      messageRoom: sinon.stub(),
      error: sinon.stub(),
      logger: {
        error: sinon.stub()
      },
      brain: new EE()
    };

    robotMock.brain.data = {};
    
    resMock = {
      send: sinon.stub(),
      reply: sinon.stub(),
      message: {
        user: {
          name: 'billmurray'
        }
      }
    };

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
    expect(robotMock.brain.data.cah.blackCard).to.exist;
    expect(robotMock.brain.data.cah.hands).to.exist;
    expect(robotMock.brain.data.cah.activePlayers).to.exist;
  });

  it.skip('should load pre-existing brain data', function () {
    // var preExistingData = { fake: 'data' };
    robotMock.brain.data.cah = 'some data';

    cah(robotMock);
    robotMock.brain.emit('loaded');

    expect(robotMock.brain.data.cah).to.equal('some data');
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
    expect(resMock.send).to.have.been.calledWithMatch(/^_hubot-cah commands:_/);
  });

  it('should allow players to join and deal them 5 cards', function () {
    robotMock.hear.withArgs(/^cah join$/i).yields(resMock);
    cah(robotMock);
    robotMock.brain.emit('loaded');
    expect(robotMock.brain.data.cah.activePlayers).to.deep.equal([ "billmurray" ]);
    expect(resMock.reply).to.have.been.calledWith('You are now an active CAH player.');
  });

});

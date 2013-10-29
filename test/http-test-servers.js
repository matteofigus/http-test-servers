var should = require('should');
var TestServers = require('./../lib/http-test-servers');
var _ = require('underscore');

describe('http test servers', function(){

  it('should start 2 servers each one with 2 get routes', function(done){

    var endpoints = {
      route1: '/getData',
      route2: '/getData2'
    };

    var servers = {
      server1: {
        port: 3006
      },
      server2: {
        port: 3007
      }
    };

    var testServers = new TestServers(endpoints, servers);

    testServers.start(function(testServers){
      testServers.should.not.be.empty;
      testServers.servers.server1.port.should.be.eql(3006);
      testServers.servers.server2.port.should.be.eql(3007);

      testServers.kill(done);
    });

  });

});
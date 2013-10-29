var should = require('should');
var superagent = require('superagent');
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
      testServers.endpoints.route1.should.be.eql('/getData');
      testServers.endpoints.route2.should.be.eql('/getData2');
      testServers.servers.server1.port.should.be.eql(3006);
      testServers.servers.server2.port.should.be.eql(3007);


      superagent.get("http://localhost:3006/getData", function(response){
        response.statusCode.should.be.eql(200);
        response.body.should.be.eql({ message: 'route1'});

        superagent.get("http://localhost:3007/getData2", function(response2){
          response2.statusCode.should.be.eql(200);
          response2.body.should.be.eql({ message: 'route2'});
          testServers.kill(done);
        });


      });

    });

  });

});
var giveMe = require('give-me');
var should = require('should');
var superagent = require('superagent');
var TestServers = require('./../lib/http-test-servers');

describe('when starting http servers', function(){

  it('should http-test-servers library provide an object with the correct object and a kill functionality', function(done){

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

      testServers.kill(done);
    });
  });

  it('should they properly respond when a http request is made to the created routes', function(done){

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

      giveMe.all(superagent.get, [["http://localhost:3006/getData"],["http://localhost:3007/getData2"]], function(responses){

        responses[0][0].statusCode.should.be.eql(200);
        responses[0][0].body.should.be.eql({ message: '/getData'});  
        responses[1][0].statusCode.should.be.eql(200);
        responses[1][0].body.should.be.eql({ message: '/getData2'});

        testServers.kill(done);
      });
    });
  });

  it('should they properly respond in case of post routes', function(done){

    var endpoints = {
      route1: {
        route: '/postData',
        method: 'post'
      }
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

      giveMe.all(superagent.post, [["http://localhost:3006/postData"],["http://localhost:3007/postData"]], function(responses){

        responses[0][0].statusCode.should.be.eql(200);
        responses[0][0].body.should.be.eql({ message: '/postData'});  
        responses[1][0].statusCode.should.be.eql(200);
        responses[1][0].body.should.be.eql({ message: '/postData'});

        testServers.kill(done);
      });
    });
  });

  it('should they properly respond with a specific response and status code if it is specified', function(done){

    var endpoints = {
      route1: {
        route: '/getData',
        method: 'get',
        response: { isThisATest: true },
        statusCode: 317
      }
    };

    var servers = {
      server1: {
        port: 3006
      }
    };

    var testServers = new TestServers(endpoints, servers);

    testServers.start(function(testServers){

      superagent.get("http://localhost:3006/getData", function(response){

        response.statusCode.should.be.eql(317);
        response.body.should.be.eql({ isThisATest: true });  

        testServers.kill(done);
      });
    });
  });
});
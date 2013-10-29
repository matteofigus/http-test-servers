var giveMe = require('give-me');
var should = require('should');
var superagent = require('superagent');
var TestServers = require('./../lib/http-test-servers');
var _ = require('underscore');

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

  it('should they properly respond in case of post routes', function(done){

    var endpoints = {
      route1: {
        route: '/deleteData',
        method: 'delete'
      }
    };

    var servers = {
      server1: {
        port: 3006
      }
    };

    var testServers = new TestServers(endpoints, servers);

    testServers.start(function(testServers){

      superagent.del("http://localhost:3006/deleteData", function(response){

        response.statusCode.should.be.eql(200);
        response.body.should.be.eql({ message: '/deleteData'});  

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

  it('should they properly respond with a specific delay if needed', function(done){

    var endpoints = {
      route1: {
        route: '/getData'
      }
    };

    var servers = {
      server1: {
        port: 3006
      },
      server2: {
        port: 3007,
        delay: 2000
      }
    };

    var testServers = new TestServers(endpoints, servers);

    testServers.start(function(testServers){

      var callbacks = 2,
          time = new Date();

      var next = function(){
        callbacks--;
        if(callbacks == 0)
          testServers.kill(done);
      }

      superagent.get("http://localhost:3006/getData", function(response){
        var newTime = new Date() - time;
        newTime.should.be.within(0, 2000);
        next();
      });

      superagent.get("http://localhost:3007/getData", function(response){
        var newTime = new Date() - time;
        newTime.should.be.within(2000, 4000);
        next();
      });

    });
  });

  it('should they properly setup routes with querystrings', function(done){

    var endpoints = {
      route1: {
        route: '/getData?mydata=something'
      }
    };

    var servers = {
      server1: {
        port: 3006
      }
    };

    var testServers = new TestServers(endpoints, servers);

    testServers.start(function(testServers){

      var route = _.filter(testServers.servers.server1.app.routes.get, function(route){
        return route.path == '/getData'
      });

      route.length.should.be.eql(1);

      testServers.kill(done);
    });
  });

});
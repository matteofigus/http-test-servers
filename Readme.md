http-test-servers
=============
[![Build Status](https://secure.travis-ci.org/matteofigus/http-test-servers.png?branch=master)](http://travis-ci.org/matteofigus/http-test-servers)

Speeds up some http servers for testing pourposes.

## Installation

  npm http-test-servers

### Sample usage (init, start, kill)

  // Routes first. They can be a simple string (will be a get route), or objects as follows

  var routes = {
    route1: '/getData',
    route2: {
      route: '/postData2',
      method: 'post',
      statusCode: 302,
      response: { 'hello': 'world' }
    }
  };

  // Next the servers. The optional delay is to simulate a delay on the response. For each one the same routes will be created

  var servers = {
    server1: {
      port: 3006
    },
    server2: {
      port: 3007,
      delay: 2000
    }
  };

  // init
  var testServers = new TestServers(routes, servers);

  // start them
  testServers.start(function(testServers){

    // if you want, take a look at this
    console.log(testServers)

    // don't forget to kill them
    testServers.kill(function(){
      
      console.log('killed everything');
    });
  });


# Tests

  npm test

# License

MIT

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/matteofigus/http-test-servers/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
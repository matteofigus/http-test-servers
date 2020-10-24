var giveMe = require("give-me");
var should = require("should");
var superagent = require("superagent");
var _ = require("underscore");

describe("http-test-servers", function () {
  var testServers,
    TestServers = require("./../lib/http-test-servers");

  var initialise = function (endpoints, servers, done) {
    testServers = new TestServers(endpoints, servers);
    testServers.start(function () {
      done(testServers);
    });
  };

  describe("when starting http servers", function () {
    it("should expose servers and kill handler", function (done) {
      var endpoints = { route1: "/getData", route2: "/getData2" },
        servers = { server1: { port: 3006 }, server2: { port: 3007 } };

      initialise(endpoints, servers, function (testServers) {
        testServers.should.not.be.empty;
        testServers.endpoints.route1.should.be.eql("/getData");
        testServers.endpoints.route2.should.be.eql("/getData2");
        testServers.servers.server1.port.should.be.eql(3006);
        testServers.servers.server2.port.should.be.eql(3007);
        testServers.kill(done);
      });
    });

    it("should provide responsive routes", function (done) {
      var endpoints = { route1: "/getData", route2: "/getData2" },
        servers = { server1: { port: 3006 }, server2: { port: 3007 } };

      initialise(endpoints, servers, function (testServers) {
        giveMe.all(
          superagent.get,
          [
            ["http://localhost:3006/getData"],
            ["http://localhost:3007/getData2"],
          ],
          function (responses) {
            responses[0][1].statusCode.should.be.eql(200);
            responses[0][1].body.should.be.eql({ message: "/getData" });
            responses[1][1].statusCode.should.be.eql(200);
            responses[1][1].body.should.be.eql({ message: "/getData2" });
            testServers.kill(done);
          }
        );
      });
    });

    it("should provide responsive post routes", function (done) {
      var endpoints = { route1: { route: "/postData", method: "post" } },
        servers = { server1: { port: 3006 }, server2: { port: 3007 } };

      initialise(endpoints, servers, function (testServers) {
        giveMe.all(
          superagent.post,
          [
            ["http://localhost:3006/postData"],
            ["http://localhost:3007/postData"],
          ],
          function (responses) {
            responses[0][1].statusCode.should.be.eql(200);
            responses[0][1].body.should.be.eql({ message: "/postData" });
            responses[1][1].statusCode.should.be.eql(200);
            responses[1][1].body.should.be.eql({ message: "/postData" });
            testServers.kill(done);
          }
        );
      });
    });

    it("should provide delete routes", function (done) {
      var endpoints = { route1: { route: "/deleteData", method: "delete" } },
        servers = { server1: { port: 3006 } };

      initialise(endpoints, servers, function (testServers) {
        superagent.del("http://localhost:3006/deleteData", function (
          err,
          response
        ) {
          response.statusCode.should.be.eql(200);
          response.body.should.be.eql({ message: "/deleteData" });
          testServers.kill(done);
        });
      });
    });

    it("should provide routes that respond with a non-json response and status code", function (done) {
      var endpoints = {
        route1: {
          route: "/getData",
          method: "get",
          response: "<html>Hello!</html>",
          statusCode: 200,
        },
      };

      var servers = { server1: { port: 3006 } };

      initialise(endpoints, servers, function (testServers) {
        superagent.get("http://localhost:3006/getData", function (
          err,
          response
        ) {
          response.statusCode.should.be.eql(200);
          response.text.should.be.eql("<html>Hello!</html>");
          testServers.kill(done);
        });
      });
    });

    it("should provide routes that respond with some headers", function (done) {
      var endpoints = {
        route1: {
          route: "/getData",
          method: "get",
          response: "<html>Hello!</html>",
          statusCode: 200,
          headers: {
            "some-header": "value",
          },
        },
      };

      var servers = { server1: { port: 3006 } };

      initialise(endpoints, servers, function (testServers) {
        superagent.get("http://localhost:3006/getData", function (
          err,
          response
        ) {
          response.statusCode.should.be.eql(200);
          response.text.should.be.eql("<html>Hello!</html>");
          response.header["some-header"].should.be.eql("value");
          testServers.kill(done);
        });
      });
    });

    it("should provide routes that respond with a specific response and status code if it is specified", function (done) {
      var endpoints = {
        route1: {
          route: "/getData",
          method: "get",
          response: { isThisATest: true },
          statusCode: 317,
        },
      };

      var servers = { server1: { port: 3006 } };

      initialise(endpoints, servers, function (testServers) {
        superagent.get("http://localhost:3006/getData", function (
          err,
          response
        ) {
          response.statusCode.should.be.eql(317);
          response.body.should.be.eql({ isThisATest: true });
          testServers.kill(done);
        });
      });
    });

    it("should provide delayed routes", function (done) {
      var endpoints = { route1: { route: "/getData" } },
        servers = {
          server1: { port: 3006 },
          server2: { port: 3007, delay: 100 },
        };

      initialise(endpoints, servers, function (testServers) {
        var callbacks = 2,
          time = new Date();

        var next = function () {
          callbacks--;
          if (callbacks == 0) testServers.kill(done);
        };

        superagent.get("http://localhost:3006/getData", function (
          err,
          response
        ) {
          var newTime = new Date() - time;
          newTime.should.be.within(0, 100);
          next();
        });

        superagent.get("http://localhost:3007/getData", function (
          err,
          response
        ) {
          var newTime = new Date() - time;
          newTime.should.be.within(100, 200);
          next();
        });
      });
    });

    it("should provide routes that handle querystrings", function (done) {
      var endpoints = { route1: { route: "/getData?mydata=something" } },
        servers = { server1: { port: 3006 } };

      initialise(endpoints, servers, function (testServers) {
        var routes = _.filter(
          testServers.servers.server1.app._router.stack,
          function (route) {
            return route.route && route.route.path === "/getData";
          }
        );

        routes.length.should.be.eql(1);

        testServers.kill(done);
      });
    });

    it("should allow post routes to respond with request body", function (done) {
      var endpoints = {
          route1: { route: "/postData", method: "post", respondWithBody: true },
        },
        servers = { server1: { port: 3006 } };

      initialise(endpoints, servers, function (testServers) {
        superagent
          .post("http://localhost:3006/postData")
          .send({ hi: "postData" })
          .set("content-type", "application/json")
          .end(function (err, res) {
            res.body.should.be.eql({ hi: "postData" });
            testServers.kill(done);
          });
      });
    });
  });
});

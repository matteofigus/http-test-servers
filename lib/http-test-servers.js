const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const giveMe = require("give-me");
const morgan = require("morgan");
const _ = require("underscore");

var httpTestServers = function (endpoints, servers, options) {
  this.endpoints = endpoints;
  this.servers = {};
  this.options = options;

  var self = this;

  var sanitiseRoute = function (route) {
    if (_.isString(route)) route = { route: route };

    if (route.route.indexOf("?") >= 0)
      route.route = route.route.substr(0, route.route.indexOf("?"));

    return _.extend(route, {
      method: route.method || "get",
      status: route.statusCode || 200,
    });
  };

  var setupRoute = function (server, route, delay) {
    route = sanitiseRoute(route);

    server.app[route.method](route.route, function (req, res) {
      setTimeout(function () {
        var response = route.response || { message: route.route };

        if (route.method === "post" && !!route.respondWithBody) {
          response = req.body;
        }

        res.status(route.status);

        _.each(route.headers, function (header, headerName) {
          res.set(headerName, header);
        });

        res[_.isObject(response) ? "json" : "send"](response);
      }, delay);
    });
  };

  var setupServer = function (serverName, server, context, callback) {
    var app = express();

    app.use(bodyParser.json({ inflate: true }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    if (context.options && context.options.logger) app.use(morgan("dev"));

    context.servers[serverName] = {
      href: "http://localhost:" + server.port,
      app: app,
      port: server.port,
      delay: server.delay || 0,
    };

    _.each(context.endpoints, function (route) {
      setupRoute(context.servers[serverName], route, server.delay || 0);
    });

    callback();
  };

  giveMe.all(
    setupServer,
    _.map(servers, function (server, serverName) {
      return [serverName, server, self];
    }),
    function () {}
  );

  return _.extend(this, {
    kill: function (callback) {
      var killServer = function (server, cb) {
        return server.listener.close(cb);
      };

      if (_.keys(servers).length == 0) return callback();

      giveMe.all(
        killServer,
        _.map(self.servers, function (server) {
          return [server];
        }),
        function () {
          callback();
        }
      );
    },
    start: function (callback) {
      var startServer = function (server, cb) {
        server.listener = server.app.listen(server.port, cb);
      };

      giveMe.all(
        startServer,
        _.map(self.servers, function (server, serverName) {
          return [server];
        }),
        function () {
          callback(self);
        }
      );
    },
  });
};

module.exports = httpTestServers;

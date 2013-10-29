var express = require('express');
var giveMe = require('give-me');
var _ = require('underscore');

var httpTestServers = function(endpoints, servers){
  this.endpoints = endpoints;
  this.servers = {};

  var self = this,
      init = false;

  this.setupRoute = function(server, route, response, delay){
    if(typeof route === 'string')
      route = {
        route: route,
        method: 'get'
      };

    var routeAddress = (route.route.indexOf("?") >= 0) ?
                       route.route.substr(0, route.route.indexOf("?")) :
                       route.route;

    server.app[route.method](routeAddress, function(req, res){
      setTimeout(function(){
        res.json(response);
      }, delay);
    });   
    return this;
  };

  this.setupServer = function(serverName, server, context, callback){

    context.servers[serverName] = {
      href: "http://localhost:" + server.port,
      app: express(),
      port: server.port,
      delay: server.delay || 0
    }

    for(routeName in context.endpoints)
      context.setupRoute(context.servers[serverName], context.endpoints[routeName], { message: routeName }, server.delay || 0);

    callback();
  };

  this.kill = function(callback){

    var serverCloseHasCallback = function(serverListener){
      // node.js version 0.6's http.close does not implement a callback :(
      var args = serverListener.close.toString().match (/function\s*\w*\s*\((.*?)\)/)[1].split (/\s*,\s*/);
      return args.length > 0 && args[0] != '';
    };

    var serverCloseRequiresCallback = _.keys(servers).length == 0 ? false : serverCloseHasCallback(this.servers[_.keys(servers)[0]].listener);

    var closeServer = function(server, callback){
      if(!serverCloseRequiresCallback){
        server.listener.close();
        callback();
      } else
        server.listener.close(callback);
    };

    giveMe.all(closeServer, _.map(self.servers, function(server){ return [server]; }), function(){
      callback();
    });
  };

  this.start = function(callback){

    var startServer = function(server, callback){ server.listener = server.app.listen(server.port, callback); };

    giveMe.all(startServer, _.map(self.servers, function(server, serverName){ return [server]; }), function(){
      callback(self);
    });

  };

  giveMe.all(this.setupServer, _.map(servers, function(server, serverName){ return [serverName, server, self]; }), function(){
    init = true;
  });
};

module.exports = httpTestServers;
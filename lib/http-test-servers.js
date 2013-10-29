var express = require('express');
var _ = require('underscore');

module.exports = function(endpoints, servers){
  this.servers = {};
  this.endpoints = endpoints;
  this.app = {};
  this.serversCount = 0;

  this.setupRoute = function(serverName, route, response, delay){
    if(typeof route === 'string')
      route = {
        route: route,
        method: 'get'
      };

    var routeAddress = (route.route.indexOf("?") >= 0) ?
                       route.route.substr(0, route.route.indexOf("?")) :
                       route.route;

    this.servers[serverName].app[route.method](routeAddress, function(req, res){
      setTimeout(function(){
        res.json(response);
      }, delay);
    });   
    return this;
  };

  this.setupServer = function(serverName, server, callback){

    this.servers[serverName] = {
      href: "http://localhost:" + server.port,
      app: express(),
      port: server.port,
      delay: server.delay || 0
    }

    for(routeName in this.endpoints)
      this.setupRoute(serverName, this.endpoints[routeName], { message: routeName }, server.delay || 0);

    this.servers[serverName].listener = this.servers[serverName].app.listen(server.port, callback);

    this.serversCount++;
  };

  this.kill = function(callback){

    var serverCloseHasCallback = function(serverListener){
      // node.js version 0.6's http.close does not implement a callback :(
      var args = serverListener.close.toString().match (/function\s*\w*\s*\((.*?)\)/)[1].split (/\s*,\s*/);
      return args.length > 0 && args[0] != '';
    };

    var serversToClose = this.serversCount,
        serverCloseRequiresCallback = this.serversCount == 0 ? false : serverCloseHasCallback(this.servers[_.keys(servers)[0]].listener);

    var tryPerformingCallback = function(){
      if(serversToClose == 0 && typeof callback === 'function' && !callbackDone){
        callbackDone = true;
        callback();
      }
    };

    for(serverName in this.servers){
      if(!serverCloseRequiresCallback){
        this.servers[serverName].listener.close();
        serversToClose--;
        tryPerformingCallback();
      } else {
        this.servers[serverName].listener.close(function(){
          serversToClose--;
          tryPerformingCallback();
        });
      }
    }
    var callbackDone = false;
    tryPerformingCallback();
  };

  this.start = function(callback){

    var serversInitialized = 0, 
        self = this;

    var done = function(){
      serversInitialized ++;
      if(serversInitialized == _.keys(servers).length)
        callback(self);
    };

    for(var server in servers)
      this.setupServer(server, servers[server], done); 
  };
};
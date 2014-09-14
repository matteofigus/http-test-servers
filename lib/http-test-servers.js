var express = require('express');
var giveMe = require('give-me');
var _ = require('underscore');

var httpTestServers = function(endpoints, servers, options){

  this.endpoints = endpoints;
  this.servers = {};
  this.options = options;

  var self = this;

  this.adjustRoute = function(route){

    if(typeof route === 'string')
      route = { route: route };
    
    if(route.route.indexOf("?") >= 0)
      route.route = route.route.substr(0, route.route.indexOf("?"));

    return _.extend(route, {
      method: route.method || 'get',
      response: route.response || { message: route.route },
      status: route.statusCode || 200
    });
  };

  this.setupRoute = function(server, route, delay){

    route = self.adjustRoute(route);

    server.app[route.method](route.route, function(req, res){
      setTimeout(function(){
        var response = route.response;
            method = _.isObject(response) ? 'json' : 'send';

        res.status(route.status)[method](route.response);
      }, delay);
    });  

  };

  this.setupServer = function(serverName, server, context, callback){

    context.servers[serverName] = {
      href: "http://localhost:" + server.port,
      app: express(),
      port: server.port,
      delay: server.delay || 0
    }

    if(context.options && context.options.logger)
      context.servers[serverName].app.use(express.logger('dev'));

    for(routeName in context.endpoints)
      context.setupRoute(context.servers[serverName], context.endpoints[routeName], server.delay || 0);

    callback();
  };

  giveMe.all(this.setupServer, _.map(servers, function(server, serverName){ return [serverName, server, self]; }), function(){});

  return _.extend(this, {
    kill: function(callback){

      if(_.keys(servers).length == 0)
        return callback();

      giveMe.all(self.killServer, _.map(self.servers, function(server){ return [server]; }), function(){
        callback();
      });
    },
    killServer: function(server, callback){

      if(!self.serverCloseHasCallback()){
        server.listener.close();
        callback();
      } else
        server.listener.close(callback);

    },
    serverCloseHasCallback: function(){

      var serverNames = _.keys(servers),
          serverListener = self.servers[serverNames[0]].listener

      // node.js version 0.6's http.close does not implement a callback :(

      var args = serverListener.close.toString().match (/function\s*\w*\s*\((.*?)\)/)[1].split (/\s*,\s*/);
      return args.length > 0 && args[0] != '';
    },
    start: function(callback){

      giveMe.all(self.startServer, _.map(self.servers, function(server, serverName){ return [server]; }), function(){
        callback(self);
      });

    },
    startServer: function(server, callback){ 
      server.listener = server.app.listen(server.port, callback); 
    }
  });
};

module.exports = httpTestServers;
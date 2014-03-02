var _ = require('underscore'),
	async = require('async');

var _beforeEach = [];
var _plugins = [];
var Controller = function(config){
	config = config || {};

	var verbs = ['get','post', 'put', 'del', 'patch', 'options'];

	var self = function (server) {
		self._beforeEach = self._beforeEach.concat(_.clone(_beforeEach));

		verbs.forEach(function(verb) {
			self._routes[verb].forEach(function (routeArgs) {
				// cast arguments to array
				var callStack =  Array.prototype.slice.call(routeArgs, 0);

				callStack[0] = callStack[0].replace(/\/+/g, '/');

				self._beforeEach.forEach(function (fn, i) {
					callStack.splice(1 + i, 0, fn);
				});

				server[verb].apply(server, callStack);
			});
		});
	};

	self.isController = true;

	self.use = function (fn) {
		fn.call(this);
	};

	_plugins.forEach(function (fn) {
		fn.call(self);
	});

	self.attach = function (subcontroller) {
		if( !subcontroller.isController ){
			throw 'cant attach non Controller objects';
		}

		subcontroller._beforeEach.shift();

		verbs.forEach(function(verb) {
			subcontroller._routes[verb].forEach(function (routeArgs) {
				routeArgs[0] = '/' + self.path + routeArgs[0];

				var callStack =  Array.prototype.slice.call(routeArgs, 0);

				subcontroller._beforeEach.forEach(function (fn) {
					callStack.splice(1,0,fn);
				});

				self._routes[verb].push(callStack);
			});
		});
	};

	self._routes = {};
	verbs.forEach(function(verb) {
		self._routes[verb] = [];

		self[verb] = function () {
			var args = arguments;
			args[0] = '/' + self.path + arguments[0];

			self._routes[verb].push(args);
		};
	});

	self._beforeEach = [];

	// Modify render to add res.data to be pass from middleware to the view
	self._beforeEach.push(function(req, res, next){
		res.data = {};

		res._render = res.render;
		res.render = function(view, data){
			data = data || {};
			data.layout = self._layout;
			data = _.extend(data, res.data);

			res.data = data;

			var fns = _.map(self._beforeRender, function (fn) {
				return function(done){
					fn.apply(self, [req, res, done]);
				};
			});

			async.series(fns, function (err) {
				if(err) return res.send(500, err);
				res._render(view, data);
			});
		};

		next();
	});

	self._beforeEach = self._beforeEach.concat(_.clone(_beforeEach));

	self._beforeRender = [];
	self.beforeRender = function(fn){
		self._beforeRender.push(fn);
	};

	self.beforeEach = function (fn) {
		self._beforeEach.push(fn);
	};

	self.config = function(config){
		this.path = config.path || '';
	};

	self.config(config);

	return self;
};

Controller.utils = require('./utils');
Controller.beforeEach = function (fn) {
	_beforeEach.push(fn);
};

Controller.use = function (fn) {
	_plugins.push(fn);
};

module.exports = Controller;
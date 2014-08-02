var _ = require('underscore'),
	Controller = require('./controller');

module.exports = {};

module.exports.asJsonFilter = function (property, expose) {
	return function(){
		if(!this._jsonFilters) this._jsonFilters = [];

		this._jsonFilters.push({
			property : property,
			expose : expose
		});
	};
};

module.exports.asJson = function (req, res, next) {
	if(req.query.asJson){
		var data = _.clone(res.data);

		if(this._jsonFilters){
			_.each(this._jsonFilters,function(filter){
				data[filter.property] = _.pick(data[filter.property], filter.expose);
			});
		}

		res.send(data);
	}else{
		next();
	}
};

module.exports.errorHandler = function (err, req, res, next) {
	if(res.sendError){
		res.sendError(500, {error:err.toString()});
	}else{
		console.log('******************************************');
		console.log('************ UNCAUGHT ERROR **************');
		console.log(err);
		console.log('******************************************');
		res.send(500, 'Error');
	}
};

module.exports.undefinedRouteHandler = function(Controller){
	return function (req, res) {
		Controller.extendResponse(res);

		res.sendError(404, {error:'Not found'});
	};
};

var _schemas = {};
module.exports.compileRequestValidator = function (name, joiSchema) {
	_schemas[name] = joiSchema;
};

module.exports.validateRequest = function (joiSchema) {
	return function(req, res, next) {
		if(typeof joiSchema === 'string'){
			joiSchema = _schemas[joiSchema];
		}

		if(!joiSchema){
			return res.sendError(500, {error: 'invalid validate method'});
		}

		joiSchema.validate(req.body, function (err) {
			if(err){return res.sendError(406, {error: 'invalid request object'});}

			next();
		});
	};
};
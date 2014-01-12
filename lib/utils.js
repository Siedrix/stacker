var _ = require('underscore');

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
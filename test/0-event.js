var request = require('supertest'),
	chai = require('chai'),
	expect = chai.expect,
	Controller = require('../lib/controller');

var express    = require('express');

var app = express();

var homeController = new Controller({
	path : '/main'
});

homeController.get('/500', function (req, res) {
	res.sendError(500, {error:'Something bad happend'});
});

homeController(app);

app.use( Controller.utils.errorHandler );
app.all( '*', Controller.utils.undefinedRouteHandler(Controller) );

describe('sendError without error handler', function () {
	describe('Request tests', function () {
		it('GET /main/500 should return 500 and error Something bad happend', function (done) {
			request(app).get('/main/500').end(function (req, res) {
				expect(res.statusCode).equal(500);
				expect(res.body.error).equal('Something bad happend');

				done();
			});
		});
	});
});
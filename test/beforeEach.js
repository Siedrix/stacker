var request = require('supertest'),
	chai = require('chai'),
	expect = chai.expect,
	Controller = require('../lib/controller');

var express    = require('express');

var app = express();

var homeController = new Controller({
	path : '/main'
});

homeController.beforeEach(function(req, res, next){
	res.data.main = true;
	next();
});

var subController = new Controller({
	path : '/sub'
});

subController.beforeEach(function(req, res, next){
	if(res.data.main){
		res.data.sub = true;
	}

	next();
});

subController.get('/test', function(req, res){
	res.send(res.data);
});

homeController.attach(subController);
homeController(app);

describe('multiple beforeEachs, from diferent controllers', function () {
	describe('Request tests', function () {
		it('GET / should return 200 and {title:"It works"}', function (done) {
			request(app).get('/main/sub/test').end(function (req, res) {
				expect(res.statusCode).equal(200);
				expect(res.body.main).equal(true);
				expect(res.body.sub).equal(true);

				done();
			});
		});
	});
});
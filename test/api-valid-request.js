var request = require('supertest'),
	chai = require('chai'),
	expect = chai.expect,
	Controller = require('../lib/controller'),
	bodyParser = require('body-parser'),
	Joi = require('joi');

var express    = require('express');

var app = express();
app.use(bodyParser.json());

var apiController = new Controller({
	path : '/'
});

// Schemas
var requestSchema = Joi.object().keys({
	title: Joi.string().required(),
	description: Joi.string().required()
});

var userSchema = Joi.object().keys({
	username: Joi.string().required(),
	email: Joi.string().email().required()
});

Controller.utils.compileRequestValidator('user', userSchema);

// Validated routes
apiController.post('/api/v1/list', Controller.utils.validateRequest(requestSchema), function (req, res) {
	res.send(req.body);
});

apiController.post('/api/v1/user', Controller.utils.validateRequest('user'), function (req, res) {
	res.send(req.body);
});

apiController.post('/api/v1/no-validation-method', Controller.utils.validateRequest(), function (req, res) {
	res.send(req.body);
});

// Mount controller to app
apiController(app);

// Tests
describe.only('Api request checker', function () {
	describe('Request tests with no validator', function () {
		it('GET /api/v1/no-validation-method should return 500, with error "invalid validate method"', function (done) {
			request(app)
			.post('/api/v1/no-validation-method')
			.end(function (req, res) {
				expect(res.statusCode).equal(500);
				expect(res.body.error).equal('invalid validate method');

				done();
			});
		});
	});

	describe('Request tests against joiSchema', function () {
		it('GET /api/v1/list should return 200, with a title and a description', function (done) {
			request(app)
			.post('/api/v1/list')
			.send({ title: 'It works', description : 'This should work, because its the object has the correct structure' })
			.end(function (req, res) {
				expect(res.statusCode).equal(200);
				expect(res.body.title).equal('It works');
				expect(res.body.description).equal('This should work, because its the object has the correct structure');

				done();
			});
		});

		it('GET /api/v1/list should return 406, with error "invalid request object"', function (done) {
			request(app)
			.post('/api/v1/list')
			.send({ title: 'It shouldnt works' })
			.end(function (req, res) {
				expect(res.statusCode).equal(406);
				expect(res.body.error).equal('invalid request object');

				done();
			});
		});
	});

	describe('Request tests complied schema', function () {
		it('GET /api/v1/user should return 200, with a username and email', function (done) {
			request(app)
			.post('/api/v1/user')
			.send({ username: 'siedrix', email : 'foo@bar.com' })
			.end(function (req, res) {
				expect(res.statusCode).equal(200);
				expect(res.body.username).equal('siedrix');
				expect(res.body.email).equal('foo@bar.com');

				done();
			});
		});

		it('GET /api/v1/user should return 406, with error "invalid request object"', function (done) {
			request(app)
			.post('/api/v1/user')
			.send({ user: 'siedrix' })
			.end(function (req, res) {
				expect(res.statusCode).equal(406);
				expect(res.body.error).equal('invalid request object');

				done();
			});
		});

		it('GET /api/v1/user with invalid email should return 406, with error "invalid request object"', function (done) {
			request(app)
			.post('/api/v1/user')
			.send({ user: 'siedrix', email: 'foo.com' })
			.end(function (req, res) {
				expect(res.statusCode).equal(406);
				expect(res.body.error).equal('invalid request object');

				done();
			});
		});
	});

});

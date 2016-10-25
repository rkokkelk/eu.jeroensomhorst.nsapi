"use strict";
const nsApi = require('./nsapi');


var api = new nsApi(Homey.env.NSAPI_USERNAME,Homey.env.NSAPI_PASSWORD);



const speechProcessor = require('./speech.js');
const flowProcessor = require('./flow.js');

function init() {
	Homey.log(Homey.env);
	Homey.log(Homey.env);
	Homey.log("Initialize NS App");
	speechProcessor.init(api);
	flowProcessor.init(api);
};



module.exports.init = init;
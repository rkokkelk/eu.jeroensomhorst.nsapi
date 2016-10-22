"use strict";
const nsApi = require('./nsapi');


var api = new nsApi('info@jeroensomhorst.eu','qJMLOIMRPO5818LRGeIJKN2-sryhXtZCBkdu5xshdJYDLWKuyl9vJg');

const speechProcessor = require('./speech.js');
const flowProcessor = require('./flow.js');

function init() {

	Homey.log("Initialize NS App");
	speechProcessor.init(api);
	flowProcessor.init(api);
};



module.exports.init = init;
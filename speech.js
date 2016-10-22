"use strict"
var nsapi = null;
var speechInput = Homey.manager('speech-input');

var startStation = null;
var endStation = null;
module.exports.init = function init(api){
    nsapi = api;

  
}

function generateRouteAdvice(start,end){

	var departure = start[Object.keys(start)[0]];
	var destination = end[Object.keys(end)[0]];
	Homey.log(departure != null);
	Homey.log(destination != null);
	var params = {};
	params.start = departure;
	params.end = destination;
	api.getRouteAdvice(params,function(data){
		Homey.log('Route aangemaakt');
		var eersteMogelijkheid = data[0];
		if(eersteMogelijkheid == null){
			Homey.log('Kon geen route genereren');
			return;	
		}

		var overstappen = eersteMogelijkheid.childNamed('AantalOverstappen').val;
		var reistijd = eersteMogelijkheid.childNamed('ActueleReisTijd').val;
		var vertrektijd = eersteMogelijkheid.childNamed('ActueleVertrekTijd').val;
		var aankomst = eersteMogelijkheid.childNamed('ActueleAankomstTijd').val;

		var vertrekDeel = eersteMogelijkheid.childNamed('ReisDeel');
		var vertrekType = vertrekDeel.childNamed('VervoerType').val;
		var vertrekSpoor = vertrekDeel.childNamed('ReisStop').childNamed('Spoor').val;

		var options = {};
		options.destination = departure.childNamed('Namen').childNamed('Lang').val;
		options.departuretime = moment(vertrektijd).local().format('HH:mm');
		options.departurelane = vertrekSpoor;

		Homey.manager('speech-output').say(__('De eerst volgende trein naar __destination__ vertrekt om __departuretime__ vanaf spoor __departurelane__',options));


	},function(error){
		Homey.log('Kon geen route genereren');
	});

	/*
	var departure = start[Object.keys(start)[0]];
	var destination = end[Object.keys(end)[0]];

	Homey.log('Generate advice from '+departure+' to '+destination);
	var param = {};
	params.start = departure;
	params.end = destination;
	api.getRouteAdvice(params,function(data){
		Homey.log('Found some advice.. lets parse it');
		Homey.log(JSON.stringify(data));
	},function(error){
		Homey.log('Error while retrieving advice');
	});
*/

}





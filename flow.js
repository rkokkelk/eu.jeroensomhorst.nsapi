"use strict"
var nsApi = null;
const moment = require('moment');
const speechInput = Homey.manager('speech-input');
const speechOutput = Homey.manager('speech-output');

var advicesFound = [];
var index = 0;
module.exports.init = function init(api){
    nsApi = api;

    Homey.manager('flow').on('action.get_travel_advice.from.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice.to.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice.via.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice',onGetTravelAdviceHandlerMulti);

    Homey.manager('flow').on('action.get_travel_advice_via.from.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice_via.to.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice_via.via.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice_via',onGetTravelAdviceHandlerMulti);

    Homey.manager('flow').on('action.get_travel_advice_single',onGetTravelAdviceSingleHandler);
    Homey.manager('flow').on('action.get_travel_advice_single.from.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice_single.to.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice_single.via.autocomplete',autoCompleteHandler);

    Homey.manager('flow').on('action.get_travel_advice_single_via',onGetTravelAdviceSingleHandler);
    Homey.manager('flow').on('action.get_travel_advice_single_via.from.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice_single_via.to.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_travel_advice_single_via.via.autocomplete',autoCompleteHandler);

    Homey.manager('flow').on('action.get_departure_times.from.autocomplete',autoCompleteHandler);
    Homey.manager('flow').on('action.get_departure_times',onGetDepartureTimes);
}

function onGetDepartureTimes(callback, args){
    Homey.log('On Get departure times called!');

}


function reportRouteAdvice(list,departure,arrival,via){
    
    var advicesParsed = [];


    list.forEach(function(advice){
        var options = {};
        options.departuretime = moment(advice.childNamed('ActueleVertrekTijd').val).local().format("HH:mm");
        options.arrivaltime = moment(advice.childNamed('ActueleAankomstTijd').val).local().format("HH:mm");
        var startTravelPart = advice.childNamed('ReisDeel');
        options.transporttype = startTravelPart.childNamed('VervoerType').val;
        options.departuretrack = startTravelPart.childNamed("ReisStop").childNamed('Spoor').val;
        options.arrivaltrack = advice.lastChild.lastChild.childNamed('Spoor').val; // get arrival track
        options.departure = departure.childNamed('Namen').childNamed('Lang').val;
        options.destination = arrival.childNamed('Namen').childNamed('Lang').val;
        advicesParsed.push(options);
    });

    if(advicesParsed.length > 1){
        Homey.log("Found multiple advices. Ask user to read them all");
        speechInput.confirm(__("question_report_all_advices"),function(err, reportall){
           if(!reportall){
                advicesFound = advicesParsed.slice(0,1);
            }else{
                advicesFound = advicesParsed;
            }

            reportRouteAdviceEntry(null,true);
            
        });
    }else{
        Homey.log("Found single advice. Read it");
        advicesFound = advicesParsed;
        reportRouteAdviceEntry(null,true);
    }
}

function reportRouteAdviceEntry(err,success){
    if(index+1 > advicesFound.length){success =false; return success};
    Homey.log("Output line "+index);


    var label = "train_advice_line_multiple";
    if(index == 0){
        label = "train_advice_line_single";
    }   
    var adviceEntry = advicesFound[index];
    Homey.log(JSON.stringify(adviceEntry));
    index++;
    speechOutput.say(__(label,adviceEntry),reportRouteAdviceEntry);
    

}

function onGetTravelAdviceSingleHandler(callback,args){
    advicesFound = [];
    index = 0;
    var departureTime= new moment();

    if(!args.hasOwnProperty('to')){
        callback(null,false);
    }else
    if(!args.hasOwnProperty('from')){
        callback(null,false);
    }else{
        var params = {};
        params.start = nsApi.getStationByCode(args.from.code);
        params.end = nsApi.getStationByCode(args.to.code);
        if(params.start == null || params.end == null){
            callback(null,false);
        }

        if(args.hasOwnProperty('via')){
            params.via = nsApi.getStationByCode(args.via.code);
        }

        if(args.hasOwnProperty('period') && args.period > 0){
            Homey.log("Period greater then 0 specified");
            departureTime.add(args.period,"minutes");
            params.departureDateTime = departureTime.format();
        }

        nsApi.getRouteAdvice(params,function(data){
            reportRouteAdvice(data.slice(1),params.start,params.end);
            callback(null,true);
        },function(data){
            callback(null,false);
        })
        
    }
}


function onGetTravelAdviceHandlerMulti(callback, args){
    Homey.log('Arguments');
    Homey.log(JSON.stringify(args));
   advicesFound = [];
   index = 0;
    if(!args.hasOwnProperty('to')){
        callback(null,false);
    }else
    if(!args.hasOwnProperty('from')){
        callback(null,false);
    }else{
        var params = {};
        params.start = nsApi.getStationByCode(args.from.code);
        params.end = nsApi.getStationByCode(args.to.code);
        if(params.start == null || params.end == null){
            callback(null,false);
        }
        
        if(args.hasOwnProperty('via')){
            params.via = nsApi.getStationByCode(args.via.code);
        }
        
        if(args.hasOwnProperty('period')){
            moment.add(args.period,"minutes");
            params.departureDateTime = moment.format();
        }

        nsApi.getRouteAdvice(params,function(data){
            reportRouteAdvice(data,params.start,params.end,params.via);
            callback(null,true);
        },function(data){
            callback(null,false);
        })
        
    }
}

function autoCompleteHandler(callback,args){
    var returnValue = [];
    if(args.query != ""){

        nsApi.findStation(args.query,false,function(data){
            for(var i = 0; i < Object.keys(data).length;i++){
                var station = data[Object.keys(data)[i]];
                returnValue.push({
                    code: station.childNamed('UICCode').val,
                    name: station.childNamed('Namen').childNamed('Lang').val
                });
            }
            callback(null,returnValue);
        },function(error){
            callback(null,returnValue);
        });
    }
    callback(null,returnValue);
}
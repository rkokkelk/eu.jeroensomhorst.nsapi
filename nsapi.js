"use strict"

var https = require('http');
var xmlParser = require('xmldoc');
var XmlDocument = xmlParser.XmlDocument;

const hostname = "webservices.ns.nl";
const endpoint_stationlist = "/ns-api-stations-v2";
const endpoint_traveladvice = "/ns-api-treinplanner";
const endpoint_disruptions = "/ns-api-storingen";
const endpoint_schedule = "/ns-api-avt";



var method = NsApi.prototype;

function NsApi(username,password){
    this.username = username;
    this.password = password;
    this.stationList = null;
    
    this.loadStationList(function(data){
        Homey.log('Succesfully loaded the stuff');    
    },function(data){
        Homey.log(data);
        Homey.log('Error loading stations list');
    })
}

method.generateOptions = function(hostname,defaultpath, params,username,password){
    var options = {};
    options.host = hostname;
    options.path = defaultpath;
    options.headers = {
        'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
    };

    for(var i = 0; i < params.length;i++){
        if(i % 2 == 0){
            if(i == 0){
                    options.path = options.path.concat("?");
            }else{
                options.path = options.path.concat("&");
            }
            
            options.path = options.path.concat(params[i]);
            options.path = options.path.concat("=");
        }else{
            options.path = options.path.concat(params[i]);
        }
    }
    Homey.log(JSON.stringify(options));
    return options;
}

method.getSchedule = function(params,successcb,errorcb){
    var parameters = [];
    if(params.hasOwnProperty('station')){
        parameters.push('station');
        parameters.push(encodeURIComponent(params.station));    
    }

    var options = this.generateOptions(hostname,endpoint_schedule,parameters,this.username,this.password);
    https.get(options,function(res){
       
        var body = '';
        res.on('data',function(chunk){
            body += chunk;	
        }).on('end',function(){
            var scheduleinfo = new XmlDocument(body);
            var reizen = scheduleinfo.childrenNamed('VertrekkendeTrein');
            Homey.log('Found '+reizen.length+" vertrekpunten");
            successcb(reizen);
        });


    }).on('error',function(data){
        Homey.log('Error!!');
    });
}

method.getDisruptionsList = function(params,successcb,errorcb){
    //?station=${Stationsnaam}&actual=${true
    var parameters = [];
    if(params.hasOwnProperty('station')){
        parameters.push('station');
        parameters.push(encodeURIComponent(params.station.childNamed('Namen').childNamed('Lang').val));
    }
    if(params.hasOwnProperty('actual')){
        parameters.push('actual');
        parameters.push(params.actual);
    }

    if(params.hasOwnProperty('unplanned')){
        parameters.push('unplanned');
        parameters.push(unplanned);
    }

    var options = this.generateOptions(hostname,endpoint_disruptions,this.username,this.password);

}


method.getRouteAdvice = function(params,successcb,errorcb){

    if(params.hasOwnProperty('start') ==false  || params.hasOwnProperty('end') == false){
        Homey.log('Invalid parameters');
        return;   
    }

    

    var parameters = ['fromStation',
                    encodeURIComponent(params.start.childNamed('Namen').childNamed('Lang').val),
                    'toStation',
                    encodeURIComponent(params.end.childNamed('Namen').childNamed('Lang').val)];

        if(params.hasOwnProperty('via') && params.via != null){
            parameters.push('viaStation');
            parameters.push(encodeURIComponent(params.via.childNamed('Namen').childNamed('Lang').val));
        }


    if(params.hasOwnProperty('previousAdvices')){
        parameters.push('previousAdvices');
        parameters.push(params.previousAdvices);
    }else{
        parameters.push('previousAdvices');
        parameters.push(0);
    }

    if(params.hasOwnProperty('nextAdvices')){
        parameters.push('nextAdvices');
        parameters.push(params.nextAdvices);
    }else{
        parameters.push('nextAdvices');
        parameters.push(1);
    }

    var options = this.generateOptions(hostname,endpoint_traveladvice,parameters,this.username,this.password);
    
    https.get(options,function(res){
       
        var body = '';
        res.on('data',function(chunk){
            body += chunk;	
        }).on('end',function(){
            var advice = new XmlDocument(body);
            var reizen = advice.childrenNamed('ReisMogelijkheid');
            Homey.log('Found '+reizen.length+" mogelijkheden");
            successcb(reizen);
        });


    }).on('error',function(data){
        Homey.log('Error!!');
    });

}

method.getStationByCode = function(query){
    Homey.log("Searching for "+query);
    var returnValue = null;
    this.getStationList("NL",function(data){
        
        data.forEach(function(station){
                
            var uiccode = station.childNamed('UICCode').val;
            if(uiccode == query){
                returnValue = station;
            }
        });

    });
    Homey.log('Return Value '+(returnValue != null));
    return returnValue;
}

method.findStation = function(txt,exactMatch,successcb,errorcb){

    var txtLower = txt.toLowerCase();
    this.getStationList("NL",function(data){
        Homey.log('Station list retrieved');
        var filteredStations = {};
        Homey.log('Search '+txtLower);
        data.forEach(function(station){
            var namen = station.childNamed('Namen');
            var code = station.childNamed('UICCode').val;
            namen.eachChild(function(naam){
                if(!filteredStations.hasOwnProperty(code)){
                        var n = naam.val.toLowerCase();
                        var match = null;
                        if(exactMatch){
                            if(txtLower == n){
                                match = station;
                                filteredStations[code] = match;
                                successcb(filteredStations);
                                return;
                            }
                        }else{
                            if(n.startsWith(txtLower)){
                                match = station;
                                filteredStations[code] = match;
                            }
                        }
                    }
                });
            
        });

        successcb(filteredStations);
    },function(data){
        errorcb(data);
    });

}

method.loadStationList = function(successcb, errorcb){
    Homey.log('Start loading stations from api');
    
    var self = this;
    if(this.stationList != null){
        Homey.log('Already in cache.');
        successcb(this.stationList);
    }else{
        Homey.log('Retrieve from Api');
        var options = this.generateOptions(hostname,endpoint_stationlist,[],this.username,this.password);
        Homey.log(JSON.stringify(options));
        var self = this;
        https.get(options,function(res){
            var body = '';
            res.on('data',function(chunk){
                body += chunk;	
            }).on('end',function(){
                self.stationList = new XmlDocument(body);
                successcb(self.stationList);
            });
        }).on('error',function(data){
            errorcb(data);
        });
    }
}

method.getStationList = function(country, successcb,errorcb){
    Homey.log('Start filter stationlist');

    this.loadStationList(function(data){
        var stations = [];
        data.eachChild(function(station){
            var land = station.childNamed('Land').val;
            if(land == country){
                stations.push(station);
            }
        });
        Homey.log('Done filtering');
        successcb(stations);
    },function(data){
         errorcb(data);
    });
};

module.exports = NsApi;
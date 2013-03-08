/*jslint maxerr:1000 */
/**
* 
* Google GeoProvider: Titanium Reverse Geo Location Provider using Google Reverse Geocoder using Google Maps
* Copyright: 2013 Benjamin Bahrenburg (http://bencoding.com)
* License: http://www.apache.org/licenses/LICENSE-2.0.html
*
*/

String.prototype.trim = function() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };

var _isAndroid = Ti.Platform.osname === 'android';
var _key = null, _purpose = null;

var helpers = {
	safeNull : function(value){
		if(value == undefined){
			return null;
		}else{
			return value;
		}
	},
	safeEmptyString : function(value){
		if((value == undefined)||(value==null)){
			return '';
		}else{
			return value;
		}		
	},
	stringTrim : function(inputValue){
		if((inputValue===null)||(inputValue===undefined)){
			return '';
		}else{
			return inputValue.replace(/^\s\s*/, '').replace(/\s\s*$/, '');	
		}
	},
 	findCodeInResults : function (resultSet,matchCode,resultType){
		var iLoop=0;
			if((resultSet.results===undefined)||(resultSet.results===null)){
				return '';
			}
	        var maxSize=resultSet.results.length;
	        var iAddressLoop=0;
	        var returnInfo='';
	        for (iLoop=0;iLoop < maxSize;iLoop++){
	                if(resultSet.results[iLoop].address_components!==undefined){
	                        var addressCount = resultSet.results[iLoop].address_components.length;
	                        for (iAddressLoop=0;iAddressLoop < addressCount;iAddressLoop++){
	                                var iAdrTypeLoop=0;
	                                var iAdrTypeCount=resultSet.results[iLoop].address_components[iAddressLoop].types.length;
	                                for (iAdrTypeLoop=0;iAdrTypeLoop < iAdrTypeCount;iAdrTypeLoop++){
	                                        if(resultSet.results[iLoop].address_components[iAddressLoop].types[iAdrTypeLoop].toUpperCase()==matchCode.toUpperCase()){
	                                           if(resultType.toUpperCase()=='NAME'){
	                                           		returnInfo=resultSet.results[iLoop].address_components[iAddressLoop].long_name;
	                                           }else{
	                                           		returnInfo=resultSet.results[iLoop].address_components[iAddressLoop].short_name.toUpperCase();	
	                                           }	                                           
	                                           break;                                                          
	                                        }
	                                }
	
	                        }
	                }                               
	
	        }
	        return returnInfo;       
	}	
};

exports.providerLevelID = 0;
exports.providerLevel='ADDRESS';
exports.lastFoundOn = null;

exports.providerName='Google Provider';

exports.addLocale = function(value){
	Ti.API.debug("This provider does not support switching locale");
	return exports;
};

exports.addPurpose=function(purpose){
	_purpose = purpose;
	return exports;
};

exports.addKey=function(key){
	_key = key;
	return exports;
};

exports.isSupported=function(){
	return true;
};

exports.generateAddress = function(location){
	var addressLine='';
	if(helpers.stringTrim(location.address).length > 0 ){
		addressLine = helpers.stringTrim(location.address);
		return addressLine;
	}
	if(helpers.stringTrim(location.regionName).length > 0 ){
		if(addressLine.length>0){
			addressLine += '  ' + helpers.stringTrim(location.regionName);
		}else{
			addressLine = helpers.stringTrim(location.regionName);	
		}		
	}	
	if(helpers.stringTrim(location.countryCode).length > 0 ){
		if(addressLine.length>0){
			addressLine += '  ' + helpers.stringTrim(location.countryCode);
		}else{
			addressLine = helpers.stringTrim(location.countryCode);	
		}		
	}		
	
	return addressLine;
};

function parseResults(latitude,longitude,results,onSuccess,onError){
	var locationObject = {
		found:false,
		address:null,
		city: null,
		adminCode:null,
		regionName:null,
		countryName:null,
		countryCode:null,
		latitude:latitude,
		longitude:longitude,
		providerName:exports.providerName,
		providerLevel:exports.providerLevel
	};
	
	//Check if Google failed.
	if(results.length===0){
		onError('No address information provided');
		return;					
	}
	
	locationObject.found = true;
	exports.lastFoundOn = new Date();
	locationObject.address = results.results[0].formatted_address,
	locationObject.city = helpers.findCodeInResults(results.results[0],'LOCALITY','name'),
	locationObject.adminCode  = helpers.findCodeInResults(results.results[0],'administrative_area_level_1','code');
	locationObject.regionName = helpers.findCodeInResults(results.results[0],'administrative_area_level_1','name');
	locationObject.countryCode = helpers.findCodeInResults(results.results[0],'COUNTRY','code');
	locationObject.countryName = helpers.findCodeInResults(results.results[0],'COUNTRY','name');

	onSuccess(locationObject);
};

exports.getCurrentAddress=function(onSuccess,onError){
	exports.lastFoundOn = null;
	
	if(!Ti.Network.online){
		onError("Not online");
		return;
	}
		
	Ti.Geolocation.showCalibration = false;
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
	Ti.Geolocation.preferredProvider = "gps";

	if (!_isAndroid){
		Ti.Geolocation.purpose = "GPS demo";
	}
		
	Ti.Geolocation.getCurrentPosition(function(e){
		if (!e.success || e.error)
		{
			onError(e.error);
			return;
		}
		exports.reverse(e.coords.latitude,e.coords.longitude,onSuccess,onError);
	});	
};

exports.reverse=function(latitude,longitude,onSuccess,onError){
	
	exports.lastFoundOn = null;
	
	if(!Ti.Network.online){
		onError("Not online");
		return;
	}
	try{
		Ti.API.info('Google Provider lookup called');
		var query = "http://maps.google.com/maps/api/geocode/json?latlng="+ latitude +"," + longitude + "&sensor=false";
		if(_key!=null){
			query +='&key=' + _key;
		}
		var done = false;
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(90000);
		xhr.validatesSecureCertificate = false;			
		
		xhr.onload = function(){
			if (this.readyState == 4 && !done) {
				// convert the response JSON text into a JavaScript object
				var results = JSON.parse(this.responseText);
				done=true;
				if((results===null)||(results===undefined)){
					onError('Invalid return from Google');	
					return;				
				}				
				parseResults(latitude,longitude,results,onSuccess,onError);		
			}	
		};
		xhr.onerror = function(exr){
			Ti.API.info('Error: ' + exr);
			onError();
		};			
      xhr.open('GET',query);
  	  xhr.send();
  	  
	 } catch(err) {
	  	Ti.API.info('>>>>>>> Error In reverseGeo ' + err );
	  	onError(err.message);
	}		
};
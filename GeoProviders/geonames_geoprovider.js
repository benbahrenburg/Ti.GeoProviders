/*jslint maxerr:1000 */
/**
* 
* GeoNames GeoProvider: Titanium Reverse Geo Location Provider using GeoNames.org
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
	}
};

exports.providerLevel='REGIONAL';
exports.providerLevelID = 3;
exports.lastFoundOn = null;
exports.providerName='Geo Names Provider';

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
	
	//Check if GeoNames failed.
	if(results.hasOwnProperty("status")){
		onError(results.status.message);
		return;
	}
	
	//If no location found, return the details
	if(helpers.stringTrim(results.countryCode).length == 0){
		onSuccess(locationObject);
		return;
	}
	locationObject.found = true;
	exports.lastFoundOn = new Date();
	locationObject.countryCode = helpers.stringTrim(results.countryCode);
	locationObject.countryName = helpers.stringTrim(results.countryName);
	locationObject.adminCode = helpers.safeNull(results.adminCode1);
	locationObject.regionName = helpers.safeNull(results.adminName1);
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

	if ((!_isAndroid)&& (_purpose!=null)){
		Ti.Geolocation.purpose = _purpose;
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
		Ti.API.info('GeoNames Provider lookup called');
		var query = "http://api.geonames.org/countrySubdivisionJSON?formatted=true&lat="+ latitude +"&lng=" + longitude + "&username=" + _key + '&style=full';
		var done = false;
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(90000);
		xhr.validatesSecureCertificate = false;			
		
		xhr.onload = function(){
			if (this.readyState == 4 && !done) {
				// convert the response JSON text into a JavaScript object
				var results = JSON.parse(this.responseText);
				done=true;
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
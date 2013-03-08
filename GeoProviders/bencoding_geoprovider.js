/*jslint maxerr:1000 */
/**
* 
* benCoding GeoProvider: Titanium Reverse Geo Location Provider using benCoding Geocoder
* Copyright: 2013 Benjamin Bahrenburg (http://bencoding.com)
* License: http://www.apache.org/licenses/LICENSE-2.0.html
* 
* Source Available at: https://github.com/benbahrenburg/benCoding.BasicGeo
* 
*/

String.prototype.trim = function() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };

var _provider = require('bencoding.basicgeo');
var _geo = _provider.createGeocoder();
var _isAndroid = Ti.Platform.osname === 'android';
var _key = null, _purpose = null, _locale ='us';

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

exports.providerLevelID = 0;
exports.providerLevel='ADDRESS';
exports.lastFoundOn = null;

exports.providerName='benCoding Provider';

exports.addLocale = function(value){
	_locale = value;
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
	return _geo.isSupported();
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

var iOSHelpers = {
	buildAddress : function(lines){
		var iLength = lines.length, address = '';
		for (iLoop=0;iLoop < iLength;iLoop++){
			if(address.length>0){
				address += ' ' + lines[iLoop];
			}else{
				address = lines[iLoop];
			}
		}
		return address;
	},
	findCity : function(value){
		return helpers.safeNull(value.City);
	}	
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
	
	//Take the first results in the array
	var queryInfo = results[0];
	
	locationObject.found = true;
	exports.lastFoundOn = new Date();
	if(_isAndroid){
		locationObject.address = helpers.safeNull(queryInfo.address);
		locationObject.city = iOSHelpers.findCity(queryInfo.locality);
	}else{
		locationObject.address = iOSHelpers.buildAddress(queryInfo.addressDictionary.FormattedAddressLines);
		locationObject.city = iOSHelpers.findCity(queryInfo.addressDictionary);
	}
	
	locationObject.adminCode = helpers.safeNull(queryInfo.administrativeArea);
	locationObject.regionName = helpers.safeNull(queryInfo.administrativeArea);
	locationObject.countryCode = helpers.safeNull(queryInfo.countryCode);
	locationObject.countryName = helpers.safeNull(queryInfo.countryName);

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

	function reverseGeoCallback(e){
		if(!e.success){
			onError(e.message);	
		}
		parseResults(latitude,longitude,e.places,onSuccess,onError);
	};
	
	try{
		if((_isAndroid) && (_locale!=null)){
			_geo.setGeoLocale(_locale);
		}
		_geo.reverseGeocoder(latitude,longitude,reverseGeoCallback);		
	}catch(err){
		onError(err.message);
	}		
};
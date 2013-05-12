/*jslint maxerr:1000 */
/**
* 
* Core GeoProvider: Titanium Reverse Geo framework
* Copyright: 2013 Benjamin Bahrenburg (http://bencoding.com)
* License: http://www.apache.org/licenses/LICENSE-2.0.html
* 
* 
*/
var _isAndroid = Ti.Platform.osname === 'android',
	_providers = [],
	_purpose = null,
	_sessionInfo = {
		useSmart:true,
		expireInDays:1,
		lastSuccessIndex: -1,
		lastSuccessDate : new Date()		
	};

var smartCacheMgt = {
     dayBetween : function(date1, date2) {
	    var ONE_DAY = 1000 * 60 * 60 * 24;
	    var date1_ms = date1.getTime();
	    var date2_ms = date2.getTime();
	    var difference_ms = Math.abs(date1_ms - date2_ms);		
		var dayFrac = difference_ms/ONE_DAY;
		return (dayFrac<1)? 0 : Math.round(dayFrac);
	},	
	isValid : function(){		
		if((_sessionInfo.lastSuccessDate==null)||(_sessionInfo.lastSuccessIndex ===-1)){
			return false;
		}

		var expired = (smartCacheMgt.dayBetween(_sessionInfo.lastSuccessDate,new Date())>_sessionInfo.expireInDays);
		if(expired){
			smartCacheMgt.reset();
		}		
		return !(expired);
	},
	reset : function(){
		_sessionInfo.lastSuccessIndex=-1;
		_sessionInfo.lastSuccessDate=null;	
	},
	addIndexFound : function(index){
		if(_sessionInfo.useSmart){
			_sessionInfo.lastSuccessIndex = index;
			_sessionInfo.lastSuccessDate = new Date();			
		}		
	}
};
exports.addPurpose=function(purpose){
	_purpose = purpose;
	return exports;
};

exports.addProvider = function(provider){
	_providers.push(provider);
	smartCacheMgt.reset();
};

exports.smartProviderExpireInDays=function(dayCount){
	_sessionInfo.expireInDays = dayCount;
};

exports.updateSmartProvider = function(value){
	_sessionInfo.useSmart = value;
	smartCacheMgt.reset();	
};

exports.clearProviders = function(){
	_providers.length = 0;
	smartCacheMgt.reset();	
};

exports.clearCache = function(){
	var iLength = _providers.length;
	for (iLoop=0;iLoop < iLength;iLoop++){
		_providers[iLoop].lastFoundOn = null;
	}	
	smartCacheMgt.reset();	
};

exports.getCurrentAddress=function(onSuccess,onError){
	
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

exports.getProvider = function(name){
	var iLength = _providers.length, provider = null;
	for (iLoop = 0; iLoop < iLength; iLoop++){
		if((_providers[iLoop].provider==undefined)||
		   (_providers[iLoop].provider==null)){
			_providers[iLoop].provider=require(_providers[iLoop].providerString);
		}
		if((_providers[iLoop].provider==undefined)||
		   (_providers[iLoop].provider==null)){
		   	Ti.API.info('Failed Loading Provider at index ' + iLoop);	   	
		}else{
			if(_providers[iLoop].provider.providerName.toUpperCase()===name.toUpperCase()){
				provider = _providers[iLoop].provider;
				break;
			}	
		}					
	}
	
	return provider;						
};

exports.reverse=function(lat, lng, onSuccess, onError){
	var activeProviderIndex = 0; //Reset our provider

	try{
		
			if(lat===undefined || lat===null || lng===undefined || lng===null ){
				throw "please enter valid coordinates";
			}
			if(_providers===undefined || _providers===null || _providers.length===0){
				throw "you need at least one provider";
			}	
		
			if(!Ti.Network.online){
				if((onError!=undefined)&&(onError!=null)){
					onError(lat, lng,"Network connection is required");											
				}
				return;
			}
			
			var manage = {
				prepare : function(){
					if(smartCacheMgt.isValid()){
						activeProviderIndex=_sessionInfo.lastSuccessIndex;
					}					
				},
				start : function(){
					manage.lookup();
				},
				doSuccess:function(e){
					//Make sure location is found
					if(!e.found){
						manage.failover();
						return;
					}
					
					smartCacheMgt.addIndexFound(activeProviderIndex);
					e.provider = {
						name: _providers[activeProviderIndex].provider.providerName,
						index : activeProviderIndex
					};
					onSuccess(e);
				},
				failover : function(){
					try{
						//If we're in a smart provider loop and we fail reset and start  at the beginning					
						if(_sessionInfo.useSmart){
							if(_sessionInfo.lastSuccessIndex == activeProviderIndex){
								activeProviderIndex=-1;	
							}	
							smartCacheMgt.reset();					
						}
						//Move to the next provider
						activeProviderIndex++;
						
						if(_providers.length>activeProviderIndex){
							manage.lookup();
						}else{
							if((onError!=undefined)&&(onError!=null)){
								onError(lat, lng,'NNo location found all providers tried');	
								return;
							}			
						}			
					 } catch(err) {
					  	Ti.API.info('>>>>>>> Error In providerFallback ' + err.message);
					 	onError(err.message);	
					}
				},
				lookup : function(){
			
					try{
			
						if(!Ti.Network.online){
							onError(lat, lng,"No network available");						
							return;
						}
						if(activeProviderIndex >= _providers.length){
							if((onError!=undefined)&&(onError!=null)){
								onError(lat, lng,'Address not found');
							}
							return;
						}
						
						//Lazy load the providers
						if((_providers[activeProviderIndex].provider==undefined)||
						   (_providers[activeProviderIndex].provider==null)){
							_providers[activeProviderIndex].provider=require(_providers[activeProviderIndex].providerString);
						}
						if((_providers[activeProviderIndex].provider==undefined)||
						   (_providers[activeProviderIndex].provider==null)){
						   	Ti.API.info('Failed Loading Provider at index ' + activeProviderIndex);
						 	manage.failover();
						 	return;				   	
						}
											
						if(_providers[activeProviderIndex].provider.isSupported()){
							if(_providers[activeProviderIndex].hasOwnProperty("key")){
								if((_providers[activeProviderIndex].key!=undefined) && (_providers[activeProviderIndex].key!=null)){
									_providers[activeProviderIndex].provider.addKey(_providers[activeProviderIndex].key);
								}
							}
							
							if(_purpose!=null){
								_providers[activeProviderIndex].provider.addPurpose(_purpose);
							}
							
							Ti.API.info('Geo Lookup using ' + _providers[activeProviderIndex].provider.providerName);
							_providers[activeProviderIndex].provider.reverse(lat, lng, manage.doSuccess,manage.failover);	
								
						}else{
							manage.failover();
						}	
									
					 } catch(err) {
					  	Ti.API.info('>>>>>>> Error In doProviderLookup ' + err );
					 	manage.failover();	
					}
				}												
			};
			
			manage.prepare();
			manage.start();
			
	 } catch(error) {
	  	Ti.API.info('>>>>>>> Error In reverseGeo ' + error.message);
	 	onError(error.message);	
	}			
};

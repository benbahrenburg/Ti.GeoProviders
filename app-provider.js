/*jslint maxerr:1000 */

var my = {
	geoNames : require('./GeoProviders/geonames_geoprovider'),
	basicGeo : require('./GeoProviders/bencoding_geoprovider'),
	google : require('./GeoProviders/google_geoprovider'),
	activeProviderName : 'geonames'	
};

(function () {
    
    var win = Ti.UI.createWindow({
        backgroundColor: '#fff', title: 'Ti.GeoProviders', 
        barColor:'#000',fullscreen:false
    });
		
	var mapView = Ti.Map.createView({
		top:80, bottom:0, width:Ti.UI.FILL,userLocation:false	
	});
	win.add(mapView);
		
	var lookup = {
		updateDataLabel : function(providerType){
			
			my.activeProviderName = providerType;
			
			if(providerType=='geonames'){
				ccLabel.visible = true;
				ccLabel.text ="data by GeoNames.org";		
			}

			if(providerType=='google'){
				ccLabel.visible = true;
				ccLabel.text ="data by Google";
			}
			
			if(providerType=='basicgeo'){
				ccLabel.visible = false;
			}		
			
		},
		updateProvider : function(providerType){
			
			Ti.API.info('Adding provider: ' + providerType);
			
			if(providerType == 'geonames'){
				my.provider = my.geoNames;
				//Add your user key
				my.provider.addKey('demo');		
			}

			if(providerType == 'google'){
				my.provider = my.google;
			}
			
			if(providerType == 'basicgeo'){
				my.provider = my.basicGeo;
			}
															
			//Add your GPS Access Reason
			my.provider.addPurpose('Demo of Geo Provider');
			
			//Update our label
			lookup.updateDataLabel(providerType);
							
		},
		addToMap: function(lat,lng,title){
			var pin = Ti.Map.createAnnotation({
				latitude:lat,longitude:lng,	
				title:title			
			});

			mapView.addAnnotation(pin);
			var region = {latitude:lat,longitude:lng,animate:true,
				          latitudeDelta:0.04, longitudeDelta:0.04};
			mapView.setLocation(region);
		},
		onSuccess : function(e){
			if(!e.found){
				alert("Unable to find your location");
				return;
			}
			//Generate the address
			var title = my.provider.generateAddress(e);
			//Add to the map
			lookup.addToMap(e.latitude,e.longitude,title);
		},
		onError: function(e){
			Ti.API.info(JSON.stringify(e));
			alert("Error finding your location, see console for details");
		}
	};
			
	var findButton = Ti.UI.createButton({
		title:'Find Current Location', left:10, right:10,top:40,height:40
	});
	win.add(findButton);

	findButton.addEventListener('click',function(e){
		if(!Ti.Network.online){
			alert("You must be online to run this recipe");
			return;
		}
			
		my.provider.getCurrentAddress(lookup.onSuccess,lookup.onError);		
	});

	var ccLabel = Ti.UI.createLabel({
		left:20, right:20, height:40, color:'#000',
		textAlign:'right', font:{fontSize:12, fontWeight:'bold'},
		bottom:0, text:'Data Provided by GeoNames.org'	
	});
	win.add(ccLabel);
	ccLabel.addEventListener('click',function(e){
		if(my.activeProviderName == 'geonames'){
			Ti.Platform.openURL("http://geonames.org");
		}
		if(my.activeProviderName == 'google'){
			Ti.Platform.openURL("http://developers.google.com/maps");
		}		
	});
	

	//Set defaults
	lookup.updateProvider(my.activeProviderName);
	
    win.open({modal:true});
        
})();    

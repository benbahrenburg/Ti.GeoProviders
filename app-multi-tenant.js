/*jslint maxerr:1000 */

var my = {
	multiProvider : require('./GeoProviders/reverse_multi_geoprovider')
};

my.multiProvider.addPurpose('Demo of Geo Provider');

my.multiProvider.addProvider({
	key : 'demo',
	providerString:'GeoProviders/geonames_geoprovider'
});
my.multiProvider.addProvider({
	providerString:'GeoProviders/bencoding_geoprovider'
});
my.multiProvider.addProvider({
	providerString:'GeoProviders/google_geoprovider'
});			

(function () {
    
    var win = Ti.UI.createWindow({
        backgroundColor: '#fff', title: 'Multi-Tenant Geo', 
        barColor:'#000',fullscreen:false
    });

	win.add(Ti.UI.createLabel({
		top:0, height:60, left:10, right:10,color:'#000',
		textAlign:'left',text:'Multi-Tenant Reverse Geo Location. If one reverse geo location provider fails to find the address, the next provider will be used.', 
		font:{fontSize:14}
	}));
		
	var mapView = Ti.Map.createView({
		top:120, bottom:0, width:Ti.UI.FILL,userLocation:false	
	});
	win.add(mapView);
		
	var lookup = {
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
			//Access the provider that returned the results using the provider name
			var provider = my.multiProvider.getProvider(e.provider.name);			
			//Generate the address
			var title = provider.generateAddress(e);
			//Add to the map
			lookup.addToMap(e.latitude,e.longitude,title);
		},
		onError: function(e){
			Ti.API.info(JSON.stringify(e));
			alert("Error finding your location, see console for details");
		}
	};

			
	var findButton = Ti.UI.createButton({
		title:'Find Current Location', left:10, right:10,top:70,height:40
	});
	win.add(findButton);

	findButton.addEventListener('click',function(e){
		if(!Ti.Network.online){
			alert("You must be online to run this recipe");
			return;
		}
			
		my.multiProvider.getCurrentAddress(lookup.onSuccess,lookup.onError);		
	});
		
    win.open({modal:true});
        
})();      
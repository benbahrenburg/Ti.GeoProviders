<h1>Ti.GeoProviders Framework</h1>

Providing a provider based approach to reverse geo location lookups in Titanium.

<h2>Available Providers</h2>
* GeoNames - Use the powerful GeoNames.org web service platform from your Titanium app.  Please make sure to register with GeoNames.org and review their terms of use before starting.
* Google - Use the Google Geocoder to perform reverse geo look-ups.  Please make sure to check the Google terms of use before starting.
* BasicGeo - Native Geo Location using the benCoding.basicGeo module.  To use this GeoProvider you need to download and install the module located [here.](https://github.com/benbahrenburg/benCoding.BasicGeo)

<h2>How To Example</h2>

<b>Using a single provider</b>
The Ti.GeoProvider's common interface makes using a single or multiple providers easier.  See the [app-provider.js]() for an example on how to use this approach.

<b>Going multi-tenant</b>
All of the Ti.GeoProviders have their strengths and weaknesses, so why settle for just one.  Using the reverse multi provider module you can automatically failover when a provider is unable to find a location.  See the [app-multi-tenant.js]() for an example on how to use this approach.

<h2>Licensing & Support</h2>

This project is licensed under the OSI approved Apache Public License (version 2). For details please see the license associated with each project.

Developed by [Ben Bahrenburg](http://bahrenburgs.com) available on twitter [@benCoding](http://twitter.com/benCoding)

<h2>Learn More</h2>

<h3>Twitter</h3>

Please consider following the [@benCoding Twitter](http://www.twitter.com/benCoding) for updates 
and more about Titanium.

<h3>Blog</h3>

For module updates, Titanium tutorials and more please check out my blog at [benCoding.Com](http://benCoding.com). 

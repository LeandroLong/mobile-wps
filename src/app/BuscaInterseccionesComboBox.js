 /**
 * @requires OpenLayers/Format/WKT.js
 */

 var BuscaInterseccionesComboBox = Ext.extend(Ext.form.ComboBox, {
    
    /** api: xtype = gxp_googlegeocodercombo */
    xtype: "app_buscacombobox",

    /** api: config[queryDelay]
     *  ``Number`` Delay before the search occurs.  Default is 100ms.
     */
    queryDelay: 100,
    
    /** api: config[bounds]
     *  ``OpenLayers.Bounds | Array`` Optional bounds (in geographic coordinates)
     *  for restricting search.
     */
    
    /** api: config[valueField]
     *  ``String``
     *  Field from selected record to use when the combo's ``getValue`` method
     *  is called.  Default is "location".  Possible value's are "location",
     *  "viewport", or "address".  The location value will be an 
     * ``OpenLayers.LonLat`` object that corresponds to the geocoded address.
     *  The viewport value will be an ``OpenLayers.Bounds`` object that is 
     *  the recommended viewport for viewing the resulting location.  The
     *  address value will be a string that is the formatted address.
     */
    valueField: "viewport",

    /** private: config[displayField]
     */
    displayField: "address",

    /** private: method[initComponent]
     *  Override
     */
	 
	 initComponent: function() {
		
        this.disabled = true;
		this.feature = new Array();
		
		  var respuesta = OpenLayers.Request.GET({
                    url: "geoserver/wfs",
                    params: {
                            typeName: "Idesf:calles",
                            service: "WFS",
                            version: "1.1.0",
                            outputFormat: "JSON", // Usamos JSON para que la respuesta sea mas rapida
                            readFormat: new OpenLayers.Format.GeoJSON(),
                            srsName: "EPSG:22185",
                            request: "GetFeature"
                    },
					async: false
            });
			
		  var format = new OpenLayers.Format.GeoJSON();
          var featureAux = format.read(respuesta.responseText);
		  var i=0;
		  var calleAux= new OpenLayers.Format.WKT();
		  while(i<featureAux.length){
			 
			  if(featureAux[i].data.tipo!=9){
				   var calleCoordenada = new Array(2);
			  calleCoordenada[0]=featureAux[i].data.nombre;
			  calleCoordenada[1]=calleAux.extractGeometry(featureAux[i].geometry);
			  this.feature.push(calleCoordenada);
			                                 }
			  i++;
		  }
	      
			
			
    /*    var ready = !!(window.google && google.maps);
        if (!ready) {
            if (!gxp.plugins || !gxp.plugins.GoogleSource) {
                throw new Error("The gxp.form.GoogleGeocoderComboBox requires the gxp.plugins.GoogleSource or the Google Maps V3 API to be loaded.");
            }
            gxp.plugins.GoogleSource.loader.onLoad({
                otherParams: gxp.plugins.GoogleSource.prototype.otherParams,
                callback: this.prepGeocoder,
                errback: function() {
                    throw new Error("The Google Maps script failed to load within the given timeout.");
                },
                scope: this
            });
			alert("Aca cuando entra1");
    *///    } else {
            // call in the next turn to complete initialization
			//  Entra si esta todo bien
			
			
			
            window.setTimeout((function() {
                this.prepGeocoder();
            }).createDelegate(this), 0);
      //  }

        this.store = new Ext.data.JsonStore({
            root: "results",
            fields: [
                {name: "address", type: "string"},
                {name: "location"}, // OpenLayers.LonLat
                {name: "viewport"} // OpenLayers.Bounds
            ],
            autoLoad: false
        });
        
        this.on({
            focus: function() {
                this.clearValue();
            },
            scope: this
        });
        
        return BuscaInterseccionesComboBox.superclass.initComponent.apply(this, arguments);

    },
    
    /** private: method[prepGeocoder]
     */
    prepGeocoder: function() {
        var geocoder = new google.maps.Geocoder();
		
        var api = {};
        api[Ext.data.Api.actions.read] = true;
        var proxy = new Ext.data.DataProxy({api: api});
        var combo = this;
        //alert(combo.length);
        // TODO: unhack this - this is due to the the tool output being generated too early
        var getBounds = (function() {
            // optional bounds for restricting search
            var bounds = this.bounds;
            if (bounds) {
                if (bounds instanceof OpenLayers.Bounds) {
                    bounds = bounds.toArray();
                }
                bounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(bounds[1], bounds[0]),
                    new google.maps.LatLng(bounds[3], bounds[2])
                );
            }
            return bounds;
        }).createDelegate(this);
		
		
        
		// Lee del combobox el texto provisorio y devuelve posibles respuestas
        proxy.doRequest = function(action, rs, params, reader, callback, scope, options) {
			
			
			var readerResult;
			var listaCalles = new Array();

			for(var i=0;i < combo.feature.length;i++){

				if((combo.feature[i][0].toLowerCase().indexOf(params.query.toLowerCase()) != -1) && (listaCalles.indexOf(combo.feature[i][0]) == -1)){
				
					
					listaCalles.push(combo.feature[i][0]);
				}				
			}
			
			results = combo.transformResults(listaCalles);
			readerResult = reader.readRecords({results});
			callback.call(scope, readerResult, options, true);       

        };
        
        this.store.proxy = proxy;
        if (this.initialConfig.disabled != true) {
            this.enable();
        }
    },
        
    /** private: method[transformResults]
     *  Setea los resultados en un arreglo para ser mostrados en el mapa
     */
    transformResults: function(gResults) {
		// Por cada vez que se escriba en el combobox se setean las posibles respuestas
        var num = gResults.length;
        var olResults = new Array(num);
        var item, latLng, bounds, ne, sw;
        for (i=0; i<num; ++i) {
            item = gResults[i];

            olResults[i] = {
                address: item
				//,location: new OpenLayers.LonLat(latLng.lng(), latLng.lat()),
                //viewport: new OpenLayers.Bounds(sw.lng(), sw.lat(), ne.lng(), ne.lat())
            };
        }
        return olResults;
    }

});

Ext.reg(BuscaInterseccionesComboBox.prototype.xtype, BuscaInterseccionesComboBox);

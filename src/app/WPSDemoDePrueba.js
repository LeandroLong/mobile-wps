/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 * @require OpenLayers/Geometry.js
 * @require OpenLayers/Format/WFS.js
 * @require OpenLayers/Format/WPSExecute.js
 * @require OpenLayers/Format/WKT.js
 * @require OpenLayers/Control/GetFeature.js
 * @require OpenLayers/Proj4js.js
 */

 
var WPSDemo = Ext.extend(gxp.plugins.Tool, {

    ptype: 'app_wpsdemo',
    
    /** Inicio del plugin */
    init: function(target) {
        WPSDemo.superclass.init.apply(this, arguments);

        // Crea una instancia del servidos local WPS
        this.wpsClient = new OpenLayers.WPSClient({
            servers: {
                local: 'geoserver/wps'
            }
        });
		
		    this.map = target.mapPanel.map;
							  
        // Añade botones de acción cuando el VISOR GPX(wiever) está listo
        target.on('ready', function() {
            // Obtiene una referencia a la capa de vector de app.js
            this.layer = target.getLayerRecordFromMap({
                name: 'sketch',
                source: 'ol'
            }).getLayer();
			
			//Inicializa las variables que usara GMaps para calculo de ruta
			this.directionsDisplay = new google.maps.DirectionsRenderer;
			this.mapaMio = this.map.layers[1].mapObject;	
			this.directionsDisplay.setMap(this.mapaMio);	
			this.directionsService = new google.maps.DirectionsService;
			
            // Algunos valores predeterminados
            var actionDefaults = {
                map: target.mapPanel.map,
                enableToggle: true,
                toggleGroup: this.ptype,
                allowDepress: true
            };
			// Inicio de agregacion de ACCIONES
            this.addActions([
			
			//Acción para la probar WFS
                    new GeoExt.Action(Ext.apply({
                    text: 'Area de Influencia',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer,OpenLayers.Handler.Point, {
                        eventListeners: {
                            featureadded: this.buffer,
                            scope: this
                        }
                    })
                }, actionDefaults)),
			
			//Acción para calculo de union
				 new GeoExt.Action(Ext.apply({
                    text: 'Area Raster',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Polygon, {
                        eventListeners: {
                            featureadded: this.area,
                            scope: this
                        }
                    })
                }, actionDefaults)),
                // Acción para la elaboración de nuevas geometrías
                new GeoExt.Action(Ext.apply({
                    text: 'Dibujar',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Polygon
                    )
                }, actionDefaults)),
					//Acción para calculo interseccion
				 new GeoExt.Action(Ext.apply({
                    text: 'Buscar Intersecciones',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Path, {
                        eventListeners: {
                            featureadded: this.intersects,
                            scope: this
                        }
                    })
                }, actionDefaults)),
                // Acción para arrastrar geometrías existentes
                new GeoExt.Action(Ext.apply({
                    text: 'Arrastrar',
                    control: new OpenLayers.Control.DragFeature(this.layer)
                }, actionDefaults)),
				
                // Acción para la división dibujando una línea
                new GeoExt.Action(Ext.apply({
                    text: 'Split',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Path, {
                        eventListeners: {
                            featureadded: this.split,
                            scope: this
                        }
                    })
                }, actionDefaults)),
				
				//Acción para calculo de interseccion
				 new GeoExt.Action(Ext.apply({
                    text: 'Borrar',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Point, {
                        eventListeners: {
                            featureadded: this.borrar,
                            scope: this
                        }
                    })
                }, actionDefaults)),
				
					
				
				//Acción para la intersection+buffer dibujando una línea
                    new GeoExt.Action(Ext.apply({
                    text: 'Union',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer,OpenLayers.Handler.Path, {
                        eventListeners: {
                            featureadded: this.union,
                            scope: this
                        }
                    })
                }, actionDefaults)),
				
				//Acción para la intersection+buffer dibujando una línea
                    new GeoExt.Action(Ext.apply({
                    text: 'Intersect+Buffer',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer,OpenLayers.Handler.Path, {
                        eventListeners: {
                            featureadded: this.intersectBuffer,
                            scope: this
                        }
                    })
                }, actionDefaults)),
				
				//Acción para la probar WFS
                    new GeoExt.Action(Ext.apply({
                    text: 'WFS',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer,OpenLayers.Handler.Path, {
                        eventListeners: {
                            featureadded: this.wfs,
                            scope: this
                        }
                    })
                }, actionDefaults))
				
				
				
            ]); // Fin de agregacion de ACCIONES
        }, this);
    },
	
	// Proceso que ejecuta un BUFFER
    buffer: function(evt) {
		
		for(var z=this.layer.features.length-1; z>=0; --z){
			
			 this.layer.removeFeatures(this.layer.features[z]);
		}	
	   
		
		
		var wpsFormat= new OpenLayers.Format.WPSExecute(); 
		var posicion= new OpenLayers.Format.WKT();
		
		
			
		
		    
		var p = new Proj4js.Point(evt.feature.geometry.x,evt.feature.geometry.y);
	
        
		Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
		var fuente = new Proj4js.Proj('EPSG:900913');
		Proj4js.defs["EPSG:22185"] = "+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
	    var dest = new Proj4js.Proj('EPSG:22185');
		
			
		// Convierte p desde el sistema de coordenadas 900913 a 22185 para realizar las intersecciones
		Proj4js.transform(fuente, dest, p);
		
		
		var puntoBuffer="POINT("+p.x+" "+""+p.y+")";
		
		
		
		
		// Aca se realiza la consulta WPS Buffer
	    var doc1= wpsFormat.write({ 
        identifier: "JTS:buffer", 
        dataInputs:[{ 
            identifier:'geom', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					//value: posicion.extractGeometry(evt.feature.geometry)
					value: puntoBuffer
					
							}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
		     }}},
			{ 
            identifier:'distance', 
            data: { 
			literalData:{
					value: 1000 // este valor debera ser reemplazadado por uno que ingrese el usuario
				}
			}
		}], 
            responseForm:{ 
                    rawDataOutput:{ 
                        mimeType:"application/wkt", 
                        identifier:"result" 
                }} 
		}); 
		
		
		// Aca se realiza la consulta WPS Buffer
	    var doc2= wpsFormat.write({ 
        identifier: "JTS:buffer", 
        dataInputs:[{ 
            identifier:'geom', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: posicion.extractGeometry(evt.feature.geometry)
					//value: puntoBuffer
							}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
		     }}},
			{ 
            identifier:'distance', 
            data: { 
			literalData:{
					value: 1000 // este valor debera ser reemplazadado por uno que ingrese el usuario
				}
			}
		}], 
            responseForm:{ 
                    rawDataOutput:{ 
                        mimeType:"application/wkt", 
                        identifier:"result" 
                }} 
		}); 
 
			var bufferInterseccion = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc1,
					headers: { "Content-Type": "text/xml;charset=utf-8" }, 
					async: false
            });
			
			
			var bufferDibujar = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc2,
					headers: { "Content-Type": "text/xml;charset=utf-8" }, 
					async: false
            });
			
			
		var mypolygon = new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT(bufferDibujar.responseText));
		
        
		
	
		this.layer.addFeatures([mypolygon]);
		//this.layer.addFeatures([evt.feature]);
		var i=0;
		var cantidadCapasVisibles = this.map.layers.length; 
        var inter =0;
		for(i=0;i<cantidadCapasVisibles;i++){
			if(this.map.layers[i].CLASS_NAME=="OpenLayers.Layer.WMS" && this.map.layers[i].visibility){
			
			var arregloWfs = this.wfs(this.map.layers[i].name);
			
				for (var j=0; j<arregloWfs.length; j++) {
				if(this.verIntersecciones(arregloWfs[j][1],bufferInterseccion.responseText)){
				// alert(arregloWfs[j][0]);	
				 
				 this.dibujaRuta(p,arregloWfs[j][1]);
			}}}}},
	
	dibujaRuta: function(pOrigen,pDest) { 
	
	
	
	var directionsDisplay = this.directionsDisplay;

	
	
	
	var puntoDest = OpenLayers.Geometry.fromWKT(pDest);
	
	var puntoOrigen = new Proj4js.Point(pOrigen.x,pOrigen.y);
	var puntoDestino = new Proj4js.Point(puntoDest.components[0].x,puntoDest.components[0].y);	
	
	
	Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
	var origen1 = new Proj4js.Proj('EPSG:900913');
	Proj4js.defs["EPSG:22185"] = "+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
	var origen2 = new Proj4js.Proj('EPSG:22185');
	Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
	var destinoUnico = new Proj4js.Proj('EPSG:4326');
	
	Proj4js.transform(origen2, destinoUnico, puntoOrigen);
	Proj4js.transform(origen2, destinoUnico, puntoDestino);
	
	var origen = {lat: puntoOrigen.y, lng: puntoOrigen.x};
	var destino = {lat: puntoDestino.y, lng: puntoDestino.x};
			
	var p1 = new google.maps.LatLng(puntoOrigen.y, puntoOrigen.x);
	var p2 = new google.maps.LatLng(puntoDestino.y, puntoDestino.x);
							

	this.haceAlgo(directionsDisplay,p1,p2,function(){
	       
        
    })
	
	},


	haceAlgo: function(directionsDisplay,p1,p2,callback){
		
		this.directionsService.route({
		origin: p1,
		destination: p2,
		travelMode: google.maps.TravelMode.TRANSIT},
			function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					 directionsDisplay.setDirections(response);
					 window.setTimeout(function () {
						 Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
						 var origen1 = new Proj4js.Proj('EPSG:900913');
						 Proj4js.defs["EPSG:22185"] = "+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
	                     var origen2 = new Proj4js.Proj('EPSG:22185');
	                     Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
	                     var destinoUnico = new Proj4js.Proj('EPSG:4326');
						 
						 var puntoCentro = new Proj4js.Point(directionsDisplay.A.D[0].location.F,directionsDisplay.A.D[0].location.A);
						 
						 //Reproyecta los puntos
						 Proj4js.transform(destinoUnico, origen1, puntoCentro);
						// Proj4js.transform(destinoUnico, origen1, puntoDestino);
						 
						 //Crea un punto donde va a centrar el mapa una vez que dibuje la ruta
						 var pixel = new OpenLayers.LonLat(puntoCentro.x,puntoCentro.y);
						 //Centra el mapa al punto especificado
						 this.app.mapPanel.map.moveTo(pixel,14,true);}, '700');
					 		
					 					 					 
					} else {
					  window.alert('Directions request failed due to ' + status);
					}
				  })
		
		
		

			
				  }
				,
	
	verIntersecciones: function(punto,buffer) {
		
		
		var mipunto = OpenLayers.Geometry.fromWKT(punto);
	    var mibuffer=OpenLayers.Geometry.fromWKT(buffer);
		
		
		var respuesta = mibuffer.intersects(mipunto);
		
		if(respuesta){
		return true;	
		}	
		
		return false;
		
},


	/** Controlador de funcion para la interseccion de geometrias */
    wfs: function(evt) {
		var feature = new Array();
		
		var calleAux = new OpenLayers.Format.WKT();
		    var respuesta = OpenLayers.Request.GET({
                    url: "geoserver/wfs",
                    params: {
                            typeName: "Idesf:"+evt,
                            service: "WFS",
                            version: "1.1.0",
                            outputFormat: "JSON", // Usamos JSON para que la respuesta sea mas rapida
                            readFormat: new OpenLayers.Format.GeoJSON(),
                            request: "GetFeature"
                    },
					async: false
            });
		  var format = new OpenLayers.Format.GeoJSON();
          var featureAux = format.read(respuesta.responseText);
		  var i=0;
		    while(i<featureAux.length){
		
			var calleCoordenada = new Array(2);
			  calleCoordenada[0]=featureAux[i].data.nombre;
			  calleCoordenada[1]=calleAux.extractGeometry(featureAux[i].geometry);
			  feature.push(calleCoordenada);
			                                 
			  i++;
		  }
		  return feature;
	    },

	 /** Controlador de funcion para la interseccion de geometrias */
    borrar: function(evt) {
       
	     var line = evt.feature;
		//alert(line.geometry);
        var poly;
			for (var i=this.layer.features.length-1; i>=0; --i) {
            poly = this.layer.features[i];
            if (poly !== line && poly.geometry.intersects(line.geometry)){
			this.layer.removeFeatures([poly]);
			this.layer.removeFeatures([line]);
			}	}
    },
	
	 /** Controlador de funcion para la division de geometrias */
    area: function(evt) {
		
        var wpsFormat= new OpenLayers.Format.WPSExecute(); 
		var posicion= new OpenLayers.Format.WKT();
		
		//var que=evt.feature.geometry.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));

   
	    var doc= wpsFormat.write({ 
        identifier: "JTS:area", 
        dataInputs:[{ 
            identifier:'geom', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: posicion.extractGeometry(evt.feature.geometry)
							}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
		     }}}], 
            responseForm:{ 
                    rawDataOutput:{ 
                        mimeType:"application/wkt", 
                        identifier:"result" 
                }} 
		}); 
 
			var posicionBuffer = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc,
					headers: { "Content-Type": "text/xml;charset=utf-8" }, 
					async: false
            });
           
		   alert("El area seleccionada es de: "+posicionBuffer.responseText+"Mts2");
  
    },
	
	 /** Controlador de funcion para la division de geometrias */
    area2: function(evt) {
     //  var line = evt.feature;
	 //  var poly = this.layer.features[0];
	   var wpsFormat= new OpenLayers.Format.WPSExecute(); 

	   
	   var calle1 = new OpenLayers.Format.WKT().extractGeometry(evt.feature.geometry);
	   var calle2 = new OpenLayers.Format.WKT().extractGeometry(this.layer.features[0].geometry);
	   
	    var doc= wpsFormat.write({ 
        identifier: "JTS:intersects", 
        dataInputs:[{ 
            identifier:'a', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: calle1
							}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
			   }}},
			{ 
            identifier:'b', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: calle2
				}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
			   }}}], 

            responseForm:{ 
                    rawDataOutput:{ 
                        mimeType:"application/wkt", 
                        identifier:"result" 
                }} 

            }); 
       
   
          
              
		
			  	  var respuesta = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc,
					headers: { "Content-Type": "text/xml;charset=utf-8" }, 
					async: false
            });
	     
              //  alert(respuesta.responseText);
						
    },
	
		
    /** Controlador de funcion para la division de geometrias */
    split: function(evt) {
        var line = evt.feature;
		//alert(line.geometry);
        var poly;
        for (var i=this.layer.features.length-1; i>=0; --i) {
            poly = this.layer.features[i];
			//alert(poly.geometry);
            if (poly !== line && poly.geometry.intersects(line.geometry)) {
                this.wpsClient.execute({
                    server: 'local',
                    process: 'JTS:splitPolygon',
                    inputs: { polygon: poly, line: line },
                    success: this.addResult,
                    scope: this
                });
                this.layer.removeFeatures([poly]);
            }
        }
        this.layer.removeFeatures([line]);
    },
	
	 union: function(evt) {
     
	   //  var line = evt.feature;
	 //  var poly = this.layer.features[0];
	   var wpsFormat= new OpenLayers.Format.WPSExecute(); 

	   
	   var calle1 = new OpenLayers.Format.WKT().extractGeometry(evt.feature.geometry);
	   var calle2 = new OpenLayers.Format.WKT().extractGeometry(this.layer.features[0].geometry);
	   
	    var doc= wpsFormat.write({ 
        identifier: "JTS:union", 
        dataInputs:[{ 
            identifier:'geom', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: "MULTILINESTRING ((50 60, 70 80), (70 80, 90 100))"
							}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
			   }}},
			{ 
            identifier:'geom', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: "MULTILINESTRING((10 20,50 60))"
				}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
			   }}}], 

            responseForm:{ 
                    rawDataOutput:{ 
                        mimeType:"application/wkt", 
                        identifier:"result" 
                }} 

            }); 
			  	  var respuesta = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc,
					headers: { "Content-Type": "text/xml;charset=utf-8" }, 
					async: false
            });
	     
             //   alert(respuesta.responseText);
	 	 	   	 
	 
    },
	


    /** Controlador de funcion para la accion intersection+buffer */
	
	// Proceso en cascada (BUFFER+INTERSECTION)
    intersectBuffer: function(evt) {
        var line = evt.feature;
        var poly;
        for (var i=this.layer.features.length-1; i>=0; --i) {
            poly = this.layer.features[i];
            if (poly !== line && poly.geometry.intersects(line.geometry)) {
                this.wpsClient.execute({
                    server: 'local',
                    process: 'JTS:buffer',
                    inputs: {
                        distance:
                            // buffer distance is 10 pixels
                            9 * this.target.mapPanel.map.getResolution(),
                        geom:
                            this.wpsClient.getProcess(
                                'local', 'JTS:intersection'
                            ).configure({
                                inputs: { a: line, b: poly }
                            }).output()
                    },
                    success: this.addResult,
                    scope: this
                });
            }
			
        }
        this.layer.removeFeatures([line]);
    },
	
	
	
	

   	/** Función auxiliar para la adición de los resultados del proceso de la capa de vector */
    addResult: function(outputs) {
		
        this.layer.addFeatures(outputs.result);
    }
	
	,

   	/** Función auxiliar para la adición de los resultados del proceso de la capa de vector */
    addResult2: function(outputs) {
        alert(outputs.result);
    },
	  raiseLayer: function() {
    var map = this.boxLayer && this.boxLayer.map;
    if (map) {
      map.setLayerIndex(this.boxLayer, map.layers.length);
    }
  }

});

Ext.preg(WPSDemo.prototype.ptype, WPSDemo);
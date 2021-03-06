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
 * @require MostrarMenu.js
 */

 
var AreaInfluenciaBuffer = Ext.extend(gxp.plugins.Tool, {

    ptype: 'app_areainfluenciaprueba',
    
    /** Inicio del plugin */
    init: function(target) {
        AreaInfluenciaBuffer.superclass.init.apply(this, arguments);
		
		
		
			
		    this.map = target.mapPanel.map;
		//	this.lugares = AreaInfluenciaBuffer.superclass.constructor.call(this,target.portalConfig.items[2].items[1]); 
							  
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
                    text: 'Area de Influencia: ',
					handler: this.muestraMenu.createDelegate(this),
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer,OpenLayers.Handler.Point, {
                        eventListeners: {
                            featureadded: this.buffer,
                            scope: this
                        }
                    })
                }, actionDefaults))					
				
				
            ]); // Fin de agregación de ACCIONES
			
		// Crea un combo para que el usuario seleccione un radio de influencia
			
			  var combo = new Ext.form.ComboBox({
						emptyText:'Seleccione un rango..',
						typeAhead: true,
						editable: false,
						store: ['200 mts', '350 mts', '500 mts', '1000 mts', '1500 mts', '2000 mts','5000 mts'],
						triggerAction: 'all',
						mode: 'local',
						width: 80,
						forceSelection: true
					});
			
			this.addOutput(combo);
        }, this);
    },
	
	// Proceso que ejecuta un BUFFER
    buffer: function(evt) {
		
		//Borra los poligonos dibujados
		for(var z=this.layer.features.length-1; z>=0; --z){
			this.layer.removeFeatures(this.layer.features[z]);
		}	
	   
		
		
		
		var posicion= new OpenLayers.Format.WKT();		    
		var p = new Proj4js.Point(evt.feature.geometry.x,evt.feature.geometry.y);
	
     // Definen en Proj4js los sistemas de coordenadas
		Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
		var fuente = new Proj4js.Proj('EPSG:900913');
		Proj4js.defs["EPSG:22185"] = "+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
	    var dest = new Proj4js.Proj('EPSG:22185');
		
	
	 // Convierte p desde el sistema de coordenadas 900913 a 22185 para realizar las intersecciones
		Proj4js.transform(fuente, dest, p);
		
	 // Arma el punto que sera usado para calcular el buffer
		var puntoBuffer="POINT("+p.x+" "+""+p.y+")";
		
	 //	Recupera el rango seleccionado por el usuario
	 
		if(!this.output[0].lastSelectionText){
			
			alert("ATENCIÓN: Debe elegir un rango de influencia");
			return 0;
		}
	 
	    var rango = this.output[0].lastSelectionText;
	    var valor = parseInt(rango.split(" ",1));
	
		
		
			
	
			
		//Se dibuja en el mapa el buffer calculado	
	//	var wkt = OpenLayers.Geometry.fromWKT(bufferDibujar.responseText);
	//	var mypolygon = new OpenLayers.Feature.Vector(wkt);
	//	this.layer.addFeatures([mypolygon]);
		
		
		var i=0;
		var cantidadCapasVisibles = this.map.layers.length; 
        var inter =0;
		
		var lugares = new Array();
		//var datosLugares = Array(3);
		for(i=0;i<cantidadCapasVisibles;i++){
			if(this.map.layers[i].CLASS_NAME=="OpenLayers.Layer.WMS" && this.map.layers[i].visibility){
		 // Recupera los datos de la capa en cuestion	
		//	var arregloWfs = this.wfs(this.map.layers[i].params.LAYERS);
		
		 var doc = this.getConsulta(this.map.layers[i].params.LAYERS,puntoBuffer,valor);
		 
		 //Se ejecuta el servicio WPS para retornar un buffer de interseccion
		 var bufferInterseccion = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc,
					headers: { "Content-Type": "text/xml;charset=utf-8" }, 
					async: false
            });
			
			var format = new OpenLayers.Format.GeoJSON();	
			var featureAux = format.read(bufferInterseccion.responseText);
		
			// Si tiene elementos para insertar en la ventana entra	
			if(featureAux.length>0){
		    for (var j=0; j<featureAux.length; j++) {
		
					var datosLugares = new Array(2);
			
					datosLugares[0]=featureAux[j].data.nombre;
					datosLugares[1]=posicion.extractGeometry(featureAux[j].geometry);
					lugares.push(datosLugares);
					}}}}

	
    // create the data store
    var store = new Ext.data.ArrayStore({
        fields: [
           {name: 'lugar'},
		   {name: 'punto'}
        ]
    });

    // manually load local data
    store.loadData(lugares);

    // create the Grid
    var grid = new Ext.grid.GridPanel({
        store: store,
		
        
        columns: [
            {
                id       :'lugar',
                header   : 'Lugar', 
                width    : 80, 
				height: 100,
                sortable : true, 
                dataIndex: 'lugar'
            },
            {
                xtype: 'actioncolumn',
				header   : 'Acciones',
                width: 85,
                items: [{
                    icon   : './verRuta.png',  // Use a URL in the icon config
                    tooltip: 'Click para ver la ruta...'
                }]
            }
        ],
		listeners: {
					cellclick: function(dv, record, item, index, e) {
					this.dibujaRuta(p,dv.initialConfig.store.data.items[record].json[1]);	
					this.panel.close();
					},
					scope: this
			},
		
        stripeRows: true,
        autoExpandColumn: 'lugar',
        height: 400,
        width: 500
    });
	
		
		this.panel = new Ext.Window({
	   
		title: "Lugares Cercanos a Usted",
        height: 400,
        width: 500,
		collapsible: true,
		maximizable: true,
		animCollapse: true,
		items: grid
				});
						
			if(this.mostrarMenu){
		this.mostrarMenu.removeOutput();
			}
		this.mostrarMenu = new MostrarMenu();
		this.mostrarMenu.addOutput(grid);


						
									
		/** UNA VEZ CALCULADOS TODOS LOS PUNTOS QUE SE INTERSECAN CON EL BUFFER, SE DEBERIA MOSTRAR POR POPUP
		    DICHOS PUNTOS Y DEJAR QUE EL USUARIO ELIJA ALGUN PUNTO Y DAR LA OPCION DE CALCULAR LA RUTA*/							
		
		},
	
	/** Funcion que recibe un punto de origen y un punto de destino para dibujar la ruta en Google Maps*/
	
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
							
    // Los puntos deberan estar en EPSG: 4326 para que sean pasados por parametros a los servicios de Google Maps
	this.directionsService.route({
		origin: origen,
		destination: destino,
		travelMode: google.maps.TravelMode.WALKING},
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
						 
						 var puntoCentro = new Proj4js.Point(directionsDisplay.map.center.K,directionsDisplay.map.center.G);
						 
						 //Reproyecta los puntos
						 Proj4js.transform(destinoUnico, origen1, puntoCentro);
						// Proj4js.transform(destinoUnico, origen1, puntoDestino);
						 
						 //Crea un punto donde va a centrar el mapa una vez que dibuje la ruta
						 var pixel = new OpenLayers.LonLat(puntoCentro.x,puntoCentro.y);
						 //Centra el mapa al punto especificado
						 this.app.mapPanel.map.moveTo(pixel,14,true);},'700');
					 		
					 					 					 
					} else {
					  window.alert('No se pudo calcular la ruta especificada');
					}
				  })
	
	},

	
	
	/** Controlador de funcion para la interseccion de geometrias */
    wfs: function(evt) {
		var feature = new Array();
		
		var calleAux = new OpenLayers.Format.WKT();
		    var respuesta = OpenLayers.Request.GET({
                    url: "geoserver/wfs",
                    params: {
                            typeName: evt,
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
		
	/** Funcion que verifica la interseccion del punto con el buffer, retorna true si interseca. */
	verIntersecciones: function(punto,buffer) {
				
		var mipunto = OpenLayers.Geometry.fromWKT(punto);
	    var mibuffer=OpenLayers.Geometry.fromWKT(buffer);
				
		var respuesta = mibuffer.intersects(mipunto);
		
		if(respuesta){
		return true;}			
		return false;
		
	},
	getConsulta: function(nombreCapa,punto,distancia) {
		// Se arma el request para calcular el buffer para interseccion
		var wpsFormat= new OpenLayers.Format.WPSExecute(); 
	    var doc = wpsFormat.write({ 
        identifier: "gs:Clip", 
        dataInputs:[{ 
            identifier:'features',
			reference:{
				mimeType:"text/xml",
				href:"http://geoserver/wfs",
				method:"POST",
				body:{
					wfs:{
						version:"1.1.0",
						outputFormat:"GML2",
						typeName:nombreCapa,
						featureType:nombreCapa,
						identifier:nombreCapa
					}//wfs
				}//body
					  }//reference
           
		   }//dataInputs
		   ,
			{ 
			identifier:'clip',
			reference:{
				mimeType:'text/xml',
				subtype:'gml/3.1.1',
				href:"http://geoserver/wps",
				method:"POST",
				body:{
					//wps:{
						identifier:'JTS:buffer',
						dataInputs:[{ 
            identifier:'geom', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: punto
					}//complexData
					}//data
					,					
					complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
		     }}
					
				}//dataInputs
				,
			{ 
            identifier:'distance', 
            data: { 
			literalData:{
					value: distancia
				        }//literalData
				  }//data
		   }//distance
		   ], 
            responseForm:{ 
                    rawDataOutput:{ 
                        mimeType:"text/xml; subtype=gml/3.1.1", 
                        identifier:"result" 
						}//rawDataOutput	
						}//responseForm 
				//	}//wps
				}//body
			}//reference
		
					}//clip
					], 
        responseForm:{ 
			rawDataOutput:{ 
				mimeType:"application/json", 
                identifier:"result" 
                }//rawDataOutput
				}//responseForm 
		}//wpsFormat.write
		); 	
		
		return doc;
		
	},

	 /** Controlador de funcion para la interseccion de geometrias */
    borrar: function(evt) {
       
	     var line = evt.feature;
	     var poly;
		for (var i=this.layer.features.length-1; i>=0; --i) {
            poly = this.layer.features[i];
            if (poly !== line && poly.geometry.intersects(line.geometry)){
			this.layer.removeFeatures([poly]);
			this.layer.removeFeatures([line]);
			}}
    },
	
	muestraMenu: function(objeto){
			var arbol = Ext.getCmp('arbolCapas');
			var lugar=Ext.getCmp('lugaresCercanos');
			
			
		if(objeto.pressed){
			lugar.show();
			arbol.ownerCt.doLayout();
			
		}
		else {
			lugar.hide();
			arbol.ownerCt.doLayout();
		}
		
		
		
		
       
	
	}

});

Ext.preg(AreaInfluenciaBuffer.prototype.ptype, AreaInfluenciaBuffer);
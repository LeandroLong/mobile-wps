/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/Geometry.js
 * @require OpenLayers/Format/WPSExecute.js
 * @require OpenLayers/Format/WKT.js
 * @require OpenLayers/Control/GetFeature.js
 * @require OpenLayers/Proj4js.js
 * @require MostrarMenu.js
 */

var AreaInfluenciaDondeEstoy=Ext.extend(gxp.plugins.Tool,{
	
	ptype:"app_areainfluenciadondeestoy",
	
	 buffer: function(todo,cord,rango) {
		 
		 this.todo = todo;
		
		//Borra los poligonos dibujados
		for(var z=todo.layer.features.length-1; z>=0; --z){
			todo.layer.removeFeatures(todo.layer.features[z]);
		}	
		
		var wpsFormat= new OpenLayers.Format.WPSExecute(); 
		var posicion= new OpenLayers.Format.WKT();		    
		var puntoDondeEstoyInter = new Proj4js.Point(cord.longitude,cord.latitude);
		var puntoDondeEstoyGraf = new Proj4js.Point(cord.longitude,cord.latitude);
	
     // Definen en Proj4js los sistemas de coordenadas
		Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
		var destGraf = new Proj4js.Proj('EPSG:900913');
		Proj4js.defs["EPSG:22185"] = "+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
		Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
	    var destInter = new Proj4js.Proj('EPSG:22185');
		var fuente = new Proj4js.Proj('EPSG:4326');
	                     
			
	 // Convierte p desde el sistema de coordenadas 4326 a 22185 para realizar las intersecciones
		Proj4js.transform(fuente, destInter, puntoDondeEstoyInter);
		
	// Convierte p desde el sistema de coordenadas 4326 a 900913 para realizar las intersecciones
		Proj4js.transform(fuente, destGraf, puntoDondeEstoyGraf);
		
	 // Arma el punto que sera usado para calcular el buffer
		var puntoBufferInter="POINT("+puntoDondeEstoyInter.x+" "+""+puntoDondeEstoyInter.y+")";
		var puntoBufferGraf="POINT("+puntoDondeEstoyGraf.x+" "+""+puntoDondeEstoyGraf.y+")";
		
	 //	Recupera el rango seleccionado por el usuario
	 
	   var valor = parseInt(rango.split(" ",1));
		
	// Se arma el request para calcular el buffer para dibujar en el mapa
	    var doc2= wpsFormat.write({ 
        identifier: "JTS:buffer", 
        dataInputs:[{ 
            identifier:'geom', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: puntoBufferGraf}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
		     }}},
			{ 
            identifier:'distance', 
            data: { 
			literalData:{
					value: valor + (valor * 0.17) // sumamos 150 para que el dibuje se corresponda con la interseccion, es una cuestion de grafica 
				}
			}
		}], 
            responseForm:{ 
                    rawDataOutput:{ 
                        mimeType:"application/wkt", 
                        identifier:"result" 
                }}}); 
 		
		//Se ejecuta el servicio WPS para retornar un buffer para dibujar
		var bufferDibujar = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc2,
					headers: { "Content-Type": "text/xml;charset=utf-8" }, 
					async: false
            });
			
		//Se dibuja en el mapa el buffer calculado	
		var wkt = OpenLayers.Geometry.fromWKT(bufferDibujar.responseText);
		var mypolygon = new OpenLayers.Feature.Vector(wkt);
		this.todo.layer.addFeatures([mypolygon]);
		
		
		var i=0;
		var cantidadCapasVisibles = todo.map.layers.length; 
        var inter =0;
		
		var lugares = new Array();
		//var datosLugares = Array(3);
		for(i=0;i<cantidadCapasVisibles;i++){
			if(this.todo.map.layers[i].CLASS_NAME=="OpenLayers.Layer.WMS" && this.todo.map.layers[i].visibility){
		 // Recupera los datos de la capa en cuestion	
		
		 var doc = this.getConsulta(this.todo.map.layers[i].params.LAYERS,puntoBufferInter,valor);
		 
		 //Se ejecuta el servicio WPS para retornar un buffer de interseccion
		 var bufferInterseccion = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc,
					headers: { "Content-Type": "charset=application/json" }, 
					async: false
            });
		
			var documento = new OpenLayers.Format.GML();
			var featureAux = documento.read(bufferInterseccion.responseText);
			
			// Si tiene elementos para insertar en la ventana entra	
			if(featureAux.length>0){
				for (var j=0; j<featureAux.length; j++) {
		
					var datosLugares = new Array(2);
					if(featureAux[j].geometry!=null){
					datosLugares[0]=featureAux[j].data.nombre;
					datosLugares[1]=posicion.extractGeometry(featureAux[j].geometry);
					lugares.push(datosLugares);}
					
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
                header   : 'Destino', 
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
					this.dibujaRuta(puntoBufferInter,dv.initialConfig.store.data.items[record].json[1]);	
					},
					scope: this
			},
		
        stripeRows: true,
        autoExpandColumn: 'lugar',
        height: 400,
        width: 500
    });
			
		todo.panel = new Ext.Window({
	   
		title: "Lugares Cercanos a Usted",
        height: 400,
        width: 500,
		collapsible: true,
		maximizable: true,
		animCollapse: true,
		items: grid
				});
						
			if(todo.mostrarMenu){
		todo.mostrarMenu.removeOutput();
			}
		todo.mostrarMenu = new MostrarMenu();
		todo.mostrarMenu.addOutput(grid);
		},
	
	
	/** Funcion que recibe un punto de origen y un punto de destino para dibujar la ruta en Google Maps*/
	
	dibujaRuta: function(pOrigen,pDest) { 	
	
	var directionsDisplay = this.todo.directionsDisplay;

	var puntoOrigen = OpenLayers.Geometry.fromWKT(pOrigen); //22185
	var puntoDest = OpenLayers.Geometry.fromWKT(pDest);     //22185
	
	var puntoOrigenMap = new Proj4js.Point(puntoOrigen.x,puntoOrigen.y);
	var puntoDestinoMap = new Proj4js.Point(puntoDest.components[0].x,puntoDest.components[0].y);
	
	
	Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
	var origen1 = new Proj4js.Proj('EPSG:900913');
	Proj4js.defs["EPSG:22185"] = "+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
	var origen2 = new Proj4js.Proj('EPSG:22185');
	Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
	var destinoUnico = new Proj4js.Proj('EPSG:4326');
	
	Proj4js.transform(origen2, destinoUnico, puntoOrigenMap);
	Proj4js.transform(origen2, destinoUnico, puntoDestinoMap);
	
	
	var origen = {lat: puntoOrigenMap.y, lng: puntoOrigenMap.x};
	var destino = {lat: puntoDestinoMap.y, lng: puntoDestinoMap.x};

							
    // Los puntos deberan estar en EPSG: 4326 para que sean pasados por parametros a los servicios de Google Maps
	this.todo.directionsService.route({
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
					mimeType:"text/xml; subtype=gml/2.1.2", 
					value: punto
					}//complexData
					}//data
					,					
					complexData:{
			   default: {
				   format: "text/xml; subtype=gml/2.1.2"
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
                        mimeType:"text/xml; subtype=gml/2.1.2", 
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
				mimeType:"text/xml; subtype=wfs-collection/1.1",
				//mimeType:"application/json",
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
		for (var i=todo.layer.features.length-1; i>=0; --i) {
            poly = todo.layer.features[i];
            if (poly !== line && poly.geometry.intersects(line.geometry)){
			todo.layer.removeFeatures([poly]);
			todo.layer.removeFeatures([line]);
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
		}}});


Ext.preg(AreaInfluenciaDondeEstoy.prototype.ptype,AreaInfluenciaDondeEstoy);
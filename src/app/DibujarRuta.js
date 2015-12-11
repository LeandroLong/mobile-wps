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

 
var DibujarRuta = Ext.extend(gxp.plugins.Tool, {

    ptype: 'app_dibujarruta',
    
    /** Inicio del plugin */
    init: function(target) {
        DibujarRuta.superclass.init.apply(this, arguments);
		
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
			
			/**		Inicio prueba	*/
			this.preview = new Ext.Panel({
        id: 'preview',
        region: 'south',
        cls:'preview',
        autoScroll: true,

        tbar: [{
            id:'tab',
            text: 'View in New Tab',
            iconCls: 'new-tab',
            disabled:true,
            scope: this
        },
        '-',
        {
            id:'win',
            text: 'Go to Post',
            iconCls: 'new-win',
            disabled:true,
            scope: this
        }],

        clear: function(){
            this.body.update('');
            var items = this.topToolbar.items;
            items.get('tab').disable();
            items.get('win').disable();
        }
    });
	
		/**  Fin Prueba */
			// Inicio de agregacion de ACCIONES
            this.addActions([
			
			//Acción para la probar WFS
                    new GeoExt.Action(Ext.apply({
                    text: 'Area de Influencia: ',
					handler: this.muestraMenu.createDelegate(this, []),
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
						store: ['200 mts', '350 mts', '500 mts', '1000 mts', '1500 mts', '2000 mts'],
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
	   
		
		
		var wpsFormat= new OpenLayers.Format.WPSExecute(); 
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
	 
	   var rango = this.output[0].lastSelectionText;
	   var valor = parseInt(rango.split(" ",1));
	  // alert(valor);
	 
	 // Se arma el request para calcular el buffer para interseccion
	    var doc1= wpsFormat.write({ 
        identifier: "JTS:buffer", 
        dataInputs:[{ 
            identifier:'geom', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: puntoBuffer}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
		     }}},
			{ 
            identifier:'distance', 
            data: { 
			literalData:{
					value: valor // este valor debera ser reemplazadado por uno que ingrese el usuario
				}
			}
		}], 
            responseForm:{ 
                    rawDataOutput:{ 
                        mimeType:"application/wkt", 
                        identifier:"result" 
                }} 
		}); 
		
		
		// Se arma el request para calcular el buffer para dibujar en el mapa
	    var doc2= wpsFormat.write({ 
        identifier: "JTS:buffer", 
        dataInputs:[{ 
            identifier:'geom', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: posicion.extractGeometry(evt.feature.geometry)}},
		   complexData:{
			   default: {
				   format: "text/xml; subtype=gml/3.1.1"
		     }}},
			{ 
            identifier:'distance', 
            data: { 
			literalData:{
					value: valor + (valor * 0.15) // sumamos 150 para que el dibuje se corresponda con la interseccion, es una cuestion de grafica 
				}
			}
		}], 
            responseForm:{ 
                    rawDataOutput:{ 
                        mimeType:"application/wkt", 
                        identifier:"result" 
                }}}); 
 
		//Se ejecuta el servicio WPS para retornar un buffer de interseccion
		var bufferInterseccion = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc1,
					headers: { "Content-Type": "text/xml;charset=utf-8" }, 
					async: false
            });
			
			
		//Se ejecuta el servicio WPS para retornar un buffer para dibujar
		var bufferDibujar = OpenLayers.Request.POST({
                    url: "geoserver/wps",
                    data: doc2,
					headers: { "Content-Type": "text/xml;charset=utf-8" }, 
					async: false
            });
			
		//Se dibuja en el mapa el buffer calculado	
		var mypolygon = new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT(bufferDibujar.responseText));
		this.layer.addFeatures([mypolygon]);
		
		
		var i=0;
		var cantidadCapasVisibles = this.map.layers.length; 
        var inter =0;
		
		var lugares = new Array();
		//var datosLugares = Array(3);
		for(i=0;i<cantidadCapasVisibles;i++){
			if(this.map.layers[i].CLASS_NAME=="OpenLayers.Layer.WMS" && this.map.layers[i].visibility){
		 // Recupera los datos de la capa en cuestion	
			var arregloWfs = this.wfs(this.map.layers[i].name);
		
		//	Para cada capa visible busca la interseccion con el buffer
		    for (var j=0; j<arregloWfs.length; j++) {
				if(this.verIntersecciones(arregloWfs[j][1],bufferInterseccion.responseText)){
					var datosLugares = new Array(1);
					datosLugares[0]= arregloWfs[j][0];
					datosLugares[1]= arregloWfs[j][1];
					lugares.push(datosLugares);
					
				//	alert(arregloWfs[j][0] + arregloWfs[j][1]);
					
					//this.dibujaRuta(p,arregloWfs[j][1]);
																							}
													}
			
											}
									}
	
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
                    tooltip: 'Click para ver la ruta...',
                    handler: function(grid, rowIndex,mapaMio,directionsDisplay,panel) {
						
                        
                    }
                }]
            }
			],
			
			
				listeners : {
					cellclick: function(dv, record, item, index, e) {
						this.dibujaRuta(1,1);
				}},
		
        stripeRows: true,
        autoExpandColumn: 'lugar',
        height: 400,
        width: 500
    });
	
	// grid.render(Ext.getBody());
	
	/**Hasta acaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa*/

		this.panel = new Ext.Window({
	   
		title: "Lugares Cercanos a Usted",
        height: 400,
        width: 500,
		collapsible: true,
		maximizable: true,
		animCollapse: true,
		items: grid
				});
						
						
		this.panel.show();


						
									
		/** UNA VEZ CALCULADOS TODOS LOS PUNTOS QUE SE INTERSECAN CON EL BUFFER, SE DEBERIA MOSTRAR POR POPUP
		    DICHOS PUNTOS Y DEJAR QUE EL USUARIO ELIJA ALGUN PUNTO Y DAR LA OPCION DE CALCULAR LA RUTA*/							
		
		},
		
		prueba: function() { 
		
		
		 var preview = this.preview;
            var right = Ext.getCmp('right-preview');
            var bot = Ext.getCmp('bottom-preview');
           // var btn = this.grid.getTopToolbar().items.get(2);
            
                    bot.hide();
                    right.add(preview);
                    right.show();
                    right.ownerCt.doLayout();
                    btn.setIconClass('preview-right');
               
		
		},
	
	
	
	dibujaRuta: function(pOrigen,pDest) { 	
	
	DibujarRuta.superclass.init.apply(this, arguments);
	
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
		
	/** Funcion que verifica la interseccion del punto con el buffer, retorna true si interseca. */
	verIntersecciones: function(punto,buffer) {
				
		var mipunto = OpenLayers.Geometry.fromWKT(punto);
	    var mibuffer=OpenLayers.Geometry.fromWKT(buffer);
				
		var respuesta = mibuffer.intersects(mipunto);
		
		if(respuesta){
		return true;}			
		return false;
		
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
    } ,
	
	muestraMenu: function() {
	// aca deberia mostrar el panel oculto
	
	//alert("hola");
	//var right = Ext.getCmp('panel');
	//right.show();
	
	
    }

});
Ext.preg(DibujarRuta.prototype.ptype, DibujarRuta);
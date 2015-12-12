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

 
var DondeEstoy = Ext.extend(gxp.plugins.Tool, {

    ptype: 'app_dondeestoy',
    
    /** Inicio del plugin */
    init: function(target) {
		
		this.cord;
			var options = {
			enableHighAccuracy: false,
			timeout: 5000,
			maximumAge: 0
			};

			function success(pos) {
			cord = pos.coords;
			
				};

			function error(err) {
			console.warn('ERROR: No se pudo calcular su ubicación!');
			alert(err.message);
				};

			navigator.geolocation.getCurrentPosition(success, error, options);
			
        DondeEstoy.superclass.init.apply(this, arguments);
		
		
		
			
		    this.map = target.mapPanel.map;
		//	this.lugares = DondeEstoy.superclass.constructor.call(this,target.portalConfig.items[2].items[1]); 
							  
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
                    text: 'Donde Estoy?',
					handler: this.muestraMenu.createDelegate(this),
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer,OpenLayers.Handler.Point, {
                        eventListeners: {
                            featureadded: this.dondeEstoy,
							scope: this
                        }
                    })
                }, actionDefaults))					
				
				
            ]); // Fin de agregación de ACCIONES
			
		
        }, this);
    },
	
	// Proceso que ejecuta un BUFFER
    buffer: function(evt) {
		
								
		
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
		
		
		
		 Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
		 Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
		 var origen = new Proj4js.Proj('EPSG:4326');
		 var destino = new Proj4js.Proj('EPSG:900913');
		 
				
		var puntoBuffer = new Proj4js.Point(cord.longitude,cord.latitude);
		
		Proj4js.transform(origen, destino, puntoBuffer);
		
		
		var miPunto="POINT("+puntoBuffer.x+" "+""+puntoBuffer.y+")";
		var wkt = OpenLayers.Geometry.fromWKT(miPunto);
		var mypolygon = new OpenLayers.Feature.Vector(wkt);
		this.layer.addFeatures([mypolygon]);
		
						 						 
		 var puntoCentro = cord;
		
		 
		 Proj4js.transform(origen, destino, puntoCentro);
				 
		 //Crea un punto donde va a centrar el mapa una vez que dibuje la ruta
		 var pixel = new OpenLayers.LonLat(puntoCentro.x,puntoCentro.y);
		 //Centra el mapa al punto especificado
		 this.map.moveTo(pixel,15,true);
	
	}

});

Ext.preg(DondeEstoy.prototype.ptype, DondeEstoy);
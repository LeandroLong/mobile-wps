/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/Geometry.js
 * @require OpenLayers/Format/WKT.js
 * @require OpenLayers/Control/GetFeature.js
 * @require OpenLayers/Proj4js.js
 * @require AreaInfluenciaDondeEstoy.js
 */

 
var DondeEstoy = Ext.extend(gxp.plugins.Tool, {

    ptype: 'app_dondeestoy',
    
    /** Inicio del plugin */
    init: function(target) {
		DondeEstoy.superclass.init.apply(this, arguments);
			
		
					
			var options = {
			enableHighAccuracy: false,
			timeout: 950,
			maximumAge: 0
			};

			function success(pos) {
			cord = pos.coords;
			
				};

			function error(err) {
			
			alert('ERROR: No se pudo calcular su ubicación!');
			return;
				};

			navigator.geolocation.getCurrentPosition(success, error, options);
			
       			
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
			
			        new GeoExt.Action(Ext.apply({
                    text: 'Donde Estoy?',
					handler: this.muestraMenu.createDelegate(this),
                    control: new OpenLayers.Control()
                }, actionDefaults))
            ]); // Fin de agregación de ACCIONES
			
			
			var comboDE = new Ext.form.ComboBox({
						emptyText:'Seleccione un rango..',
						typeAhead: true,
						editable: false,
						store: ['200 mts', '350 mts', '500 mts', '1000 mts', '1500 mts', '2000 mts','3000 mts','5000 mts','6000 mts'],
						triggerAction: 'all',
						mode: 'local',
						width: 80,
						forceSelection: true,
						hidden: true,
					    selectOnFocus: true,
						listeners: {
							select: function(comboDE, selection) {
							this.buffer(this,cord,selection.data.field1);
									},
							scope: this
						}
					});
			
			this.addOutput(comboDE);		
        }, this);
    },
	
	// Proceso que ejecuta un BUFFER
    buffer: function(todo,cord,selection) {
		
		
	
		var area = new AreaInfluenciaDondeEstoy();
		area.buffer(todo,cord,selection);
				
		},
	
	
	muestraMenu: function(objeto){
		
		
		if(typeof cord === 'undefined'){
			
			 window.setTimeout(function () {
				 
				 
				 var options = {
			enableHighAccuracy: false,
			timeout: 1950,
			maximumAge: 0
			};

			function success(pos) {
			cord = pos.coords;
			
				};

			function error(err) {
			
			alert('ERROR: No se pudo calcular su ubicación, Recargue la Página!');
				};

			navigator.geolocation.getCurrentPosition(success, error, options);
						 
						 
						 },'2000');
		}
		
		//Borra los poligonos dibujados
		for(var z=this.layer.features.length-1; z>=0; --z){
			this.layer.removeFeatures(this.layer.features[z]);
		}
			
		var arbol = Ext.getCmp('arbolCapas');
		var lugar=Ext.getCmp('lugaresCercanos');
			
			
		if(objeto.pressed){
			
			 Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
			 Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
			 var origen = new Proj4js.Proj('EPSG:4326');
			 var destino = new Proj4js.Proj('EPSG:900913');
		     
			 var puntoBuffer = new Proj4js.Point(cord.longitude,cord.latitude);
		
		Proj4js.transform(origen, destino, puntoBuffer);
		
		//Crea un punto donde va a centrar el mapa una vez que dibuje la ruta
		 var pixel = new OpenLayers.LonLat(puntoBuffer.x,puntoBuffer.y);
		 //Centra el mapa al punto especificado
		 this.map.moveTo(pixel,15,true);
		
		
		var miPunto="POINT("+puntoBuffer.x+" "+""+puntoBuffer.y+")";
		var wkt = OpenLayers.Geometry.fromWKT(miPunto);
		var mypolygon = new OpenLayers.Feature.Vector(wkt);
		this.layer.addFeatures([mypolygon]);
			
		
		 
		 
		lugar.show();
		arbol.ownerCt.doLayout();
		
		this.output[0].setVisible(true);
			
		}
		else {
			lugar.hide();
			arbol.ownerCt.doLayout();
			this.output[0].setVisible(false);
		}
		
		
	}

});

Ext.preg(DondeEstoy.prototype.ptype, DondeEstoy);
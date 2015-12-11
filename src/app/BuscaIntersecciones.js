/**
 * @requires plugins/Tool.js
 * @requires BuscaInterseccionesComboBox.js
 * @requires OpenLayers/Format/WPSExecute.js
 * @requires OpenLayers/Format/WKT.js
 */

var BuscaIntersecciones = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_googlegeocoder */
    ptype: "app_intersecciones",

    /** api: config[updateField]
     *  ``String``
     *  If value is specified, when an item is selected in the combo, the map
     *  will be zoomed to the corresponding field value in the selected record.
     *  If ``null``, no map navigation will occur.  Valid values are the field
     *  names described for the :class:`gxp.form.GoogleGeocoderComboBox`.
     *  Default is "viewport".
     */
    updateField: "viewport",
    
    init: function(target) {
		
        var combo = new BuscaInterseccionesComboBox(Ext.apply({
            listeners: {
                select: this.onComboSelect,
                scope: this
            }
        }, this.outputConfig));
        
        var bounds = target.mapPanel.map.restrictedExtent;
        this.combo = combo;
		combo=null;
		
        
       BuscaIntersecciones.superclass.init.apply(this, arguments);

    },

    //Retorna el combobox que se plasma en la ventana inicial
    addOutput: function(config) {
        return BuscaIntersecciones.superclass.addOutput.call(this, this.combo);
    },
    
    /** private: method[onComboSelect]
     *  Aca entra cuando seleccionaste una calle
     */
    onComboSelect: function(combo, record) {
	   
	   
	   var calleCoordenada = new Array(2);
	   var listaCalleSeleccionada = new Array();
	   var listaCallesIntersect = new Array();
	   var wpsFormat= new OpenLayers.Format.WPSExecute(); 
	   var calleAux= new OpenLayers.Format.WKT();
	   var calle1;
	   var calle2;
	   var z=0;
	   for(var i=0; i<combo.feature.length;i++){
		   if(combo.feature[i][0].toLowerCase()== record.data.address.toLowerCase() ){
			    var calleCoordenada = new Array(2); 
				calleCoordenada[0]=combo.feature[i][0];
				calleCoordenada[1]=combo.feature[i][1];
				listaCalleSeleccionada.push(calleCoordenada);
				
		   }
	   }
	   
	   
	   for(var i=0; i< listaCalleSeleccionada.length;i++){
		   var j = i+1;
		    while(j< listaCalleSeleccionada.length){
				
				if(listaCalleSeleccionada[i]==undefined){
					j=listaCalleSeleccionada.length;
				}
				else if(listaCalleSeleccionada[j]==undefined){
					j++;
				}
					else if(this.verInterseccion(listaCalleSeleccionada[i][1],listaCalleSeleccionada[j][1])){
						delete listaCalleSeleccionada[i];
						delete listaCalleSeleccionada[i];
						j=listaCalleSeleccionada.length;
					}
					else j++;
				
			}
	   }
	   
	   
	   
	   for(var i=listaCalleSeleccionada.length-1;i>0;i--){
		   for(var j=combo.feature.length-1; j>0;j--){
			   z++;
			// if((combo.feature[j].data.nombre.toLowerCase()!=(record.data.address.toLowerCase())) && (listaCallesIntersect.indexOf(combo.feature[j].data.nombre) == -1)){
				
				
			//	  calle1 = calleAux.extractGeometry(listaCalleSeleccionada[i][1]);
				//  calle2 = calleAux.extractGeometry(combo.feature[j].geometry);
			      z++;
				//  listaCallesIntersect.push(combo.feature[j].data.nombre);
		
			//	}
	      }		   	   
	   }
	   alert(z);
    
    },
	
	 verInterseccion: function(elementoI,elementoJ) {

	   var wpsFormat= new OpenLayers.Format.WPSExecute(); 
   
	    var doc= wpsFormat.write({ 
        identifier: "JTS:intersects", 
        dataInputs:[{ 
            identifier:'a', 
            data:{ 
                complexData:{
					mimeType:"application/wkt", 
					value: elementoI
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
					value: elementoJ
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
	     
       
		return  respuesta.responseText;

}});

Ext.preg(BuscaIntersecciones.prototype.ptype, BuscaIntersecciones);
/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 * @require OpenLayers/Geometry.js
 */

var ConvertirSeleccionables = Ext.extend(gxp.plugins.Tool, {
ptype: 'app_convertir',
init: function(target) {
    
ConvertirSeleccionables.superclass.init.apply(this, arguments);    
var map = this.target.mapPanel.map;


map.events.on({
addlayer: this.raiseLayer,
scope: this
});

// Add action buttons when the viewer is ready
target.on('ready', function() {
var actionDefaults = {
map: target.mapPanel.map,
enableToggle: true,
toggleGroup: this.ptype,
allowDepress: true
};
this.addActions([
new GeoExt.Action({
text: 'Convertir Capas',
handler:function(evt) {
var me = this;
var capa1,capa2,layer1, layer2, nombre1, nombre2, fin;
fin = 0;
//nombre1 = prompt("Por favor Introduce el nombre de la PRIMERA capa para convertirla en seleccionable","");
if (true){
//nombre2 = prompt("Por favor Introduce el nombre de la SEGUNDA capa para convertirla en seleccionable","");
if(true){
	this.layer = target.getLayerRecordFromMap({
                name: 'Idesf:calles',
                source: 'local'
            }).getLayer();

alert(layer.RESOLUTION_PROPERTIES);


}
else { fin =2}
}
else{fin = 1 }
if (fin == 0){
if (capa1.length != 0 && capa2.length != 0){
	alert(nombre1);
	alert(nombre2);
//document.capauno="Selection "+nombre1;
//document.capados="Seleccion "+nombre2;
layer1= new OpenLayers.Layer.WMS(
nombre1,"http://localhost:8080/geoserver/wms",
{layers: 'europe:'+nombre1, transparent: true,
isBaseLayer:false }
);
select = new OpenLayers.Layer.Vector("Seleccion "+nombre1,
{styleMap:
new
OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
});
map.addLayers([layer1, select]);
control = new OpenLayers.Control.GetFeature({
protocol: OpenLayers.Protocol.WFS.fromWMSLayer(layer1),
box: true,
hover: false,
//toggle:false,
//multiple: false,
clickout: true,
multipleKey: "shiftKey",
toggleKey: "ctrlKey"

});
control.events.register("featureselected", this, function(e) {
if(!map.getLayersByName('Selection '+nombre2)[0].features.length) {
//alert(map.getLayersByName("Selection Nucleos Urbanos")[0].features.length);
select.addFeatures([e.feature]);
//alert(map.getLayersByName("Selection")[0].features[0].id);
}
});
control.events.register("featureunselected", this, function(e) {
//alert("pais") ;
select.removeFeatures([e.feature]);
});
map.addControl(control);
control.activate();
///////////////////////////////////////////////////////////////////////////////////////////
layer2= new OpenLayers.Layer.WMS(
nombre2,"http://localhost:8080/geoserver/wms",
{layers: 'europe:'+nombre2, transparent: true,
isBaseLayer:false }
);
select2 = new OpenLayers.Layer.Vector("Seleccion "+nombre2,
{styleMap:
new
OpenLayers.Style(OpenLayers.Feature.Vector.style["select"])
});
map.addLayers([layer2, select2]);
control2 = new OpenLayers.Control.GetFeature({
protocol: OpenLayers.Protocol.WFS.fromWMSLayer(layer2),
box: true,
hover: false,
//toggle:false,
//multiple: false,
clickout: true,
multipleKey: "shiftKey",
toggleKey: "ctrlKey"
});
control2.events.register("featureselected", this, function(e) {
//alert(map.getLayersByName("Selection Nucleos Urbanos")[0].features.length);
select2.addFeatures([e.feature]);
//alert(map.getLayersByName("Selection")[0].features[0].id);
});
control2.events.register("featureunselected", this, function(e) {
//alert("pais") ;
select2.removeFeatures([e.feature]);
});
map.addControl(control2);
control2.activate();
map.removeLayer(capa1[0]);
map.removeLayer(capa2[0]);
}
else {alert('ERROR: nombre de la capa incorrecto');}

}
}
},actionDefaults)
]);
}, this); // Fin del target.on
}});

Ext.preg(ConvertirSeleccionables.prototype.ptype, ConvertirSeleccionables);
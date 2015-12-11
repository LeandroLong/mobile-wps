/**
 * Add all your dependencies here.
 *
 * @require widgets/Viewer.js
 * @require plugins/LayerTree.js
 * @require plugins/OLSource.js
 * @require plugins/OSMSource.js
 * @require plugins/WMSCSource.js
 * @require plugins/ZoomToExtent.js
 * @require plugins/NavigationHistory.js
 * @require plugins/Zoom.js
 * @require plugins/AddLayers.js
 * @require plugins/RemoveLayer.js
 * @require OpenLayers/Layer/Vector.js
 * @require OpenLayers/Renderer/Canvas.js
 * @require OpenLayers/Renderer/VML.js
 * @require GeoExt/widgets/ZoomSlider.js
 * @require RowExpander.js
 * @require plugins/GoogleSource.js
 * @require BuscaIntersecciones.js
 * @require WPSDemoDePrueba.js
 * @require AreaInfluencia.js
 * @require plugins/WMSGetFeatureInfo.js
 * @require plugins/GoogleGeocoder.js
 * @require plugins/FeatureGrid.js
 * @require plugins/FeatureManager.js
 * @require plugins/SnappingAgent.js
 * @require plugins/FeatureEditor.js
 * @require MostrarMenu.js
 * @require plugins/Legend.js
 * @require AreaInfluenciaMobile.js

 */


 
 var dispositivo = navigator.userAgent.toLowerCase();
 
 
 
 
 if( dispositivo.search(/iphone|ipod|ipad|android|chrome|mozilla/) > -1 ){
     var app = new gxp.Viewer({
    portalConfig: {
        layout: "border",
        region: "center",
        
        // by configuring items here, we don't need to configure portalItems
        // and save a wrapping container
        items: [{
            id: "panelsuperior",
            xtype: "container",
            layout: "fit",
            region: "north",
            border: false,
			height: 97
        },{
            id: "panelcentral",
            xtype: "panel",
            layout: "fit",
            region: "center",
            border: 1,
            items: ["mymap"]
        }, {
    id: "paneleste",
    xtype: "container",
    layout: "vbox",
    region: "west",
    width: 270,
    defaults: {
        width: "100%",
        layout: "fit"
    },
    items: [{
        title: "Arbol de Capas",
        id: "arbolCapas",
        border: false,
        flex: 1
    }, {
		title: "Lugares cercanos a Usted",
        id: "lugaresCercanos",
        height: 270,
		hidden: true,
		outputTarget: "lugaresCercanos"
    }]
			}],
        bbar: {id: "mybbar"}
    },
    
    // configuration of all tool plugins for this application
    tools: [{
        ptype: "gxp_layertree",
        outputConfig: {
            id: "tree",
            border: true,
            tbar: [] // Los botones se agregaran en "tree.bbar" posteriormente
        },
        outputTarget: "arbolCapas"
    }, {
        ptype: "gxp_addlayers",
        actionTarget: "tree.tbar"
    }, {
        ptype: "gxp_removelayer",
        actionTarget: ["tree.tbar", "tree.contextMenu"]
    },
	{ ptype: "app_areainfluenciamobile",outputTarget: "map.tbar"},
	{ ptype: "app_mostrarmenu", outputTarget: "lugaresCercanos"}
	],
    
    // layer sources
    sources: {
        local: {
            ptype: "gxp_wmscsource",
            url: "/geoserver/wms",
            version: "1.1.1"
        },
        osm: {
            ptype: "gxp_osmsource"
        },
		google: {
			ptype: "gxp_googlesource"
} ,
        ol: { ptype: "gxp_olsource" }
    },
    
    // map and layers
    map: {
        id: "mymap", // id needed to reference map in portalConfig above
        title: "Mapa",
        projection: "EPSG:900913",
        center: [-6755000.758211, -3715572.3184791],
        zoom: 12,
        layers: [
			{	
            source: "google",
            name: "SATELLITE",
            group: "background"
        }, 
		{
            // Capa Vector para mostrar nuestras geometrias y los resultados del procesamiento
            source: "ol",
            name: "sketch",
            type: "OpenLayers.Layer.Vector",
			selected: true,
			projection: "EPSG:4326"
        },
		{
            // Capa calles    ---   Son capas SHP
            source: "local",
            name: "Idesf:hospitales",
			selected: true,
			visibility: true
        },
		{
            // Capa calles   ---   Son capas SHP
            source: "local",
            name: "Idesf:comisarias",
			selected: true,
			visibility: true
        },
		{
            // Capa calles   ---   Son capas SHP
            source: "local",
            name: "Idesf:escuelas",
			selected: false,
			visibility: false
        }],
        items: [{
            xtype: "gx_zoomslider",
            vertical: true,
            height: 100
        }]
    }

}); }
else
{
 
var app = new gxp.Viewer({
    portalConfig: {
        layout: "border",
        region: "center",
        
        // by configuring items here, we don't need to configure portalItems
        // and save a wrapping container
        items: [{
            id: "panelsuperior",
            xtype: "container",
            layout: "fit",
            region: "north",
            border: false,
			height: 97
        },{
            id: "panelcentral",
            xtype: "panel",
            layout: "fit",
            region: "center",
            border: 1,
            items: ["mymap"]
        }, {
    id: "paneleste",
    xtype: "container",
    layout: "vbox",
    region: "west",
    width: 270,
    defaults: {
        width: "100%",
        layout: "fit"
    },
    items: [{
        title: "Arbol de Capas",
        id: "arbolCapas",
        border: false,
        flex: 1
    }, {
		title: "Lugares cercanos a Usted",
        id: "lugaresCercanos",
        height: 270,
		hidden: true,
		outputTarget: "lugaresCercanos"
    }]
			}],
        bbar: {id: "mybbar"}
    },
    
    // configuration of all tool plugins for this application
    tools: [{
        ptype: "gxp_layertree",
        outputConfig: {
            id: "tree",
            border: true,
            tbar: [] // Los botones se agregaran en "tree.bbar" posteriormente
        },
        outputTarget: "arbolCapas"
    }, {
        ptype: "gxp_addlayers",
        actionTarget: "tree.tbar"
    }, {
        ptype: "gxp_removelayer",
        actionTarget: ["tree.tbar", "tree.contextMenu"]
    },
	{ ptype: "app_areainfluencia",outputTarget: "map.tbar"},
	{ ptype: "app_mostrarmenu", outputTarget: "lugaresCercanos"}
	],
    
    // layer sources
    sources: {
        local: {
            ptype: "gxp_wmscsource",
            url: "/geoserver/wms",
            version: "1.1.1"
        },
        osm: {
            ptype: "gxp_osmsource"
        },
		google: {
			ptype: "gxp_googlesource"
} ,
        ol: { ptype: "gxp_olsource" }
    },
    
    // map and layers
    map: {
        id: "mymap", // id needed to reference map in portalConfig above
        title: "Mapa",
        projection: "EPSG:900913",
        center: [-6755000.758211, -3715572.3184791],
        zoom: 12,
        layers: [
			{	
            source: "google",
            name: "SATELLITE",
            group: "background"
        }, 
		{
            // Capa Vector para mostrar nuestras geometrias y los resultados del procesamiento
            source: "ol",
            name: "sketch",
            type: "OpenLayers.Layer.Vector",
			selected: true,
			projection: "EPSG:4326"
        },
		{
            // Capa calles    ---   Son capas SHP
            source: "local",
            name: "Idesf:hospitales",
			selected: false,
			visibility: false
        },
		{
            // Capa calles   ---   Son capas SHP
            source: "local",
            name: "Idesf:comisarias",
			selected: true,
			visibility: true
        },
		{
            // Capa calles   ---   Son capas SHP
            source: "local",
            name: "Idesf:escuelas",
			selected: true,
			visibility: true
        }],
        items: [{
            xtype: "gx_zoomslider",
            vertical: true,
            height: 100
        }]
    }

});
}

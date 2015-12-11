/**
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Format.js
 * @requires OpenLayers/Request.js
 * @requires OpenLayers/Layer/WMS.js
 * @requires OpenLayers/Layer/MapServer.js
 * @requires OpenLayers/Tile.js
 * @requires OpenLayers/Request/XMLHttpRequest.js
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Layer/Markers.js
 * @requires OpenLayers/Console.js
 * @requires OpenLayers/Lang.js
 * @requires OpenLayers/Feature.js
 * @requires OpenLayers/Layer/EventPane.js
 * @requires OpenLayers/Layer/FixedZoomLevels.js
 * @requires OpenLayers/Layer/SphericalMercator.js
 * @requires OpenLayers/Protocol.js
 * @requires OpenLayers/Format/JSON.js
 * @requires OpenLayers/Format/WKT.js
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Geometry.js
 * @requires OpenLayers/Renderer/Elements.js
 * @requires OpenLayers/Popup/Anchored.js
 * @requires Rico/Corner.js
 */
OpenLayers.Parse = OpenLayers.Parse || {};

	
OpenLayers.Parse.parseXMLString= function(text) {

    //MS sucks, if the server is bad it dies
    var index = text.indexOf('<');
    if (index > 0) {
        text = text.substring(index);
    }

    var ajaxResponse = OpenLayers.Util.Try(
        function() {
            var xmldom = new ActiveXObject('Microsoft.XMLDOM');
            xmldom.loadXML(text);
            return xmldom;
        },
        function() {
            return new DOMParser().parseFromString(text, 'text/xml');
        },
        function() {
            var req = new XMLHttpRequest();
            req.open("GET", "data:" + "text/xml" +
                     ";charset=utf-8," + encodeURIComponent(text), false);
            if (req.overrideMimeType) {
                req.overrideMimeType("text/xml");
            }
            req.send(null);
            return req.responseXML;
        }
    );

    return ajaxResponse;
};
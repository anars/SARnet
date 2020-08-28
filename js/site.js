window.onload = function () {

    const maxBounds = L.latLngBounds(
        L.latLng(23, -73), //Southwest
        L.latLng(33, -93) //Northeast
    );

    const map = L.map("map");
    L.tileLayer(
        "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5hcnMiLCJhIjoiY2tlZGowaHY1MDFldTJ6b3oyeW9pNTN2bSJ9.jIFUKXstg5M4vuD6_KuNyg", {
            minZoom: 7,
            maxZoom: 18,
            attribution: "Map data, Imagery &copy; <a href=\"https://www.openstreetmap.org\">OpenStreetMap</a>, <a href=\"https://www.mapbox.com\">Mapbox</a> and contributors. <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>",
            id: "mapbox/outdoors-v11",
            tileSize: 512,
            zoomOffset: -1,
            center: [0, 0],
            zoom: 0,
            maxBounds,
        }).addTo(map);
    map.setMaxBounds(maxBounds);
    map.fitBounds(maxBounds);

    function polystyle(feature) {
        return {
            //fillColor: 'blue',
            weight: 2,
            fillOpacity: 0
        };
    }

    map.createPane("labels");
    // This pane is above markers but below popups
    map.getPane("labels").style.zIndex = 650;

    // Layers in this pane are non-interactive and do not obscure mouse/touch events
    map.getPane("labels").style.pointerEvents = "none";

    L.geoJson(floridaCounties, {
        style: polystyle
    }).addTo(map).eachLayer(function (layer) {
        layer.bindPopup(layer.feature.properties.name + " County");
    });

    function onLocationFound(e) {
        var radius = e.accuracy / 2;
        L.marker(e.latlng).addTo(map)
            .bindPopup("You are within " + radius + " meters from this point").openPopup();
        L.circle(e.latlng, radius).addTo(map);
    }

    function onLocationError(error) {
        // alert(error.message);
        // console.error(error);
    }

    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);

    // map.locate({
    //     setView: true,
    //     maxZoom: 16
    // });
};
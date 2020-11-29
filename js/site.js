window.onload = function () {
    const onair = L.layerGroup();
    const onairIcon = L.icon({
        iconUrl: "images/onair-no-shadow-normal.png",
        shadowUrl: "images/shadow.png",
        iconSize: [32, 32],
        shadowSize: [32, 32],
        iconAnchor: [16, 16],
        shadowAnchor: [16, 16],
        popupAnchor: [0, 0]
    });
    const offair = L.layerGroup();
    const offairIcon = L.icon({
        iconUrl: "images/offair-no-shadow-normal.png",
        shadowUrl: "images/shadow.png",
        iconSize: [32, 32],
        shadowSize: [32, 32],
        iconAnchor: [16, 16],
        shadowAnchor: [16, 16],
        popupAnchor: [0, 0]
    });
    const planned = L.layerGroup();
    const plannedIcon = L.icon({
        iconUrl: "images/planned-no-shadow-normal.png",
        shadowUrl: "images/shadow.png",
        iconSize: [32, 32],
        shadowSize: [32, 32],
        iconAnchor: [16, 16],
        shadowAnchor: [16, 16],
        popupAnchor: [0, 0]
    });
    const mapURL = "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5hcnMiLCJhIjoiY2tlZGowaHY1MDFldTJ6b3oyeW9pNTN2bSJ9.jIFUKXstg5M4vuD6_KuNyg";
    const attribution = "Map data, Imagery &copy; <a href=\"https://www.openstreetmap.org\">OpenStreetMap</a>, <a href=\"https://www.mapbox.com\">Mapbox</a> and contributors. <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>";
    const layerLight = L.tileLayer(mapURL, {
            id: 'mapbox/light-v10',
            tileSize: 512,
            zoomOffset: -1,
            attribution
        }),
        layerDark = L.tileLayer(mapURL, {
            id: 'mapbox/dark-v10',
            tileSize: 512,
            zoomOffset: -1,
            attribution
        }),
        layerStreets = L.tileLayer(mapURL, {
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            attribution
        }),
        layerOutdoors = L.tileLayer(mapURL, {
            id: 'mapbox/outdoors-v11',
            tileSize: 512,
            zoomOffset: -1,
            attribution
        }),
        layerSatellite = L.tileLayer(mapURL, {
            id: 'mapbox/satellite-streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            attribution
        });

    const maxBounds = L.latLngBounds(
        L.latLng(38, -94), // Nortwest
        L.latLng(15, -70) // Southeast
    );
    const fitBounds = L.latLngBounds(
        L.latLng(31, -84), // Nortwest
        L.latLng(24, -80) // Southeast
    );
    SARnetStatus.forEach((site) => {
        L.marker([site.latitude, site.longitude], {
            "icon": !site.built ? plannedIcon : (site.status === "On-Air" ? onairIcon : offairIcon)
        }).bindPopup(`
        <table>
        <tr><td><strong>Name</strong></td><td><strong>:</strong></td><td>${site.site_name}</td></tr>
        <tr><td><strong>Label</strong></td><td><strong>:</strong></td><td>${site.memory_label}</td></tr>
        <tr><td><strong>Status</strong></td><td><strong>:</strong></td><td>${site.status}</td></tr>
        <tr><td><strong>Frequency</strong></td><td><strong>:</strong></td><td>${site.frequency} Mhz</td></tr>
        <tr><td><strong>Offset</strong></td><td><strong>:</strong></td><td>${site.duplex}${site.offset} Mhz</td></tr>
        <tr><td><strong>Tone</strong></td><td><strong>:</strong></td><td>${site.tone_frequency} Hz</td></tr>
        <tr><td><strong>Type</strong></td><td><strong>:</strong></td><td>${site.type}</td></tr>
        <tr><td><strong>Built</strong></td><td><strong>:</strong></td><td>${site.built ? "Yes" : "No"}</td></tr>
        <tr><td><strong>Latitude</strong></td><td><strong>:</strong></td><td>${site.latitude}</td></tr>
        <tr><td><strong>Longitude</strong></td><td><strong>:</strong></td><td>${site.longitude}</td></tr>
        <tr><td><strong>County</strong></td><td><strong>:</strong></td><td>${site.county}</td></tr>
        <tr><td><strong>​Region</strong></td><td><strong>:</strong></td><td>${site.region}</td></tr>
        <tr><td><strong>Grid Zone</strong></td><td><strong>:</strong></td><td>${site.grid_zone}</td></tr>
        <tr><td><strong>100 km id</strong></td><td><strong>:</strong></td><td>${site.hundred_km_id}</td></tr>
        <tr><td><strong>Notes</strong></td><td><strong>:</strong></td><td>${site.notes}</td></tr>
        <tr><td><strong>Updated On</strong></td><td><strong>:</strong></td><td>${site.last_update}</td></tr>
        </table>
        `).addTo(!site.built ? planned : (site.status === "On-Air" ? onair : offair));
    });
    const map = L.map("map", {
        "maxZoom": 18,
        "minZoom": 6,
        maxBounds,
        "layers": [layerLight, onair, offair, planned]
    });
    map.setMaxBounds(maxBounds);
    map.fitBounds(fitBounds);
    map.createPane("labels");
    map.getPane("labels").style.zIndex = 650;
    map.getPane("labels").style.pointerEvents = "none";
    L.geoJson(floridaCounties, {
            "style": {
                "weight": 1,
                "fillOpacity": 0
            }
        })
        .addTo(map);
    const baseLayers = {
        "Light": layerLight,
        "Dark": layerDark,
        "Streets": layerStreets,
        "Outdoors": layerOutdoors,
        "Satellite": layerSatellite
    };

    const overlays = {
        "On-Air": onair,
        "Off-Air": offair,
        "Planned": planned
    };
    L.control.layers(baseLayers, overlays).addTo(map);

    function onLocationFound(e) {
        var radius = e.accuracy / 2;
        L.marker(e.latlng).addTo(map)
            .bindPopup("You are within " + (radius | 1) + " meters from this point").openPopup();
        L.circle(e.latlng, radius).addTo(map);
    }

    function onLocationError(error) {
        // alert(error.message);
        // console.error(error);
    }

    function onMapClick(e) {
        console.log(e.latlng);
    }
    map.on('click', onMapClick);
    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);
    // var marker1 = onair.addTo(map);
    // var marker2 = offair.addTo(map);
    // var marker3 = planned.addTo(map);
};
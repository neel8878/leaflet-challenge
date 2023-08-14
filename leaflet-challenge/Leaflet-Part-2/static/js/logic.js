const tectonicPlatesBtn = document.getElementById('tectonicPlatesBtn');
const loadContainer = document.getElementById('loadContainer');

const mapDiv = document.getElementById('map');

const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`;
let existingMap;

const setLoader = (status) => {
  if (status) {
    loadContainer.innerHTML = '';
    loadContainer.innerHTML = 'Loading....'
  }
  else {
    loadContainer.innerHTML = ''
  }
}

// // Define colors for depth
function getColor(depth) {
  // Adjust color scale as needed
  return depth > 90 ? '#4a148c' :
    depth > 70 ? '#6a1b9a' :
      depth > 50 ? '#8e24aa' :
        depth > 30 ? '#ab47bc' :
          depth > 10 ? '#ce93d8' :
            '#e1bee7';
}

const createTectonicPlatesMap = (earthquakes, tectonicPlates) => {
  mapDiv.style.height = '500px';
  if (existingMap) {
    existingMap.remove();
    existingMap = null;
  }
  const map = L.map('map').setView([0, 0], 2);
  existingMap = map;

  // Add base layers (e.g., OpenStreetMap and Satellite)
  const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  const satelliteMap = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Map data © <a href="https://www.google.com/maps">Google Maps</a>'
  });

  // Create layer groups for earthquakes and tectonic plates
  const earthquakeLayer = L.layerGroup();
  const tectonicPlateLayer = L.geoJSON();

  // Add earthquakes to the earthquake layer
  earthquakes.forEach(earthquake => {
    const lat = earthquake.geometry.coordinates[1];
    const lon = earthquake.geometry.coordinates[0];
    const mag = earthquake.properties.mag;
    const depth = earthquake.geometry.coordinates[2];

    const marker = L.circleMarker([lat, lon], {
      radius: mag * 3,
      fillColor: getColor(depth),
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    });
    marker.bindPopup(`Location: ${lat}, ${lon} <br> Magnitude: ${mag}<br>Depth: ${depth} km`);
    earthquakeLayer.addLayer(marker);
  });

  // Create a legend
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info legend');
    const depths = [-11, 10, 30, 50, 70, 90];
    const colors = ['#e1bee7', '#ce93d8', '#ab47bc', '#8e24aa', '#6a1b9a', '#4a148c'];

    for (let i = 0; i < depths.length; i++) {
      const rangeLabel = `${depths[i] + 1}${depths[i + 1] ? '&ndash;' + depths[i + 1] : '+'}`;
      const colorLabel = `<div style="display: inline-block; width: 20px; height: 20px; background-color: ${colors[i]}"></div>`;
      div.innerHTML +=
        `${colorLabel}&nbsp;&nbsp;<i>${rangeLabel}</i><br />`; // Add a non-breaking space here
    }
    return div;
  };
  legend.addTo(map);
  // Add tectonic plates to the tectonic plate layer
  tectonicPlateLayer.addData(tectonicPlates);
  tectonicPlateLayer.setStyle({
    color: 'yellow',
    weight: 2
  });

  // Create overlays
  const overlayMaps = {
    'Earthquakes': earthquakeLayer,
    'Tectonic Plates': tectonicPlateLayer
  };

  // Add base layers and overlays to the map
  L.control.layers({ 'OpenStreetMap': openStreetMap, 'Satellite': satelliteMap }, overlayMaps).addTo(map);

  // Set default layers
  openStreetMap.addTo(map);
  earthquakeLayer.addTo(map);
}


const fetchTectonicPlatesMap = async () => {
  try {
    mapDiv.innerHTML = ''
    setLoader(true);
    const tectonicPlateUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';

    const earthquakeResponse = await d3.json(url);
    const tectonicPlateResponse = await d3.json(tectonicPlateUrl);

    createTectonicPlatesMap(earthquakeResponse.features, tectonicPlateResponse.features);
  } catch (error) {
    console.log(error);
    alert('Error fetching data:', error);
  }
  finally {
    setLoader(false);
  }
}


tectonicPlatesBtn.addEventListener('click', fetchTectonicPlatesMap);
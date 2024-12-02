'use strict'

//NOTE:load the api key here if you want the bw maptiles
const key = ""

// TODO:here we should probably get the starting position fromt he backend
const map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([51.505, -0.09], 4);

map.doubleClickZoom.disable();

if (key) {
	L.tileLayer(`https://api.maptiler.com/maps/toner-v2/{z}/{x}/{y}.png?key=${key}`, {
		tileSize: 512,
		zoomOffset: -1,
		minZoom: 1,
		crossOrigin: true
	}).addTo(map);
} else {
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);
}

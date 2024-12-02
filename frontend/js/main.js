'use strict'

//apilta palautukseen:
//weather data
//player/game data
//list of possible contracts
//3 plane options
//random encounter
//
let playerData
let markerLayer

// get the dialog element
const dialog = document.querySelector("dialog")
dialog.showModal()

// form for the dialog element
dialog.innerHTML = `
<form id = "player-form">
	<input type="text" name="username" placeholder="input player name..."> 
	<input type="submit" name="" value="Submit"> 
</form>`

// for creating the new player using dialog modal
const form = dialog.querySelector("#player-form")
form.addEventListener("submit", async (evt) => {

	// boilerplate prevent reload
	evt.preventDefault()

	// get all the data in FormData class object
	const formData = new FormData(form)

	if (formData.get("username") != "") {
		const username = formData.get("username")
		console.log(await createAPICall("player/create", username))
		playerData = await createAPICall("player", username)

		// set coordinates to pan to (Helsinki)

		let latlng = L.latLng(60.3179, 24.9496)
		let markers = []

		// add markers and attach data to them
		const airportsClose = await createAPICall("airport/bydistance/1000/10", playerData.screen_name)
		for (const airport of airportsClose) {
			console.log(airport)
			let latlng = L.latLng(airport.latitude_deg, airport.longitude_deg)
			let marker = L.circleMarker(latlng)
			// you can attach data to the marker,, you can put the data of the airport here and use it in the flyTo phase
			marker.data = { airport }
			// event listener for clicking the markers
			marker.addEventListener('click', flyTo)
			markers.push(marker)
		}

		markerLayer = L.layerGroup(markers)
		markerLayer.addTo(map)

		// just testing creating clickable markers
		//let markerLayer = L.circleMarker(latlng)
		//markerLayer.data = { location: "EFHK" }
		//markerLayer.addTo(map)
		//markerLayer.addEventListener('click', () => {
		//	console.log(markerLayer.data)
		//	markerLayer.remove()
		//})

		//setTimeout(, 1000)


		// pan to coordinates
		map.panTo(latlng)


		// set player data to the player card element
		document.querySelector(".id-grid-name").innerText = username
		document.querySelector(".id-grid-currency").innerText = playerData.currency

		dialog.innerHTML = ""
		dialog.close()

		// go to the plane selection screen
		await getPlanes()

	} else {
		// check if the error paragraph already exists
		if (!dialog.querySelector("p")) {
			const errorMessage = document.createElement("p")
			errorMessage.innerText = "Please insert a valid name."
			dialog.appendChild(errorMessage)
		}
		console.log("There was no username")
	}
})

function flyTo() {
	console.log(this.data)
	map.panTo(L.latLng(this.data.airport.latitude_deg, this.data.airport.longitude_deg))
	// check if this airport is the one in the contract 
	// remove markers somehow
	// generate new markers for close airports (put the code that generated it earlier in function probably)
	// update player data
	// send data to backend when we hit the contract probably
	this.remove()
}

async function selectPlane() {
	console.log(this)
	console.log(this.data.id)
	document.querySelector(".id-grid-temp").innerText = this.data.type
	const listItems = this.parentNode.querySelectorAll("li")
	listItems.forEach((item) => item.removeEventListener('click', selectPlane))

	dialog.close()
	dialog.innerText = ""

	// select contracts
	// this opens the contract selection modal
	// don't know if there is better way to do this than to daisychain async functions
	await getContracts()
}

// list of planes
const getPlanes = async () => {
	const itemList = `
	<p>Select a plane</p>
	<ul style="list-style: none;" id="item-list">
	</ul>
	`

	dialog.innerHTML = itemList

	// this is currectly just hard set to select specific planes
	const planeList = dialog.querySelector("#item-list")
	for (let i = 1; i <= 3; i++) {
		const plane = document.createElement("li")
		plane.data = await createAPICall("plane", i * 2)
		console.log(plane.data)
		plane.innerText = plane.data.type
		plane.addEventListener('click', selectPlane)
		planeList.appendChild(plane)
	}

	dialog.showModal()
}

async function selectContract() {
	console.log(this)
	console.log(this.data.id)
	const listItems = this.parentNode.querySelectorAll("li")
	listItems.forEach((item) => item.removeEventListener('click', selectContract))

	dialog.close()
	dialog.innerText = ""


	// don't know if there is better way to do this than to daisychain async functions
	// this starts the mainloop
	await setupGame()
}

const getContracts = async () => {
	const itemList = `
	<p>Select a contract</p>
	<ul style="list-style: none;" id="item-list">
	</ul>
	`

	dialog.innerHTML = itemList

	const contractList = dialog.querySelector("#item-list")

	// testi pelaajan location
	const playerLatLng = L.latLng(60.3179, 24.9496)  // esim helsinki koordinaatit

	for (let i = 1; i <= 3; i++) {
		const contracts = await createAPICall("contract", playerData.screen_name)
		console.log(contracts)

		for (const contr of contracts.cargo) {
			const contract = document.createElement("li")
			contract.data = contr
			console.log(contract.data)
			contract.innerText = contract.data.description

			// valitsee rando lentokentän contracts.airportista
			const randomAirport = contracts.airport[Math.floor(Math.random() * contracts.airport.length)]
			console.log('Selected random airport:', randomAirport)

			// ottaa latitude ja longitude valitusta lentokentästä
			const airportLatLng = L.latLng(randomAirport.latitude_deg, randomAirport.longitude_deg)

			// laskee etäisyyden pelaajan ja valitun lento kentän välillä
			const distanceInMeters = playerLatLng.distanceTo(airportLatLng)
			const distanceInKilometers = (distanceInMeters / 1000).toFixed(2)

			// luo tooltipin näyttääkseen contract info on hover
			const tooltip = document.createElement('div')
			tooltip.style.position = 'absolute'
			tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
			tooltip.style.color = 'white'
			tooltip.style.padding = '5px'
			tooltip.style.borderRadius = '5px'
			tooltip.style.display = 'none'

			// Append tooltipin contract itemiin
			contract.appendChild(tooltip)

			// declare redMarker here so it can be accessed in both mouseover and mouseout event listeners
			let redMarker;

			// näyttää contract info kun hiiri hoveraa
			contract.addEventListener('mouseover', () => {
				tooltip.innerHTML = `Destination: ${randomAirport.airport}<br>
					Country: ${randomAirport.country}<br>
					Reward: $${contract.data.delivery_value}<br>
					Distance: ${distanceInKilometers} Kilometers
				`
				tooltip.style.display = 'block'

				map.panTo(airportLatLng)
				// lisää punasen pallon contract lentokentä päälle kun hoveraa contracteja
				redMarker = L.circleMarker(airportLatLng, {
					color: `red`,
					fillColor: `red`,
					fillOpacity: 0.6,
					radius: 10
				}).addTo(map)
				redMarker.data = { airport: null }
				redMarker.data.airport = randomAirport
				redMarker.addEventListener('click', flyTo)
			})

			contract.addEventListener('mouseout', () => {
				tooltip.style.display = 'none' // piilottaa tooltipin ku hiiri ei oo enää päällä
				if (redMarker) {
					map.removeLayer(redMarker)
				}
			})

			contract.addEventListener('click', selectContract)
			contractList.appendChild(contract)
		}
	}

	dialog.showModal()
}

const setupGame = async () => {
	console.log("game is running")

	// draw points on the map
	// update values on the screen
}

// api_endpoint is the part after /api/
const createAPICall = async (api_endpoint, data) => {
	const fetchOptions = {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		}
	}
	const url = "http://127.0.0.1:3000/api/"
	try {
		const response = await fetch(url + api_endpoint + "/" + data, fetchOptions)
		if (response.ok) {
			console.log("promise resolved and HTTP status is succesful")
			const json_response = await response.json()
			return json_response
		} else {
			const json_response = await response.json()
			// json_response still needs to get processed
			console.log(json_response.text)
		}
	} catch (error) {
		console.error("promise rejected: " + error)
	}
}

const fetchTable = async (table) => {
	const fetchOptions = {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		}
	}
	const url = "http://127.0.0.1:3000/api/"
	try {
		const response = await fetch(url + table, fetchOptions)
		if (response.ok) {
			console.log("promise resolved and HTTP status is succesful")
			const json_response = await response.json()
			return json_response
		} else {
			const json_response = await response.json()
			// json_response still needs to get processed
			console.log(json_response.text)
		}
	} catch (error) {
		console.error("promise rejected: " + error)
	}
}


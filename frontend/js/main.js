'use strict'

//apilta palautukseen:
//weather data
//player/game data
//list of possible contracts
//3 plane options
//random encounter

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

		// set coordinates to pan to (Helsinki)

		let latlng = L.latLng(60.3179, 24.9496)
		let markers = []

		// add markers and attach data to them
		for (let i = 0; i < 10; i++) {
			let latlng = L.latLng(60.3179 + i * 0.01, 24.9496 + i * 0.01)
			let marker = L.circleMarker(latlng)
			// you can attach data to the marker,, you can put the data of the airport here and use it in the flyTo phase
			marker.data = { location: `${i}` }
			marker.addEventListener('click', () => {
				console.log(marker.data)
				marker.remove()
			})
			markers.push(marker)
		}

		let makerLayer = L.layerGroup(markers)
		makerLayer.addTo(map)

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

		const playerData = await createAPICall("player", username)

		// set player data to the player card element
		document.querySelector(".id-grid-name").innerText = username
		document.querySelector(".id-grid-currency").innerText = playerData.currency

		// call the game loop here
		// assign listeners and stuff to the point on the map

		dialog.innerHTML = ""
		dialog.close()
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

// just for testing the stuff
(async () => {
	console.log(await createAPICall("airport", "EFHK"))
	console.log(await createAPICall("player", "heini"))
	console.log(await createAPICall("plane", "13"))
	console.log(await fetchTable("contract"))
})()


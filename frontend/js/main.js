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
form.addEventListener("submit", (evt) => {

	// boilerplate prevent reload
	evt.preventDefault()

	// get all the data in FormData class object
	const formData = new FormData(form)

	if (formData.get("username") != "") {
		const username = formData.get("username")
		document.querySelector(".id-grid-name").innerText = username

		// call the game loop here
		// assign listeners and stuff to the point on the map

		console.log(formData.get("username"))
		dialog.innerHTML = ""
		dialog.close()
	} else {
		console.log("There was no username")
	}
})

const fetchData = async (table, data) => {
	const fetchOptions = {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		}
	}
	const url = "http://127.0.0.1:3000/api/"
	try {
		const response = await fetch(url + table + "/" + data, fetchOptions)
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
	console.log(await fetchData("airport", "EFHK"))
	console.log(await fetchData("player", "heini"))
	console.log(await fetchData("plane", "13"))
	console.log(await fetchTable("contract"))
})()


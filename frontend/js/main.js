'use strict'

//apilta palautukseen:
//weather data
//player/game data
//list of possible contracts
//3 plane options
//random encounter

const fetchData = async (table, data) => {
	const fetchOptions = {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		}
	}
	const url = "http://127.0.0.1:3000/"
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
		console.error("promise rejected: " + error.message)
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
		console.error("promise rejected: " + error.message)
	}
}

// just for testing the stuff
(async () => {
	console.log(await fetchData("airport", "EFHK"))
	console.log(await fetchData("player", "mika"))
	console.log(await fetchTable("cargo"))
	console.log(await fetchTable("plane"))
})()


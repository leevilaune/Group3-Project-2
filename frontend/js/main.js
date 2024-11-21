'use strict'

//apilta palautukseen:
//weather data
//player/game data
//list of possible contracts
//3 plane options
//random encounter

const fetchAirportByIcao = async (icao) => {
	const fetchOptions = {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		}
	}
	const url = "http://127.0.0.1:3000/airport/"
	try {
		const response = await fetch(url + icao, fetchOptions)
		if (response.ok) {
			console.log("promise resolved and HTTP status is succesfull")
			const json_response = await response.json()
			console.log(json_response)
		} else {
			const json_response = await response.json()
			console.log(json_response.text)
		}
	} catch (error) {
		console.error("promise rejected: " + error.message)
	}
}

const fetchData = async (table) => {
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
			console.log("promise resolved and HTTP status is succesfull")
			const json_response = await response.json()
			console.log(json_response)
		} else {
			const json_response = await response.json()
			console.log(json_response.text)
		}
	} catch (error) {
		console.error("promise rejected: " + error.message)
	}
}

const fetchPlayer = async (name) => {
	const fetchOptions = {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		}
	}
	const url = "http://127.0.0.1:3000/player/"
	try {
		const response = await fetch(url + name, fetchOptions)
		if (response.ok) {
			console.log("promise resolved and HTTP status is succesfull")
			const json_response = await response.json()
			console.log(json_response)
		} else {
			const json_response = await response.json()
			console.log(json_response.text)
		}
	} catch (error) {
		console.error("promise rejected: " + error.message)
	}
}

// just for testing the stuff
(async () => {
	await fetchAirportByIcao("EFHK")
	await fetchAirportByIcao("EFK")
	await fetchData("plane")
	await fetchData("cargo")
	await fetchPlayer("kalle")
})()

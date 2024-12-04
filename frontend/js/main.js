'use strict'

//apilta palautukseen:
//weather data
//player/game data
//list of possible contracts
//3 plane options
//random encounter
//
let playerData = null

let gameRunning = false

let markerLayer = L.layerGroup()

const dialog = document.querySelector("dialog")
dialog.innerHTML = `
<h2 id="new game">New game</h2>
<h2 id="load game">Load game</h2>
<h2><a style="text-decoration: none; color: black" href="instructions.html">Instructions</a></h2>
<h2><a style="text-decoration: none; color: black" href="devit.html">Credits</a></h2>`
dialog.showModal()

const h2s = dialog.querySelectorAll("h2")

for (let h2 of h2s) {
    h2.addEventListener("click", function () {
        if (h2.id === "new game") {
            nameInput()
        } else if (h2.id === "load game") {
            console.log("load game pressed")
        }
    })
}

function nameInput() {
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
}


async function flyTo() {
    console.log(this.data)
    map.panTo(L.latLng(this.data.airport.latitude_deg, this.data.airport.longitude_deg))
    // check if this airport is the one in the contract
    // remove markers somehow
    // generate new markers for close airports (put the code that generated it earlier in function probably)
    // update player data
    playerData.location = this.data.airport.ident

    if (playerData.location == playerData.contract.airport.ident) {
        playerData.currency += playerData.contract.delivery_value
        await getContracts()
    }

    // send data to backend when we hit the contract probably
    await createAPIPostCall("player/update", playerData.screen_name, playerData)

    await updateMarkers()

    // remove the marker from the layer // maybe only ones that are certain distance away or somehitn
    //markerLayer.removeLayer(this)
}

async function selectPlane() {
    console.log(this)
    console.log(this.data.id)
    document.querySelector(".id-grid-temp").innerText = this.data.type
    const listItems = this.parentNode.querySelectorAll("li")
    listItems.forEach((item) => item.removeEventListener('click', selectPlane))

    playerData.rented_plane = this.data.id

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
    playerData.contract = this.data

    console.log(playerData.contract)

    const listItems = this.parentNode.querySelectorAll("li")
    listItems.forEach((item) => item.removeEventListener('click', selectContract))

    dialog.close()
    dialog.innerText = ""


    // don't know if there is better way to do this than to daisychain async functions
    // this starts the mainloop
    // making some spaghetti ...
    if (!gameRunning) {
        await setupGame()
    }
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
        contract.data.airport = randomAirport

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
                //fillOpacity: 0.6,
                radius: 10
            })
            markerLayer.addLayer(redMarker)
            markerLayer.addTo(map)
            redMarker.data = {airport: null}
            redMarker.data.airport = randomAirport
            redMarker.addEventListener('click', flyTo)
        })

        contract.addEventListener('mouseout', () => {
            tooltip.style.display = 'none' // piilottaa tooltipin ku hiiri ei oo enää päällä
            if (redMarker) {
                markerLayer.removeLayer(redMarker)
            }
        })

        contract.addEventListener('click', selectContract)
        contractList.appendChild(contract)
    }

    dialog.showModal()
}

const updateMarkers = async () => {
    // add markers and attach data to them
    const airportsClose = await createAPICall("airport/bydistance/1000/10", playerData.screen_name)
    for (const airport of airportsClose) {
        let draw = true
        // this is really bad it always goes through every layer fix if time left
        // go through all the layers(markers) and check if it already exists
        markerLayer.eachLayer((layer) => {
            if (layer.data.airport.ident != playerData.contract.airport.ident) {
                layer.setStyle({fillColor: "#3388ff", color: "#3388ff"})
            }
            if (layer.data.airport.ident == airport.ident) {
                draw = false;
            }
            if (layer.data.airport.ident == playerData.location) {
                layer.setStyle({fillColor: "green", color: "green"})
                //console.log("changing color of " + layer.data.airport.ident)
            }
        })
        // draw markers that are not already drawn
        if ((airport.ident != playerData.contract.airport.ident) && draw) {
            let latlng = L.latLng(airport.latitude_deg, airport.longitude_deg)
            let marker = L.circleMarker(latlng)
            marker.setStyle({fillColor: "#3388ff", color: "#3388ff"})
            // you can attach data to the marker,, you can put the data of the airport here and use it in the flyTo phase
            marker.data = {airport}
            // event listener for clicking the markers
            marker.addEventListener('click', flyTo)
            markerLayer.addLayer(marker)
        }
    }

    markerLayer.addTo(map)
}

const setupGame = async () => {
    gameRunning = true
    console.log("game is running")
    console.log(playerData)

    // helsinki coordinates
    let latlng = L.latLng(60.3179, 24.9496)
    let marker = L.circleMarker(latlng)
    marker.setStyle({fillColor: "green", color: "green"})
    marker.data = {airport: {ident: "EFHK", latitude_deg: 60.3179, longitude_deg: 24.9496}}
    marker.addEventListener('click', flyTo)
    markerLayer.addLayer(marker)
    markerLayer.addTo(map)

    map.panTo(latlng)

    // draw all markers for airports
    await updateMarkers()

    // pan to coordinates
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

const createAPIPostCall = async (api_endpoint, id, data) => {
    // data is the stuff we want to update in a dictionary
    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    }
    const url = "http://127.0.0.1:3000/api/"
    try {
        const response = await fetch(url + api_endpoint + "/" + id, fetchOptions)
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


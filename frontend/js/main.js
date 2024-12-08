'use strict'

//apilta palautukseen:
//weather data
//player/game data
//list of possible contracts
//3 plane options
//random encounter
//
const planeIcon = (bearing) => L.divIcon({
    className: 'plane-icon',
    html: `<div style="transform: rotate(${bearing}deg);">
               <img src="img/interface/plane-icon.png" style="width: 32px; height: 32px;" />
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
})

let planeMarker = null;

const animatePlane = (startLatLng, endLatLng, duration) => {
    const steps = 100;
    const stepDelay = duration / steps;
    let step = 0;

    const calculateBearing = (start, end) => {
        const lat1 = start.lat * Math.PI / 180;
        const lon1 = start.lng * Math.PI / 180;
        const lat2 = end.lat * Math.PI / 180;
        const lon2 = end.lng * Math.PI / 180;

        const deltaLon = lon2 - lon1;
        const y = Math.sin(deltaLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
        const bearing = Math.atan2(y, x) * 180 / Math.PI;

        const planeOffset = -45;
        return (bearing + planeOffset + 360) % 360;
    }


const movePlane = () => {
    if (step < steps) {
        const lat = startLatLng.lat + ((endLatLng.lat - startLatLng.lat) * (step / steps));
        const lng = startLatLng.lng + ((endLatLng.lng - startLatLng.lng) * (step / steps));
        const currentLatLng = { lat, lng };

        planeMarker.setLatLng(currentLatLng);

        const bearing = calculateBearing(currentLatLng, endLatLng);
        console.log(`Step ${step}, Bearing: ${bearing}`);
        planeMarker.setIcon(planeIcon(bearing));

        step++;
        setTimeout(movePlane, stepDelay);
    } else {
        console.log("Animation complete");
    }
}

    movePlane()
}

const player = { data: null, contract: null }

let gameRunning = false

let markerLayer = L.layerGroup()

const dialog = document.querySelector("dialog")

const startDialog = () => {

    dialog.innerHTML = `
<h2 id="new game">New game</h2>
<h2 id="load game">Load game</h2>
<h2><a style="text-decoration: none; color: black" href="instructions.html">Instructions</a></h2>
<h2><a style="text-decoration: none; color: black" href="devit.html">Credits</a></h2>`
    dialog.showModal()

    const h2s = dialog.querySelectorAll("h2")

    for (let h2 of h2s) {
        h2.addEventListener("click", function() {
            if (h2.id === "new game") {
                nameInput()
            } else if (h2.id === "load game") {
                loadGame()
                console.log("load game pressed")
            }
        })
    }

}

// get the main menu here
startDialog()

const loadGame = async () => {
    const form = inputPopup()
    form.addEventListener('submit', async (evt) => {
        // boilerplate prevent reload
        evt.preventDefault()

        // get all the data in FormData class object
        const formData = new FormData(form)

        // add event listener to get the player data from database
        if (formData.get("username") != "") {
            const username = formData.get("username")

            player.data = await createAPICall("player", username)
            player.plane = { data: null }
            player.plane.data = await createAPICall("plane", player.data.rented_plane)
            player.plane.data.price = parseInt(player.plane.data.fuel_consumption) + parseInt(player.plane.data.max_speed) * 50

            console.log(`player initialized with: ${JSON.stringify(player)}`)
            if (player.data != undefined) {
                // set coordinates to pan to (Helsinki)

                // set player data to the player card element
                document.querySelector(".id-grid-name").innerText = username
                document.querySelector(".id-grid-currency").innerText = player.data.currency

                dialog.innerHTML = ""
                dialog.close()

                // go to the plane selection screen
                await getContracts()
            }
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

const inputPopup = () => {
    const dialog = document.querySelector("dialog")
    dialog.showModal()

    // form for the dialog element
    dialog.innerHTML = `
   <form id = "player-form">
	  <input type="text" name="username" placeholder="input player name..."> 
	  <input type="submit" name="" value="Submit"> 
   </form>`
    return dialog.querySelector("#player-form")

}

function nameInput() {
    // get the dialog element


    // for creating the new player using dialog modal
    const form = inputPopup()

    form.addEventListener("submit", async (evt) => {

        // boilerplate prevent reload
        evt.preventDefault()

        // get all the data in FormData class object
        const formData = new FormData(form)

        if (formData.get("username") != "") {
            const username = formData.get("username")
            console.log(await createAPICall("player/create", username))
            player.data = await createAPICall("player", username)

            // set coordinates to pan to (Helsinki)

            // set player data to the player card element
            document.querySelector(".id-grid-name").innerText = username
            document.querySelector(".id-grid-currency").innerText = player.data.currency

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

const updateGame = async () => {
    console.log("Before update", player.data)
    player.data = await createAPIPostCall("player/update", player.data.screen_name, player.data)
    console.log("After update", player.data)

    // return weather from the weather api
    // show it somewhere
    const weather = await createAPICall("weather", player.data.location)
    console.log(weather)

    if (Math.floor(player.data.current_day) != 0) {
        player.data.currency -= player.plane.data.price
    }
    // check if the game is over
    if (player.data.currency <= 0 || player.data.fuel_amount <= 0) {
        console.log("GAME OVER!")
        dialog.innerHTML = ""
        dialog.innerText = "GAME OVER! you ran out of resources!"
        dialog.showModal()

        setTimeout(() => {
            // what a time to be alive
            location.reload()
        }, 2000)
    }
}

async function flyTo() {
    console.log(this.data)

    const currentAirport = await createAPICall("airport", player.data.location);
    const startLatLng = L.latLng(currentAirport.latitude_deg, currentAirport.longitude_deg);
    const endLatLng = L.latLng(this.data.airport.latitude_deg, this.data.airport.longitude_deg);
    const duration = 2;

    if (!planeMarker) {
        planeMarker = L.marker(startLatLng, {
            icon: planeIcon(0),
            className: 'rotatable-icon'
        }).addTo(map);
    }

    animatePlane(startLatLng, endLatLng, duration);
    map.panTo(L.latLng(this.data.airport.latitude_deg, this.data.airport.longitude_deg))
    // check if this airport is the one in the contract
    // remove markers somehow
    // generate new markers for close airports (put the code that generated it earlier in function probably)
    // update player data
    player.data.location = this.data.airport.ident

    // update currency if we hit the contract airport
    if (player.data.location == player.contract.airport.ident) {
        player.data.currency += player.contract.delivery_value
        await getContracts()
    }


    // update game data
    await updateGame()

    // send data to backend when we hit the contract probably
    await updateMarkers()

    // remove the marker from the layer // maybe only ones that are certain distance away or somehitn
    markerLayer.removeLayer(planeMarker)
}

async function selectPlane() {
    console.log(this)
    console.log(this.data.id)
    document.querySelector(".id-grid-temp").innerText = this.data.type
    const listItems = this.parentNode.querySelectorAll("li")
    listItems.forEach((item) => item.removeEventListener('click', selectPlane))

    // update and add plane to the player object
    player.plane = this
    player.data.rented_plane = this.data.id
    player.data.currency -= this.data.price

    // update game data
    await updateGame()

    // close dialog and empty it
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
        plane.data = await createAPICall("plane", parseInt(Math.random() * 1000 % 24 + 1))
        console.log(plane.data)
        plane.innerText = plane.data.type
        plane.data.price = parseInt(plane.data.fuel_consumption) + parseInt(plane.data.max_speed) * 50
        plane.addEventListener('click', selectPlane)
        planeList.appendChild(plane)

        const tooltip = document.createElement('div')
        tooltip.style.position = 'absolute'
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
        tooltip.style.color = 'white'
        tooltip.style.padding = '5px'
        tooltip.style.borderRadius = '5px'
        tooltip.style.display = 'none'

        // Append tooltipin contract itemiin
        plane.appendChild(tooltip)

        // declare redMarker here so it can be accessed in both mouseover and mouseout event listeners
        let redMarker;

        // näyttää plane info kun hiiri hoveraa
        plane.addEventListener('mouseover', () => {
            tooltip.innerHTML = `
Type: ${plane.data.type}
Fuel Consumption: ${plane.data.fuel_consumption}
Max Speed: ${plane.data.max_speed}
Price: ${plane.data.price}
`
            tooltip.style.display = 'block'
        })

        plane.addEventListener('mouseout', () => {
            tooltip.style.display = 'none' // piilottaa tooltipin ku hiiri ei oo enää päällä
            if (redMarker) {
                markerLayer.removeLayer(redMarker)
            }
        })
    }


    dialog.showModal()
}

async function selectContract() {
    console.log(this)
    player.contract = this.data

    console.log(player.contract)

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

    await createAPIPostCall("player/update", player.data.screen_name, player.data)

    const contractList = dialog.querySelector("#item-list")

    // testi pelaajan location
    const currentAirport = await createAPICall("airport", player.data.location)
    console.log(currentAirport)
    const playerLatLng = L.latLng(currentAirport.latitude_deg, currentAirport.longitude_deg)  // esim helsinki koordinaatit

    const contracts = await createAPICall("contract", player.data.screen_name)
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
					Distance: ${distanceInKilometers} Km
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
            redMarker.data = { airport: null }
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
    const airportsClose = await createAPICall("airport/bydistance/1000/10", player.data.screen_name)
    for (const airport of airportsClose) {
        let draw = true
        // this is really bad it always goes through every layer fix if time left
        // go through all the layers(markers) and check if it already exists
        markerLayer.eachLayer((layer) => {
            if (layer.data.airport.ident != player.contract.airport.ident) {
                layer.setStyle({ fillColor: "#3388ff", color: "#3388ff" })
            }
            if (layer.data.airport.ident == airport.ident) {
                draw = false;
            }
            if (layer.data.airport.ident == player.data.location) {
                layer.setStyle({ fillColor: "green", color: "green" })
                //console.log("changing color of " + layer.data.airport.ident)
            }
        })
        // draw markers that are not already drawn
        if ((airport.ident != player.contract.airport.ident) && draw) {
            let latlng = L.latLng(airport.latitude_deg, airport.longitude_deg)
            let marker = L.circleMarker(latlng)
            marker.setStyle({ fillColor: "#3388ff", color: "#3388ff" })
            // you can attach data to the marker,, you can put the data of the airport here and use it in the flyTo phase
            marker.data = { airport }
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
    console.log(player)

    // testi pelaajan location
    const currentAirport = await createAPICall("airport", player.data.location)
    console.log(currentAirport)
    const playerLatLng = L.latLng(currentAirport.latitude_deg, currentAirport.longitude_deg)  // esim helsinki koordinaatit
    // player
    let marker = L.circleMarker(playerLatLng)
    marker.setStyle({ fillColor: "green", color: "green" })
    marker.data = { airport: currentAirport }
    marker.addEventListener('click', flyTo)
    markerLayer.addLayer(marker)
    markerLayer.addTo(map)

    map.panTo(playerLatLng)

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
            console.log("JSON response", json_response)
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

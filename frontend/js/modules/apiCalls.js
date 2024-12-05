
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

export { fetchTable, createAPICall, createAPIPostCall }

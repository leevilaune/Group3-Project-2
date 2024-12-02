# Group3-Project-2

# API Documentation

## Overview
This API provides various endpoints to interact with airport, player, plane, and contract data. It supports operations such as retrieving information, creating resources, and updating players.

---

## Endpoints

### 1. Get Airports by Distance
**URL:** `/api/airport/bydistance/<distance>/<amount>/<name>`  
**Method:** `GET`  
**Description:** Retrieve a list of airports within a specified distance.  
**Parameters:**  
- `distance` (int): Maximum distance to search for airports.  
- `amount` (int): Number of airports to return.  
- `name` (string): The player's name.  

**Response:**
- `200 OK`: JSON list of airports.  
- `404 Not Found`: No airports found near the specified location.  

---

### 2. Get Airport by ICAO Code
**URL:** `/api/airport/<icao>`  
**Method:** `GET`  
**Description:** Retrieve details of a specific airport by its ICAO code.  
**Parameters:**  
- `icao` (string): ICAO code of the airport.  

**Response:**
- `200 OK`: JSON object with airport details.  
- `404 Not Found`: Airport not found.  

---

### 3. Get Player Data
**URL:** `/api/player/<name>`  
**Method:** `GET`  
**Description:** Retrieve details of a specific player by name.  
**Parameters:**  
- `name` (string): Name of the player.  

**Response:**
- `200 OK`: JSON object with player details.  
- `404 Not Found`: Player not found.  

---

### 4. Create a Player
**URL:** `/api/player/create/<name>`  
**Method:** `GET`  
**Description:** Create a new player with the given name.  
**Parameters:**  
- `name` (string): Name of the player to be created.  

**Response:**
- `200 OK`: Player successfully created.  

---

### 5. Update Player Data
**URL:** `/api/player/update/<name>`  
**Method:** `POST`  
**Description:** Update the details of an existing player.  
**Parameters:**  
- `name` (string): Name of the player to be updated.  
- Request Body: JSON object with player details.
## Notes
- Player details are based on following Database Schema payload doesnt need to have
all fields, just the ones you want to update
```
| Field        | Type        |
|--------------|-------------|
| id           | int(11)     |
| co2_consumed | int(8)      |
| co2_budget   | int(8)      |
| location     | varchar(10) |
| screen_name  | varchar(40) |
| currency     | int(32)     |
| fuel_amount  | int(8)      |
| rented_plane | int(8)      |
| current_day  | float       |
```


**Response:**
- `200 OK`: Player successfully updated.  
- `400 Bad Request`: Invalid request payload.  

---

### 6. Get Plane Data
**URL:** `/api/plane/<plane_id>`  
**Method:** `GET`  
**Description:** Retrieve details of a specific plane by its ID.  
**Parameters:**  
- `plane_id` (int): ID of the plane.  

**Response:**
- `200 OK`: JSON object with plane details.  
- `404 Not Found`: Plane not found.  

---

### 7. Get Contract
**URL:** `/api/contract/<name>`  
**Method:** `GET`  
**Description:** Generate a contract for a specific player.  
**Parameters:**  
- `name` (string): Name of the player.  

**Response:**
- `200 OK`: JSON object with contract details.  
- `404 Not Found`: Contract not found.  

---

### Error Handling
**Default 404 Error:**  
If a requested resource is not found, the API will return:  
- `Status Code`: 404  
- `Response Body`:  
  ```json
  {
    "code": 404,
    "text": "Not Found"
  }

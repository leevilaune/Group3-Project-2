# setting off formatting for neovim for this file
# fmt: off
import time

import requests
from pyexpat import native_encoding

from flask import Flask, Response, request
from flask_cors import CORS
import json
import os

import mysql.connector

from backend.game.Contract import CargoManager, ContractManager
from backend.game.Database import Database
from backend.game.Game import PlayerManager
from backend.game.Plane import PlaneManager
from backend.weatherapi import WeatherApi
app = Flask(__name__)
CORS(app)

# TODO airports by distance
@app.route('/api/airport/bydistance/<distance>/<amount>/<name>', methods=['GET'])
def get_airport_by_distance(amount, distance,name):
	airports = db_airports_by_distance(amount,distance,name)
	if len(airports) == 0:
		return Response(response=json.dumps({"code": 404, "text": f"No airports found near"}), status=404,
		                mimetype="application/json")
	resp =  Response(response=json.dumps(airports), status=200, mimetype="application/json")
	print(f"{int(time.time())}|'api.get_airport_by_distance': Returning {resp.json}")
	return resp

@app.route("/api/airport/<icao>")
def get_airport(icao:str):
	airport = get_airports(icao)
	if airport is None:
		return Response(response=json.dumps({"code": 404, "text": f"Airport {icao} not found"}), status=404,
		                mimetype="application/json")
	resp =  Response(response=json.dumps(airport), status=200, mimetype="application/json")
	print(f"{int(time.time())}|'api.get_airport': Returning {resp.json}")
	return resp

@app.route("/api/player/<name>")
def get_player(name: str):
	player = db_get_player(name)
	if player is None:
		return Response(response=json.dumps({"code": 404, "text": f"Player {name} not found"}), status=404,
	                    mimetype="application/json")
	resp =  Response(response=json.dumps(player), status=200, mimetype="application/json")
	print(f"{int(time.time())}|'api.get_player': Returning {resp.json}")
	return resp


@app.route("/api/player/create/<name>")
def create_player(name: str):
	code = add_player_to_db(name)
	#if code == 403:
	#	return Response(response=json.dumps({"text":"Already Logged in"}), status=403, mimetype="application/json")
	if code == 200:
		return Response(response=json.dumps({"text":"Player created"}), status=200, mimetype="application/json")

@app.route("/api/player/update/<name>", methods=['GET',"POST"])
def update_player(name: str):
	data = request.json
	try:
		pm.update_player(name,data)
	except Exception as e:
		print(e)
		return Response(status=400,response=json.dumps({"text":"Bad Request, Check your payload"}), mimetype="application/json")

	resp =  Response(status=200, response=json.dumps(pm.get_player(name).__dict__), mimetype="application/json")
	print(f"{int(time.time())}|'api.update_player': Returning {resp.json}")
	return resp

@app.route("/api/plane/<plane_id>")
def get_plane(plane_id:int):
	plane = planeManager.get_plane_by_id(int(plane_id))
	if plane is None:
		return Response(response=json.dumps({"code": 404, "text": f"Planes not found"}), status=404,
		                mimetype="application/json")
	resp =  Response(response=json.dumps(plane.__dict__), status=200, mimetype="application/json")
	print(f"{int(time.time())}|'api.get_plane': Returning {resp.json}")
	return resp

@app.route("/api/contract/<name>")
def get_contract(name):
	contract = contractManager.generate_contract(name)
	if contract is None:
		return Response(response=json.dumps({"code": 404, "text": f"Contract not found"}), status=404,
		                mimetype="application/json")
	resp =  Response(response=json.dumps(contract.__dict__), status=200, mimetype="application/json")
	print(f"{int(time.time())}|'api.get_contract': Returning {resp}")
	return resp

@app.route("/admin/api/players")
def get_players():
	players = pm.players()
	if players is None:
		return Response(response=json.dumps({"code": 404, "text": f"Players not found"}), status=404,
		                mimetype="application/json")
	return Response(response=json.dumps({"players":players}), status=200, mimetype="application/json")

@app.route("/api/weather/<screen_name>")
def get_weather(screen_name: str):
	weather = wa.get_weather(screen_name)
	if weather:
		return Response(response=json.dumps(weather), status=200, mimetype="application/json")
	return Response(status=404, response=json.dumps({"code": 404, "text": "Weather unavailable check apiKey"}), mimetype="application/json")

@app.errorhandler(404)
def page_not_found(errorcode):
	error = {
        "code" : errorcode.code,
        "text" : "Not Found"
    }
	return Response(response=json.dumps(error), status=errorcode.code, mimetype="application/json")

current_dir = os.path.dirname(__file__)
db_path = os.path.join(current_dir, '..', 'db.json')
with open(db_path) as file:
	database = json.load(file)
connection = mysql.connector.connect(
    host=database["host"],
    port=database["port"],
    database=database["database"],
    username=database["username"],
    password=database["password"],
    autocommit=True,
    buffered=True)
# get the weatherapi key from the json file
apiKey = database["weatherAPI_key"]
cursor = connection.cursor(dictionary=True)
db = Database()
planeManager = PlaneManager(db)
pm = PlayerManager(db,planeManager)
wa = WeatherApi(db, pm)

contractManager = ContractManager(db)

def get_airports(icao: str)->dict:
	return db.get_airport(icao)

def db_get_player(name: str)->dict:
	return db.get_player_data(name)

def get_players_from_db():
	return db.fetch_data("game")

def add_player_to_db(name) -> int:
	print(f"'api.add_player_to_db': Player {name} exists {db.user_exists_by_name(name)}")
	if pm.player_exists(name) is False:
		add_data = {"co2_consumed": 0,
		            "co2_budget": 20000,
		            "currency": 100000,
		            "location": "EFHK",
		            "fuel_amount": 100000,
		            "current_day": 0.0,
		            "rented_plane":1,
		            "screen_name": name}
		print(f"{int(time.time())}|'api.add_player_to_db': Add Data: {add_data}")
		db.add_data([add_data], "game")
		pm.login(name)
		return 200
	else:
		if pm.login(name):
			return 403
		else: return 200

def db_airports_by_distance(amount:int, distance:int,screen_name:str) -> list:
	return db.get_airports_by_distance("large_airport", distance,screen_name,amount)
if __name__ == '__main__':
	app.run(use_reloader=False,
            host='127.0.0.1',
            port=3000,
            debug=True)

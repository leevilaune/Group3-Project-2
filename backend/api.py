# setting off formatting for neovim for this file
# fmt: off
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

app = Flask(__name__)
CORS(app)

# TODO airports by distance
@app.route('/api/airport/bydistance/<distance>/<amount>/<name>', methods=['GET'])
def get_airport_by_distance(amount, distance,name):
	airports = db_airports_by_distance(amount,distance,name)
	if len(airports) == 0:
		return Response(response=json.dumps({"code": 404, "text": f"No airports found near"}), status=404,
		                mimetype="application/json")
	return Response(response=json.dumps(airports), status=200, mimetype="application/json")

@app.route("/api/airport/<icao>")
def get_airport(icao:str):
	airport = db_get_airport(icao)
	if airport is None:
		return Response(response=json.dumps({"code": 404, "text": f"Airport {icao} not found"}), status=404,
		                mimetype="application/json")
	return Response(response=json.dumps(airport), status=200, mimetype="application/json")

@app.route("/api/player/<name>")
def get_player(name: str):
	player = db_get_player(name)
	if player is None:
		return Response(response=json.dumps({"code": 404, "text": f"Player {name} not found"}), status=404,
	                    mimetype="application/json")
	return Response(response=json.dumps(player), status=200, mimetype="application/json")

@app.route("/api/player/create/<name>")
def create_player(name: str):
	add_player_to_db(name)
	return Response(response=json.dumps({"text":"Player created"}), status=200, mimetype="application/json")

@app.route("/api/player/update/<name>", methods=['GET',"POST"])
def update_player(name: str):
	data = request.json
	try:
		pm.update_player(name,data)
	except Exception as e:
		print(e)
		return Response(status=400,response=json.dumps({"text":"Bad Request, Check your payload"}), mimetype="application/json")

	return Response(status=200, response=json.dumps({"text": "Player Updated"}), mimetype="application/json")

@app.route("/api/plane/<plane_id>")
def get_plane(plane_id:int):
	plane = planeManager.get_plane_by_id(int(plane_id))
	if plane is None:
		return Response(response=json.dumps({"code": 404, "text": f"Planes not found"}), status=404,
		                mimetype="application/json")
	return Response(response=json.dumps(plane.__dict__), status=200, mimetype="application/json")

@app.route("/api/contract/<name>")
def get_contract(name):
	contract = contractManager.generate_contract(name)
	if contract is None:
		return Response(response=json.dumps({"code": 404, "text": f"Contract not found"}), status=404,
		                mimetype="application/json")
	return Response(response=json.dumps(contract.__dict__), status=200, mimetype="application/json")

@app.route("/admin/api/players")
def get_players():
	players = get_players_from_db()
	if players is None:
		return Response(response=json.dumps({"code": 404, "text": f"Players not found"}), status=404,
		                mimetype="application/json")
	return Response(response=json.dumps(players), status=200, mimetype="application/json")

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
cursor = connection.cursor(dictionary=True)
db = Database()
planeManager = PlaneManager(db)
contractManager = ContractManager(db)

pm = PlayerManager(db)

def get_players_from_db():
	return db.fetch_data("game")

def db_get_player(name):
	return db.get_player_data(name)

def db_get_airport(icao):
	return db.get_airport(icao)

def add_player_to_db(name) -> int:

	if pm.player_exists(name) is False:
		add_data = {"co2_consumed": 0,
		            "co2_budget": 20000,
		            "currency": 100000,
		            "location": "EFHK",
		            "fuel_amount": 69420,
		            "current_day": 0,
		            "screen_name": name}
		print(add_data)
		db.add_data([add_data], "game")
		pm.login(name)
	else:
		pm.login(name)


def db_airports_by_distance(amount:int, distance:int,screen_name:str) -> list:
	print(db_get_player(screen_name))
	return db.get_airports_by_distance("large_airport", distance,screen_name,amount)
if __name__ == '__main__':
	app.run(use_reloader=False,
            host='127.0.0.1',
            port=3000,
            debug=True)

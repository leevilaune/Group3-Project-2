from flask import Flask, Response
import json
import os

import mysql.connector

from backend.game.Database import Database
from backend.game.Plane import PlaneManager

app = Flask(__name__)
db = Database()
pm = PlaneManager(db)
@app.route("/airport/<icao>")
def get_airport(icao):
	airport = get_airports(icao)
	if airport is None:
		return Response(response=json.dumps({"code": 404, "text": f"Airport {icao} not found"}), status=404,
		                mimetype="application/json")
	response = {
		"ICAO": icao,
		"Name": airport["name"],
		"Municipality": airport["municipality"]
	}
	return Response(response=json.dumps(response), status=200, mimetype="application/json")

@app.route("/player/<name>")
def get_player(name):
	player = get_player_data(name)
	if player is None:
		return Response(response=json.dumps({"code": 404, "text": f"Player {name}not found"}), status=404,
	                    mimetype="application/json")
	return Response(response=json.dumps(player), status=200, mimetype="application/json")

@app.route("/api/plane")
def get_plane():
	data = pm.get_random_planes(3)
	print(data)
	if data is None:
		return Response(response=json.dumps({"code": 404, "text": f"Planes not found"}), status=404,
		                mimetype="application/json")
	return Response(response=json.dumps(data), status=200, mimetype="application/json")
@app.route("/api/cargo")
def get_cargo():
	data = get_static_data("cargo")
	if data is None:
		return Response(response=json.dumps({"code": 404, "text": f"Cargo not found"}), status=404,
		                mimetype="application/json")
	return Response(response=json.dumps(data), status=200, mimetype="application/json")

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

def get_airports(icao: str)->dict:
	fetch_airport_sql = f"""
	SELECT name, municipality
    FROM airport
    WHERE airport.ident = '{icao}'
	"""
	cursor.execute(fetch_airport_sql)
	return cursor.fetchone()

def get_player_data(name: str)->dict:
	fetch_player_sql = f"""
    SELECT *
    FROM game
    WHERE screen_name = '{name}'
    """
	cursor.execute(fetch_player_sql)
	return cursor.fetchone()

if __name__ == '__main__':
	app.run(use_reloader=False,
            host='127.0.0.1',
            port=3000,
            debug=True)
import json
import random

from geopy.distance import distance

from backend.game import Database
from backend.game.Game import PlayerManager
from backend.game.Plane import PlaneManager


class Cargo:
	def __init__(self, json_obj:dict):
		self.id = int(json_obj["id"])
		self.delivery_value = int(json_obj["delivery_value"])
		self.weight = int(json_obj["weight"])
		self.description = json_obj["description"]

	def __str__(self):
		return json.dumps(self.__dict__)

class CargoManager:
	def __init__(self, db: Database):
		self.database = db
		self.cargo = []
		self.load_cargo()

	def load_cargo(self):
		cargo_data = self.database.fetch_data("cargo")
		for cargo in cargo_data:
			self.cargo.append(Cargo(cargo))

	def get_random_cargo(self, number_of_cargo: int) -> list:
		cargo = []
		for i in range(number_of_cargo):
			cargo.append(self.cargo[random.randint(0, len(self.cargo)-1)])
		return cargo

class Contract:
	def __init__(self,cargo:list,airport:list,reward:int,distance:int):
		self.cargo = cargo
		self.airport = airport
		self.reward = reward
		self.distance = distance

	def __str__(self):
		return json.dumps(self.__dict__)

class ContractManager:
	def __init__(self, db:Database, plane_m: PlaneManager, player_m: PlayerManager):
		self.database = db
		self.cargo_manager = CargoManager(db)
		self.plane_m = plane_m
		self.player_m = player_m

	def generate_contract(self, username: str) -> Contract:
		ap_type = "large_airport"
		player = self.player_m.get_player(username)
		"""if self.plane_m.get_plane_by_id(player.rented_plane).type=="helicopter":
			ap_type = "heliport"
		elif self.plane_m.get_plane_by_id(player.rented_plane).type=="cargo_plane":
			ap_type = "large_airport"
		elif self.plane_m.get_plane_by_id(player.rented_plane).type=="small_plane":
			ap_type = "small_airport"
		"""
		airports = self.database.get_airports_by_distance(ap_type,2000,username,20)
		print(airports[0])
		cargo = self.cargo_manager.get_random_cargo(3)
		cargo_value = 0
		cargo_dict = []
		for carg in cargo:
			cargo_dict.append(carg.__dict__)
		for c in cargo:
			print(c)
			cargo_value += c.delivery_value
		reward = cargo_value*0.2
		distance_to_airport = airports[0]["distance"]

		return Contract(cargo_dict,airports,reward,distance_to_airport)
import json
import random
import time

from geopy.distance import distance

from backend.game import Database


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
	def __init__(self, db:Database):
		self.database = db
		self.cargo_manager = CargoManager(db)

	def generate_contract(self, username: str) -> Contract:
		airports = self.database.get_airports_by_distance("large_airport",2000,username,20)
		cargo = self.cargo_manager.get_random_cargo(3)
		cargo_value = 0
		cargo_dict = []
		for carg in cargo:
			cargo_dict.append(carg.__dict__)
		for c in cargo:
			cargo_value += c.delivery_value
		reward = cargo_value*0.2
		distance_to_airport = airports[0]["distance"]
		contract = Contract(cargo_dict,airports,reward,distance_to_airport)
		print(f"{int(time.time())}|'Contract.ContractManager.generate_contract': Generated contract {contract}")
		return contract
import json
import random

from backend.game import Database


class Cargo:
	def __init__(self, json:dict):
		self.id = int(json["id"])
		self.delivery_value = int(json["delivery_value"])
		self.weight = int(json["weight"])
		self.description = json["description"]

	def __str__(self):
		return json.dumps(self.__dict__)

class CargoManager:
	def __init__(self, db: Database):
		self.database = db
		self.cargo = []
		self.load_cargo()

	def load_cargo(self):
		cargo_data = self.database.fetch_data("plane")
		for cargo in cargo_data:
			print(cargo)
			self.cargo.append(Cargo(cargo_data))

	def get_random_cargo(self, number_of_cargo: int) -> list:
		cargo = []
		for i in range(number_of_cargo):
			cargo.append(self.cargo[random.randint(0, len(self.cargo))].__dict__)
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

	def generate_contract(self) -> Contract:
		return None
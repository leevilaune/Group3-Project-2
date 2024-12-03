from backend.game.Database import Database

class Game:
	def __init__(self, db:Database):
		self.database = db

class Player:
	def __init__(self, json):
		self.id = json["id"]
		self.co2_consumed = json["co2_consumed"]
		self.co2_budget = json["co2_budget"]
		self.location = json["location"]
		self.screen_name = json["screen_name"]
		self.currency = json["currency"]
		self.fuel_amount = json["fuel_amount"]
		self.rented_plane = json["rented_plane"]
		self.current_day = json["current_day"]

	def update(self, json:dict):
		for key, value in json.items():
			if hasattr(self, key) and value is not None:
				setattr(self, key, value)
		print(self.__dict__)


class PlayerManager:
	def __init__(self, db:Database):
		self.db = db
		self.players = []

	def login(self, screen_name:str):
		"""
		:param screen_name:
		:return:
		"""

		self.players.append(Player(self.db.get_player_data(screen_name)))

	def logout(self, screen_name:str):
		"""
		:param screen_name:
		:return:
		"""

	def player_exists(self, screen_name: str) -> bool:
		return self.db.get_player_data(screen_name) is not None

	def get_player(self, screen_name:str) -> Player:
		for p in self.players:
			if p.screen_name == screen_name:
				return p
	def update_player(self, screen_name:str, json:dict):
		self.get_player(screen_name).update(json)
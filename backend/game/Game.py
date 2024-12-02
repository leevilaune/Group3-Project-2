from backend.game.Database import Database

class Game:
	def __init__(self, db:Database):
		self.database = db

class Player:
	def __init__(self, json):
		self.id = int(json["id"])
		self.co2_consumed = int(json["co2_consumed"])
		self.co2_budget = int(json["co2_budget"])
		self.location = json["location"]
		self.screen_name = json["screen_name"]
		self.currency = int(json["currency"])
		self.fuel_amount = int(json["fuel_amount"])
		self.rented_plane = int(json["rented_plane"])
		self.current_day = int(json["current_day"])

class PlayerManager:
	def __init__(self, db:Database):
		self.db = db
		self.players = []

	def login(self, screen_name:str):
		"""
		:param screen_name:
		:return:
		"""
		self.players.append(self.db.get_player_data(screen_name))

	def logout(self, screen_name:str):
		"""
		:param screen_name:
		:return:
		"""

	def get_player(self, screen_name:str) -> Player:
		for p in self.players:
			if p.screen_name == screen_name:
				return p
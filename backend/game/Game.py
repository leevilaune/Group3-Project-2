# fmt: off
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

		# get all the existing players from the database
		players = self.db.fetch_data("game")
		for player in players:
			self.players.append(Player(player))

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
		return self.db.user_exists_by_name(screen_name)

	def get_player(self, screen_name:str) -> Player:
		for p in self.players:
			if p.screen_name == screen_name:
				return p
	def update_player(self, screen_name:str, json:dict):
		player = self.get_player(screen_name)
		player.update(json)
		self.db.update_data([player.__dict__],"game","screen_name")
		print("Committed to DB")
		print(self.db.get_player_data(screen_name))


class Game:
	def __init__(self, db:Database,pm: PlayerManager,plm:PlaneManager):
		self.db = db
		self.pm = pm
		self.plm = plm

	def calculate_distance(self, old_ap:str,new_ap:str) -> float:
		old_airport = self.db.get_airport(old_ap)
		new_airport = self.db.get_airport(new_ap)

		if old_airport is None or new_airport is None:
			raise ValueError("One or both airports could not be found.")

		old_cords = (old_airport['latitude_deg'], old_airport['longitude_deg'])
		new_cords = (new_airport['latitude_deg'], new_airport['longitude_deg'])

		dist = distance(old_cords, new_cords).kilometers
		return dist

	def calculate_spent_fuel(self, dist:float,screen_name:str) -> int:
		plane = self.plm.get_plane_by_id(self.pm.get_player(screen_name).rented_plane)
		return int((plane.fuel_consumption * dist / 100) * 0.8)

	def land(self, from_icao: str, to_icao: str,screen_name:str) -> dict:
		player = self.pm.get_player(screen_name)
		dist = self.calculate_distance(from_icao,to_icao)
		plane = self.plm.get_plane_by_id(self.pm.get_player(screen_name).rented_plane)
		fuel_amount = player.fuel_amount - self.calculate_spent_fuel(dist,screen_name)
		time = dist/plane.max_speed * 60
		print(player.current_day)
		current_day = player.current_day + (time / 1440)
		print(current_day)
		update = {
			"current_day":current_day,
			"fuel_amount":fuel_amount,
		}
		return update

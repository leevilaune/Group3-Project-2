import json
import random
import time

from backend.game.Database import Database

class Plane:
	def __init__(self, json:dict):
		self.id = int(json["id"])
		self.type = json["type"]
		self.fuel_consumption = int(json["fuel_consumption"])
		self.max_speed = int(json["max_speed"])

	def __str__(self):
		return json.dumps(self.__dict__)

class PlaneManager:
	def __init__(self, db: Database):
		self.database = db
		self.planes = []
		self.load_planes()

	def load_planes(self):
		plane_data = self.database.fetch_data("plane")
		for plane in plane_data:
			self.planes.append(Plane(plane))

	def get_random_planes(self,number_of_planes:int) -> list:
		planes = []
		for i in range(number_of_planes):
			planes.append(self.planes[random.randint(0, len(self.planes))].__dict__)
		return planes

	def get_plane_by_id(self, plane_id:int) -> Plane:
		for plane in self.planes:
			if plane.id == plane_id:
				print(f"'Plane.PlaneManager.get_plane_by_id': Getting plane: {plane}")
				return plane
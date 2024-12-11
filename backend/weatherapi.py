from backend.game.Database import Database
from backend.game.Game import PlayerManager

import requests


class WeatherApi:
    def __init__(self, db: Database, plm: PlayerManager):
        self.db = db
        self.plm = plm
        self.name = "name"
        self.apiKey = db.apiKey

    def get_weather(self, screen_name):
        currentPlayer = self.plm.get_player(screen_name)
        airport = self.db.get_airport(currentPlayer.location)
        res = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?lat={airport['latitude_deg']}&lon={airport['longitude_deg']}&appid={self.apiKey}"
        )
        if res.status_code == 200:
            return res.json()
        else:
            return None

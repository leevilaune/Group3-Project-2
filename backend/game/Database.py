import mysql.connector
import json
import os

class Database:

	def __init__(self):
		current_dir = os.path.dirname(__file__)
		db_path = os.path.join(current_dir, '..', '..', 'db.json')
		with open(db_path) as file:
			database = json.load(file)
		self.connection = mysql.connector.connect(
			host=database["host"],
			port=database["port"],
			database=database["database"],
			username=database["username"],
			password=database["password"],
			autocommit=True,
			buffered=True,
		)
		self.cursor = self.connection.cursor(dictionary=True)
		self.validate_database()

	def validate_database(self):
		"""
		alter the database if incorrectly formatted,
		assumes that the base is flight game database given
		:return:
		"""
		cursor = self.cursor

		cursor.execute("DROP TABLE IF EXISTS goal_reached")
		cursor.execute("DROP TABLE IF EXISTS goal")

		cursor.execute("""
            CREATE TABLE IF NOT EXISTS country (
                iso_country VARCHAR(40) PRIMARY KEY,
                name VARCHAR(40),
                continent VARCHAR(40),
                wikipedia_link VARCHAR(40),
                keywords VARCHAR(40)
            );
        """)
		cursor.execute("""
            CREATE TABLE IF NOT EXISTS airport (
                id INT(11) PRIMARY KEY,
                ident VARCHAR(40),
                type VARCHAR(40),
                name VARCHAR(40),
                latitude_deg DOUBLE,
                longitude_deg DOUBLE,
                elevation_ft INT(11),
                continent VARCHAR(40),
                iso_country VARCHAR(40),
                iso_region VARCHAR(40),
                municipality VARCHAR(40),
                scheduled_service VARCHAR(40),
                gps_code VARCHAR(40),
                iata_code VARCHAR(40),
                local_code VARCHAR(40),
                home_link VARCHAR(40),
                wikipedia_link VARCHAR(40),
                keywords VARCHAR(40),
                FOREIGN KEY (iso_country) REFERENCES country(iso_country)
            );
        """)
		cursor.execute("""
            CREATE TABLE IF NOT EXISTS plane (
                id INT(8),
                type VARCHAR(40),
                fuel_consumption INT(32),
                max_speed INT(16),
                PRIMARY KEY (id)
            );
        """)
		cursor.execute("""
            ALTER TABLE game 
                MODIFY COLUMN id INT(11) AUTO_INCREMENT,
                MODIFY COLUMN IF EXISTS current_day FLOAT,
                ADD COLUMN IF NOT EXISTS (currency INT(32),
                rented_plane INT(8),
                fuel_amount INT (8),
                current_day FLOAT,
                FOREIGN KEY (rented_plane) REFERENCES plane(id)
                )
        """)
		cursor.execute("""
            CREATE TABLE IF NOT EXISTS cargo (
                id INT(8),
                delivery_value INT(16),
                weight INT(16),
                description TEXT,
                PRIMARY KEY (id)
            );
        """)
		cursor.execute("""
            CREATE TABLE IF NOT EXISTS cargo_list (
                game_id INT(11),
                cargo_id INT(8),
                PRIMARY KEY (game_id, cargo_id)
            );
        """)

	def get_current_airport(self, user: str) -> dict:
		"""
		Fetch current airport player is in

		:param user: screen_name.
		:return: current airport or None.
		"""
		sql_fetch_current_airport = f"""
            SELECT *
            FROM airport
            INNER JOIN game ON location = ident
            WHERE screen_name = "{user}"
        """
		self.cursor.execute(sql_fetch_current_airport)
		result = self.cursor.fetchone()
		return result if result else None

	def get_airport(self, icao: str) -> dict:
		"""
		Fetch airport from database by icao
		:param icao:
		:return airport:
		"""
		self.cursor.execute(f"SELECT * FROM airport WHERE ident='{icao}'")
		return self.cursor.fetchall()[0]

	def get_random_airport(self, amount: int) -> list:
		self.cursor.execute(f"SELECT * FROM airport WHERE type IN ('large_airport') ORDER BY RAND() LIMIT {amount}")
		return self.cursor.fetchall()

	def get_airports_by_iso(self, iso: str) -> list:
		"""
		Fetch all airport from country by country's iso code
		:param iso:
		:return:
		"""
		self.cursor.execute(f"SELECT * FROM airport WHERE iso_country='{iso}'")
		return self.cursor.fetchall()

	def get_airports_by_distance(self, airport_type: str, distance: int, user: str, limit: int) -> list:
		"""
		get all airports from the database that are inside certain radius from user's current loc
		:param limit:
		:param airport_type: limit what size of airports we are interested in
		:param distance: radius that we use to look for new airports
		:param user: screen_name of an user
		:return:
		"""

		current_airport = self.get_current_airport(user)

		# some sql voodoo to get all airports in a radius
		sql_get_airports_in_distance = f"""
            SELECT country.name as country, airport.name as airport, ident, latitude_deg, longitude_deg,
                (6371 * acos(
                        cos(radians({current_airport["latitude_deg"]})) * cos(radians(latitude_deg)) *
                        cos(radians(longitude_deg) - radians({current_airport["longitude_deg"]})) +
                        sin(radians(
                            {current_airport["latitude_deg"]})) * sin(radians(latitude_deg))
                )) AS distance
            FROM airport
            inner join country on country.iso_country = airport.iso_country
            WHERE airport.type = "{airport_type}"
            HAVING distance <= {distance} AND distance > 1
            ORDER BY distance
            LIMIT {limit};
        """

		self.cursor.execute(sql_get_airports_in_distance)
		return self.cursor.fetchall()

	def get_airport_by_coords(self, lat: float, lon: float, tolerance=1.0) -> dict:
		"""
		Get an airport by coordinates within a certain tolerance.

		:param lat: Latitude
		:param lon: Longitude
		:param tolerance: Degree of tolerance for latitude/longitude comparison (default 1)
		:return: The matching airport record or None
		"""
		sql = f"""
            SELECT * FROM airport 
            WHERE (latitude_deg BETWEEN {lat - tolerance} AND {lat + tolerance})
            AND (longitude_deg BETWEEN {lon - tolerance} AND {lon + tolerance})
        """
		self.cursor.execute(sql)
		result = self.cursor.fetchone()

		if result is None:
			print(f"No airport found near coordinates ({lat}, {lon})")
		return result

	def get_cargo(self, cargo_id: int) -> dict:
		self.cursor.execute(f"SELECT * FROM cargo WHERE id={cargo_id}")
		return self.cursor.fetchone()

	def get_random_cargo(self, amount: int) -> list:
		self.cursor.execute(f"SELECT * FROM cargo ORDER BY RAND() LIMIT {amount}")
		return self.cursor.fetchall()

	def get_cargo_in_game(self, game_id: int) -> list:
		self.cursor.execute(f"""SELECT cargo_id 
                                FROM cargo_list 
                                WHERE game_id={game_id}
                            """)
		return self.cursor.fetchall()

	def assign_cargo(self, cargo_id: int, user: str):
		"""
		assign_cargo to user by cargo_id
		:param cargo_id:
		:param user: screen_name of an user
		:return:
		"""
		sql_assign_cargo = f"""
            INSERT INTO cargo_list (game_id, cargo_id)
            VALUES (
                (SELECT id FROM game WHERE screen_name = "{user}"),
                (SELECT id FROM cargo WHERE id = {cargo_id})
            )
        """
		self.cursor.execute(sql_assign_cargo)

	def remove_cargo(self, user: str):
		"""
		remove ALL cargo from user by screen_name
		:param user: screen_name of an user
		:return:
		"""
		sql_remove_cargo = f"""
            delete from cargo_list
            where game_id = (
                select id
                from game
                where screen_name = "%s"
                LIMIT = 1
            )
        """
		self.cursor.execute(sql_remove_cargo, user)

	def get_plane(self, user: str) -> dict:
		"""
		get the current plane user is flying from the database
		:param user: screen_name of an user
		:return:
		"""
		sql_get_plane = f"""
        SELECT *
        FROM plane
        WHERE id = (
            SELECT rented_plane
            FROM game
            WHERE screen_name = "{user}"
        )
        """

		self.cursor.execute(sql_get_plane)
		return self.cursor.fetchall()[0]

	def add_data(self, data: list, table: str):
		"""
		Add data to a table, the data needs to be in the same format
		:param data: list of dictionaries, where each dictionary is a row
		:param table: name of the table
		:return:
		"""
		for item in data:
			columns = ','.join([str(name) for name, val in item.items()])
			values = ','.join([f"'{val}'" if isinstance(val, str) else str(val) for name, val in item.items()])
			statement = f"INSERT IGNORE INTO {table} ({columns}) VALUES ({values});"
			print(statement)
			self.cursor.execute(statement)

	def update_data(self, data: list, table: str, id_column="id"):
		"""
		Update data in a table, the data needs to be in the same format
		:param data: list of dictionaries, where each dictionary is a row
		:param table: name of the table
		:param id_column: name of the field we use to narrow down
		:return:
		"""

		for item in data:
			# Extract columns and values from the dictionary
			columns = [f"{key} = %s" for key in item if key != id_column]
			values = [item[key] for key in item if key != id_column]
			id_value = item[id_column]

			# Prepare the SQL update query
			sql = f"UPDATE {table} SET {', '.join(columns)} WHERE {id_column} = %s"
			values.append(id_value)
			self.cursor.execute(sql, values)

	def update_fuel_amount(self, fuel_amount: float, operator: str, user: str):
		"""
		Update the fuel amount
		:param fuel_amount:  of fuel to be added or subtracted
		:param operator: "+" or "-" to subtract or add
		:param user: screen_name of the user
		"""
		sql_update_fuel_amount = f"""
                UPDATE game
                SET fuel_amount = fuel_amount {operator} {fuel_amount}
                WHERE screen_name = "{user}"
            """
		if fuel_amount > 0 and (operator == "+" or operator == "-"):
			self.cursor.execute(sql_update_fuel_amount)
		else:
			return Exception("Incorrect operator or fuel amount")
		return "fuel updated"

	def add_time(self, amount_min: int, user: str):
		sql = f"UPDATE game SET current_day=current_day+{amount_min / 3600} WHERE screen_name='{user}'"
		self.cursor.execute(sql)

	def update_currency_amount(self, currency, operator, user):
		"""
		Update the currency amount
		"""
		sql_update_currency_amount = f"""
                UPDATE game
                SET currency = currency {operator} {currency}
                WHERE screen_name = "{user}"
            """
		self.cursor.execute(sql_update_currency_amount)

	def fetch_data(self, table: str):
		"""
		Get the whole table from the database
		:param table: name of the table
		:return:
		"""
		sql_get_data = f"""
            SELECT *
            FROM {table}
            """
		self.cursor.execute(sql_get_data)
		if self.cursor.rowcount == 0:
			metadata = self.cursor.description
			column_names = [i[0] for i in metadata]
			output = dict(zip(column_names, [None] * len(column_names)))
			return output
		else:
			return self.cursor.fetchall()

	def fetch_data_row(self, table: str, column: str, operator: str, data: str) -> dict:
		"""
		Get the specific row from a table from the database
		:param table: name of the table
		:param column: the specific column
		:param operator: using default SQL operators
		:param data: data being looked for in the column
		:return:
		"""
		sql_get_data_row = f"""
            SELECT *
            FROM {table}
            WHERE {column} {operator} {data}
            """
		self.cursor.execute(sql_get_data_row)
		if self.cursor.rowcount == 0:
			return None
		else:
			return self.cursor.fetchone()

	def fetch_data_max(self, table: str, data: str):
		"""
		get the whole table from the database
		:param data: name of the column
		:param table: name of the table
		:return:
		"""
		sql_get_data_max = f"""
            SELECT MAX({data}) AS Output
            FROM {table}
            """
		self.cursor.execute(sql_get_data_max)
		return self.cursor.fetchall()

	def get_random_plane(self, amount: int) -> list:
		self.cursor.execute(f"SELECT * FROM plane ORDER BY RAND() LIMIT {amount}")
		return self.cursor.fetchall()

	def set_plane(self, user: str, plane_id: int, price: int):
		"""
		Get the current plane user is flying from the database
		:param price:
		:param user: screen_name of an user
		:param plane_id: id of the plane in planes table
		:return:
		"""
		sql_set_plane = f"UPDATE game SET rented_plane = {plane_id}, currency = currency-{price} WHERE screen_name = '{user}'"
		self.cursor.execute(sql_set_plane)

	def user_exists_by_name(self, user: str) -> bool:
		"""
		check if user exists by screen_name
		:param user:
		:return:
		"""
		sql = f"""
            SELECT screen_name
            FROM game
            WHERE screen_name = '{user}'
        """
		self.cursor.execute(sql)
		if len(self.cursor.fetchall()) > 0:
			return True
		return False

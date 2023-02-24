import sys
sys.path.append("../")

from pymongo import MongoClient
from dbmanager import DbManager
import json
import tomllib


with open('config.toml', 'rb') as f:
            conf = tomllib.load(f)

mongo_client = MongoClient(conf["MongoDb"]["host"], conf["MongoDb"]["port"])

db_battle = mongo_client['inkoverlay'].battleHistory
db_coop = mongo_client['inkoverlay'].coopHistory

db = DbManager('./battlehistory.db')

battle_histories = [json.loads(x[1]) for x in db.get_cursor().execute('SELECT * from history WHERE type=="battle"').fetchall()]
for battle_history in battle_histories:
    if db_battle.find_one({"id": battle_history["id"]}) is None:
        db_battle.insert_one(battle_history)

coop_histories = [json.loads(x[1]) for x in db.get_cursor().execute('SELECT * from history WHERE type=="coop"').fetchall()]
for coop_history in coop_histories:
    if db_coop.find_one({"id": coop_history["id"]}) is None:
        db_coop.insert_one(coop_history)
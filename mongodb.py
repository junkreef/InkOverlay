import logging
import pymongo.errors
from pymongo import MongoClient
from pymongo.collection import Collection


class MongoDbConnector:
    def __init__(self, host, port, username=None, password=None, authSource=None) -> None:
        self.logger = logging.getLogger('inkoverlay')
        self.mongo_client = MongoClient(
            host, port, username=username, password=password, authSource=authSource)
        self.battle = self.mongo_client['inkoverlay'].battleHistory
        self.coop = self.mongo_client['inkoverlay'].coopHistory

    def is_exists(self, collection: Collection, key, value) -> bool:
        if collection.count_documents({key: value}, limit=1) != 0:
            return True
        else:
            return False

    def insert_document(self, collection: Collection, document: dict, key: str = "id", force=False):
        result = None
        try:
            if force == False:
                result = collection.replace_one(
                    filter={key: document[key]},
                    replacement=document,
                    upsert=True
                )
            else:
                result = collection.insert_one(document)
        except pymongo.errors.DuplicateKeyError:
            self.logger.exception(
                key + "=" + document[key] + " is already stored and duplicated.")
        except pymongo.errors.OperationFailure:
            self.logger.exception(
                "During upserting " + key + "=" + document[key] + " Operation Failure is raised.")
        finally:
            return result

    def find_document_by_id(self, collection: Collection, value, key: str = "id") -> dict:
        return collection.find_one({key: value}, {"_id": 0})

    def find_document_latest(self, collection: Collection, key="playedTime", sort_order=-1) -> dict:
        c = collection.find({}, {"_id": 0}).sort(key, sort_order).limit(1)
        try:
            return c.next()
        except StopIteration:
            return None

import asyncio
import aiohttp
from typing import List
from s3s import s3s
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from dbmanager import DbManager
import multiprocessing
import os
import logging
import requests
from mongodb import MongoDbConnector
import tomllib
from datetime import datetime


class StatsManager:
    def __init__(self, loop=None) -> None:
        self.logger = logging.getLogger('inkoverlay')
        self._executor = ThreadPoolExecutor(
            (multiprocessing.cpu_count() * 2) + 1)
        self.loop = loop if loop is not None else asyncio.get_running_loop()

        with open('config.toml', 'rb') as f:
            conf = tomllib.load(f)

        self.mongodb = MongoDbConnector(conf["MongoDb"]["host"], conf["MongoDb"]["port"],
                                        conf["MongoDb"]["user"], conf["MongoDb"]["password"], authSource='inkoverlay')

        if not os.path.isdir('./static/img'):
            self.logger.info("Creating directory ./static/img")
            os.makedirs('./static/img')

    async def _get_from_url(self, url, filepath):
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                data = await response.text()
                with open(filepath, mode='wb') as f:
                    f.write(data)

    async def _store_non_exists_battle_history(self, battle_history):
        if (self.mongodb.is_exists(self.mongodb.battle, "id", battle_history["id"]) == 0):
            # The battle_history is not found in the database => Insert record

            # Fetch battle detail json from Switch Online Server
            battle_detail = await self.fetch_battle_detail(battle_history["id"])
            if battle_detail is None:
                self.logger.warn(
                    "Failed to fetch battle detail " + battle_history["id"] + ".")
                return False

            battle_detail = battle_detail["data"]["vsHistoryDetail"]

            for p in battle_detail["myTeam"]["players"]:
                if not os.path.isfile('./static/img/' + p["weapon"]["id"] + '.png'):
                    self.loop.run_in_executor(
                        self._executor,
                        partial(self._get_from_url, p["weapon"]["image2d"]
                                ["url"], './static/img/' + p["weapon"]["id"] + '.png')
                    )

            battle_detail["playedTime"] = datetime.fromisoformat(
                battle_detail["playedTime"])

            self.mongodb.insert_document(self.mongodb.battle, battle_detail)
            return True

        else:
            # The battle_history is already stored in the database
            return False

    async def store_battle_histories(self, battle_histories) -> List[bool]:
        async with asyncio.TaskGroup() as tg:
            tasks = []
            for battle_history in battle_histories:
                tasks.append(tg.create_task(
                    self._store_non_exists_battle_history(battle_history)))

        return tasks

    async def fetch_battle_histories(self):
        for _ in range(3):
            try:
                battle_histories = await self.loop.run_in_executor(self._executor, partial(s3s.fetch_json_raw, "LatestBattleHistoriesQuery"))
            except requests.exceptions.ConnectionError:
                self.logger.exception("Connection Error on fetch_battle_histories()")     
                pass
            except Exception as e:
                self.logger.exception("Exception on fetch_battle_histories()")
                pass
            else:
                break
        else:
            return None

        return battle_histories["data"]["latestBattleHistories"]["historyGroups"]["nodes"][0]["historyDetails"]["nodes"]

    async def fetch_battle_detail(self, id):
        for _ in range(3):
            try:
                battle_detail = await self.loop.run_in_executor(self._executor, partial(s3s.fetch_detailed_result, True, id))
            except requests.exceptions.ConnectionError:
                self.logger.exception("Connection Error on fetch_battle_detail()")     
                pass
            except Exception as e:
                self.logger.exception("Exception on fetch_battle_detail()")
                pass
            else:
                break
        else:
            return None
        
        return battle_detail

    async def store_battle_histories(self, battle_histories) -> List[bool]:
        async with asyncio.TaskGroup() as tg:
            tasks = []
            for battle_history in battle_histories:
                tasks.append(tg.create_task(
                    self._store_non_exists_battle_history(battle_history)))

        return tasks

    async def sync_battle_histories(self):
        self.logger.debug(
            "Syncing battle histories between NSO and local database...")
        battle_histories = await self.fetch_battle_histories()
        if battle_histories is None:
            self.logger.warn("Failed to fetch battle histories.")
            return

        latest_id = self.mongodb.find_document_latest(
            self.mongodb.battle)["id"]
        latest_index = None

        for i, doc in enumerate(battle_histories):
            if doc["id"] == latest_id:
                latest_index = i

        if latest_index is not None:
            del battle_histories[latest_index:]

        tasks = await self.store_battle_histories(battle_histories)
        if (num_inserted := sum([bool(task.result()) for task in tasks])):
            self.logger.info(str(num_inserted) +
                             " battle record(s) are inserted.")
        else:
            self.logger.debug("No new battle histories are found on NSO.")

    async def _store_non_exists_coop_history(self, coop_history):
        if (self.mongodb.is_exists(self.mongodb.coop, "id", coop_history["id"]) == 0):
            # The coop_history is not found in the database => Insert record

            # Fetch coop detail json from Switch Online Server
            coop_detail = await self.fetch_coop_detail(coop_history["id"])
            if coop_detail is None:
                self.logger.warn(
                    "Failed to fetch coop detail " + coop_history["id"] + ".")
                return False

            coop_detail = coop_detail["data"]["coopHistoryDetail"]

            # add schedule info to detail data
            coop_detail["startTime"] = datetime.fromisoformat(
                coop_history["startTime"])
            coop_detail["endTime"] = datetime.fromisoformat(
                coop_history["endTime"])
            coop_detail["mode"] = coop_history["mode"]
            coop_detail["rule"] = coop_history["rule"]

            coop_detail["playedTime"] = datetime.fromisoformat(
                coop_detail["playedTime"])

            self.mongodb.insert_document(self.mongodb.coop, coop_detail)
            return True
        else:
            # The coop_history is already stored in the database
            return False

    async def store_coop_histories(self, coop_histories) -> List[bool]:
        async with asyncio.TaskGroup() as tg:
            tasks = []
            for coop_history in coop_histories:
                tasks.append(tg.create_task(
                    self._store_non_exists_coop_history(coop_history)))

        return tasks

    async def fetch_coop_histories(self):
        for _ in range(3):
            try:
                coop_histories = await self.loop.run_in_executor(
                    self._executor,
                    partial(s3s.fetch_json_raw, "CoopHistoryQuery")
                    )
            except requests.exceptions.ConnectionError:
                self.logger.exception("Connection Error on fetch_coop_histories()")
                pass
            except Exception as e:
                self.logger.exception("Exception on fetch_coop_histories()")
                pass
            else:
                break
        else:
            return None

        ret = []
        for i in coop_histories["data"]["coopResult"]["historyGroups"]["nodes"]:
            for j in i["historyDetails"]["nodes"]:
                j["startTime"] = i["startTime"]
                j["endTime"] = i["endTime"]
                j["mode"] = i["mode"]
                j["rule"] = i["rule"]
            ret.extend(i["historyDetails"]["nodes"])

        return ret

    async def fetch_coop_detail(self, id):
        for _ in range(3):
            try:
                coop_detail = await self.loop.run_in_executor(self._executor, partial(s3s.fetch_detailed_result, False, id))
            except requests.exceptions.ConnectionError:
                self.logger.exception("Connection Error on fetch_coop_detail()")     
                pass
            except Exception as e:
                self.logger.exception("Exception on fetch_coop_detail()")
                pass
            else:
                break
        else:
            return None

        return coop_detail

    async def sync_coop_histories(self):
        self.logger.debug(
            "Syncing coop histories between NSO and local database...")
        coop_histories = await self.fetch_coop_histories()
        if coop_histories is None:
            self.logger.warn("Failed to fetch coop histories.")
            return

        latest_id = self.mongodb.find_document_latest(self.mongodb.coop)["id"]
        latest_index = None

        for i, doc in enumerate(coop_histories):
            if doc["id"] == latest_id:
                latest_index = i

        if latest_index is not None:
            del coop_histories[latest_index:]

        tasks = await self.store_coop_histories(coop_histories)
        if (num_inserted := sum([bool(task.result()) for task in tasks])):
            self.logger.info(str(num_inserted) +
                             " coop record(s) are inserted.")
        else:
            self.logger.debug("No new coop histories are found on NSO.")


if __name__ == "__main__":
    try:
        with asyncio.Runner() as runner:
            stats_manager = StatsManager(runner.get_loop())
            runner.run(stats_manager.run_periodical_sync())

    except* BaseException as eg:
        print(eg.exceptions)

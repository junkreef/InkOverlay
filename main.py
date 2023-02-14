import multiprocessing
from multiprocessing import Process, active_children
from threading import Thread
import threading
import asyncio
import time
import gunicorn.app.base
import signal
import os
import logging
import logging.config
import yaml

from statsmanager import StatsManager
import inkoverlay
from s3s import s3s

process_list: dict[str, Process] = {}
logger:logging.Logger = None


class InkOverlayServer(gunicorn.app.base.BaseApplication):

    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        config = {key: value for key, value in self.options.items()
                  if key in self.cfg.settings and value is not None}
        for key, value in config.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        return self.application


def stats_sync():
    signal.signal(signal.SIGINT, signal.SIG_DFL)
    signal.signal(signal.SIGTERM, signal.SIG_DFL)
    try:
        with asyncio.Runner() as runner:
            stats_manager = StatsManager(runner.get_loop())
            while True:
                runner.run(stats_manager.sync_battle_histories())
                runner.run(stats_manager.sync_coop_histories())
                time.sleep(15)

    except asyncio.TimeoutError as e:
        logger.exception(e)

    except asyncio.CancelledError as e:
        logger.exception(e)

    except asyncio.InvalidStateError as e:
        logger.exception(e)


def overlay_server():
    signal.signal(signal.SIGINT, signal.SIG_DFL)
    signal.signal(signal.SIGTERM, signal.SIG_DFL)
    options = {
        'bind': '%s:%s' % ('127.0.0.1', '5000'),
        'workers': (multiprocessing.cpu_count() * 2) + 1,
    }
    InkOverlayServer(inkoverlay.app, options).run()


def app_terminator(num, frame):
    for p in active_children():
        p.terminate()
    # for pname, p in process_list.items():
    #     os.kill(p.pid, signal.SIGTERM)


def main():
    s3s.prefetch_checks(printout=True)

    with open('logger.yaml')as f:
        logging.config.dictConfig(yaml.safe_load(f.read()))
        logger = logging.getLogger('inkoverlay')
    
    process_list["stats_sync"] = Process(target=stats_sync, name="stats_sync")
    process_list["overlay"] = Process(target=overlay_server, name="overlay")
    # overlay_server()

    signal.signal(signal.SIGINT, app_terminator)
    signal.signal(signal.SIGTERM, app_terminator)

    for pname, p in process_list.items():
        logger.info("Starting " + pname + "...")
        p.start()

    signal.pause()
    for pname, p in process_list.items():
        logger.info("Confirming " + pname + " successfully shutted down...")
        p.join()

    logger.info("Shutting down: InkOverlay")

    return


if __name__ == "__main__":
    main()

import tomllib
from flask import Flask, abort
import json
from mongodb import MongoDbConnector

app = Flask(__name__)

with open('config.toml', 'rb') as f:
    conf = tomllib.load(f)

mongodb = MongoDbConnector(conf["MongoDb"]["host"], conf["MongoDb"]["port"],
                           conf["MongoDb"]["user"], conf["MongoDb"]["password"], authSource='inkoverlay')


@app.route("/")
def hello_world():
    return "<p>Hello world!</p>"


@app.route("/battle/<id>")
def get_battle_detail(id):
    if id == "latest":
        data = mongodb.find_document_latest(mongodb.battle)
        data["playedTime"] = data["playedTime"].strftime("%Y-%m-%dT%H:%M:%SZ")
        "2023-01-22T15:39:59Z"
        if data is not None:
            return json.dumps(data, separators=(',', ':'))
        else:
            abort(404)

    else:
        c = mongodb.battle.find({"id": id}, {"_id": 0})
        try:
            data = c.next()
            data["playedTime"] = data["playedTime"].strftime(
                "%Y-%m-%dT%H:%M:%SZ")
            return json.dumps(data, separators=(',', ':'))
        except StopIteration:
            abort(404)

# @app.route("/stats/winratio")
# def get_stats_winratio():
#     db = DbManager("./battlehistory.db")
#     date_before = request.args.get('before')
#     date_after = request.args.get('after')
#     mode = request.args.get('mode')
#     rule = request.args.get('rule')
#     weapon = request.args.get('weapon')

#     template = j2env.get_template('win_ratio.sql.j2')
#     c = db.get_cursor()
#     print(template.render({
#         "mode": mode,
#         "rule": rule,
#         "before": date_before,
#         "after": date_after,
#         "weapon": weapon,
#     }))
#     c.execute(template.render({
#         "mode": mode,
#         "rule": rule,
#         "before": date_before,
#         "after": date_after,
#         "weapon": weapon,
#     }))

#     data = {}
#     while (i := c.fetchone()) is not None:
#         data[i[0]] = i[1]

#     return data


def overlay_server():
    # Finally boot Flask
    app.run(host="0.0.0.0", port="5000", debug=False)


if __name__ == "__main__":
    overlay_server()

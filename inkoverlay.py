from flask import Flask, abort, request
from s3s import s3s
from dbmanager import DbManager
import json
from jinja2 import Template, Environment, FileSystemLoader

app = Flask(__name__)
j2env = Environment(loader=FileSystemLoader('./sql_template'))

@app.route("/")
def hello_world():
    return "<p>Hello world!</p>"


@app.route("/latestbattlehistory")
def get_latest_battle_history():
    return s3s.fetch_json_raw("LatestBattleHistoriesQuery")


@app.route("/battle/<id>")
def get_battle_detail(id):
    db = DbManager("./battlehistory.db")
    if id == "latest":
        c = db.get_cursor()
        c.execute("SELECT id, json FROM history ORDER BY datetime(json_extract(json, '$.playedTime')) DESC LIMIT 1;")
        data = c.fetchone()
        if data is not None:
            return json.loads(data[1])
        else:
            abort(404)

    else:
        c = db.get_cursor()
        c.execute("SELECT id, json FROM history WHERE id=? LIMIT 1;", (id,))
        data = c.fetchone()
        if data is not None:
            return json.loads(data[1])
        else:
            abort(404)

@app.route("/stats/winratio")
def get_stats_winratio():
    db = DbManager("./battlehistory.db")
    date_before = request.args.get('before')
    date_after = request.args.get('after')
    mode = request.args.get('mode')
    rule = request.args.get('rule')
    weapon = request.args.get('weapon')
    
    template = j2env.get_template('win_ratio.sql.j2')
    c = db.get_cursor()
    print(template.render({
        "mode": mode,
        "rule": rule,
        "before": date_before,
        "after": date_after,
        "weapon": weapon,
    }))
    c.execute(template.render({
        "mode": mode,
        "rule": rule,
        "before": date_before,
        "after": date_after,
        "weapon": weapon,
    }))

    data = {}
    while (i := c.fetchone()) is not None:
        data[i[0]] = i[1]

    return data


    





def overlay_server():
    # Renew NSO tokens
    s3s.prefetch_checks(printout=True)

    # Finally boot Flask
    app.run(host="0.0.0.0", port="5000", debug=False)


if __name__ == "__main__":
    overlay_server()
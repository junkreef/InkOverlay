function float2percent(a) {
    return new Intl.NumberFormat('default', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(a);
}

function float2color(r, g, b, a) {
    r = ('00' + Number(parseInt(r*255, 10)).toString(16)).slice(-2);
    g = ('00' + Number(parseInt(g*255, 10)).toString(16)).slice(-2);
    b = ('00' + Number(parseInt(b*255, 10)).toString(16)).slice(-2);
    a = ('00' + Number(parseInt(a*255, 10)).toString(16)).slice(-2);
    return "#"+r+g+b+a;
}

function change_header_info() {
    if(typeof change_header_info.index == 'undefined') {
        change_header_info.index = -1;
    }
    $(".header-info").eq(change_header_info.index).hide();
    change_header_info.index++;
    if(change_header_info.index == $(".header-info").length) {
        change_header_info.index = 0;
    }
    $(".header-info").eq(change_header_info.index).show();
}

function check_data_availability(data, ...keys) {
    try {
        for (const key of keys) {
            data = data[key];
        }
        return data;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}

async function Fetch_BattleInfo() {
    // fetch("http://" + location.host + "/latestbattlehistory")
    //     .then((res_history) => res_history.json())
    //     .then((LatestBattleHistoriesQuery) => {
    //         BattleHistory = LatestBattleHistoriesQuery["data"]["latestBattleHistories"]["historyGroups"]["nodes"][0]["historyDetails"]["nodes"];

    //         // fetch("http://" + location.host + "/battle/" + BattleHistory[0]["id"])
            
    //     });

    fetch("http://" + location.host + "/battle/latest")
        .then((res_battle) => res_battle.json())
        .then((LastBattleDetail) => {
            switch (LastBattleDetail["vsMode"]["mode"]) {
                case "BANKARA":
                    $(".color-vsmode").attr('style', "color:#F23C13");
                    $("#vs_mode").text("バンカラマッチ");
                    if (LastBattleDetail["knockout"] === "NEITHER") {
                        $("#score").text(LastBattleDetail["myTeam"]["result"]["score"] + "p");
                    } else if (!LastBattleDetail["knockout"]) {
                        $("#score").text("");
                    } else {
                        $("#score").text("ノックアウト！");
                    }
                    break;

                case "REGULAR":
                    $("#vs_mode").text("レギュラーマッチ");
                    $(".color-vsmode").attr('style', "color:#CFF622");
                    break;

                case "FEST":
                    $("#vs_mode").text("フェスマッチ");
                    $(".color-vsmode").attr('style', "color:#CFF622");
                    break;

                case "X_MATCH":
                    $(".color-vsmode").attr('style', "color:#0FDC9B");
                    $("#vs_mode").text("Xマッチ");
                    if (LastBattleDetail["knockout"] === "NEITHER") {
                        $("#score").text(LastBattleDetail["myTeam"]["result"]["score"] + "p");
                    } else if (!LastBattleDetail["knockout"]) {
                        $("#score").text("");
                    } else {
                        $("#score").text("ノックアウト！");
                    }
                    break;

                default:
                    break;
            }

            switch (LastBattleDetail["vsRule"]["id"]) {
                case "VnNSdWxlLTA=": // Turf War (NAWABARI)
                    $(".inkinfo-enable-with-rule[rule='turf']").show();
                    $(".inkinfo-enable-with-rule[rule!='turf']").hide();

                    // Team Colors
                    $(".color-ally").css('color', float2color(
                        LastBattleDetail["myTeam"]["color"]["r"],
                        LastBattleDetail["myTeam"]["color"]["g"],
                        LastBattleDetail["myTeam"]["color"]["b"],
                        LastBattleDetail["myTeam"]["color"]["a"],
                    ));
                    $(".color-enemy").css('color', float2color(
                        LastBattleDetail["otherTeams"][0]["color"]["r"],
                        LastBattleDetail["otherTeams"][0]["color"]["g"],
                        LastBattleDetail["otherTeams"][0]["color"]["b"],
                        LastBattleDetail["otherTeams"][0]["color"]["a"],
                    ));

                    // Paint point of ally
                    $("#score").text("\u00A0");

                    // Team Name
                    if (LastBattleDetail["myTeam"]["festTeamName"]) {
                        $("#battle_turf_ally_stats_teamname").text(LastBattleDetail["myTeam"]["festTeamName"]);
                        $("#battle_turf_enemy_stats_teamname").text(LastBattleDetail["otherTeams"][0]["festTeamName"]);
                    } else {
                        $("#battle_turf_ally_stats_teamname").text("なかま");
                        $("#battle_turf_enemy_stats_teamname").text("あいて");
                    }

                    // Paint Ratio
                    $("#battle_turf_ally_stats_paintRatio").text(float2percent(LastBattleDetail["myTeam"]["result"]["paintRatio"]));
                    $("#battle_turf_enemy_stats_paintRatio").text(float2percent(LastBattleDetail["otherTeams"][0]["result"]["paintRatio"]));

                    // Splat
                    $("#battle_turf_ally_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 3, "result", "kill"))).toString(10)
                    );
                    $("#battle_turf_enemy_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 3, "result", "kill"))).toString(10)
                    );

                    // Splatted
                    $("#battle_turf_ally_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 3, "result", "death"))).toString(10)
                    );
                    $("#battle_turf_enemy_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 3, "result", "death"))).toString(10)
                    );

                    // Personal Stats
                    for (var player of LastBattleDetail["myTeam"]["players"]) {
                        if (player["isMyself"] == true) {
                            $(".inkinfo-personal-stats-username").text(player["name"]);
                            $(".inkinfo-personal-stats-splat").text(
                                (parseInt(player["result"]["kill"]) - parseInt(player["result"]["assist"]))
                                    .toString(10)
                            );
                            $(".inkinfo-personal-stats-splatted").text(player["result"]["death"]);
                            $(".inkinfo-personal-stats-assist").text(player["result"]["assist"]);
                            $(".inkinfo-personal-stats-special").text(player["result"]["special"]);
                            break;
                        }
                    }
                    break;

                case "VnNSdWxlLTM=": // GOAL war (GACHIHOKO)
                case "VnNSdWxlLTQ=": // CLAM war (GACHIASARI)
                case "VnNSdWxlLTI=": // LOFT war (YAGURA)
                    $(".inkinfo-enable-with-rule[rule='bankara']").show();
                    $(".inkinfo-enable-with-rule[rule!='bankara']").hide();

                    // Team Colors
                    $(".color-ally").css('color', float2color(
                        LastBattleDetail["myTeam"]["color"]["r"],
                        LastBattleDetail["myTeam"]["color"]["g"],
                        LastBattleDetail["myTeam"]["color"]["b"],
                        LastBattleDetail["myTeam"]["color"]["a"],
                    ));
                    $(".color-enemy").css('color', float2color(
                        LastBattleDetail["otherTeams"][0]["color"]["r"],
                        LastBattleDetail["otherTeams"][0]["color"]["g"],
                        LastBattleDetail["otherTeams"][0]["color"]["b"],
                        LastBattleDetail["otherTeams"][0]["color"]["a"],
                    ));

                    // Earned point of ally
                    if (LastBattleDetail["knockout"] === "NEITHER") {
                        $("#score").text(LastBattleDetail["myTeam"]["result"]["score"] + "p");
                    } else if (!LastBattleDetail["knockout"]) {
                        $("#score").text("");
                    } else {
                        $("#score").text("ノックアウト！");
                    }

                    // Team Name
                    if (LastBattleDetail["myTeam"]["festTeamName"]) {
                        $("#battle_bankara_ally_stats_teamname").text(LastBattleDetail["myTeam"]["festTeamName"]);
                        $("#battle_bankara_enemy_stats_teamname").text(LastBattleDetail["otherTeams"][0]["festTeamName"]);
                    } else {
                        $("#battle_bankara_ally_stats_teamname").text("なかま");
                        $("#battle_bankara_enemy_stats_teamname").text("あいて");
                    }

                    // Score
                    if (LastBattleDetail["knockout"] === "NEITHER") {
                        $("#battle_bankara_ally_stats_score").text(LastBattleDetail["myTeam"]["result"]["score"] + 'p');
                        $("#battle_bankara_enemy_stats_score").text(LastBattleDetail["otherTeams"][0]["result"]["score"] + 'p');
                    } else if (!LastBattleDetail["knockout"]) {
                        $("#battle_bankara_ally_stats_score").text("-");
                        $("#battle_bankara_enemy_stats_score").text("-");
                    } else {
                        if(LastBattleDetail["judgement"] === "WIN") {
                            $("#battle_bankara_ally_stats_score").text("ノックアウトした！");
                            $("#battle_bankara_enemy_stats_score").text("-");
                        } else {
                            $("#battle_bankara_ally_stats_score").text("-");
                            $("#battle_bankara_enemy_stats_score").text("ノックアウトした！");
                        }
                    }

                    // Splat
                    $("#battle_bankara_ally_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 3, "result", "kill"))).toString(10)
                    );
                    $("#battle_bankara_enemy_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 3, "result", "kill"))).toString(10)
                    );

                    // Splatted
                    $("#battle_bankara_ally_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 3, "result", "death"))).toString(10)
                    );
                    $("#battle_bankara_enemy_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 3, "result", "death"))).toString(10)
                    );

                    // Personal Stats
                    for (var player of LastBattleDetail["myTeam"]["players"]) {
                        if (player["isMyself"] == true) {
                            $(".inkinfo-personal-stats-username").text(player["name"]);
                            $(".inkinfo-personal-stats-splat").text(
                                (parseInt(player["result"]["kill"]) - parseInt(player["result"]["assist"]))
                                    .toString(10)
                            );
                            $(".inkinfo-personal-stats-splatted").text(player["result"]["death"]);
                            $(".inkinfo-personal-stats-assist").text(player["result"]["assist"]);
                            $(".inkinfo-personal-stats-special").text(player["result"]["special"]);
                            break;
                        }
                    }

                    break;

                case "VnNSdWxlLTU=": // TRI_COLOR
                    $(".inkinfo-enable-with-rule[rule='tri']").show();
                    $(".inkinfo-enable-with-rule[rule!='tri']").hide();

                    // Team Colors
                    $(".color-ally").css('color', float2color(
                        LastBattleDetail["myTeam"]["color"]["r"],
                        LastBattleDetail["myTeam"]["color"]["g"],
                        LastBattleDetail["myTeam"]["color"]["b"],
                        LastBattleDetail["myTeam"]["color"]["a"],
                    ));
                    $(".color-enemy").css('color', float2color(
                        LastBattleDetail["otherTeams"][0]["color"]["r"],
                        LastBattleDetail["otherTeams"][0]["color"]["g"],
                        LastBattleDetail["otherTeams"][0]["color"]["b"],
                        LastBattleDetail["otherTeams"][0]["color"]["a"],
                    ));
                    $(".color-enemy2").css('color', float2color(
                        LastBattleDetail["otherTeams"][1]["color"]["r"],
                        LastBattleDetail["otherTeams"][1]["color"]["g"],
                        LastBattleDetail["otherTeams"][1]["color"]["b"],
                        LastBattleDetail["otherTeams"][1]["color"]["a"],
                    ));
                    $(".color-"+LastBattleDetail["myTeam"]["tricolorRole"].toLowerCase()).css('color', float2color(
                        LastBattleDetail["myTeam"]["color"]["r"],
                        LastBattleDetail["myTeam"]["color"]["g"],
                        LastBattleDetail["myTeam"]["color"]["b"],
                        LastBattleDetail["myTeam"]["color"]["a"],
                    ));
                    $(".color-"+LastBattleDetail["otherTeams"][0]["tricolorRole"].toLowerCase()).css('color', float2color(
                        LastBattleDetail["otherTeams"][0]["color"]["r"],
                        LastBattleDetail["otherTeams"][0]["color"]["g"],
                        LastBattleDetail["otherTeams"][0]["color"]["b"],
                        LastBattleDetail["otherTeams"][0]["color"]["a"],
                    ));
                    $(".color-"+LastBattleDetail["otherTeams"][1]["tricolorRole"].toLowerCase()).css('color', float2color(
                        LastBattleDetail["otherTeams"][1]["color"]["r"],
                        LastBattleDetail["otherTeams"][1]["color"]["g"],
                        LastBattleDetail["otherTeams"][1]["color"]["b"],
                        LastBattleDetail["otherTeams"][1]["color"]["a"],
                    ));

                    // Paint point of ally
                    $("#score").text("\u00A0");

                    // Team Name
                    $("#battle_tri_ally_stats_teamname").text(LastBattleDetail["myTeam"]["festTeamName"]);
                    $("#battle_tri_enemy_stats_teamname").text(LastBattleDetail["otherTeams"][0]["festTeamName"]);
                    $("#battle_tri_enemy2_stats_teamname").text(LastBattleDetail["otherTeams"][1]["festTeamName"]);
                    $("#battle_tri_"+LastBattleDetail["myTeam"]["tricolorRole"].toLowerCase()+"_stats_teamname").text(LastBattleDetail["myTeam"]["festTeamName"]);
                    $("#battle_tri_"+LastBattleDetail["otherTeams"][0]["tricolorRole"].toLowerCase()+"_stats_teamname").text(LastBattleDetail["otherTeams"][0]["festTeamName"]);
                    $("#battle_tri_"+LastBattleDetail["otherTeams"][1]["tricolorRole"].toLowerCase()+"_stats_teamname").text(LastBattleDetail["otherTeams"][1]["festTeamName"]);

                    // Paint Ratio
                    $("#battle_tri_ally_stats_paintRatio").text(float2percent(LastBattleDetail["myTeam"]["result"]["paintRatio"]));
                    $("#battle_tri_enemy_stats_paintRatio").text(float2percent(LastBattleDetail["otherTeams"][0]["result"]["paintRatio"]));
                    $("#battle_tri_enemy2_stats_paintRatio").text(float2percent(LastBattleDetail["otherTeams"][1]["result"]["paintRatio"]));
                    $("#battle_tri_"+LastBattleDetail["myTeam"]["tricolorRole"].toLowerCase()+"_stats_paintRatio").text(float2percent(LastBattleDetail["myTeam"]["result"]["paintRatio"]));
                    $("#battle_tri_"+LastBattleDetail["otherTeams"][0]["tricolorRole"].toLowerCase()+"_stats_paintRatio").text(float2percent(LastBattleDetail["otherTeams"][0]["result"]["paintRatio"]));
                    $("#battle_tri_"+LastBattleDetail["otherTeams"][1]["tricolorRole"].toLowerCase()+"_stats_paintRatio").text(float2percent(LastBattleDetail["otherTeams"][1]["result"]["paintRatio"]));
                    

                    // Splat
                    $("#battle_tri_ally_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 3, "result", "kill"))).toString(10)
                    );
                    $("#battle_tri_enemy_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 3, "result", "kill"))).toString(10)
                    );
                    $("#battle_tri_enemy2_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 3, "result", "kill"))).toString(10)
                    );
                    $("#battle_tri_"+LastBattleDetail["myTeam"]["tricolorRole"].toLowerCase()+"_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 3, "result", "kill"))).toString(10)
                    );
                    $("#battle_tri_"+LastBattleDetail["otherTeams"][0]["tricolorRole"].toLowerCase()+"_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 3, "result", "kill"))).toString(10)
                    );
                    $("#battle_tri_"+LastBattleDetail["otherTeams"][1]["tricolorRole"].toLowerCase()+"_stats_splat").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 0, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 1, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 2, "result", "kill")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 3, "result", "kill"))).toString(10)
                    );

                    // Splatted
                    $("#battle_tri_ally_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 3, "result", "death"))).toString(10)
                    );
                    $("#battle_tri_enemy_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 3, "result", "death"))).toString(10)
                    );
                    $("#battle_tri_enemy2_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 3, "result", "death"))).toString(10)
                    );
                    $("#battle_tri_"+LastBattleDetail["myTeam"]["tricolorRole"].toLowerCase()+"_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["myTeam"]["players"], 3, "result", "death"))).toString(10)
                    );
                    $("#battle_tri_"+LastBattleDetail["otherTeams"][0]["tricolorRole"].toLowerCase()+"_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][0]["players"], 3, "result", "death"))).toString(10)
                    );
                    $("#battle_tri_"+LastBattleDetail["otherTeams"][1]["tricolorRole"].toLowerCase()+"_stats_splatted").text(
                        (
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 0, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 1, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 2, "result", "death")) +
                            parseInt(check_data_availability(LastBattleDetail["otherTeams"][1]["players"], 3, "result", "death"))).toString(10)
                    );

                    // Personal Stats
                    for (var player of LastBattleDetail["myTeam"]["players"]) {
                        if (player["isMyself"] == true) {
                            $(".inkinfo-personal-stats-username").text(player["name"]);
                            $(".inkinfo-personal-stats-splat").text(
                                (parseInt(player["result"]["kill"]) - parseInt(player["result"]["assist"]))
                                    .toString(10)
                            );
                            $(".inkinfo-personal-stats-splatted").text(player["result"]["death"]);
                            $(".inkinfo-personal-stats-assist").text(player["result"]["assist"]);
                            $(".inkinfo-personal-stats-special").text(player["result"]["special"]);
                            break;
                        }
                    }

                    break;
                    

                default:
                    break;
            }

            $("#rule_image").attr('src', "http://" + location.host + "/static/img/" + LastBattleDetail["vsRule"]["id"] + ".png");
            if (LastBattleDetail["judgement"] === "WIN") {
                $("#judge").text("WIN!");
            } else if (LastBattleDetail["judgement"] === "DRAW") {
                $("#judge").text("DRAW");
            } else {
                $("#judge").text("LOSE...");
            }

            $("#map").text(LastBattleDetail["vsStage"]["name"]);
            $("#map_image").attr('src', LastBattleDetail["vsStage"]["image"]["url"]);
        });
}


$(document).ready(() => {
    $(".inkinfo-enable-with-rule").hide();
    $(".header-info").hide();
    Fetch_BattleInfo();
    setInterval(Fetch_BattleInfo, 5*1000);
    change_header_info();
    setInterval(change_header_info, 5*1000);
})
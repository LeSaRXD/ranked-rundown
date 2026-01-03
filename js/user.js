import { fetch_mojang_api, fetch_ranked_api } from "./api.js";
import { add_summary_effect } from "./card.js";
import { load_user_data, save_user_data } from "./local_storage.js";
import { lunar_api_builder, PoseType } from "./lunar.js";
import { construct_api_url, try_api } from "./util.js";
const SEASON_START = 6, SEASON_END = SEASON_START + 3;
let total_cards = 0;
let current_card = 0;
window.addEventListener("load", async () => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get("username");
    if (username === null || username.trim() === "") {
        window.location.assign("./index.html");
        return;
    }
    const uuid = await try_api(fetch_mojang_api(username));
    if (uuid === null)
        return;
    const player_skin_api = lunar_api_builder(uuid);
    document.querySelector(".card>img").src = player_skin_api(PoseType.CROSSED_LEGS);
    let display_data = load_user_data(uuid);
    if (display_data === null) {
        const promises = new Array();
        for (let season = SEASON_START; season <= SEASON_END; season++) {
            promises.push(request_user_data(uuid, season));
        }
        const user_seasons = await try_api(Promise.all(promises));
        if (user_seasons === null)
            return;
        const users = Object.fromEntries(user_seasons);
        let total_matches = 0;
        for (const user of Object.values(users)) {
            total_matches += user.statistics.season.playedMatches.ranked;
        }
        if (total_matches < 5) {
            alert("At least 5 ranked matches required :<");
            window.location.assign("./index.html");
            return;
        }
        const raw_data = await request_user_matches(users, total_matches);
        if (raw_data === null)
            return;
        display_data = create_display_data(raw_data);
        save_user_data(uuid, display_data);
    }
    render_data(player_skin_api, display_data);
    setTimeout(() => {
        move_right();
        update_scroll_buttons();
    }, 500);
});
async function request_user_data(uuid, season) {
    const url = construct_api_url(`/users/${uuid}`, { season });
    const user = await fetch_ranked_api(url);
    return [season, user];
}
async function request_user_matches(users, total_matches) {
    const user = users[SEASON_END];
    if (user === undefined)
        return Promise.resolve(null);
    const promises = new Array();
    const progress = {
        paragraph: document.getElementById("loading_counter"),
        loaded: 0,
        total: total_matches,
        load(added, total = null) {
            this.loaded += added;
            if (total !== null)
                this.total = total;
            this.paragraph.innerText = `${Math.floor(this.loaded / this.total * 100)}%`;
        }
    };
    for (let season = SEASON_START; season <= SEASON_END; season++) {
        promises.push(load_user_matches(user, season, progress));
    }
    const all_matches = new Array();
    const res_matches = await try_api(Promise.all(promises));
    if (res_matches === null)
        return null;
    for (const matches of res_matches)
        all_matches.push(...matches);
    progress.load(0, progress.loaded);
    return Promise.resolve({
        users,
        matches: all_matches,
    });
}
async function load_user_matches(user, season, progress) {
    const matches = new Array();
    let before = null;
    while (true) {
        const COUNT = 100;
        const url = construct_api_url(`/users/${user.uuid}/matches`, {
            count: COUNT,
            before,
            season,
            excludedecay: true,
            type: 2,
        });
        const new_matches = await fetch_ranked_api(url);
        matches.push(...new_matches);
        progress.load(new_matches.length);
        if (new_matches.length < COUNT)
            break;
        before = Math.min(...new_matches.map((match) => match.id));
    }
    matches.sort((m1, m2) => m1.date - m2.date);
    return Promise.resolve(matches);
}
function create_card(heading, img_src, ...text) {
    const card = document.createElement("div");
    card.classList.add("card", "right");
    const header = document.createElement("h1");
    header.innerHTML = heading;
    const image = document.createElement("img");
    image.src = img_src;
    const paragraph = document.createElement("p");
    paragraph.innerHTML = text.join("<br>");
    card.replaceChildren(header, image, paragraph);
    return card;
}
function create_summary(heading, img_src, max_elo, ...text) {
    const card = document.createElement("div");
    card.classList.add("card", "right");
    card.id = "summary";
    const elo = document.createElement("div");
    elo.id = "elo_icon";
    const elo_img = document.createElement("img");
    let elo_category, elo_color = null;
    if (max_elo < 600) {
        elo_category = "coal";
    }
    else if (max_elo < 900) {
        elo_category = "iron";
        elo_color = "#ffffff";
    }
    else if (max_elo < 1200) {
        elo_category = "gold";
        elo_color = "#fdf55f";
    }
    else if (max_elo < 1500) {
        elo_category = "emerald";
        elo_color = "#17dd62";
    }
    else if (max_elo < 2000) {
        elo_category = "diamond";
        elo_color = "#4aedd9";
    }
    else {
        elo_category = "netherite";
        elo_color = "#662fcc";
    }
    elo_img.src = `./static/${elo_category}.png`;
    const elo_text = document.createElement("b");
    elo_text.innerText = max_elo.toString();
    elo.replaceChildren(elo_img, elo_text);
    if (elo_color !== null) {
        elo_color += "90";
        elo_img.style.filter = `drop-shadow(0 0 0.5rem ${elo_color})`;
    }
    const header = document.createElement("h1");
    header.innerHTML = heading;
    const image = document.createElement("img");
    image.src = img_src;
    const paragraph = document.createElement("p");
    paragraph.innerHTML = text.join("<br>");
    const overlay = document.createElement("div");
    overlay.id = "summary_overlay";
    card.replaceChildren(elo, header, image, paragraph, overlay);
    const wrapper = document.createElement("div");
    wrapper.id = "summary_wrapper";
    wrapper.appendChild(card);
    return wrapper;
}
function render_data(player_skin_api, data) {
    const { username, playtime, total_matches, total_wins, total_losses, total_forfeits, total_elo_lost, total_elo_gained, highest_elo, highest_win_streak, highest_loss_streak, greatest_rival, average_completion } = data;
    const playtime_hours = Math.floor(playtime / 1000 / 60 / 60);
    const playtime_minutes = Math.floor((playtime / 1000 / 60) % 60);
    const playtime_string = playtime_hours > 0 ? `${playtime_hours} hours and ${playtime_minutes} minutes` : `${playtime_minutes} minutes`;
    console.debug(data);
    const main = document.querySelector("main");
    const cards = [];
    cards.push(create_card("Playtime", player_skin_api(PoseType.DUNGEONS), "You have played Ranked for", `<b>${playtime_string}</b>`, `(${total_matches} matches)`, "in the big '25"));
    const ff_rate = total_forfeits / total_losses;
    const ff_percent = Math.round(ff_rate * 100);
    const ff_message = ["You have forfeited", `<b>${total_forfeits} games</b> (${ff_percent}%)`, "last year"];
    if (ff_rate < 0.15) {
        cards.push(create_card("<b>W</b> Mental", player_skin_api(PoseType.LUNGING), ...ff_message));
    }
    else if (ff_rate < 0.4) {
        cards.push(create_card("Average Forfeiter", player_skin_api(PoseType.RELAXING), ...ff_message));
    }
    else {
        cards.push(create_card("Forfeit Legend", player_skin_api(PoseType.CLOWN), ...ff_message));
    }
    if (highest_win_streak > 2) {
        const win_streak_heading = (highest_win_streak >= 10) ? "Thats a Lot of Games" :
            (highest_win_streak >= 5) ? "A Good Win Streak" : "A Decent Win Streak";
        cards.push(create_card(win_streak_heading, player_skin_api(PoseType.KICKING), "Your highest win streak of 2025 is", `<b>${highest_win_streak} games</b> in a row`));
    }
    cards.push(create_card("Highest loss streak", player_skin_api(PoseType.FACEPALM), "You have lost", `<b>${highest_loss_streak} games</b> in a row`, "in 2025"));
    if (total_elo_gained > total_elo_lost) {
        cards.push(create_card("The Elos are Skyrocketing", player_skin_api(PoseType.CHEERING), "You have gained a total of", `<b>${total_elo_gained} ELO</b>`, "and lost", `<b>${total_elo_lost} ELO</b>`, "last year"));
    }
    else {
        cards.push(create_card("The Elos are Plummeting", player_skin_api(PoseType.TRUDGING), "You have gained a total of", `<b>${total_elo_gained} ELO</b>`, "and lost", `<b>${total_elo_lost} ELO</b>`, "last year"));
    }
    if (greatest_rival.losses > 1)
        cards.push(create_card("Your Greatest Rival", player_skin_api(PoseType.COWERING), "You have lost", `<b>${greatest_rival.losses} games</b>`, `against <i>${greatest_rival.username}</i>`));
    const win_percent = Math.floor(total_wins / total_matches * 100);
    const average_str = `${Math.floor(average_completion / 1000 / 60)}:${(Math.floor(average_completion / 1000) % 60).toString().padStart(2, "0")}`;
    cards.push(create_summary(username, player_skin_api(PoseType.MOJANG_AVATAR), highest_elo, `Win rate: ${win_percent}%`, `FF rate: ${ff_percent}%`, `Average: ${average_str}`));
    for (const [idx, card] of cards.entries()) {
        card.style.zIndex = (idx + 2).toString();
        main.appendChild(card);
    }
    total_cards = cards.length + 1;
    add_summary_effect();
}
var MatchOutcome;
(function (MatchOutcome) {
    MatchOutcome["Won"] = "won";
    MatchOutcome["Lost"] = "lost";
    MatchOutcome["Drew"] = "drew";
})(MatchOutcome || (MatchOutcome = {}));
function create_display_data(data) {
    const player = data.users[SEASON_END];
    let playtime = 0;
    let total_elo_gained = 0, total_elo_lost = 0;
    let total_forfeits = 0, total_wins = 0, total_losses = 0;
    let current_win_streak = 0, highest_win_streak = 0;
    let current_loss_streak = 0, highest_loss_streak = 0;
    let total_completion_time = 0, total_completions = 0;
    const opponent_records = {};
    const biggest_elo_gain = {
        elo_change: -Infinity,
        username: "",
    };
    const biggest_elo_loss = {
        elo_change: -Infinity,
        username: "",
    };
    for (const match of data.matches) {
        playtime += match.result.time;
        const match_outcome = match.result.uuid === player.uuid ? MatchOutcome.Won
            : (match.result.uuid === null) ?
                MatchOutcome.Drew
                : MatchOutcome.Lost;
        switch (match_outcome) {
            case MatchOutcome.Won:
                current_win_streak += 1;
                current_loss_streak = 0;
                highest_win_streak = Math.max(highest_win_streak, current_win_streak);
                total_wins += 1;
                if (!match.forfeited) {
                    total_completions += 1;
                    total_completion_time += match.result.time;
                }
                break;
            case MatchOutcome.Lost:
                current_loss_streak += 1;
                current_win_streak = 0;
                highest_loss_streak = Math.max(highest_loss_streak, current_loss_streak);
                total_losses += 1;
                total_forfeits += +match.forfeited;
                break;
            case MatchOutcome.Drew:
                current_win_streak = 0;
                current_loss_streak = 0;
                break;
        }
        const elo_change = match.changes.find((change) => change.uuid === player.uuid)?.change ?? 0;
        if (elo_change > 0)
            total_elo_gained += elo_change;
        else
            total_elo_lost -= elo_change;
        const opponent = match.players.find((user) => user.uuid !== player.uuid);
        if (opponent === undefined)
            continue;
        if (!(opponent.uuid in opponent_records)) {
            opponent_records[opponent.uuid] = {
                username: opponent.nickname,
                wins: 0,
                losses: 0,
                draws: 0,
                best_time_against: null,
                best_time_rival: null,
            };
        }
        const opponent_record = opponent_records[opponent.uuid];
        switch (match_outcome) {
            case MatchOutcome.Won:
                opponent_record.wins += 1;
                if (match.forfeited)
                    break;
                opponent_record.best_time_against = Math.min(opponent_record.best_time_against ?? Infinity, match.result.time);
                if (biggest_elo_gain.elo_change < elo_change) {
                    biggest_elo_gain.elo_change = elo_change;
                    biggest_elo_gain.username = opponent.nickname;
                }
                break;
            case MatchOutcome.Lost:
                opponent_record.losses += 1;
                if (match.forfeited)
                    break;
                opponent_record.best_time_rival = Math.min(opponent_record.best_time_rival ?? Infinity, match.result.time);
                if (biggest_elo_loss.elo_change < -elo_change) {
                    biggest_elo_loss.elo_change = -elo_change;
                    biggest_elo_loss.username = opponent.nickname;
                }
                break;
            case MatchOutcome.Drew:
                opponent_record.draws += 1;
                break;
        }
    }
    const greatest_rival = Object.values(opponent_records).reduce(compare_vs_records, {
        username: "",
        wins: -1,
        losses: -1,
        draws: -1,
        best_time_against: Infinity,
        best_time_rival: Infinity,
    });
    const highest_elo = Object.values(data.users).map((user) => user.seasonResult.highest).reduce((prev, curr) => Math.max(prev, curr), 0);
    return {
        username: player.nickname,
        playtime,
        total_matches: data.matches.length,
        total_elo_gained,
        total_elo_lost,
        total_wins,
        total_losses,
        total_forfeits,
        highest_win_streak,
        highest_loss_streak,
        greatest_rival,
        highest_elo,
        biggest_elo_gain,
        biggest_elo_loss,
        average_completion: (total_completions > 0) ? Math.floor(total_completion_time / total_completions) : 0,
    };
}
function compare_vs_records(first, second) {
    if (first.losses > second.losses)
        return first;
    if (first.losses < second.losses)
        return second;
    if (first.wins < second.wins)
        return first;
    if (first.wins > second.wins)
        return second;
    if (first.draws > second.draws)
        return first;
    if (first.draws < second.draws)
        return second;
    if ((first.best_time_rival ?? Infinity) < (second.best_time_rival ?? Infinity))
        return first;
    return second;
}
function update_scroll_buttons() {
    const scroll_left = document.getElementById("scroll_left");
    const scroll_right = document.getElementById("scroll_right");
    scroll_left.addEventListener("click", move_left);
    scroll_right.addEventListener("click", move_right);
}
function move_left() {
    if (current_card <= 1)
        return;
    const cards = document.getElementsByClassName("card");
    const card = cards.item(current_card);
    if (card === null)
        return;
    card.classList.add("right");
    current_card -= 1;
    update_button_opacity();
}
function move_right() {
    if (current_card + 1 >= total_cards)
        return;
    const cards = document.getElementsByClassName("card");
    const card = cards.item(current_card + 1);
    if (card === null)
        return;
    card.classList.remove("right");
    current_card += 1;
    update_button_opacity();
}
function update_button_opacity() {
    const scroll_left = document.getElementById("scroll_left");
    const scroll_right = document.getElementById("scroll_right");
    scroll_right.style.opacity = (+(current_card + 1 < total_cards)).toString();
    scroll_left.style.opacity = (+(current_card > 1)).toString();
}

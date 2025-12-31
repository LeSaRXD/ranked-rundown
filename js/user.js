import { fetch_api } from "./api.js";
import { lunar_api_builder, PoseType } from "./lunar.js";
import { construct_api_url, try_api } from "./util.js";
const SEASON_START = 6, SEASON_END = SEASON_START + 3;
window.addEventListener("load", async () => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get("username");
    if (username === null || username.trim() === "") {
        window.location.assign("./index.html");
        return;
    }
    const player_skin_api = lunar_api_builder(username);
    document.querySelector(".card>img").src = player_skin_api(PoseType.CROSSED_LEGS);
    const promises = new Array();
    for (let season = SEASON_START; season <= SEASON_END; season++) {
        promises.push(load_user_data(username, season));
    }
    const user_seasons = await try_api(Promise.all(promises));
    if (user_seasons === null)
        return;
    const users = Object.fromEntries(user_seasons);
    let total_matches = 0;
    for (const user of Object.values(users)) {
        total_matches += user.statistics.season.playedMatches.ranked;
    }
    const data = await load_all_data(users, total_matches);
    if (data === null)
        return;
    render_data(player_skin_api, data);
});
async function load_user_data(username, season) {
    const url = construct_api_url(`/users/${username}`, { season });
    const user = await fetch_api(url);
    return [season, user];
}
async function load_all_data(users, total_matches) {
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
            this.paragraph.innerText = `${this.loaded} / ${this.total}`;
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
        const new_matches = await fetch_api(url);
        matches.push(...new_matches);
        progress.load(new_matches.length);
        if (new_matches.length < COUNT)
            break;
        before = Math.min(...new_matches.map((match) => match.id));
    }
    return Promise.resolve(matches);
}
function create_card(heading, img_src, ...text) {
    const card = document.createElement("div");
    card.classList.add("card", "right");
    const header = document.createElement("h1");
    header.innerHTML = heading;
    const image = document.createElement("img");
    image.src = img_src;
    const span = document.createElement("span");
    span.innerHTML = text.join("<br>");
    card.replaceChildren(header, image, span);
    return card;
}
function render_data(player_skin_api, data) {
    const main = document.querySelector("main");
    const cards = [
        create_card("Let's go!", player_skin_api(PoseType.ULTIMATE), "This is you"),
        create_card("Your elo", player_skin_api(PoseType.CROSSED_ARMS), `${data.users[SEASON_END].eloRate} ELO`),
        create_card("Matches played", player_skin_api(PoseType.WALKING), `${data.matches.length} matches`),
    ];
    for (const [idx, card] of cards.entries()) {
        card.style.zIndex = (idx + 2).toString();
        main.appendChild(card);
    }
}

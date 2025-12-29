import { fetch_api, Match, Player } from "./api.js";
import { lunar_api_builder, PoseType } from "./lunar.js";
import { construct_api_url, try_api } from "./util.js";

const SEASON_START = 6, SEASON_END = SEASON_START + 3;

document.addEventListener("DOMContentLoaded", async () => {
	const params = new URLSearchParams(window.location.search);
	const username = params.get("username");
	if (username === null || username.trim() === "") {
		window.location.assign("./index.html");
		return;
	}

	const player_skin_api = lunar_api_builder(username);
	(document.querySelector(".card_img") as HTMLImageElement).src = player_skin_api(PoseType.CROSSED_LEGS);
	const promises = [];
	for (let season = SEASON_START; season <= SEASON_END; season++) {
		promises.push(load_user_data(username, season));
	}
	const user_seasons = await try_api(Promise.all(promises));
	if (user_seasons === null) return;
	console.log(user_seasons);
	const user = user_seasons[0]!!;

	const data = await load_all_data(user);
	console.log(data);
});

interface UserData {
	user: Player,
	matches: Match[],
}

async function load_user_data(username: string, season: number): Promise<Player> {
	const url = construct_api_url(`/users/${username}`, { season });
	return fetch_api<Player>(url);
}

async function load_all_data(user: Player): Promise<UserData | null> {
	const promises = [];
	for (let season = SEASON_START; season <= SEASON_END; season++) {
		promises.push(load_user_matches(user, season));
	}
	const all_matches = [];
	const res_matches = await try_api(Promise.all(promises));
	if (res_matches === null)
		return null;

	for (const matches of res_matches)
		all_matches.push(...matches);

	return Promise.resolve({
		user,
		matches: all_matches,
	});
}

async function load_user_matches(user: Player, season: number): Promise<Match[]> {
	const matches = [];
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
		console.log(url);
		const new_matches = await fetch_api<Match[]>(url);
		if (new_matches === null) break;
		matches.push(...new_matches);

		if (new_matches.length < COUNT)
			break;
		before = Math.min(...new_matches.map((match) => match.id));
	}
	return Promise.resolve(matches);
}

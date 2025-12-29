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

	const promises = new Array();
	for (let season = SEASON_START; season <= SEASON_END; season++) {
		promises.push(load_user_data(username, season));
	}

	const user_seasons = await try_api(Promise.all(promises));
	if (user_seasons === null) return;
	const users = Object.fromEntries(user_seasons);
	let total_matches = 0;
	for (const user of Object.values(users)) {
		total_matches += user.statistics.season.playedMatches.ranked;
	}

	const data = await load_all_data(users, total_matches);
	console.log(data);
});

async function load_user_data(username: string, season: number): Promise<[number, Player]> {
	const url = construct_api_url(`/users/${username}`, { season });
	const user = await fetch_api<Player>(url);
	return [season, user];
}

interface LoadingProgress {
	paragraph: HTMLParagraphElement,
	loaded: number,
	total: number,
	load: (loaded: number) => void,
}
interface UserData {
	users: { [season: number]: Player },
	matches: Match[],
}

async function load_all_data(users: { [season: number]: Player }, total_matches: number): Promise<UserData | null> {
	const user = users[SEASON_END];
	if (user === undefined)
		return Promise.resolve(null);

	const promises = new Array();
	const progress = {
		paragraph: document.getElementById("loading_counter") as HTMLParagraphElement,
		loaded: 0,
		total: total_matches,
		load(added: number, total: number | null = null) {
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

async function load_user_matches(user: Player, season: number, progress: LoadingProgress): Promise<Match[]> {
	const matches = new Array();
	let before: number | null = null;
	while (true) {
		const COUNT = 100;

		const url = construct_api_url(`/users/${user.uuid}/matches`, {
			count: COUNT,
			before,
			season,
			excludedecay: true,
			type: 2,
		});
		const new_matches = await fetch_api<Match[]>(url);
		matches.push(...new_matches);
		progress.load(new_matches.length);

		if (new_matches.length < COUNT)
			break;
		before = Math.min(...new_matches.map((match) => match.id));
	}
	return Promise.resolve(matches);
}

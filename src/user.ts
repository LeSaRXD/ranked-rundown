import { fetch_api, Match, Player } from "./api.js";
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

	const promises = new Array();
	for (let season = SEASON_START; season <= SEASON_END; season++) {
		promises.push(load_user_data(username, season));
	}

	const user_seasons = await try_api(Promise.all(promises));
	if (user_seasons === null) return;
	const users: { [key: number]: Player } = Object.fromEntries(user_seasons);
	let total_matches = 0;
	for (const user of Object.values(users)) {
		total_matches += user.statistics.season.playedMatches.ranked;
	}

	const player_skin_api = lunar_api_builder(users[SEASON_END]!!.uuid);
	(document.querySelector(".card>img") as HTMLImageElement).src = player_skin_api(PoseType.CROSSED_LEGS);

	const data = await load_all_data(users, total_matches);
	if (data === null)
		return;

	render_data(player_skin_api, data);
	setTimeout(() => {
		move_right();
		update_scroll_buttons();
	}, 1000);
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

async function load_user_matches(user: Player, season: number, progress: LoadingProgress): Promise<Match[]> {
	const matches: Match[] = new Array();
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
	matches.sort((m1, m2) => m1.date - m2.date);
	return Promise.resolve(matches);
}

function create_card(heading: string, img_src: string, ...text: string[]): HTMLDivElement {
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

function render_data(player_skin_api: (pose: PoseType) => string, data: UserData) {
	const display_data = create_display_data(data);
	const { playtime, total_forfeits, total_losses, total_elo_lost, total_elo_gained, highest_win_streak, highest_loss_streak, greatest_rival } = display_data;
	const playtime_hours = Math.floor(playtime / 1000 / 60 / 60);
	const playtime_minutes = Math.floor((playtime / 1000 / 60) % 60);
	const playtime_string = playtime_hours > 0 ? `${playtime_hours} hours and ${playtime_minutes} minutes` : `${playtime_minutes} minutes`;
	console.log(display_data);

	const main = document.querySelector("main") as HTMLElement;
	const cards = [];
	cards.push(create_card("Playtime", player_skin_api(PoseType.DUNGEONS), "You have played Ranked for", `<b>${playtime_string}</b>`, `(${data.matches.length} matches)`, "in the big '25"));

	const ff_rate = total_forfeits / total_losses;
	const ff_message = ["You have forfeited", `<b>${total_forfeits} games</b>`, "last year"];
	if (ff_rate < 0.1) {
		cards.push(create_card("<b>W</b> Mental", player_skin_api(PoseType.LUNGING), ...ff_message))
	} else if (ff_rate < 0.25) {
		cards.push(create_card("Average Forfeiter", player_skin_api(PoseType.RELAXING), ...ff_message));
	} else {
		cards.push(create_card("Forfeit Legend", player_skin_api(PoseType.CLOWN), ...ff_message));
	}
	if (highest_win_streak > 2) {
		const win_streak_heading = (highest_win_streak >= 10) ? "Thats a Lot of Games" :
			(highest_win_streak >= 5) ? "A Good Win Streak" : "A Decent Win Streak";
		cards.push(create_card(win_streak_heading, player_skin_api(PoseType.KICKING), "Your highest win streak of 2025 is", `<b>${highest_win_streak} games</b> in a row`));
	}
	cards.push(create_card("Highest loss streak", player_skin_api(PoseType.FACEPALM), "You have lost", `<b>${highest_loss_streak} games</b> in a row`, "in 2025"));
	cards.push(create_card("The Elos are Skyrocketing", player_skin_api(PoseType.CHEERING), "You have gained a total of", `<b>${total_elo_gained} ELO</b>`, "and lost", `<b>${total_elo_lost} ELO</b>`, "last year"));
	if (greatest_rival.losses > 1)
		cards.push(create_card("Your Greatest Rival", player_skin_api(PoseType.COWERING), "You have lost", `<b>${greatest_rival.losses} games</b>`, `against <i>${greatest_rival.username}</i>`));

	for (const [idx, card] of cards.entries()) {
		card.style.zIndex = (idx + 2).toString();
		main.appendChild(card);
	}
	total_cards = cards.length + 1;
}

interface PlayerVsRecord {
	username: string,
	wins: number,
	losses: number,
	draws: number,
	best_time_against: number | null,
	best_time_rival: number | null,
}
interface DisplayData {
	playtime: number,
	total_elo_gained: number,
	total_elo_lost: number,
	total_forfeits: number,
	total_losses: number,
	highest_win_streak: number,
	highest_loss_streak: number,
	greatest_rival: PlayerVsRecord,
	// biggest_elo_gain: {
	// 	elo: number,
	// 	username: string,
	// },
	// biggest_elo_loss: {
	// 	elo: number,
	// 	username: string,
	// },
}
enum MatchOutcome {
	Won = "won",
	Lost = "lost",
	Drew = "drew",
}
function create_display_data(data: UserData): DisplayData {
	const player_uuid = data.users[SEASON_END]!!.uuid;

	let playtime = 0;
	let total_elo_gained = 0, total_elo_lost = 0;
	let total_forfeits = 0, total_losses = 0;
	let current_win_streak = 0, highest_win_streak = 0;
	let current_loss_streak = 0, highest_loss_streak = 0;

	const opponent_records: { [opp_uuid: string]: PlayerVsRecord } = {};
	for (const match of data.matches) {
		playtime += match.result.time;

		const match_outcome = match.result.uuid === player_uuid ? MatchOutcome.Won
			: (match.result.uuid === null) ?
				MatchOutcome.Drew
				: MatchOutcome.Lost;
		switch (match_outcome) {
			case MatchOutcome.Won:
				current_win_streak += 1;
				current_loss_streak = 0;
				highest_win_streak = Math.max(highest_win_streak, current_win_streak);
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

		const elo_change = match.changes.find((change) => change.uuid === player_uuid)?.change ?? 0;
		if (elo_change > 0)
			total_elo_gained += elo_change;
		else
			total_elo_lost -= elo_change;

		const opponent = match.players.find((user) => user.uuid !== player_uuid);
		if (opponent === undefined) continue;

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
		const opponent_record = opponent_records[opponent.uuid]!!;
		switch (match_outcome) {
			case MatchOutcome.Won:
				opponent_record.wins += 1;
				if (!match.forfeited)
					opponent_record.best_time_against = Math.min(opponent_record.best_time_against ?? Infinity, match.result.time);
				break;
			case MatchOutcome.Lost:
				opponent_record.losses += 1;
				if (!match.forfeited)
					opponent_record.best_time_rival = Math.min(opponent_record.best_time_rival ?? Infinity, match.result.time);
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

	return {
		playtime,
		total_elo_gained,
		total_elo_lost,
		total_forfeits,
		total_losses,
		highest_win_streak,
		highest_loss_streak,
		greatest_rival,
	}
}

function compare_vs_records(first: PlayerVsRecord, second: PlayerVsRecord): PlayerVsRecord {
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
	const scroll_left = document.getElementById("scroll_left") as HTMLButtonElement;
	const scroll_right = document.getElementById("scroll_right") as HTMLButtonElement;
	scroll_left.addEventListener("click", move_left);
	scroll_right.addEventListener("click", move_right);
}

function move_left() {
	if (current_card <= 1) return;
	const cards = document.getElementsByClassName("card");
	const card = cards.item(current_card);
	if (card === null) return;
	card.classList.add("right");
	current_card -= 1;

	update_button_opacity();
}

function move_right() {
	if (current_card + 1 >= total_cards) return;
	const cards = document.getElementsByClassName("card");
	const card = cards.item(current_card + 1);
	if (card === null) return;
	card.classList.remove("right");
	current_card += 1;

	update_button_opacity();
}

function update_button_opacity() {
	const scroll_left = document.getElementById("scroll_left") as HTMLButtonElement;
	const scroll_right = document.getElementById("scroll_right") as HTMLButtonElement;
	scroll_right.style.opacity = (+(current_card + 1 < total_cards)).toString();
	scroll_left.style.opacity = (+(current_card > 1)).toString();
}

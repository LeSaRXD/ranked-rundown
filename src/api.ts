export type ApiResponse<T> = {
	status: "success"
	data: T,
} | {
	status: "error",
	data: any,
} | {
	status: "fetch_error",
	data: any,
} | {
	status: "json_error",
	data: any,
} | {
	status: "no_user",
};

export interface Player {
	uuid: string,
	nickname: string,
	eloRate: number | null,
}
export interface VsResult {
	total: number,
	wins: number,
	draws: number,
	losses: number,
	win_completions: number,
	loss_completions: number,
	win_completions_time: number,
	loss_completions_time: number,
	win_average: number | null,
	loss_average: number | null,
	elo_change: number,
	opponent: Player,
};
export interface Match {
	id: number,
	forfeited: boolean,
	players: Player[],
	result: {
		uuid: string,
		time: number,
	},
	changes: {
		uuid: string,
		change: number,
	}[]
};
export interface Leaderboard {
	season: {
		startsAt: number,
		endsAt: number,
		number: number,
	},
	users: Player[],
}

const NO_USER = "User is not exists.";
export const fetch_api = async<T>(url: string): Promise<ApiResponse<T>> => {
	return new Promise((resolve, _) => {
		fetch(`https://api.mcsrranked.com/${url}`).then((ok) => {
			ok.json()
				.then((json) => {
					const api_res = json as ApiResponse<T>;
					if (api_res.status === "error" && api_res.data?.error === NO_USER)
						resolve({ status: "no_user" });
					else
						resolve(api_res);
				})
				.catch((err) => resolve({ status: "json_error", data: err }));
		}).catch((err) => resolve({ status: "fetch_error", data: err }));
	});
}

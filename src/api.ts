type ApiResponse<T> = {
	status: "success"
	data: T,
} | {
	status: "error",
	data: any,
};
export type ApiError = {
	status: "error",
	data: any,
} | {
	status: "no_user",
} | {
	status: "json_error",
	data: any,
} | {
	status: "fetch_error",
	data: any,
};

interface RankedCasual<T = number> {
	ranked: T,
	casual: T,
}

export interface Player {
	uuid: string,
	nickname: string,
	eloRate: number | null,
	statistics: {
		season: {
			playedMatches: RankedCasual,
		}
	},
}
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
export const fetch_api = async<T>(url: string): Promise<T> => {
	return new Promise((resolve, reject) => {
		fetch(url).then((ok) => {
			ok.json()
				.then((json) => {
					const api_res = json as ApiResponse<T>;
					if (api_res.status === "error")
						if (api_res.data?.error === NO_USER)
							reject({ status: "no_user" });
						else
							reject(api_res);
					else
						resolve(api_res.data);
				})
				.catch((err) => reject({ status: "json_error", data: err } as ApiError));
		}).catch((err) => reject({ status: "fetch_error", data: err } as ApiError));
	});
}

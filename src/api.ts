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
	seasonResult: {
		highest: number,
	}
}
export interface Match {
	id: number,
	forfeited: boolean,
	players: Player[],
	result: {
		uuid: string | null,
		time: number,
	},
	changes: {
		uuid: string,
		change: number,
	}[],
	date: number,
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
export async function fetch_ranked_api<T>(url: string): Promise<T> {
	let res;
	try {
		res = await fetch(url);
	} catch (err) {
		throw { status: "fetch_error", data: err } as ApiError;
	}
	if (!res.ok) {
		throw { status: "error", data: res.statusText } as ApiError;
	}
	let json;
	try {
		json = await res.json();
	} catch (err) {
		throw { status: "json_error", data: err } as ApiError;
	}
	const api_res = json as ApiResponse<T>;
	if (api_res.status === "error")
		if (api_res.data?.error === NO_USER)
			throw { status: "no_user" } as ApiError;
		else
			throw { api_res };
	else
		return api_res.data;
}

type MojangResponse = {
	id: string,
	name: string,
};
export async function fetch_mojang_api(username: string): Promise<string> {
	let res;
	try {
		res = await fetch(`https://corsjangapi.b-cdn.net/users/profiles/minecraft/${username}`);
	} catch (err) {
		throw { status: "fetch_error", data: err } as ApiError;
	}
	if (!res.ok) {
		if (res.status === 404)
			throw { status: "no_user" } as ApiError;
		else
			throw { status: "error", data: res.statusText };
	}
	let json;
	try {
		json = await res.json();
	} catch (err) {
		throw { status: "json_error", data: err } as ApiError;
	}
	const api_res = json as MojangResponse;
	return api_res.id;
}


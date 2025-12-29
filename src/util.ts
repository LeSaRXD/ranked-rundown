import { ApiError } from "./api";

export function construct_api_url(base: string, params: { [s: string]: any | null } = {}): string {
	const url_params = new URLSearchParams();
	for (const [key, value] of Object.entries(params))
		if (value != null)
			url_params.set(key, value);

	return `https://api.mcsrranked.com${base}?${url_params}`;
}

export async function try_api<T>(promise: Promise<T>): Promise<T | null> {
	try {
		return await promise;
	} catch (err) {
		const error = err as ApiError;
		switch (error.status) {
			case "error":
			case "fetch_error":
			case "json_error":
				console.error(error.data);
				alert("Error fetching API. Please check the console for more info");
				return null;
			case "no_user":
				alert("Could not find user. Please check whether you entered the username correctly");
				window.location.assign("./index.html");
				return null;
		}
	}
}

import { DisplayData } from "./user.js";

const VERSION_KEY = "version";
const STORAGE_VERSION = "2";

function check_version() {
	const prev_version = localStorage.getItem(VERSION_KEY);
	if (prev_version === null || prev_version !== STORAGE_VERSION) {
		localStorage.clear();
	}

	localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
}

export function load_user_data(uuid: string): DisplayData | null {
	check_version();
	const json = localStorage.getItem(uuid);
	if (json === null)
		return null;
	return JSON.parse(json);
}

export function save_user_data(uuid: string, display_data: DisplayData) {
	check_version();
	localStorage.setItem(uuid, JSON.stringify(display_data));
}

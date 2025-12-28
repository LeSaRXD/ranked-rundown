import { fetch_api, Player } from "./api.js";
enum PoseType {
	DEFAULT = "default",
	MARCHING = "marching",
	WALKING = "walking",
	CROUCHING = "crouching",
	CROSSED_ARMS = "crossed",
	CROSSED_LEGS = "criss_cross",
	ULTIMATE = "ultimate",
	ISOMETRIC = "isometric",
}
function lunar_api_builder(uuid: string): (pose_type: PoseType) => string {
	return (pose_type: PoseType): string => {
		return `https://starlightskins.lunareclipse.studio/render/${pose_type}/${uuid}/full`
	}
}

document.addEventListener("DOMContentLoaded", async () => {
	const params = new URLSearchParams(window.location.search);
	const username = params.get("username");
	if (username === null || username.trim() === "") {
		window.location.assign("./index.html");
		return;
	}

	const user_res = await fetch_api<Player>(`users/${username}`);
	switch (user_res.status) {
		case "error":
		case "fetch_error":
		case "json_error":
			console.error(user_res.data);
			alert("Error fetching API. Please check the console for more info");
			return;
		case "no_user":
			alert("Could not find user. Please check whether you entered the username correctly");
			window.location.assign("./index.html");
			return;
	}

	const user = user_res.data;
	const player_skin_api = lunar_api_builder(user.uuid);

	(document.querySelector(".card_img") as HTMLImageElement).src = player_skin_api(PoseType.CROSSED_LEGS);
});


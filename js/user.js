import { fetch_api } from "./api.js";
var PoseType;
(function (PoseType) {
    PoseType["DEFAULT"] = "default";
    PoseType["MARCHING"] = "marching";
    PoseType["WALKING"] = "walking";
    PoseType["CROUCHING"] = "crouching";
    PoseType["CROSSED_ARMS"] = "crossed";
    PoseType["CROSSED_LEGS"] = "criss_cross";
    PoseType["ULTIMATE"] = "ultimate";
    PoseType["ISOMETRIC"] = "isometric";
})(PoseType || (PoseType = {}));
function lunar_api_builder(uuid) {
    return (pose_type) => {
        return `https://starlightskins.lunareclipse.studio/render/${pose_type}/${uuid}/full`;
    };
}
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get("username");
    if (username === null || username.trim() === "") {
        window.location.assign("./index.html");
        return;
    }
    const user_res = await fetch_api(`users/${username}`);
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
    document.querySelector(".card_img").src = player_skin_api(PoseType.CROSSED_LEGS);
});

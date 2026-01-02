;
const NO_USER = "User is not exists.";
export async function fetch_ranked_api(url) {
    let res;
    try {
        res = await fetch(url);
    }
    catch (err) {
        throw { status: "fetch_error", data: err };
    }
    if (!res.ok) {
        throw { status: "error", data: res.statusText };
    }
    let json;
    try {
        json = await res.json();
    }
    catch (err) {
        throw { status: "json_error", data: err };
    }
    const api_res = json;
    if (api_res.status === "error")
        if (api_res.data?.error === NO_USER)
            throw { status: "no_user" };
        else
            throw { api_res };
    else
        return api_res.data;
}
export async function fetch_mojang_api(username) {
    let res;
    try {
        res = await fetch(`https://corsjangapi.b-cdn.net/users/profiles/minecraft/${username}`);
    }
    catch (err) {
        throw { status: "fetch_error", data: err };
    }
    if (!res.ok) {
        if (res.status === 404)
            throw { status: "no_user" };
        else
            throw { status: "error", data: res.statusText };
    }
    let json;
    try {
        json = await res.json();
    }
    catch (err) {
        throw { status: "json_error", data: err };
    }
    const api_res = json;
    return api_res.id;
}

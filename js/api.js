;
const NO_USER = "User is not exists.";
export const fetch_api = async (url) => {
    return new Promise((resolve, reject) => {
        fetch(url).then((ok) => {
            ok.json()
                .then((json) => {
                const api_res = json;
                if (api_res.status === "error")
                    if (api_res.data?.error === NO_USER)
                        reject({ status: "no_user" });
                    else
                        reject(api_res);
                else
                    resolve(api_res.data);
            })
                .catch((err) => reject({ status: "json_error", data: err }));
        }).catch((err) => reject({ status: "fetch_error", data: err }));
    });
};

;
;
const NO_USER = "User is not exists.";
export const fetch_api = async (url) => {
    return new Promise((resolve, _) => {
        fetch(`https://api.mcsrranked.com/${url}`).then((ok) => {
            ok.json()
                .then((json) => {
                var _a;
                const api_res = json;
                if (api_res.status === "error" && ((_a = api_res.data) === null || _a === void 0 ? void 0 : _a.error) === NO_USER)
                    resolve({ status: "no_user" });
                else
                    resolve(api_res);
            })
                .catch((err) => resolve({ status: "json_error", data: err }));
        }).catch((err) => resolve({ status: "fetch_error", data: err }));
    });
};

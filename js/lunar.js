export var PoseType;
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
export function lunar_api_builder(uuid) {
    return (pose_type) => {
        return `https://starlightskins.lunareclipse.studio/render/${pose_type}/${uuid}/full`;
    };
}

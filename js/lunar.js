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
    PoseType["HEAD"] = "head";
    PoseType["CUSTOM"] = "custom";
    PoseType["CHEERING"] = "cheering";
    PoseType["RELAXING"] = "relaxing";
    PoseType["TRUDGING"] = "trudging";
    PoseType["COWERING"] = "cowering";
    PoseType["POINTING"] = "pointing";
    PoseType["LUNGING"] = "lunging";
    PoseType["DUNGEONS"] = "dungeons";
    PoseType["FACEPALM"] = "facepalm";
    PoseType["SLEEPING"] = "sleeping";
    PoseType["DEAD"] = "dead";
    PoseType["ARCHER"] = "archer";
    PoseType["KICKING"] = "kicking";
    PoseType["MOJANG_AVATAR"] = "mojavatar";
    PoseType["READING"] = "reading";
    PoseType["HIGH_GROUND"] = "high_ground";
    PoseType["CLOWN"] = "clown";
})(PoseType || (PoseType = {}));
export function lunar_api_builder(uuid) {
    return (pose_type) => {
        return `https://starlightskins.lunareclipse.studio/render/${pose_type}/${uuid}/full`;
    };
}

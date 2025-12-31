export enum PoseType {
	DEFAULT = "default",
	MARCHING = "marching",
	WALKING = "walking",
	CROUCHING = "crouching",
	CROSSED_ARMS = "crossed",
	CROSSED_LEGS = "criss_cross",
	ULTIMATE = "ultimate",
	ISOMETRIC = "isometric",
	HEAD = "head",
	CUSTOM = "custom",
	CHEERING = "cheering",
	RELAXING = "relaxing",
	TRUDGING = "trudging",
	COWERING = "cowering",
	POINTING = "pointing",
	LUNGING = "lunging",
	DUNGEONS = "dungeons",
	FACEPALM = "facepalm",
	SLEEPING = "sleeping",
	DEAD = "dead",
	ARCHER = "archer",
	KICKING = "kicking",
	MOJANG_AVATAR = "mojavatar",
	READING = "reading",
	HIGH_GROUND = "high_ground",
	CLOWN = "clown",
}

export function lunar_api_builder(uuid: string): (pose_type: PoseType) => string {
	return (pose_type: PoseType): string => {
		return `https://starlightskins.lunareclipse.studio/render/${pose_type}/${uuid}/full`
	}
}

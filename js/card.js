const MAX_TILT_DEG = 15;
const MIN_OPACITY = 0.05;
const MAX_OPACITY = 0.5;
function remap(value, min1, max1, min2, max2) {
    return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
}
export function add_summary_effect() {
    const summary_wrapper = document.getElementById("summary_wrapper");
    const summary_card = document.getElementById("summary");
    const overlay = document.getElementById("summary_overlay");
    summary_wrapper.addEventListener("mousemove", (e) => {
        const x_tilt = remap(e.clientX - summary_wrapper.offsetLeft, 0, summary_card.clientWidth, -1, 1), y_tilt = remap(e.clientY - summary_wrapper.offsetTop, 0, summary_card.clientHeight, -1, 1);
        summary_card.style.transform = `rotateX(${y_tilt * -MAX_TILT_DEG}deg) rotateY(${x_tilt * MAX_TILT_DEG}deg)`;
        overlay.style.setProperty("--offset", `${remap(y_tilt, -1, 1, -300, 600)}%`);
        overlay.style.opacity = `${Math.max(MIN_OPACITY, remap(x_tilt, -1, 1, -1.2 * MAX_OPACITY, MAX_OPACITY))}`;
    });
    summary_wrapper.addEventListener("mouseleave", () => {
        summary_card.style.transform = "";
        overlay.style.opacity = "";
        overlay.style.setProperty("--offset", "");
    });
}

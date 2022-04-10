const canvas = document.querySelector("canvas");
const width = 400, height = 400;
const ctx = canvas.getContext("2d");

init();

function init() {
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
}
import "./nndisplay.js";

const board = document.querySelector("#game-board");
board.width = 400;
board.height = 400;
const boardCtx = board.getContext("2d");

const nnDisplay = document.querySelector("nn-display");

init();

function init() {
    boardCtx.fillStyle = "black";
    boardCtx.fillRect(0, 0, board.width, board.height);
}
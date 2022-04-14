import "./nndisplay.js";
import { NN, NodeTypes, WeightRandomizeFuncs } from "./nn.js"

const board = document.querySelector("#game-board");
board.width = 400;
board.height = 400;
const boardCtx = board.getContext("2d");

const nnDisplay = document.querySelector("nn-display");

init();

function init() {
    boardCtx.fillStyle = "black";
    boardCtx.fillRect(0, 0, board.width, board.height);

    let nn = new NN();
    nn.addInitialNode(NodeTypes.Input, "IN 1");
    nn.addInitialNode(NodeTypes.Input, "IN 2");
    nn.addInitialNode(NodeTypes.Input, "IN 3");
    nn.addInitialNode(NodeTypes.Input, "IN 4");
    nn.addInitialNode(NodeTypes.Output, "OUT");
    nn.addInitialNode(NodeTypes.Output, "OUT 2");
    nn.addInitialNode(NodeTypes.Output, "OUT 3");
    nn.randomizeConnectionWeights();
    console.log(nn);

    nnDisplay.nn = nn;
    nnDisplay.render();
}
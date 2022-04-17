// NN TESTING STUFF
import "./nndisplay.js";
import NNOptions from "./nnoptions.js";
import { ConnectionEnabledInitializeFuncs, NN, NodeTypes, WeightRandomizeFuncs } from "./nn.js"
import Population from "./population.js";

const nnDisplay = document.querySelector("nn-display");

const nn = new NN(ConnectionEnabledInitializeFuncs.Random);
nn.addInitialNode(NodeTypes.Input, "IN 1");
nn.addInitialNode(NodeTypes.Input, "IN 2");
nn.addInitialNode(NodeTypes.Output, "OUT 1");
nn.addInitialNode(NodeTypes.Output, "OUT 2");
nn.finishInitialization();

const breedingOptions = new NNOptions();

let population = new Population(20, nn, WeightRandomizeFuncs.ZeroToOne, breedingOptions);

let displayID = 0;

nnDisplay.nn = population.networks[0];
nnDisplay.render();

console.log(population);

console.log(population.networks[0].process({
    "IN 1": 1,
    "IN 2": .5
}));
// END NN TESTING

// Various event callbacks
document.querySelector("#btn-next").onclick = () => {
    displayID = (displayID + 1) % population.networks.length;
    nnDisplay.nn = population.networks[displayID];
    nnDisplay.render();
}
document.querySelector("#btn-prev").onclick = () => {
    displayID--;
    if (displayID < 0)
        displayID = population.networks.length - 1;
    nnDisplay.nn = population.networks[displayID];
    nnDisplay.render();
}

/*
Snake game tutorial used: https://www.youtube.com/watch?v=7Azlj0f9vas
*/
const board = document.querySelector("#game-board");
board.width = 400;
board.height = 400;
const boardCtx = board.getContext("2d");

//snake variables
let speed = 7;
let tileCount = 20;
let tileSize = 10;
let headX = 10;
let headY = 10;
const snakeParts = [];
let tailLength = 2;

//snake apple variables
let appleX = 5;
let appleY = 5;

//snake misc variables
let xVelocity = 0;
let yVelocity = 0;
let score = 0;

//snake part class
class SnakePart {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

init();

function init() {
    drawGame();
    document.body.addEventListener('keydown', keyDown);
};

//game loop
function drawGame() {
    changeSnakePosition();
    let result = isGameOver();
    if (result) {
        return;
    }
    clearScreen();
    checkAppleCollision();
    drawApple();
    drawSnake();
    drawScore();

    //difficulty settings
    if (score > 2) {
        speed = 11;
    }
    if (score > 5) {
        speed = 15;
    }

    if (score > 10) {
        speed = 20;
    }

    if (score > 20) {
        speed = 22;
    }
    setTimeout(drawGame, 1000 / speed);
};

//check if gameOver
function isGameOver() {
    let gameOver = false;

    //stop auto kill on start
    if (yVelocity === 0 && xVelocity === 0) {
        return false;
    }

    //walls
    if (headX < 0) {
        gameOver = true;
    }
    else if (headX === tileCount) {
        gameOver = true;
    }
    else if (headY < 0) {
        gameOver = true;
    }
    else if (headY === tileCount) {
        gameOver = true;
    }

    //snake Body
    for (let i = 0; i < snakeParts.length; i++) {
        let part = snakeParts[i];
        if (part.x === headX && part.y === headY) {
            gameOver = true;
            break;
        }
    }

    //game over text
    if (gameOver) {
        boardCtx.fillStyle = "white";
        boardCtx.font = "50px Verdana";
        boardCtx.fillText("Game Over!", board.width / 6.5, board.height / 2);
    }

    return gameOver;
}

//draws the score to the screen
function drawScore() {
    boardCtx.fillStyle = "white";
    boardCtx.font = "10px Verdana";
    boardCtx.fillText("Score " + score, board.width - 50, 10);
}

//clear screen
function clearScreen() {
    boardCtx.fillStyle = "black";
    boardCtx.fillRect(0, 0, board.width, board.height);
}

//draw the snake
function drawSnake() {

    //add a snake part after collecting a fruit
    boardCtx.fillStyle = "red";
    for (let i = 0; i < snakeParts.length; i++) {
        let part = snakeParts[i];
        boardCtx.fillRect(part.x * tileCount, part.y * tileCount, tileSize, tileSize);
    }

    //put an item at the end of the list next to the head
    //then remove the furthest item from the snake parts if it has more than our tail size 
    snakeParts.push(new SnakePart(headX, headY));
    if (snakeParts.length > tailLength) {
        snakeParts.shift();
    }

    //snake head piece
    boardCtx.fillRect(headX * tileCount, headY * tileCount, tileSize, tileSize);
}

//calculate snake movement
function changeSnakePosition() {
    headX = headX + xVelocity;
    headY = headY + yVelocity;
}

//draw apple
function drawApple() {
    boardCtx.fillStyle = "green";
    boardCtx.fillRect(appleX * tileCount, appleY * tileCount, tileSize, tileSize);
}

//check if an apple is eaten
function checkAppleCollision() {
    //add new random apple if the previous is eaten, and increase tail length and score
    if (appleX === headX && appleY === headY) {
        appleX = Math.floor(Math.random() * tileCount);
        appleY = Math.floor(Math.random() * tileCount);
        tailLength++;
        score++;
    }
}

//movement controls
function keyDown(event) {
    //up
    if (event.keyCode == 38) {
        if (yVelocity == 1) return;
        yVelocity = -1;
        xVelocity = 0;
    }

    //down
    if (event.keyCode == 40) {
        if (yVelocity == -1) return;
        yVelocity = 1;
        xVelocity = 0;
    }

    //left
    if (event.keyCode == 37) {
        if (xVelocity == 1) return;
        yVelocity = 0;
        xVelocity = -1;
    }

    //right
    if (event.keyCode == 39) {
        if (xVelocity == -1) return;
        yVelocity = 0;
        xVelocity = 1;
    }
}
// NN TESTING STUFF
import "./nndisplay.js";
import "./snakedisplay.js";
import Snake from "./snake.js";
import Population from "./population.js";
import "./init.js";

const nnDisplay = document.querySelector("nn-display");
const snakeDisplay = document.querySelector("snake-display");
const generationNum = document.querySelector("#generation-num");

const population = new Population(() => new Snake(), 1000);
snakeDisplay.logic = population.players[0];
let steps = 1;

let alwaysShowFittestLiving = false;

generationNum.innerHTML = "Generation: " + population.generation + ", Alive: " + population.aliveCount;

const secondaryDisplaysParent = document.querySelector("#secondary-displays");

const secondaryDisplays = [];
for (let i = 0; i < 20; i++) {
    const snakeDisp = document.createElement("snake-display");
    snakeDisp.logic = population.players[i + 1];
    snakeDisp.classList.add("secondary-snake");
    //snakeDisp.classList.add("column")
    snakeDisp.setWidth(200);
    const div = document.createElement("div");
    div.classList.add("column");
    div.appendChild(snakeDisp)
    secondaryDisplaysParent.appendChild(snakeDisp);
    secondaryDisplays.push(snakeDisp);
}

let displayID = 0;
let running = true;

const loop = () => {
    for (let i = 0; i < steps; i++) {
        population.update();
        if (population.aliveCount == 0) {
            population.nextGeneration();
            displayID = 0;
        }
        snakeDisplay.logic = population.players[displayID];
    }
    for (let i = 0; i < 20; i++) {
        secondaryDisplays[i].logic = population.players[i + 1];
        secondaryDisplays[i].render();
    }

    if (alwaysShowFittestLiving) {
        let fittest = 0;
        for (let i = 1; i < population.size; i++) {
            if (!population.players[i].alive)
                continue;
            if (population.players[i].score > population.players[fittest].score)
                fittest = i;
        }
        displayID = fittest;
        snakeDisplay.logic = population.players[displayID];
    }

    snakeDisplay.render();
    generationNum.innerHTML = "Generation " + population.generation + ", Alive: " + population.aliveCount;

    if (running)
        setTimeout(loop, 1000 / 60);
};

loop();

document.querySelector("#btn-step").onclick = () => {
    running = false;
    document.querySelector("#pause-button-icon").classList.remove("fa-pause");
    document.querySelector("#pause-button-icon").classList.add("fa-play");
    loop();
};

document.querySelector("#btn-pause").onclick = () => {
    running = !running;
    if (running)
        loop();

    if (running) {
        document.querySelector("#pause-button-icon").classList.remove("fa-play");
        document.querySelector("#pause-button-icon").classList.add("fa-pause");
    } else {
        document.querySelector("#pause-button-icon").classList.remove("fa-pause");
        document.querySelector("#pause-button-icon").classList.add("fa-play");
    }
};

document.querySelector("#btn-view-fittest").onclick = () => {
    let fittest = 0;
    for (let i = 1; i < population.size; i++) {
        if (population.players[i].score > population.players[fittest].score)
            fittest = i;
    }
    displayID = fittest;
    snakeDisplay.logic = population.players[displayID];
    snakeDisplay.render();
};

document.querySelector("#btn-view-fittest-living").onclick = () => {
    let fittest = 0;
    for (let i = 1; i < population.size; i++) {
        if (!population.players[i].alive)
            continue;
        if (population.players[i].score > population.players[fittest].score)
            fittest = i;
    }
    displayID = fittest;
    snakeDisplay.logic = population.players[displayID];
    snakeDisplay.render();
};

document.querySelector("#btn-next").onclick = () => {
    displayID = (displayID + 1) % population.size;
    snakeDisplay.logic = population.players[displayID];
    snakeDisplay.render();
};
document.querySelector("#btn-prev").onclick = () => {
    displayID--;
    if (displayID < 0)
        displayID = population.size - 1;
    snakeDisplay.logic = population.players[displayID];
    snakeDisplay.render();
};

document.querySelector("#slider-speed").oninput = (e) => {
    steps = e.target.value;
};

document.querySelector("#cb-show-fittest-living").onclick = (e) => {
    alwaysShowFittestLiving = e.target.checked;
};

// document.body.onkeydown = keyDown;
// //movement controls
// function keyDown(event) {
//     //up
//     if (event.keyCode == 38) {
//         game.passInput("UP");
//     }

//     //down
//     if (event.keyCode == 40) {
//         game.passInput("DOWN");
//     }

//     //left
//     if (event.keyCode == 37) {
//         game.passInput("LEFT");
//     }

//     //right
//     if (event.keyCode == 39) {
//         game.passInput("RIGHT");
//     }

//     event.preventDefault();
// }
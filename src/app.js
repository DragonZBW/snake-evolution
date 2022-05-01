import "./nndisplay.js";
import "./snakedisplay.js";
import Snake from "./snake.js";
import Population from "./population.js";
import "./init.js";
import NN from "./nn.js";
import Matrix from "./matrix.js";

// Get display elements that are going to get updated
const nnDisplay = document.querySelector("nn-display");
const snakeDisplay = document.querySelector("snake-display");
const generationNum = document.querySelector("#generation-num");

// This holds the template to use for snakes when restarting the population
let snakeSource = undefined;

// Initialize population using default values
let population = new Population(() => {
    const snake = new Snake();
    snake.nn.mutationRate = document.querySelector("#slider-mutation-rate").value;
    return snake;
}, 1000);
snakeDisplay.logic = population.players[0];
nnDisplay.nn = population.players[0].nn;
let steps = 3;

let secondaryDisplayMode = "First";
let alwaysShowFittestLiving = false;

// Set up displays
generationNum.innerHTML = "Generation: " + population.generation + ", Alive: " + population.aliveCount;

const secondaryDisplaysParent = document.querySelector("#secondary-displays");

const secondaryDisplays = [];
const secondaryCount = document.querySelector("#slider-secondary-count").value;
for (let i = 0; i < secondaryCount; i++) {
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

// Loop function (this steps through the simulation and loops it if running is true)
const loop = (ignoreSteps) => {
    let loopSteps = steps - 2;
    let fps = 60;
    if (steps == 2) {
        fps = 30;
        loopSteps = 1;
    }
    else if (steps == 1) {
        fps = 15;
        loopSteps = 1;
    }
    if (ignoreSteps)
        loopSteps = 1;
    for (let i = 0; i < loopSteps; i++) {
        population.update();
        if (population.aliveCount == 0) {
            population.nextGeneration();
            displayID = 0;
        }
        snakeDisplay.logic = population.players[displayID];
    }
    switch (secondaryDisplayMode) {
        case "First":
            for (let i = 0; i < secondaryDisplays.length; i++) {
                secondaryDisplays[i].logic = population.players[i];
                secondaryDisplays[i].render();
            }
            break;
        case "Fittest":
            const fittest = population.getFittestGroup(secondaryDisplays.length);
            for (let i = 0; i < secondaryDisplays.length; i++) {
                secondaryDisplays[i].logic = population.players[fittest[i]];
                secondaryDisplays[i].render();
            }
            break;
        case "First Alive":
            let count = 0;
            for (let i = 0; i < population.size && count < secondaryDisplays.length; i++) {
                if (population.players[i].alive) {
                    secondaryDisplays[count].logic = population.players[i];
                    secondaryDisplays[count].render();
                    count++;
                }
            }
            break;
        case "Fittest Alive":
            const fittestAlive = population.getFittestGroup(secondaryDisplays.length, false);
            for (let i = 0; i < secondaryDisplays.length; i++) {
                secondaryDisplays[i].logic = population.players[fittestAlive[i]];
                secondaryDisplays[i].render();
            }
            break;
    }

    if (alwaysShowFittestLiving) {
        displayID = population.getFittest(false);
        snakeDisplay.logic = population.players[displayID];
    }

    snakeDisplay.render();
    
    nnDisplay.nn = population.players[displayID].nn;
    nnDisplay.render();

    generationNum.innerHTML = "Generation " + population.generation + ", Alive: " + population.aliveCount;

    if (running)
        setTimeout(loop, 1000 / fps);
};

// Set parameters and start looping
document.querySelector("#label-sim-speed").innerHTML = "Sim Speed (" + document.querySelector("#slider-speed").value + ")";
document.querySelector("#label-mutation-rate").innerHTML = "Mutation Rate (" + document.querySelector("#slider-mutation-rate").value + ")";
document.querySelector("#label-secondary-count").innerHTML = "Secondary Displays (" + document.querySelector("#slider-secondary-count").value + ")";

loop();

// Set next button callback - moves display to next snake in population
document.querySelector("#btn-next").onclick = () => {
    displayID = (displayID + 1) % population.size;
    snakeDisplay.logic = population.players[displayID];
    snakeDisplay.render();
};

// Set previous button callback - moves display to previous snake in population
document.querySelector("#btn-prev").onclick = () => {
    displayID--;
    if (displayID < 0)
        displayID = population.size - 1;
    snakeDisplay.logic = population.players[displayID];
    snakeDisplay.render();
};

// Set step button callback - moves through one step of the simulation
document.querySelector("#btn-step").onclick = () => {
    running = false;
    document.querySelector("#pause-button-icon").classList.remove("fa-pause");
    document.querySelector("#pause-button-icon").classList.add("fa-play");
    loop(true);
};

// Set pause button callback - pauses/plays the simulation
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

// Set view fittest button callback - finds the fittest snake in population and displays it
document.querySelector("#btn-view-fittest").onclick = () => {
    displayID = population.getFittest();
    snakeDisplay.logic = population.players[displayID];
    snakeDisplay.render();
};

// Set view fittest living button callback - finds the fittest living snake in population and displays it
document.querySelector("#btn-view-fittest-living").onclick = () => {
    displayID = population.getFittest(false);
    snakeDisplay.logic = population.players[displayID];
    snakeDisplay.render();
};

// Set sim speed slider callback - Adjusts number of steps per loop
document.querySelector("#slider-speed").oninput = (e) => {
    document.querySelector("#label-sim-speed").innerHTML = "Sim Speed (" + e.target.value + ")";
    steps = e.target.value;
};

// Set show fittest living checkbox callback - Sets the alwaysShowFittestLiving flag
document.querySelector("#cb-show-fittest-living").onclick = (e) => {
    alwaysShowFittestLiving = e.target.checked;
};

// Set secondary display mode dropdown callback - Sets the way snakes are selected to display in the secondary displays
document.querySelector("#select-secondary-display-mode").onchange = (e) => {
    secondaryDisplayMode = e.target.value;
    if (secondaryDisplayMode == "First") {
        for (let i = 0; i < secondaryDisplays.length; i++) {
            secondaryDisplays[i].logic = population.players[i];
            secondaryDisplays[i].render();
        }
    }
};

// Set secondary display count slider callback - Sets the number of secondary displays
document.querySelector("#slider-secondary-count").oninput = (e) => {
    document.querySelector("#label-secondary-count").innerHTML = "Secondary Displays (" + e.target.value + ")";
    for (let i = 0; i < secondaryDisplays.length; i++) {
        secondaryDisplaysParent.removeChild(secondaryDisplays[i]);
    }
    secondaryDisplays.splice(0);
    const secondaryCount = e.target.value;
    for (let i = 0; i < secondaryCount; i++) {
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
};

// Set restart button callback - Restarts the population
document.querySelector("#btn-restart").onclick = () => {
    population.nextGenSize = Number(document.querySelector("#input-population-size").value);
    population = new Population(() => {
        const snake = snakeSource ? snakeSource.copy() : new Snake();
        snake.nn.mutationRate = document.querySelector("#slider-mutation-rate").value;
        snake.scorePerMove = Number(document.querySelector("#input-score-per-move").value);
        snake.scorePerApple = Number(document.querySelector("#input-score-per-apple").value);
        snake.scorePerMoveTowardApple = Number(document.querySelector("#input-score-per-move-toward-apple").value);
        snake.starveTime = Number(document.querySelector("#input-time-to-starve").value);
        return snake;
    }, population.nextGenSize);
    displayID = 0;
    snakeDisplay.logic = population.players[0];
    snakeDisplay.render();

    for (let i = 0; i < secondaryDisplays.length; i++) {
        secondaryDisplays[i].logic = population.players[i];
        secondaryDisplays[i].render();
    }
};

// Params
// Set population size input callback - Sets the next gen size of the population
document.querySelector("#input-population-size").onchange = (e) => {
    // Clamp values
    if (e.target.value < 100)
        e.target.value = 100;
    else if (e.target.value > 5000)
        e.target.value = 5000;
    
    // Adjust population size in next generation
    population.setNextGenSize(e.target.value);
};

// Set mutation rate slider callback - Sets the mutation rate??? Duh???
document.querySelector("#slider-mutation-rate").oninput = (e) => {
    let val = e.target.value + "";
    if (val.length == 3)
        val += "0";
    if (val.length == 1)
        val += ".00";
    document.querySelector("#label-mutation-rate").innerHTML = "Mutation Rate (" + val + ")";
    for (let i = 0; i < population.size; i++) {
        population.players[i].nn.mutationRate = e.target.value;
    }
};

// Set score per move input callback - Sets score per move of snakes
document.querySelector("#input-score-per-move").onchange = (e) => {
    for (let i = 0; i < population.size; i++) {
        population.players[i].scorePerMove = Number(e.target.value);
    }
};

// Set score per apple input callback - Sets score per apple of snakes
document.querySelector("#input-score-per-apple").onchange = (e) => {
    for (let i = 0; i < population.size; i++) {
        population.players[i].scorePerApple = Number(e.target.value);
    }
};

// Set score per move toward apple input callback - Sets score per move toward apple of snakes
document.querySelector("#input-score-per-move-toward-apple").onchange = (e) => {
    for (let i = 0; i < population.size; i++) {
        population.players[i].scorePerMoveTowardApple = Number(e.target.value);
    }
};

// Set time to starve input callback - Sets the number of steps a snake can move without getting an apple before it dies
document.querySelector("#input-time-to-starve").onchange = (e) => {
    if (e.target.value < 0)
        e.target.value = 0;
    for (let i = 0; i < population.size; i++) {
        population.players[i].starveTime = Number(e.target.value);
    }
};

// DiskOp
// Set save fittest button callback - Saves the fittest snake in the current population as a JSON file
document.querySelector("#btn-save-fittest").onclick = () => {
    const fittestNN = population.getFittest();
    const obj = {
        nn: population.players[fittestNN].nn,
        populationSize: population.size,
        mutationRate: population.players[fittestNN].nn.mutationRate,
        scorePerMove: population.players[fittestNN].scorePerMove,
        scorePerApple: population.players[fittestNN].scorePerApple,
        scorePerMoveTowardApple: population.players[fittestNN].scorePerMoveTowardApple,
        timeToStarve: population.players[fittestNN].starveTime
    };
    download("nn.json", JSON.stringify(obj));
};

// Set save current button callback - Saves the snake currently in the primary display as a JSON file
document.querySelector("#btn-save-current").onclick = () => {
    const obj = {
        nn: population.players[displayID].nn,
        populationSize: population.size,
        mutationRate: population.players[displayID].nn.mutationRate,
        scorePerMove: population.players[displayID].scorePerMove,
        scorePerApple: population.players[displayID].scorePerApple,
        scorePerMoveTowardApple: population.players[displayID].scorePerMoveTowardApple,
        timeToStarve: population.players[displayID].starveTime
    };
    download("nn.json", JSON.stringify(obj));
};

// Set load button callback - Loads a JSON file from the user's computer as a snake
document.querySelector("#btn-load-nn").onclick = (e) => {
    document.querySelector("input[type='file']").click();
};

// Restart the populatiomn using a JSON object as a template for the snakes
function restartFromJSON(json, name) {
    const nnJSON = json.nn;
    const nn = new NN(nnJSON.inputNames, nnJSON.hidden, nnJSON.outputNames);
    nn.weights = [];
    nn.biases = [];
    for (let i = 0; i < nnJSON.weights.length; i++) {
        nn.weights.push(Matrix.fromJSON(nnJSON.weights[i]));
        nn.biases.push(Matrix.fromJSON(nnJSON.biases[i]));
    }
    nn.mutationRate = nnJSON.mutationRate;
    snakeSource = new Snake();
    snakeSource.nn = nn;
    snakeSource.scorePerMove = json.scorePerMove;
    snakeSource.scorePerApple = json.scorePerApple;
    snakeSource.scorePerMoveTowardApple = json.scorePerMoveTowardApple;
    snakeSource.starveTime = json.timeToStarve;
    document.querySelector("#label-nn-init").innerHTML = "(Using " + name + ")";

    document.querySelector("#input-population-size").value = json.populationSize;
    document.querySelector("#slider-mutation-rate").value = json.mutationRate;
    document.querySelector("#label-mutation-rate").innerHTML = "Mutation Rate (" + json.mutationRate + ")";
    document.querySelector("#input-score-per-move").value = json.scorePerMove;
    document.querySelector("#input-score-per-apple").value = json.scorePerApple;
    document.querySelector("#input-score-per-move-toward-apple").value = json.scorePerMoveTowardApple;
    document.querySelector("#input-time-to-starve").value = json.timeToStarve;

    document.querySelector("#btn-unload-nn").removeAttribute("disabled");
    
    document.querySelector("#btn-restart").click();
}

// Set what actually happens when a file gets selected
document.querySelector("input[type='file']").onchange = (e) => {
    if (!e.target.files[0])
        return;

    document.querySelector("#btn-load-nn").classList.add("is-loading");

    const fr = new FileReader();
    fr.onload = () => {
        document.querySelector("#btn-load-nn").classList.remove("is-loading");
        // convert text to json
        try {
            const json = JSON.parse(fr.result);
            restartFromJSON(json, e.target.files[0].name);
        } catch (error) {
            console.log(error);
            document.querySelector(".one-line-notif").style.display = "inline-block";
        }
    }
    fr.readAsText(e.target.files[0]);
};

// Set load preset button callback - Loads a preset from presets folder based on selected value in select-preset
document.querySelector("#btn-load-preset").onclick = (e) => {
    fetch("./presets/" + document.querySelector("#select-preset").value + ".json")
        .then((response) => response.json())
        .then((json) => restartFromJSON(json, document.querySelector("#select-preset").value + ".json"))
        .catch((e) => console.log(e));
};

// Set unload button callback - resets the snakeSource to undefined so that restarting the simulation will use default settings
document.querySelector("#btn-unload-nn").onclick = (e) => {
    snakeSource = undefined;
    document.querySelector("#label-nn-init").innerHTML = "(Using default NN)";
    e.target.setAttribute("disabled", true);
};

// Set delete button callback (the x button on the error message) - hides the error message
document.querySelector(".delete").onclick = () => {
    document.querySelector(".one-line-notif").style.display = "none";
};

// Downloads a file to the user's computer
function download(filename, textInput) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(textInput));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Key input
// Removed for now
// Will add to allow users to play against the AI at some point

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
// NN TESTING STUFF
import "./nndisplay.js";
import "./snakedisplay.js";
import Snake from "./snake.js";
import Population from "./population.js";
import "./init.js";
import NN from "./nn.js";
import Matrix from "./matrix.js";

const nnDisplay = document.querySelector("nn-display");
const snakeDisplay = document.querySelector("snake-display");
const generationNum = document.querySelector("#generation-num");

let population = new Population(() => {
    const snake = new Snake();
    snake.nn.mutationRate = document.querySelector("#slider-mutation-rate").value;
    return snake;
}, 1000);
snakeDisplay.logic = population.players[0];
nnDisplay.nn = population.players[0].nn;
let steps = 1;

let secondaryDisplayMode = "First";

let alwaysShowFittestLiving = false;

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

const loop = () => {
    for (let i = 0; i < steps; i++) {
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
        setTimeout(loop, 1000 / 60);
};

document.querySelector("#label-sim-speed").innerHTML = "Sim Speed (" + document.querySelector("#slider-speed").value + ")";
document.querySelector("#label-mutation-rate").innerHTML = "Mutation Rate (" + document.querySelector("#slider-mutation-rate").value + ")";
document.querySelector("#label-secondary-count").innerHTML = "Secondary Displays (" + document.querySelector("#slider-secondary-count").value + ")";

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
    displayID = population.getFittest();
    snakeDisplay.logic = population.players[displayID];
    snakeDisplay.render();
};

document.querySelector("#btn-view-fittest-living").onclick = () => {
    displayID = population.getFittest(false);
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
    document.querySelector("#label-sim-speed").innerHTML = "Sim Speed (" + e.target.value + ")";
    steps = e.target.value;
};

document.querySelector("#cb-show-fittest-living").onclick = (e) => {
    alwaysShowFittestLiving = e.target.checked;
};

document.querySelector("#select-secondary-display-mode").onchange = (e) => {
    secondaryDisplayMode = e.target.value;
    if (secondaryDisplayMode == "First") {
        for (let i = 0; i < secondaryDisplays.length; i++) {
            secondaryDisplays[i].logic = population.players[i];
            secondaryDisplays[i].render();
        }
    }
};

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

document.querySelector("#btn-restart").onclick = () => {
    population = new Population(() => {
        const snake = new Snake();
        snake.nn.mutationRate = document.querySelector("#slider-mutation-rate").value;
        return snake;
    }, population.size);
    displayID = 0;
    snakeDisplay.logic = population.players[0];
    snakeDisplay.render();

    for (let i = 0; i < secondaryDisplays.length; i++) {
        secondaryDisplays[i].logic = population.players[i];
        secondaryDisplays[i].render();
    }
};

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

document.querySelector("#btn-save-fittest").onclick = () => {
    const fittestNN = population.getFittest();
    download("nn.json", JSON.stringify(population.players[fittestNN].nn));
};

document.querySelector("#btn-save-current").onclick = () => {
    download("nn.json", JSON.stringify(population.players[displayID].nn));
};

document.querySelector("#btn-load-nn").onclick = (e) => {
    document.querySelector("input[type='file']").click();
};

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
            const nn = new NN(json.inputs, json.hidden, json.outputs);
            nn.biasH = Matrix.fromJSON(json.biasH);
            nn.biasO = Matrix.fromJSON(json.biasO);
            nn.learningRate = json.learningRate;
            nn.mutationRate = json.mutationRate;
            nn.weightsHO = Matrix.fromJSON(json.weightsHO);
            nn.weightsIH = Matrix.fromJSON(json.weightsIH);
            population = new Population(() => {
                const snake = new Snake();
                snake.nn = nn.copy();
                return snake;
            }, population.size);
            displayID = 0;
            snakeDisplay.logic = population.players[0];
            snakeDisplay.render();

            for (let i = 0; i < secondaryDisplays.length; i++) {
                secondaryDisplays[i].logic = population.players[i];
                secondaryDisplays[i].render();
            }
        } catch (error) {
            console.log(error);
            document.querySelector(".one-line-notif").style.display = "inline-block";
        }
    }
    fr.readAsText(e.target.files[0]);
};

document.querySelector(".delete").onclick = () => {
    document.querySelector(".one-line-notif").style.display = "none";
}

function download(filename, textInput) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(textInput));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

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
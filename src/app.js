// NN TESTING STUFF
import "./nndisplay.js";
import "./snake.js";
import "./xor.js";
import NNOptions from "./nnoptions.js";
import { ActivationFuncs, ConnectionEnabledInitializeFuncs, NN, NodeTypes } from "./nn.js"
import Population from "./population.js";

const nnDisplay = document.querySelector("nn-display");
const xor = document.querySelector("xor-display");

const nn = new NN(ConnectionEnabledInitializeFuncs.Disabled, ActivationFuncs.ModifiedSigmoid);
nn.addInitialNode(NodeTypes.Input, "IN 1");
nn.addInitialNode(NodeTypes.Input, "IN 2");
nn.addInitialNode(NodeTypes.Bias, "BIAS");
nn.addInitialNode(NodeTypes.Output, "OUT");
nn.addHiddenNode([0, 1, 2], []);
nn.addHiddenNode([0, 1, 2], []);
nn.addHiddenNode([2, 4, 5], [3]);
nn.addHiddenNode([2, 4, 5], [3]);
console.log(nn);

const breedingOptions = new NNOptions();
// breedingOptions.newNeuronMutationRate = .01;
// breedingOptions.compatibilityThreshold = 10;

breedingOptions.weightMutationRate = .1;
breedingOptions.uniformPerturbationRange = .01;
breedingOptions.newNeuronMutationRate = 0;
breedingOptions.newConnectionMutationRate = 0;

let population = new Population(150, nn, breedingOptions);

let displayID = 0;

nnDisplay.nn = population.networks[0];
xor.nn = population.networks[0];

const xorProblem = [
    {
        inputs: { "IN 1": 1, "IN 2": 1, "BIAS": 1 },
        output: 0
    },
    {
        inputs: { "IN 1": 1, "IN 2": 0, "BIAS": 1 },
        output: 1
    },
    {
        inputs: { "IN 1": 0, "IN 2": 0, "BIAS": 1 },
        output: 0
    },
    {
        inputs: { "IN 1": 0, "IN 2": 1, "BIAS": 1 },
        output: 1
    }
];

let running = false;

const calcFitness = () => {
    population.networks.forEach((network) => {
        let sumFitness = 0;
        let guesses = [];
        for (let problem of xorProblem) {
            const guess = network.process(problem.inputs);
            const guessOutput = Math.round(guess["OUT"]);
            guesses.push(guessOutput);
            sumFitness += Math.abs(guess["OUT"] - problem.output);
        }
        sumFitness = 4 - sumFitness;
        sumFitness *= sumFitness;
        if (sumFitness > 15.75) {
            console.log(network.id + " FOUND THE ANSWER!");
            return true;
        }
        network.assignFitness(sumFitness, population.speciesOf(network).networks.length);
        network.output = "[" + guesses.join() + "]";
        network.expectedOutput = "[" + xorProblem.map((prob) => prob.output).join() + "]";
    });
    let maxFitness = 0;
    for (let network of population.networks) {
        if (network.fitness > maxFitness) {
            NN.highestFitnessThisGen = network.fitness;
        }
    }
    nnDisplay.nn = population.networks[0];
    nnDisplay.render();
    xor.nn = population.networks[0];
    xor.render();
    console.log(population);
    if (!running)
        return;
    setTimeout(() => {
        if (running) {
            population.nextGeneration();
            calcFitness();
        }
    }, 50);
}

setTimeout(() => {
    running = true;
    calcFitness();
}, 500);

document.querySelector("#btn-next-gen").onclick = () => {
    population.nextGeneration();
    calcFitness();

    nnDisplay.nn = population.networks[0];
    xor.nn = population.networks[0];
    nnDisplay.render();
    xor.render();
};

document.querySelector("#btn-pause").onclick = () => {
    running = !running;
    if (running) {
        calcFitness();
    }
};

document.querySelector("#btn-view-fittest").onclick = () => {
    let fittestIndex = 0;
    for (let i = 0; i < population.networks.length; i++) {
        if (population.networks[i].fitness > population.networks[fittestIndex].fitness)
            fittestIndex = i;
    }
    displayID = fittestIndex;
    nnDisplay.nn = population.networks[displayID];
    nnDisplay.render();
    xor.nn = population.networks[displayID];
    xor.render();
};

// END NN TESTING

const game = document.querySelector("snake-display");
document.body.onkeydown = keyDown;

// Various event callbacks
document.querySelector("#btn-next").onclick = () => {
    displayID = (displayID + 1) % population.networks.length;
    nnDisplay.nn = population.networks[displayID];
    nnDisplay.render();
    xor.nn = population.networks[displayID];
    xor.render();
};
document.querySelector("#btn-prev").onclick = () => {
    displayID--;
    if (displayID < 0)
        displayID = population.networks.length - 1;
    nnDisplay.nn = population.networks[displayID];
    nnDisplay.render();
    xor.nn = population.networks[displayID];
    xor.render();
};


init();

function init() {
   
}

//movement controls
function keyDown(event) {
    //up
    if (event.keyCode == 38) {
        game.passInput("UP");
    }

    //down
    if (event.keyCode == 40) {
        game.passInput("DOWN");
    }

    //left
    if (event.keyCode == 37) {
        game.passInput("LEFT");
    }

    //right
    if (event.keyCode == 39) {
        game.passInput("RIGHT");
    }

    event.preventDefault();
}
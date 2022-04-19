// NN TESTING STUFF
import "./nndisplay.js";
import "./snake.js";
import NNOptions from "./nnoptions.js";
import { ActivationFuncs, ConnectionEnabledInitializeFuncs, NN, NodeTypes } from "./nn.js"
import Population from "./population.js";

const nnDisplay = document.querySelector("nn-display");

const nn = new NN(ConnectionEnabledInitializeFuncs.Disabled, ActivationFuncs.ModifiedSigmoid);
nn.addInitialNode(NodeTypes.Input, "IN 1");
nn.addInitialNode(NodeTypes.Input, "IN 2");
nn.addInitialNode(NodeTypes.Bias, "BIAS 1");
nn.addInitialNode(NodeTypes.Bias, "BIAS 2");
nn.addInitialNode(NodeTypes.Output, "OUT 1");

const breedingOptions = new NNOptions();
breedingOptions.compatibilityThreshold = 1.75;
breedingOptions.newConnectionMutationRate = 1;
breedingOptions.enableDisabledConnectionRate = .1;

let population = new Population(50, nn, breedingOptions);

let displayID = 0;

nnDisplay.nn = population.networks[0];

const xorProblem = [
    {
        inputs: { "IN 1": 1, "IN 2": 1, "BIAS 1": 1, "BIAS 2": -1 },
        output: 0
    },
    {
        inputs: { "IN 1": 1, "IN 2": 0, "BIAS 1": 1, "BIAS 2": -1 },
        output: 1
    },
    {
        inputs: { "IN 1": 0, "IN 2": 0, "BIAS 1": 1, "BIAS 2": -1 },
        output: 0
    },
    {
        inputs: { "IN 1": 0, "IN 2": 1, "BIAS 1": 1, "BIAS 2": -1 },
        output: 1
    }
];

const calcFitness = () => {
    population.networks.forEach((network) => {
        let avgFitness = 0;
        let guesses = [];
        for (let problem of xorProblem) {
            const guess = network.process(problem.inputs);
            const guessOutput = Math.round(guess["OUT 1"]);
            guesses.push(guessOutput);
            avgFitness += 1 - Math.abs(guess["OUT 1"] - problem.output);
        }
        avgFitness /= 4;
        if (avgFitness > .9) {
            console.log(network.id + " FOUND THE ANSWER!");
            return true;
        }
        network.assignFitness(avgFitness, population.speciesOf(network).networks.length);
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
    console.log(population);
    setTimeout(() => {
        population.nextGeneration();
        calcFitness();
    }, 100);
}

setTimeout(calcFitness, 500);

document.querySelector("#btn-next-gen").onclick = () => {
    population.nextGeneration();
    calcFitness();

    nnDisplay.nn = population.networks[0];
    nnDisplay.render();
};

// END NN TESTING

// Various event callbacks
document.querySelector("#btn-next").onclick = () => {
    displayID = (displayID + 1) % population.networks.length;
    nnDisplay.nn = population.networks[displayID];
    nnDisplay.render();
};
document.querySelector("#btn-prev").onclick = () => {
    displayID--;
    if (displayID < 0)
        displayID = population.networks.length - 1;
    nnDisplay.nn = population.networks[displayID];
    nnDisplay.render();
};


init();

function init() {
   
};

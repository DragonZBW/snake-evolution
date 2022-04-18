// NN TESTING STUFF
import "./nndisplay.js";
import NNOptions from "./nnoptions.js";
import { ConnectionEnabledInitializeFuncs, NN, NodeTypes } from "./nn.js"
import Population from "./population.js";

const nnDisplay = document.querySelector("nn-display");

const nn = new NN(ConnectionEnabledInitializeFuncs.Random);
nn.addInitialNode(NodeTypes.Input, "IN 1");
nn.addInitialNode(NodeTypes.Input, "IN 2");
nn.addInitialNode(NodeTypes.Output, "OUT 1");
nn.addInitialNode(NodeTypes.Output, "OUT 2");
nn.finishInitialization();

const breedingOptions = new NNOptions();

let population = new Population(20, nn, breedingOptions);

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


init();

function init() {
   
};

import { ConnectionEnabledInitializeFuncs, NN, WeightRandomizeFuncs } from "./nn.js";
import Species from "./species.js";
import * as Utils from "./nnutils.js";

// A class representing a population of neural networks. 
// This is used to represent all the networks in a generation and keep track of them in relation to each other.
export default class Population {
    // Construct a population with an initial size and template neural network to base the initial condition off of.
    constructor(size, templateNN, weightRandomizeFunc = WeightRandomizeFuncs.ZeroToOne, breedingOptions) {
        this.size = size;
        this.networks = [];
        this.species = [];

        this.breedingOptions = breedingOptions;

        for (let i = 0; i < size; i++) {
            const nn = templateNN.copy();
            nn.randomizeConnectionWeights(weightRandomizeFunc);
            nn.finishInitialization();
            this.networks.push(nn);
        }

        this.species.push(new Species(this.networks[0]));
        this.classifySpecies();
    }

    // Classify all the networks in the population into species.
    classifySpecies() {
        // Prepare all species for the next gen
        for (let species of this.species) {
            species.prepareForNextGen();
        }
        // Loop through each nn in the networks array and classify it into a species
        for (let nn of this.networks) {
            let found = false;
            for (let species of this.species) {
                if (Utils.distance(nn, species.representative, this.breedingOptions) < this.breedingOptions.compatibilityThreshold) {
                    species.add(nn);
                    found = true;
                }
            }
            // If a fitting species was not found, create a new one with this nn
            if (!found) {
                this.species.push(new Species(nn));
            }
        }
    }
}
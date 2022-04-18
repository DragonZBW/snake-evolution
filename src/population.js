import { ConnectionEnabledInitializeFuncs, NN } from "./nn.js";
import Species from "./species.js";
import * as Utils from "./nnutils.js";

// A class representing a population of neural networks. 
// This is used to represent all the networks in a generation and keep track of them in relation to each other.
export default class Population {
    // Construct a population with an initial size and template neural network to base the initial condition off of.
    constructor(size, templateNN, breedingOptions) {
        this.size = size;
        this.gen = 0;
        this.networks = [];
        this.species = [];

        this.breedingOptions = breedingOptions;

        for (let i = 0; i < size; i++) {
            const nn = templateNN.copy();
            nn.randomizeConnectionWeights();
            nn.finishInitialization();
            nn.id = i;
            this.networks.push(nn);
        }

        this.classifySpecies();
    }

    // Classify all the networks in the population into species.
    classifySpecies() {
        // Prepare all species for the next gen
        for (let species of this.species) {
            species.prepareForNextGen();
        }
        for (let i = 0; i < this.species.length; i++) {
            if (!this.species[i].representative) {
                this.species.splice(i, 1);
                i--;
            }
        }
        // Loop through each nn in the networks array and classify it into a species
        for (let nn of this.networks) {
            let found = false;
            for (let i = 0; i < this.species.length; i++) {
                const species = this.species[i];
                const dist = Utils.distance(nn, species.representative, this.breedingOptions);
                console.log(nn.id + " has a distance of " + dist + " to species " + i);
                if (dist < this.breedingOptions.compatibilityThreshold) {
                    species.add(nn);
                    nn.species = i;
                    found = true;
                    break;
                }
            }
            // If a fitting species was not found, create a new one with this nn
            if (!found) {
                nn.species = this.species.length;
                this.species.push(new Species(nn));
            }
        }
        for (let i = 0; i < this.species.length; i++) {
            if (this.species[i].networks.length == 0) {
                this.species.splice(i, 1);
                i--;
            }
        }
    }

    // Get the species that a certain network belongs to.
    speciesOf(network) {
        for (let species of this.species) {
            if (species.networks.includes(network)) {
                return species;
            }
        }
        return undefined;
    }

    // Move to the next generation. Handles breeding and mutation. Assumes that fitness has already been assigned
    nextGeneration() {
        // create an empty array which will hold the networks of the next generation.
        const newPopulation = [];

        /* From https://ai.stackexchange.com/questions/2689/how-does-mating-take-place-in-neat: The breeding process of NEAT.
            1. The worst networks from every species are removed.
            2. All species receive a number of offsprings that they can have. This is calculated by an adjusted neural network fitness.
            3. Offsprings for species are divided among neural networks in those species. Fitter neural networks have more offsprings.
            4. Networks from the same species are combined and create an offspring.
        */

        // 1. The worst networks are removed from each species
        for (let i = 0; i < this.species.length; i++) {
            const species = this.species[i];
            // Omit species with only one network from this, since they probably haven't gotten a chance to grow yet.
            if (species.networks.length < this.breedingOptions.minSpeciesSizeToRemoveWorst)
                continue;

            let lowestFitness = Number.MAX_VALUE;
            let lowestIndex = undefined;
            for (let i = 0; i < species.networks.length; i++) {
                const nn = species.networks[i];
                if (nn.fitness < lowestFitness) {
                    lowestFitness = nn.fitness;
                    lowestIndex = i;
                }
            }
            // remove the worst network
            species.networks.splice(lowestIndex, 1);
        }
        for (let i = 0; i < this.species.length; i++) {
            if (this.species[i].networks.length == 0) {
                this.species.splice(i);
                i--;
            }
        }

        // 2. All species receive a number of offsprings they can have. This is calculated by an adjusted neural network fitness.
        // For my purposes, I am just taking the fittest network of the species and using its adjusted fitness as the offspring generation weight.
        const offspringAllotments = [];
        let speciesFitnessTotal = 0;
        const speciesFitnesses = [];
        for (let i = 0; i < this.species.length; i++) {
            const fittest = this.species[i].getFittest();
            if (!fittest) {
                speciesFitnesses.push(0);
                continue;
            }
            
            const fitness = fittest.fitness;
            speciesFitnesses.push(fitness);
            speciesFitnessTotal += fitness;
        }
        for (let i = 0; i < speciesFitnesses.length; i++) {
            offspringAllotments.push(Math.floor(speciesFitnesses[i] / speciesFitnessTotal * this.size));
        }
        // Ensure the correct number of allotments have been made
        let totalAllotted = offspringAllotments.reduce((prev, curr) => prev + curr);
        while (totalAllotted < this.size) {
            const index = Math.floor(Math.random() * offspringAllotments.length);
            offspringAllotments[index]++;
            totalAllotted = offspringAllotments.reduce((prev, curr) => prev + curr);
        }
        console.log("offspring allotments", offspringAllotments);
        // Loop through species and breed networks.
        for (let i = 0; i < offspringAllotments.length; i++) {
            // Get the allotted number of offspring for the species
            const allottedOffspring = offspringAllotments[i];

            // 3. Offsprings for species are divided among neural networks in those species. Fitter neural networks have more offsprings.
            // The networkFitnesses array is an array of the fitnesses of all the networks in the species. A higher fitness = a higher weight to the breeding chance.
            let networkFitnessTotal = 0;
            let networkFitnesses = [];
            for (let j = 0; j < this.species[i].networks.length; j++) {
                const fitness = this.species[i].networks[j].fitness;
                networkFitnesses.push(fitness);
                networkFitnessTotal += fitness;
            }

            /* The chances array holds numbers from 0 to 1 representing the probabilities of selecting a network to breed.
               These are not literally probabilities, as each one is larger than the last. Really, this is set up so that
               a random number between 0 and 1 will be used to pick one of these chances using the below algorithm where
               each chance is checked, and if the random number is less than it, then that chance is picked. */
            let chances = [];
            for (let f of networkFitnesses) {
                const prevVal = chances.length == 0 ? 0 : chances[chances.length - 1];
                chances.push(prevVal + f / networkFitnessTotal);
            }

            const selectNetwork = () => {
                const rand = Math.random();
                let selectedNetwork;
                for (let j = 0; j < chances.length; j++) {
                    if (rand < chances[j]) {
                        selectedNetwork = j;
                        break;
                    }
                }
                // If a network was not selected, it means there was an issue in calculating the chances resulting in the highest chance value
                // not being 1 (this should be the last value in the array) so just pick the last network
                if (!selectedNetwork)
                    selectedNetwork = chances.length - 1;
                
                return selectedNetwork;
            }

            // 4. Networks from the same species are combined and create an offspring.
            // Create the allotted number of offspring by selecting networks to breed based on fitness
            for (let j = 0; j < allottedOffspring; j++) {
                const breedMode = Math.random();
               // if (breedMode < this.breedingOptions.asexualReproductionRate) {
                    const selected = selectNetwork();
                    const newNetwork = this.species[i].networks[selected].copy();
                    newNetwork.id = newPopulation.length;
                    newNetwork.mutate(this.breedingOptions);
                    newPopulation.push(newNetwork);
                // } else {
                //     const a = this.species[i].networks[selectNetwork()];
                //     const b = this.species[i].networks[selectNetwork()];
                //     const newNetwork = NN.breed(a, b, this.breedingOptions);
                //     newNetwork.id = newPopulation.length;
                //     newNetwork.mutate(this.breedingOptions);
                //     newPopulation.push(newNetwork);
                // }
            }
        }

        for (let network of newPopulation)
            network.finishInitialization();
        this.networks = newPopulation;
        this.classifySpecies();
        NN.clearInnovationsThisGen();
        this.gen++;
        NN.gen = this.gen;
    }
}
// A class representing a population of neural networks. 
// This is used to represent all the networks in a generation and keep track of them in relation to each other.
export default class Population {
    // Construct a population with an initial size and template neural network to base the initial condition off of.
    constructor(size, templateNN) {
        this.size = size;
        this.networks = [];
        for (let i = 0; i < size; i++) {
            const nn = templateNN.copy();
            nn.randomizeConnectionWeights();
            this.networks.push(nn);
        }
    }
}
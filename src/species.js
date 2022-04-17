// A species in a NEAT neural network population.
export default class Species {
    // Construct a species off of a single neural network
    constructor(nn) {
        this.representative = nn;
        this.networks = [nn];
        this.gensWithoutImprovement = 0;
    }

    // Get ready for the next generation by selecting a representative network at random.
    prepareForNextGen() {
        const index = Math.floor(Math.random() * this.networks.length);
        this.representative = this.networks[index];
        this.networks = [];
    }

    // Add a neural network to this species.
    add(nn) {
        this.networks.push(nn);
    }

    // Get the fittest network from this species
    getFittest() {
        return this.networks.reduce((prev, curr) => curr.fitness > prev.fitness ? curr : prev);
    }
}
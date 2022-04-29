// A population for neuroevolution.
export default class Population {
    // Construct a population. Each player is initialized using creationFunc.
    constructor(creationFunc, populationSize) {
        this.players = [];
        for (let i = 0; i < populationSize; i++) {
            this.players.push(creationFunc());
            this.players[i].id = i;
        }
        this.size = populationSize;
        this.nextGenSize = this.size;

        this.aliveCount = this.size;

        this.generation = 0;
    }

    // Set the size of the next generation.
    setNextGenSize(size) {
        this.nextGenSize = size;
    }

    // Get the fittest player in the population, return its index.
    getFittest(allowDead = true) {
        let fittest = 0;
        for (let i = 1; i < this.size; i++) {
            if (!this.players[i].alive && !allowDead)
                continue;
            if (this.players[i].score > this.players[fittest].score)
                fittest = i;
        }
        return fittest;
    }

    // Get an array of the top players in the population.
    getFittestGroup(count, allowDead = true) {
        let fittest = [];
        for (let n = 0; n < count; n++) {
            fittest.push(0);
            for (let i = 1; i < this.size; i++) {
                if (!this.players[i].alive && !allowDead)
                    continue;
                if (this.players[i].score > this.players[fittest[n]].score && !fittest.includes(i)) {
                    fittest[n] = i;
                }
            }
        }
        return fittest;
    }

    // Move on to the next generation, using natural selection to pass on genes.
    nextGeneration() {
        // Calculate fitness of players
        let sum = 0;
        for (let i = 0; i < this.size; i++) {
            sum += this.players[i].score;
        }

        const matingPool = [];
        for (let i = 0; i < this.size; i++) {
            this.players[i].fitness = sum == 0 ? 1 / this.size : (1 + this.players[i].score) / sum;
            for (let j = 0; j < this.players[i].fitness * this.size; j++)
                matingPool.push(i);
        }

        // Select players to pass on genes to next gen
        const nextGen = [];

        // always copy over most fit of the generation without mutation
        let fittest = 0;
        for (let i = 0; i < this.size; i++) {
            if (this.players[i].fitness > this.players[fittest].fitness) {
                fittest = i;
            }
        }
        nextGen.push(this.players[fittest].copy());

        for (let i = 1; i < this.nextGenSize; i++) {
            // select a player
            const selectedPlayer = this.players[matingPool[Math.floor(Math.random() * matingPool.length)]];
            // copy and mutate the selected player into the next gen
            const child = selectedPlayer.copy();
            child.mutate();
            nextGen.push(child);
            nextGen[i].id = i;
        }

        this.players = nextGen;
        this.allDead = false;
        this.generation++;
        this.size = this.nextGenSize;
        this.aliveCount = this.size;
    }

    // Update all players in the population.
    update() {
        this.aliveCount = 0;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].update();
            if (this.players[i].alive)
                this.aliveCount++;
        }
    }
}
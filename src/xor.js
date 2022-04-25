import NN from "./nn.js";

const trainingData = [
    {
        inputs: [0, 1],
        targets: [1]
    },
    {
        inputs: [1, 0],
        targets: [1]
    },
    {
        inputs: [0, 0],
        targets: [0]
    },
    {
        inputs: [1, 1],
        targets: [0]
    }
];

// XOR problem logic
export default class XOR {
    // Construct the problem with a neural network.
    constructor() {
        this.nn = new NN(2, 6, 1);
        this.nn.mutationRate = .01;
        this.alive = true;
        this.score = 0;
        this.fitness = 0;
    }

    copy() {
        const clone = new XOR();
        clone.nn = this.nn.copy();
        return clone;
    }

    mutate() {
        this.nn.mutate();
    }

    update() {
        let errSum = 0;
        for (let i = 0; i < trainingData.length; i++) {
            const guess = this.nn.feedForward(trainingData[i].inputs)[0];
            const error = Math.abs(guess - trainingData[i].targets[0]);
            errSum += error;
        }
        this.score = 4 - errSum;

        this.alive = false;
    }

    guess(x, y) {
        //console.log(x, y);
        //console.log(this.nn.feedForward([x, y]));
        return this.nn.feedForward([x, y])[0];
    }
}
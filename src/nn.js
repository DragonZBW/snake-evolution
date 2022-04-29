import Matrix from "./matrix.js";
import { randomGauss } from "./utils.js";

// Sigmoid function for use in the neural network.
function sigmoid(x) {
    return 1 / (1 + Math.exp(-3 * x));
}

// Derivative of sigmoid for use in the neural network.
function dsigmoid(y) {
    //return sigmoid(x) * (1 - sigmoid(x));
    return y * (1 - y);
}

// A general purpose neural network.
export default class NN {
    // Construct a neural network with a specified number of inputs, hidden nodes, and outputs.
    constructor(inputs, hidden, outputs) {
        this.inputNames = inputs;
        this.inputs = inputs.length;
        this.hidden = hidden.slice();
        this.outputNames = outputs;
        this.outputs = outputs.length;

        const layers = [this.inputs].concat(this.hidden.concat([this.outputs]));

        this.weights = [];
        this.biases = [];
        for (let i = 1; i < layers.length; i++) {
            this.weights.push(new Matrix(layers[i], layers[i - 1]));
            this.weights[this.weights.length - 1].randomize();

            this.biases.push(new Matrix(layers[i], 1));
            this.biases[this.biases.length - 1].randomize();
        }

        // this.weightsIH = new Matrix(this.hidden, this.inputs);
        // this.weightsHO = new Matrix(this.outputs, this.hidden);
        // this.weightsIH.randomize();
        // this.weightsHO.randomize();


        // this.biasH = new Matrix(this.hidden, 1);
        // this.biasO = new Matrix(this.outputs, 1);
        // this.biasH.randomize();
        // this.biasO.randomize();

        //this.learningRate = .05;
        this.mutationRate = .02;
    }

    // Make a copy of the neural network.
    copy() {
        const clone = new NN(this.inputNames, this.hidden, this.outputNames);
        clone.weights = [];
        clone.biases = [];
        for (let i = 0; i < this.weights.length; i++) {
            clone.weights[i] = this.weights[i].copy();
            clone.biases[i] = this.biases[i].copy();
        }
        // clone.weightsIH = this.weightsIH.copy();
        // clone.weightsHO = this.weightsHO.copy();
        // clone.biasH = this.biasH.copy();
        // clone.biasO = this.biasO.copy();
        // clone.learningRate = this.learningRate;
        clone.mutationRate = this.mutationRate;
        return clone;
    }

    // Ask the neural network for a guess of the output given a set of inputs.
    feedForward(input) {
        let inputs = Matrix.fromArray(input);

        let outputs = inputs;
        for (let i = 0; i < this.hidden.length + 1; i++) {
            outputs = Matrix.multiply(this.weights[i], outputs);
            outputs.add(this.biases[i]);
            outputs.map(sigmoid);
        }

        // let hidden = Matrix.multiply(this.weightsIH, inputs);
        // hidden.add(this.biasH);
        // hidden.map(sigmoid);

        // let outputs = Matrix.multiply(this.weightsHO, hidden);
        // outputs.add(this.biasO);
        // outputs.map(sigmoid);

        return outputs.toArray();
    }

    // Train the neural network to get closer to an expected output using backpropagation.
    // train(inputArray, targetArray) {
    //     let inputs = Matrix.fromArray(inputArray);

    //     let hidden = Matrix.multiply(this.weightsIH, inputs);
    //     hidden.add(this.biasH);
    //     hidden.map(sigmoid);

    //     let outputs = Matrix.multiply(this.weightsHO, hidden);
    //     outputs.add(this.biasO);
    //     outputs.map(sigmoid);
        
    //     let targets = Matrix.fromArray(targetArray);

    //     // Calc output errors (targets - outputs)
    //     const outputErrors = Matrix.subtract(targets, outputs);

    //     // Calc delta weightsHO
    //     const gradients = Matrix.map(outputs, dsigmoid);
    //     gradients.multiply(outputErrors);
    //     gradients.multiply(this.learningRate);

    //     const hiddenTranspose = Matrix.transpose(hidden);
    //     const weightsHODelta = Matrix.multiply(gradients, hiddenTranspose);

    //     this.weightsHO.add(weightsHODelta);
    //     this.biasO.add(gradients);
        
    //     // Calc hidden layer errors
    //     const weightsHOTranspose = Matrix.transpose(this.weightsHO);
    //     const hiddenErrors = Matrix.multiply(weightsHOTranspose, outputErrors);

    //     // Calc delta weightsIH
    //     const hiddenGradient = Matrix.map(hidden, dsigmoid);
    //     hiddenGradient.multiply(hiddenErrors);
    //     hiddenGradient.multiply(this.learningRate);

    //     const inputTranspose = Matrix.transpose(inputs);
    //     const weightsIHDelta = Matrix.multiply(hiddenGradient, inputTranspose);

    //     this.weightsIH.add(weightsIHDelta);
    //     this.biasH.add(hiddenGradient);
    // }

    // Mutate the weights and biases.
    mutate() {
        const mutateFunc = (el, i, j) => {
            if (Math.random() < this.mutationRate) {
                return randomGauss();
            }
            return el;
        };

        for (let i = 0; i < this.weights.length; i++) {
            this.weights[i].map(mutateFunc);
            this.biases[i].map(mutateFunc);
        }
        
        // this.weightsHO.map(mutateFunc);
        // this.weightsIH.map(mutateFunc);
        // this.biasH.map(mutateFunc);
        // this.biasO.map(mutateFunc);
    }
}
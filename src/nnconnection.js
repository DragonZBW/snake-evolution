// A connection in a neural network
export default class NNConnection {
    // Construct a connection with input, output, weight, enabled flag, and innovation number.
    // The input and output parameters are the IDs (aka the index in nodes) of the two nodes to connect.
    constructor(input, output, weight, enabled, innovationNum) {
        this.input = input;
        this.output = output;
        this.weight = weight;
        this.enabled = enabled;
        this.innovationNum = innovationNum;
    }

    // Check if this connection matches another (aside from innovation number and weight)
    matches(other) {
        return this.input == other.input && this.output == other.output;
    }

    // Return a copy of the connection.
    copy() {
        return new NNConnection(this.input, this.output, this.weight, this.enabled, this.innovationNum);
    }
}
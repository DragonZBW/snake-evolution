// A node (input, hidden neuron, or output) in a neural network
export default class NNNode {
    // Construct a node with id, type, and name. Name can be excluded for hidden neurons.
    constructor(id, type, name) {
        this.id = id;
        this.type = type;
        this.name = name;
    }

    // Return a copy of the node.
    copy() {
        return new NNNode(this.id, this.type, this.name);
    }
}
import NNConnection from "./nnconnection.js";
import NNNode from "./nnnode.js";

export const NodeTypes = {
    Input: 0,
    Hidden: 1,
    Output: 2,
};

export const WeightRandomizeFuncs = {
    ZeroToOne: () => Math.random(),
    MinusOneToOne: () => Math.random() * 2 - 1
};

export const ConnectionEnabledInitializeFuncs = {
    Enabled: () => true,
    Disabled: () => false,
    Random: () => Math.random() > .5
};

export const ActivationFuncs = {
    Sigmoid: (x) => 1 / (1 + Math.pow(Math.E, -x)),
    ModifiedSigmoid: (x) => 1 / (1 + Math.pow(Math.E, -4.9 * x)),
    Clamp01: (x) => Math.max(0, Math.min(x, 1)),
    Step01: (x) => x > 0 ? 1 : 0,
    Sign: (x) => Math.sign(x)
};

// A neural network based around the NEAT algorithm.
export class NN {
    /* Notes on data structure:
        - The network always starts EMPTY (only having inputs and outputs). Nodes are added one by one. When initializing a population of networks, one network
          should be created with the default initial values, then it should be cloned to the population size.

        - ALL NODES in the network are stored in a SINGLE array, indexed only by the order they were added. 
          Innovation number DOES NOT matter for nodes, only for connections. Input/Hidden/Output nodes are distinguished
          by a type property in the nodes and by two additional arrays that keep track of the inputs and outputs separately.

        - All NODES in the network only need two pieces of information:
            1. ID (only needs to be unique to the network itself, not globally)
            2. Type (Input, Hidden, Output)

        - For INPUT NODES, a naming semantic will be used to ease sending data between the game and the network.
          Input nodes will have an additional property of name, which will be passed into a reverse lookup table to allow
          the inputs to be looked up by name. When passing in inputs from an external source, they can be indexed this way.

        - OUTPUT NODES will also be given a name so that the data is easily readable when returned as an object.

        - All CONNECTIONS in the network need the following information:
            1. Input
            2. Output
            3. Weight
            4. Enabled/Disabled?
            5. Innovation Number
     */

    static innovationNumber = 0;

    /* Construct an empty neural network. Initializes some properties that will remain the same throughout the NN's lifetime. 
        - connectionInitializeMode: how the connections' enabled property will be initialized when creating the initial nodes + connections
        - activationFunc: the activation function that will be used to process values in all hidden neurons
    */
    constructor(connectionInitializeMode = ConnectionEnabledInitializeFuncs.Enabled, activationFunc = ActivationFuncs.Sigmoid) {
        this.inputs = [];
        this.outputs = [];
        this.nodes = [];
        this.connections = [];

        this.activationFunc = activationFunc;

        this.connectionInitializeMode = connectionInitializeMode;
    }

    // Returns a copy of the neural network.
    copy() {
        const clone = new NN();
        
        clone.inputs = this.inputs.map((node) => node.copy());
        clone.outputs = this.outputs.map((node) => node.copy());
        clone.nodes = this.nodes.map((node) => node.copy());
        clone.connections = this.connections.map((conn) => conn.copy());

        return clone;
    }

    // Add an input or output node to the neural network.
    // This should only be called when first creating neural networks at the start of the population.
    addInitialNode(type, name) {
        // Ensure node type is input or output
        if (type == NodeTypes.Hidden)
            throw "Can't initialize a NEAT neural network with any hidden nodes!";
        if (type != NodeTypes.Input && type != NodeTypes.Output)
            throw "Invalid node type!";
        
        // Create node
        const node = new NNNode(this.nodes.length, type, name);

        // Add to inputs or outputs array based on type, and add connections to nodes of the opposite type
        if (type == NodeTypes.Input) {
            // Add to inputs array
            this.inputs.push(node);
            
            // Add connections
            for (let o of this.outputs) {
                this.addConnection(node.id, o.id, 0, this.connectionInitializeMode());
            }
        } else {
            // Add to outputs array
            this.outputs.push(node);
            
            // Add connections
            for (let i of this.inputs) {
                this.addConnection(i.id, node.id, 0, this.connectionInitializeMode());
            }
        }
        
        // Add to master nodes array
        this.nodes.push(node);
    }

    // Add a connection between two existing nodes. The input and output parameters are the IDs (aka the index in nodes) of the two nodes to connect.
    addConnection(input, output, weight, enabled) {
        this.connections.push(new NNConnection(input, output, weight, enabled, NN.innovationNumber));
        NN.innovationNumber++;
    }

    // Randomize the weights of all connections in the network.
    randomizeConnectionWeights(randomizeFunc = WeightRandomizeFuncs.ZeroToOne) {
        for (let c of this.connections) {
            c.weight = randomizeFunc();
        }
    }

    // Mutates this neural network. This DOES directly modify the neural network and doesn't create a new one.
    mutate(breedingOptions) {
        
    }

    // Breed two neural networks together to create a new one.
    static breed(parentA, parentB, breedingOptions) {
        
    }
}
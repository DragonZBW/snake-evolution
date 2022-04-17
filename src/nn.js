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
    Value: (x) => x,
    AbsoluteVal: (x) => Math.abs(x),
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
        this.initialized = false;
    }

    // Returns a copy of the neural network.
    copy() {
        const clone = new NN();

        clone.inputs = this.inputs.map((node) => node.copy());
        clone.outputs = this.outputs.map((node) => node.copy());
        for (let input of clone.inputs) {
            clone.nodes[input.id] = input;
        }
        for (let output of clone.outputs) {
            clone.nodes[output.id] = output;
        }
        clone.connections = this.connections.map((conn) => conn.copy());

        return clone;
    }

    // Add an input or output node to the neural network.
    // This should only be called when first creating neural networks at the start of the population.
    addInitialNode(type, name) {
        if (this.initialized)
            throw "The NN has already finished initialization; can't add any more initial nodes!";

        // Ensure node type is input or output
        if (type == NodeTypes.Hidden)
            throw "Can't initialize a NEAT neural network with any hidden nodes!";
        if (type != NodeTypes.Input && type != NodeTypes.Output)
            throw "Invalid node type!";

        // Create node
        const node = new NNNode(this.nodes.length, type, name);

        // Add to inputs or outputs array based on type, and add connections to nodes of the opposite type
        switch (type) {
            case NodeTypes.Input:
                // Add to inputs array
                this.inputs.push(node);

                // Add connections
                for (let o of this.outputs) {
                    this.addConnection(node.id, o.id, 0, this.connectionInitializeMode());
                }
                break;
            case NodeTypes.Output:
                // Add to outputs array
                this.outputs.push(node);

                // Add connections
                for (let i of this.inputs) {
                    this.addConnection(i.id, node.id, 0, this.connectionInitializeMode());
                }
                break;
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

    // Finishes the initialization process by generating data necessary to process inputs.
    finishInitialization() {
        /* Generate data. In addition to the starting information from the genotype, each node needs to know
            - Its INPUT connections. The order in which nodes/connections are processed must be computed in reverse starting from the outputs,
              so knowing each node's inputs will allow this calculation to be much faster than searching through all the connections
              each time.
        */

        // For each connection, check the output and add the connection to that node's inputs array
        for (let c of this.connections) {
            const out = this.nodes[c.output];
            out.inputs.push(c);
        }

        this.initialized = true;
    }

    // Process a set of inputs. Inputs are processed using names as indices. Returns an object containing the outputs indexed by name.
    process(inputs) {
        // The NN must have finished being initialized to process data (otherwise, the nodes will not have their inputs arrays set up)
        if (!this.initialized)
            throw "The NN has not finished initialization; can't process data!";
        
        // Define a function for getting the value of a node. This will be used recursively to produce outputs for the netowrk.
        const getValue = (node) => {
            switch (node.type) {
                case NodeTypes.Input:
                    // INPUT NODE - check the inputs array for the corresponding input. If it is there, just return its value.
                    // If it's not there, throw an error.
                    const input = inputs[node.name];
                    if (input == undefined)
                        throw "Input for node '" + node.name + "' was missing from the inputs passed in to the NN.";
                    return input;
                case NodeTypes.Hidden:
                case NodeTypes.Output:
                    // HIDDEN/OUTPUT NODE - sum the values resulting from multiplying the weights of the input connections by the values of the input nodes,
                    // then run the sum through the activation function and return the resulting value.
                    let sum = 0;
                    for (let inConn of node.inputs) {
                        if (!inConn.enabled)
                            continue;

                        const value = getValue(this.nodes[inConn.input]) * inConn.weight;
                        sum += value;
                    }
                    return this.activationFunc(sum);
            }
        };

        // Create an empty object of outputs, which will get filled up with data by processing each output node using recursion.
        let outputs = {};
        for (let output of this.outputs) {
            outputs[output.name] = getValue(output);
        }

        return outputs;
    }

    // Mutates this neural network. This DOES directly modify the neural network and doesn't create a new one.
    mutate(breedingOptions) {

    }

    // Breed two neural networks together to create a new one.
    static breed(parentA, parentB, breedingOptions) {

    }
}
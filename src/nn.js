import NNConnection from "./nnconnection.js";
import NNNode from "./nnnode.js";

export const NodeTypes = {
    Input: 0,
    Hidden: 1,
    Output: 2,
    Bias: 3
};

const randomMinusOneToOne = () => Math.random() * 2 - 1;

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
    static innovationsThisGen = {};
    static gen = 0;
    static highestFitnessThisGen = 0;

    static clearInnovationsThisGen() {
        NN.innovationsThisGen = {};
    }

    static clearInnovations() {
        NN.innovationNumber = 0;
        NN.innovationsThisGen = {};
    }

    /* Construct an empty neural network. Initializes some properties that will remain the same throughout the NN's lifetime. 
        - connectionInitializeMode: how the connections' enabled property will be initialized when creating the initial nodes + connections
        - activationFunc: the activation function that will be used to process values in all hidden neurons
    */
    constructor(connectionInitializeMode = ConnectionEnabledInitializeFuncs.Enabled, activationFunc = ActivationFuncs.ModifiedSigmoid) {
        this.inputs = [];
        this.outputs = [];
        this.nodes = [];
        this.connections = [];

        this.activationFunc = activationFunc;

        this.connectionInitializeMode = connectionInitializeMode;

        this.output = undefined;
        this.expectedOutput = undefined;
        this.fitness = 0;
        this.species = undefined;
        this.id = undefined;
    }

    // Returns a copy of the neural network.
    copy() {
        const clone = new NN();

        clone.inputs = this.inputs.map((node) => node.copy());
        clone.outputs = this.outputs.map((node) => node.copy());
        const hidden = [];
        for (let node of this.nodes) {
            if (node.type == NodeTypes.Hidden) {
                hidden.push(node.copy());
            }
        }
        for (let input of clone.inputs) {
            clone.nodes[input.id] = input;
        }
        for (let output of clone.outputs) {
            clone.nodes[output.id] = output;
        }
        for (let h of hidden) {
            clone.nodes[h.id] = h;
        }
        clone.connections = this.connections.map((conn) => conn.copy());

        clone.activationFunc = this.activationFunc;
        clone.connectionInitializeMode = this.connectionInitializeMode;

        return clone;
    }

    // Add an input or output node to the neural network.
    // This should only be called when first creating neural networks at the start of the population.
    addInitialNode(type, name) {

        // Ensure node type is input or output
        if (type == NodeTypes.Hidden)
            throw "Can't initialize a NEAT neural network with any hidden nodes!";
        if (type != NodeTypes.Input && type != NodeTypes.Output && type != NodeTypes.Bias)
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
            case NodeTypes.Bias:
                // Techically they are inputs
                node.type = NodeTypes.Input;

                // Add to inputs array
                this.inputs.push(node);

                // Add connections
                for (let o of this.outputs) {
                    this.addConnection(node.id, o.id, 0, false);
                }
                break;
        }

        // Add to master nodes array
        this.nodes.push(node);
    }

    addHiddenNode(inputs, outputs) {
        const node = new NNNode(this.nodes.length, NodeTypes.Hidden);

        this.nodes.push(node);

        for (let input of inputs) {
            this.addConnection(input, node.id, randomMinusOneToOne(), true);
        }

        for (let output of outputs) {
            this.addConnection(node.id, output, randomMinusOneToOne(), true);
        }
    }

    // Add a connection between two existing nodes. The input and output parameters are the IDs (aka the index in nodes) of the two nodes to connect.
    addConnection(input, output, weight, enabled) {
        console.log("adding connection from " + input + " to " + output);
        this.connections.push(new NNConnection(input, output, weight, enabled, NN.innovationNumber));
        NN.innovationNumber++;
    }

    // Randomize the weights of all connections in the network.
    randomizeConnectionWeights() {
        for (let c of this.connections) {
            c.weight = randomMinusOneToOne();
        }
    }

    // Finishes the initialization process by generating data necessary to process inputs.
    updateNodeInputs() {
        /* Generate data. In addition to the starting information from the genotype, each node needs to know
            - Its INPUT connections. The order in which nodes/connections are processed must be computed in reverse starting from the outputs,
              so knowing each node's inputs will allow this calculation to be much faster than searching through all the connections
              each time.
        */

        for (let node of this.nodes) {
            node.inputs = [];
        }

        // For each connection, check the output and add the connection to that node's inputs array
        for (let c of this.connections) {
            const out = this.nodes[c.output];
            out.inputs.push(c.copy());
        }
    }

    // Process a set of inputs. Inputs are processed using names as indices. Returns an object containing the outputs indexed by name.
    process(inputs) {
        this.updateNodeInputs();

        // Define a function for getting the value of a node. This will be used recursively to produce outputs for the network.
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

    // Assign a fitness to this network. The fitness parameter is an unadjusted fitness value, while the species size affects the "fitness sharing" formula,
    // resulting in a final fitness value for the network.
    assignFitness(fitness, speciesSize) {
        this.fitness = fitness / speciesSize;
    }

    // Add a connection by mutation to the network. If the same structure was created in another mutation this generation, use the same innovation number.
    addMutatedConnection(connection) {
        // Check for a matching connection in another innovation from this gen
        let match = undefined;
        for (let conn in NN.innovationsThisGen) {
            if (connection.matches(NN.innovationsThisGen[conn])) {
                match = NN.innovationsThisGen[conn];
            }
        }
        if (match) {
            connection = match.copy();
        } else {
            NN.innovationsThisGen[NN.innovationNumber] = connection;
            NN.innovationNumber++;
        }
        this.connections.push(connection);
    }

    // Mutates this neural network. This DOES directly modify the neural network and doesn't create a new one.
    mutate(breedingOptions) {
        this.updateNodeInputs();

        // Mutate weights?
        if (Math.random() < breedingOptions.weightMutationRate) {
            // Each connection weight is mutated, and will either be uniformly perturbed or assigned a new random value.
            for (let c of this.connections) {
                if (Math.random() < breedingOptions.uniformPerturbationRate) {
                    // Uniform perturbation
                    c.weight += randomMinusOneToOne() * breedingOptions.uniformPerturbationRange;
                } else {
                    // New random value
                    c.weight = randomMinusOneToOne();
                }
            }
        }

        // Mutate a new hidden neuron?
        if (Math.random() < breedingOptions.newNeuronMutationRate) {
            /* From http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf:
               In the add node mutation, an existing connection is split and the new node placed where the old
               connection used to be. The old connection is disabled and two new connections are added to the 
               genome. The new connection leading into the new node receives a weight of 1, and the new 
               connection leading out receives the same weight as the old connection. */

            // Pick a random enabled connection to split
            // First make a list of all enabled connections
            const enabledConnections = [];
            for (let conn of this.connections) {
                if (conn.enabled)
                    enabledConnections.push(conn);
            }
            if (enabledConnections.length > 0) {

                let connIndex = Math.floor(Math.random() * enabledConnections.length);
                const oldConn = enabledConnections[connIndex];

                // Disable the old connection
                oldConn.enabled = false;

                // Make a new node
                const newNode = new NNNode(this.nodes.length, NodeTypes.Hidden);
                this.nodes.push(newNode);

                // Connect the new node
                this.addMutatedConnection(new NNConnection(oldConn.input, newNode.id, 1, true, NN.innovationNumber));

                newNode.inputs.push(this.connections[this.connections.length - 1]);

                this.addMutatedConnection(new NNConnection(newNode.id, oldConn.output, oldConn.weight, true, NN.innovationNumber));

                this.nodes[oldConn.output].inputs.push(this.connections[this.connections.length - 1]);
            }
        }

        // Mutate a new connection/enable a disabled connection?
        if (Math.random() < breedingOptions.newConnectionMutationRate) {
            /* From http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf:
               In the add connection mutation, a single new connection gene with a random weight is added connecting
               two previously unconnected nodes. */

            if (Math.random() < breedingOptions.enableDisabledConnectionRate) {
                // Enable a disabled connection
                const disabledConnections = [];
                for (let conn of this.connections) {
                    if (!conn.enabled)
                        disabledConnections.push(conn);
                }

                if (disabledConnections.length > 0) {
                    disabledConnections[Math.floor(Math.random() * disabledConnections.length)].enabled = true;
                }
            } else {
                // First, make a list of all nodes in the network that have at least one other node that is not connected to them as an input
                const availableNodes = [];
                for (let node of this.nodes) {
                    // Input nodes cannot have any inputs connected to them
                    if (node.type == NodeTypes.Input)
                        continue;
                    
                    const availableNode = {
                        node: node,
                        availableInputs: []
                    };
                    
                    // Determine which nodes would be allowed to connect to this one
                    for (let nodeB of this.nodes) {
                        // Outputs cannot be used as inputs, and a node can't be connected to itself
                        if (nodeB.type == NodeTypes.Output || nodeB.id == node.id)
                            continue;
                        
                        // If the node already uses nodeB as an input, we can't add it again
                        let found = false;
                        for (let conn of node.inputs) {
                            if (conn.input == nodeB.id) {
                                found = true;
                                break;
                            }
                        }
                        if(found)
                            continue;
                        
                        // Check if connecting nodeB as an input would create a loop.
                        const nodeHasInput = (nodeA, nodeB) => {
                            if (nodeA.type == NodeTypes.Input)
                                return false;
                            
                            for (let conn of nodeA.inputs) {
                                if (conn.input == nodeB.id)
                                    return true;
                            }
                            for (let conn of nodeA.inputs) {
                                if (nodeHasInput(this.nodes[conn.input], nodeB))
                                    return true;
                            }
                            return false;
                        };
                        if (nodeHasInput(nodeB, node)) {
                            continue;
                        }
                        
                        // All cases have been checked and the node is valid as an input, add it to the array
                        availableNode.availableInputs.push(nodeB);
                    }
                    if(availableNode.availableInputs.length > 0)
                        availableNodes.push(availableNode);
                }

                if (availableNodes.length > 0) {
                    // Choose a node from the list
                    const node = availableNodes[Math.floor(Math.random() * availableNodes.length)];

                    // Add a node from the availableInputs list as an input to node
                    const input = node.availableInputs[Math.floor(Math.random() * node.availableInputs.length)];
                    this.addMutatedConnection(new NNConnection(input.id, node.node.id, randomMinusOneToOne(), true, NN.innovationNumber));
                }
            }
        }
    }

    // Breed two neural networks together to create a new one.
    static breed(parentA, parentB, breedingOptions) {
        // Create a new network to work with
        const newNetwork = new NN(parentA.connectionInitializeMode, parentA.activationFunc);

        /* From http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf:
            Matching genes are inherited
            randomly, whereas disjoint genes (those that do not match in the middle) and excess
            genes (those that do not match in the end) are inherited from the more fit parent. In
            this case, equal fitnesses are assumed, so the disjoint and excess genes are also inherited randomly. */

        // Find max innovation values of both parents
        let aMaxInnovation = -1;
        for (let conn of parentA.connections) {
            if (conn.innovationNum > aMaxInnovation)
                aMaxInnovation = conn.innovationNum;
        }
        let bMaxInnovation = -1;
        for (let conn of parentB.connections) {
            if (conn.innovationNum > bMaxInnovation)
                bMaxInnovation = conn.innovationNum;
        }
        const maxInnovation = Math.max(aMaxInnovation, bMaxInnovation);

        // Look through the parents' connections and sort them by innovation number
        const aConnections = [];
        const bConnections = [];

        // Create lined up arrays of the genes
        for (let i = 0; i <= maxInnovation; i++) {
            let aFound = false;
            for (let conn of parentA.connections) {
                if (conn.innovationNum == i) {
                    aConnections.push(conn.copy());
                    aFound = true;
                    break;
                }
            }
            if (!aFound)
                aConnections.push(undefined);

            let bFound = false;
            for (let conn of parentB.connections) {
                if (conn.innovationNum == i) {
                    bConnections.push(conn.copy());
                    bFound = true;
                    break;
                }
            }
            if (!bFound)
                bConnections.push(undefined);
        }

        // Loop through connections by innovation number and pick which genes will get chosen
        for (let i = 0; i <= maxInnovation; i++) {
            // Skip genes that both are missing
            if (!aConnections[i] && !bConnections[i])
                continue;

            if (i > aMaxInnovation && aMaxInnovation < bMaxInnovation && bConnections[i]) {
                // Is excess (B)?
                if (parentB.fitness > parentA.fitness || (parentB.fitness == parentA.fitness && Math.random() < .5)) {
                    newNetwork.connections.push(bConnections[i]);
                }
            } else if (i > bMaxInnovation && bMaxInnovation < aMaxInnovation && aConnections[i]) {
                // Is excess (A)?
                if (parentA.fitness > parentB.fitness || (parentA.fitness == parentB.fitness && Math.random() < .5)) {
                    newNetwork.connections.push(aConnections[i]);
                }
            } else if (i <= aMaxInnovation && i <= bMaxInnovation) {
                if (aConnections[i] && !bConnections[i]) {
                    // Is disjoint (A)?
                    if (parentA.fitness > parentB.fitness || (parentA.fitness == parentB.fitness && Math.random() < .5)) {
                        newNetwork.connections.push(aConnections[i]);
                    }
                } else if (bConnections[i] && !aConnections[i]) {
                    // Is disjoint (B)?
                    if (parentB.fitness > parentA.fitness || (parentB.fitness == parentA.fitness && Math.random() < .5)) {
                        newNetwork.connections.push(bConnections[i]);
                    }
                } else if (aConnections[i] && bConnections[i]) {
                    // Not excess or disjoint
                    let newConn;
                    if (Math.random() < .5) {
                        newConn = aConnections[i];
                    } else {
                        newConn = bConnections[i];
                    }
                    // Chance to disable
                    if ((!aConnections[i].enabled || !bConnections[i].enabled) && Math.random() < breedingOptions.keepDisabledRate) {
                        newConn.enabled = false;
                    }
                    newNetwork.connections.push(newConn);
                }
            }
        }

        // Create a list of nodes that exist in either parent
        const combinedNodes = {};
        for (let node of parentA.nodes) {
            combinedNodes[node.id] = node;
        }
        for (let node of parentB.nodes) {
            combinedNodes[node.id] = node;
        }

        // Add nodes
        for (let n in combinedNodes) {
            const node = combinedNodes[n];
            switch (node.type) {
                case NodeTypes.Input:
                    newNetwork.inputs.push(node);
                    break;
                case NodeTypes.Output:
                    newNetwork.outputs.push(node);
                    break;
            }
            newNetwork.nodes.push(node);
        }

        return newNetwork;
    }
}
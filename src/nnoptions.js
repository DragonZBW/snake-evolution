// Options for speciating and breeding neural networks.
export default class NNOptions {
    constructor() {
        //Options for speciation.
        this.compatibilityCoeffExcess = 1;      // USED
        this.compatibilityCoeffDisjoint = 1;    // USED
        this.compatibilityCoeffWeightDiff = .4; // USED
        // If the distance function evaluates to less than this number, the two neural networks can be attributed to the same species.
        this.compatibilityThreshold = 3;        // USED
        
        // Options for selecting how to breed.
        this.maxGensWithoutImprovement = 15;
        this.minSpeciesSizeToKeepBest = 6;
        this.minSpeciesSizeToRemoveWorst = 2;   // USED
        this.asexualReproductionRate = .25;     // USED
        this.interspeciesMatingRate = .001;
        
        // Options for breeding neural networks.
        this.keepDisabledRate = .75;            // USED

        // Options for mutating neural networks.
        this.weightMutationRate = .8;           // USED
        this.uniformPerturbationRate = .9;      // USED
        this.uniformPerturbationRange = .1;     // USED
        this.newNeuronMutationRate = .03;       // USED
        this.newConnectionMutationRate = .05;   // USED
        this.enableDisabledConnectionRate = .1; // USED

        // Seal this object. I typically don't use this but since this object will get passed around
        // a lot and needs to have all the right properties on it, it made sense to seal it here.
        Object.seal(this);
    }
}
// Options for speciating and breeding neural networks.
class NNOptions {
    constructor() {
        // Options for speciation.
        this.compatibilityCoeffExcess = 1;
        this.compatibilityCoeffDisjoint = 1;
        this.compatibilityCoeffWeightDiff = .4;
        // If the distance function evaluates to less than this number, the two neural networks can be attributed to the same species.
        this.compatibilityThreshold = 3;
        
        // Options for selecting how to breed.
        this.maxGensWithoutImprovement = 15;
        this.minSpeciesSizeToKeepBest = 6;
        this.mutateWithoutCrossoverRate = .25;
        this.interspeciesMatingRate = .001;
        
        // Options when breeding two neural networks.
        this.weightMutationRate = .8;
        this.uniformPerturbationRate = .9;
        this.keepDisabledRate = .75;
        this.newNeuronMutationRate = .03;
        this.newConnectionMutationRate = .05;

        // Seal this object. I typically don't use this but since this object will get passed around
        // a lot and needs to have all the right properties on it, it made sense to seal it here.
        Object.seal(this);
    }
}
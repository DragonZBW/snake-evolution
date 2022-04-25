// Options for speciating and breeding neural networks.
export default class NNOptions {
    constructor() {
        // Options for selecting how to breed.
        this.asexualReproductionRate = .25;     

        // Options for mutating neural networks.
        this.weightMutationRate     = .5; 
        this.weightPerturbRate      = .9; 
        this.weightPerturbRange     = .2; 
        
        this.biasMutationRate       = .5; 
        this.biasPerturbRate        = .9;
        this.biasPerturbRange       = .2;

        // Seal this object. I typically don't use this but since this object will get passed around
        // a lot and needs to have all the right properties on it, it made sense to seal it here.
        Object.seal(this);
    }
}
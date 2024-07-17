// Get the number of disjoint genes between NN A and B.
export function disjointGenes(a, b) {
    let aMaxInnovation = 0;
    for (let gene of a.connections) {
        if (gene.innovationNum > aMaxInnovation)
            aMaxInnovation = gene.innovationNum;
    }

    let bMaxInnovation = 0;
    for (let gene of b.connections) {
        if (gene.innovationNum > bMaxInnovation)
            bMaxInnovation = gene.innovationNum;
    }

    let disjointCount = 0;
    for (let i = 0; i <= Math.min(aMaxInnovation, bMaxInnovation); i++) {
        let aFound = false;
        for (let gene of a.connections) {
            if (gene.innovationNum == i) {
                aFound = true;
                break;
            }
        }
        
        let bFound = false;
        for (let gene of b.connections) {
            if (gene.innovationNum == i) {
                bFound = true;
                break;
            }
        }

        if (aFound != bFound)
            disjointCount++;
    }

    return disjointCount;
}

// Get the number of excess genes between NN A and B.
export function excessGenes(a, b) {
    let aMaxInnovation = 0;
    for (let gene of a.connections) {
        if (gene.innovationNum > aMaxInnovation)
            aMaxInnovation = gene.innovationNum;
    }

    let bMaxInnovation = 0;
    for (let gene of b.connections) {
        if (gene.innovationNum > bMaxInnovation)
            bMaxInnovation = gene.innovationNum;
    }

    return Math.abs(aMaxInnovation - bMaxInnovation);
}

// Get the "distance" between NN A and B. Basically, how different are they?
export function distance(a, b, breedingOptions) {
    const c1 = breedingOptions.compatibilityCoeffExcess;
    const c2 = breedingOptions.compatibilityCoeffDisjoint;
    const c3 = breedingOptions.compatibilityCoeffWeightDiff;
    
    const E = excessGenes(a, b);
    const D = disjointGenes(a, b);
    let N;
    if (a.connections.length < breedingOptions.maxGenomeSizeToDisregardNormalization && b.connections.length < breedingOptions.maxGenomeSizeToDisregardNormalization)
        N = 1;
    else
        N = Math.max(a.connections.length, b.connections.length);

    let weightSum = 0;
    let weightCount = 0;
    for (let aGene of a.connections) {
        // If this gene matches one on NN B, add the difference between the weights to weightSum.
        for (let bGene of b.connections) {
            if (aGene.innovationNum == bGene.innovationNum) {
                weightSum += Math.abs(bGene.weight - aGene.weight);
                weightCount++;
                break;
            }
        }
    }
    
    if (weightCount == 0)
        return 0;

    const W = weightSum / weightCount;

    return ((c1 * E) / N) + ((c2 * D) / N) + (c3 * W);
}
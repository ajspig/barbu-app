import { CONTRACTS } from './game-constants.js';

// Get domino points based on finishing position
function getDominoPoints(position) {
    switch(position) {
        case 1: return 45;
        case 2: return 20;
        case 3: return 5;
        case 4: return -5;
        default: return 0;
    }
}

// Calculate scores for negative contracts
function calculateNegativeScores(contractId, scoreInputs) {
    const scores = [0, 0, 0, 0];
    
    if (contractId === 'no-tricks') {
        for (let i = 0; i < 4; i++) {
            const tricks = parseInt(scoreInputs[i]) || 0;
            
            if (tricks < 0 || tricks > 13) {
                throw new Error(`Invalid number of tricks for player ${i}`);
            }
            
            scores[i] = tricks * -2;
        }
    } else if (contractId === 'no-hearts') {
        for (let i = 0; i < 4; i++) {
            const hearts = parseInt(scoreInputs[i]) || 0;
            
            if (hearts < 0 || hearts > 13) {
                throw new Error(`Invalid number of hearts for player ${i}`);
            }
            
            scores[i] = hearts * -2;
        }
    } else if (contractId === 'no-queens') {
        for (let i = 0; i < 4; i++) {
            const queens = parseInt(scoreInputs[i]) || 0;
            
            if (queens < 0 || queens > 4) {
                throw new Error(`Invalid number of queens for player ${i}`);
            }
            
            scores[i] = queens * -6;
        }
    } else if (contractId === 'no-king-hearts') {
        const takerIndex = parseInt(scoreInputs.kingTaker);
        if (isNaN(takerIndex)) {
            throw new Error('Please select which player took the King of Hearts');
        }
        
        scores[takerIndex] = -20;
    } else if (contractId === 'no-last-two') {
        const secondLastTaker = parseInt(scoreInputs.secondLastTaker);
        const lastTaker = parseInt(scoreInputs.lastTaker);
        
        if (isNaN(secondLastTaker) || isNaN(lastTaker)) {
            throw new Error('Please select players for both last tricks');
        }
        
        scores[secondLastTaker] = -10;
        scores[lastTaker] = -20;
    }
    
    return scores;
}

// Calculate scores for positive contracts
function calculatePositiveScores(contractId, scoreInputs, positions) {
    const scores = [0, 0, 0, 0];
    
    if (contractId === 'trumps') {
        for (let i = 0; i < 4; i++) {
            const tricks = parseInt(scoreInputs[i]) || 0;
            
            if (tricks < 0 || tricks > 13) {
                throw new Error(`Invalid number of tricks for player ${i}`);
            }
            
            scores[i] = tricks * 5;
        }
    } else if (contractId === 'domino') {
        // Use positions already entered
        for (let i = 0; i < 4; i++) {
            const position = positions[i];
            scores[i] = getDominoPoints(position);
        }
    }
    
    return scores;
}

// Apply doubling adjustments to scores
function applyDoublingAdjustments(baseScores, contractId, dealerIndex, doubles, redoubles, specialDoubles) {
    const finalScores = [...baseScores];
    
    // Apply normal doubling adjustments
    // Handle regular doubles
    if (doubles) {
        doubles.forEach(doublerIndex => {
            // Calculate score difference between doubler and dealer
            let scoreDiff = Math.abs(baseScores[doublerIndex] - baseScores[dealerIndex]);
            
            // If redoubled, double the difference
            if (redoubles && redoubles.includes(doublerIndex)) {
                scoreDiff *= 2;
            }
            
            // Apply to final scores
            if (baseScores[doublerIndex] > baseScores[dealerIndex]) {
                finalScores[doublerIndex] += scoreDiff;
                finalScores[dealerIndex] -= scoreDiff;
            } else {
                finalScores[doublerIndex] -= scoreDiff;
                finalScores[dealerIndex] += scoreDiff;
            }
        });
    }
    
    // Handle special doubles
    if (specialDoubles) {
        if (specialDoubles.maximum) {
            // Maximum/Table - double all other players
            for (let i = 0; i < 4; i++) {
                if (i === dealerIndex) continue;
                
                let scoreDiff = Math.abs(baseScores[i] - baseScores[dealerIndex]);
                scoreDiff *= 2; // Special doubles are automatically doubled
                
                if (baseScores[i] > baseScores[dealerIndex]) {
                    finalScores[i] += scoreDiff;
                    finalScores[dealerIndex] -= scoreDiff;
                } else {
                    finalScores[i] -= scoreDiff;
                    finalScores[dealerIndex] += scoreDiff;
                }
            }
        }
        
        if (specialDoubles.family) {
            // Family/Flanks - double the other two non-dealers
            // This would be the players who are not the dealer and not the current doubler
            // For simplicity, we'll treat this as doubling all non-dealers but with a different multiplier
            for (let i = 0; i < 4; i++) {
                if (i === dealerIndex) continue;
                
                let scoreDiff = Math.abs(baseScores[i] - baseScores[dealerIndex]);
                scoreDiff *= 1.5; // Family double multiplier
                
                if (baseScores[i] > baseScores[dealerIndex]) {
                    finalScores[i] += scoreDiff;
                    finalScores[dealerIndex] -= scoreDiff;
                } else {
                    finalScores[i] -= scoreDiff;
                    finalScores[dealerIndex] += scoreDiff;
                }
            }
        }
    }
    
    return finalScores;
}

// Validate scores based on contract type
function validateScores(contractId, scores) {
    const contract = CONTRACTS.find(c => c.id === contractId);
    
    if (contract.type === 'negative') {
        // For negative contracts, ensure scores don't exceed maximum penalties
        for (let i = 0; i < scores.length; i++) {
            if (scores[i] < contract.maxPoints) {
                throw new Error(`Player ${i}'s penalty score cannot exceed ${Math.abs(contract.maxPoints)} points`);
            }
        }
        
        // Special validation for specific contracts
        if (contractId === 'no-tricks') {
            // Total tricks should be 13
            const totalTricks = scores.reduce((sum, score) => sum + Math.abs(score / -2), 0);
            if (totalTricks !== 13) {
                throw new Error(`Total tricks must equal 13 (currently ${totalTricks})`);
            }
        } else if (contractId === 'no-queens') {
            // Total queens should be 4
            const totalQueens = scores.reduce((sum, score) => sum + Math.abs(score / -6), 0);
            if (totalQueens !== 4) {
                throw new Error(`Total queens must equal 4 (currently ${totalQueens})`);
            }
        }
    } else {
        // For positive contracts, ensure scores don't exceed maximum points
        for (let i = 0; i < scores.length; i++) {
            if (scores[i] > contract.maxPoints) {
                throw new Error(`Player ${i}'s score cannot exceed ${contract.maxPoints} points`);
            }
        }
        
        // Special validation for specific contracts
        if (contractId === 'trumps') {
            // Total tricks should be 13
            const totalTricks = scores.reduce((sum, score) => sum + score / 5, 0);
            if (totalTricks !== 13) {
                throw new Error(`Total tricks must equal 13 (currently ${totalTricks})`);
            }
        }
    }
    
    return true;
}

export { getDominoPoints, calculateNegativeScores, calculatePositiveScores, applyDoublingAdjustments, validateScores };

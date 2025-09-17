// Game state management
let gameState = {
    players: [],
    currentDealerIndex: 0,
    currentHand: 1,
    hands: [],
    // Track which contracts each dealer has used
    dealerContracts: {},
    // Track mandatory doubling compliance
    doublingCompliance: {}
};

// Initialize game state
function initGameState() {
    gameState = {
        players: [],
        currentDealerIndex: 0,
        currentHand: 1,
        hands: [],
        dealerContracts: {},
        doublingCompliance: {}
    };
    
    // Initialize dealer contracts tracking
    for (let i = 0; i < 4; i++) {
        gameState.dealerContracts[i] = [];
    }
    
    // Initialize doubling compliance tracking
    // Each non-dealer must double the dealer at least twice during their 7 hands
    for (let dealer = 0; dealer < 4; dealer++) {
        gameState.doublingCompliance[dealer] = {};
        for (let player = 0; player < 4; player++) {
            if (player !== dealer) {
                gameState.doublingCompliance[dealer][player] = 0;
            }
        }
    }
}

// Reset game state for a new hand
function resetHandState() {
    // Clear any previous inputs
    if (gameState.currentPositions) {
        delete gameState.currentPositions;
    }
    if (gameState.currentDoubles) {
        delete gameState.currentDoubles;
    }
    if (gameState.currentRedoubles) {
        delete gameState.currentRedoubles;
    }
    if (gameState.currentSpecialDoubles) {
        delete gameState.currentSpecialDoubles;
    }
}

// Validate doubling compliance before game completion
function validateDoublingCompliance() {
    // Check that each non-dealer has doubled each dealer at least twice
    for (let dealer = 0; dealer < 4; dealer++) {
        for (let player = 0; player < 4; player++) {
            if (player !== dealer) {
                const count = gameState.doublingCompliance[dealer][player];
                if (count < 2) {
                    return false;
                }
            }
        }
    }
    return true;
}

export { gameState, initGameState, resetHandState, validateDoublingCompliance };

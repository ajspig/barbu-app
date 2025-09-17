import { gameState } from './game-state.js';

// Save game state to localStorage
function saveGameState() {
    try {
        localStorage.setItem('barbuGameState', JSON.stringify(gameState));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}

// Load game state from localStorage
function loadGameState() {
    try {
        const savedState = localStorage.getItem('barbuGameState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            Object.assign(gameState, parsedState);
            
            // Ensure doublingCompliance exists (for backward compatibility)
            if (!gameState.doublingCompliance) {
                gameState.doublingCompliance = {};
                // Initialize doubling compliance tracking
                for (let dealer = 0; dealer < 4; dealer++) {
                    gameState.doublingCompliance[dealer] = {};
                    for (let player = 0; player < 4; player++) {
                        if (player !== dealer) {
                            gameState.doublingCompliance[dealer][player] = 0;
                        }
                    }
                }
            }
            
            return true;
        }
    } catch (e) {
        console.error('Failed to load game state:', e);
    }
    return false;
}

// Clear saved game state
function clearGameState() {
    localStorage.removeItem('barbuGameState');
}

export { saveGameState, loadGameState, clearGameState };

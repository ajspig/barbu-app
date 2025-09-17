import { CONTRACTS } from './game-constants.js';
import { gameState, initGameState, resetHandState, validateDoublingCompliance } from './game-state.js';
import { saveGameState, loadGameState, clearGameState } from './storage-manager.js';
import { 
    initDOMElements, 
    updateGameUI, 
    showDominoSection,
    createDoublingOptions,
    createNegativeScoringInputs,
    createPositiveScoringInputs,
    showError,
    showStats,
    hideStats,
    showFinalResults,
    resetHandUI,
    getSetupSection,
    getGameSection,
    getCompletedSection,
    getPlayerForm,
    getContractSelect,
    getConfirmContractBtn,
    getDoublingSection,
    getDoublingInstructions,
    getDominoSection,
    getScoringSection,
    getConfirmDoublesBtn,
    getConfirmPositionsBtn,
    getConfirmScoresBtn,
    getUndoHandBtn,
    getExportGameBtn,
    getShowStatsBtn,
    getHideStatsBtn,
    getNewGameBtn,
    getRestartGameBtn
} from './ui-manager.js';
import { 
    calculateNegativeScores, 
    calculatePositiveScores, 
    applyDoublingAdjustments, 
    validateScores 
} from './scoring-logic.js';
import { calculateGameStats } from './stats-manager.js';

// Initialize game
function initGame() {
    // Initialize DOM elements
    initDOMElements();
    
    // Set up player form submission
    getPlayerForm().addEventListener('submit', handlePlayerSetup);
    
    // Set up other event listeners
    getConfirmContractBtn().addEventListener('click', handleContractSelection);
    getConfirmDoublesBtn().addEventListener('click', handleDoublingConfirmation);
    getConfirmPositionsBtn().addEventListener('click', handleDominoPositions);
    getConfirmScoresBtn().addEventListener('click', handleScoreConfirmation);
    getUndoHandBtn().addEventListener('click', undoLastHand);
    getExportGameBtn().addEventListener('click', exportGame);
    getShowStatsBtn().addEventListener('click', showStatsHandler);
    getHideStatsBtn().addEventListener('click', hideStats);
    getNewGameBtn().addEventListener('click', startNewGame);
    getRestartGameBtn().addEventListener('click', restartGame);
    
    // Load saved game state if available
    if (loadGameState()) {
        // Hide setup section and show game section
        getSetupSection().classList.add('hidden');
        getGameSection().classList.remove('hidden');
        updateGameUI();
    }
}

// Handle player setup
function handlePlayerSetup(e) {
    e.preventDefault();
    
    const player1 = document.getElementById('player1').value.trim();
    const player2 = document.getElementById('player2').value.trim();
    const player3 = document.getElementById('player3').value.trim();
    const player4 = document.getElementById('player4').value.trim();
    
    if (!player1 || !player2 || !player3 || !player4) {
        showError('All player names are required');
        return;
    }
    
    // Check for duplicate player names
    const playerNames = [player1, player2, player3, player4];
    const uniqueNames = new Set(playerNames);
    if (uniqueNames.size !== playerNames.length) {
        showError('All player names must be unique', 'warning');
        return;
    }
    
    // Initialize players
    gameState.players = [
        { id: 0, name: player1, totalScore: 0 },
        { id: 1, name: player2, totalScore: 0 },
        { id: 2, name: player3, totalScore: 0 },
        { id: 3, name: player4, totalScore: 0 }
    ];
    
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
    
    // Save initial state
    saveGameState();
    
    // Hide setup section and show game section
    getSetupSection().classList.add('hidden');
    getGameSection().classList.remove('hidden');
    
    // Update UI
    updateGameUI();
}

// Handle contract selection
function handleContractSelection() {
    const selectedContract = getContractSelect().value;
    
    if (!selectedContract) {
        showError('Please select a contract');
        return;
    }
    
    // Validate that each dealer uses each contract exactly once
    const usedContracts = gameState.dealerContracts[gameState.currentDealerIndex];
    if (usedContracts.includes(selectedContract)) {
        showError('This contract has already been used by the current dealer');
        return;
    }
    
    // Hide contract selection and show appropriate section based on contract type
    document.querySelector('.contract-selection').classList.add('hidden');
    
    if (selectedContract === 'domino') {
        showDominoSection();
    } else {
        showDoublingSection(selectedContract);
    }
}

// Handle doubling confirmation
function handleDoublingConfirmation() {
    const doubles = [];
    const redoubles = [];
    const specialDoubles = {};
    
    // Check regular doubles
    for (let i = 0; i < 4; i++) {
        if (i === gameState.currentDealerIndex) continue;
        
        const doubleCheckbox = document.getElementById(`double-${i}`);
        if (doubleCheckbox && doubleCheckbox.checked) {
            doubles.push(parseInt(doubleCheckbox.dataset.player));
            
            // Check for redoubles
            const redoubleCheckbox = document.getElementById(`redouble-${i}`);
            if (redoubleCheckbox && redoubleCheckbox.checked) {
                redoubles.push(parseInt(redoubleCheckbox.dataset.player));
            }
        }
    }
    
    // Check special doubles
    const maximumCheckbox = document.getElementById('double-maximum');
    const familyCheckbox = document.getElementById('double-family');
    
    if (maximumCheckbox && maximumCheckbox.checked) {
        specialDoubles.maximum = true;
    }
    
    if (familyCheckbox && familyCheckbox.checked) {
        specialDoubles.family = true;
    }
    
    // Store doubles in game state
    gameState.currentDoubles = doubles;
    gameState.currentRedoubles = redoubles;
    gameState.currentSpecialDoubles = specialDoubles;
    
    // Validate doubling compliance for negative contracts
    const contractId = getContractSelect().value;
    const contract = CONTRACTS.find(c => c.id === contractId);
    
    if (contract.type === 'negative') {
        try {
            validateDoublingCompliance(contractId, doubles, specialDoubles);
        } catch (error) {
            showError(error.message);
            return;
        }
    }
    
    // Hide doubling section and show scoring section
    getDoublingSection().classList.add('hidden');
    getScoringSection().classList.remove('hidden');
    
    // Create scoring inputs based on contract type
    if (contract.type === 'negative') {
        createNegativeScoringInputs(contractId);
    } else {
        createPositiveScoringInputs(contractId);
    }
}

// Show doubling section
function showDoublingSection(contractId) {
    getDoublingSection().classList.remove('hidden');
    
    // Set up doubling instructions based on contract type
    const contract = CONTRACTS.find(c => c.id === contractId);
    const doublingInstructions = getDoublingInstructions();
    if (contract.type === 'positive') {
        doublingInstructions.innerHTML = `
            <p>In positive contracts, only non-dealers can double the dealer.</p>
            <p>Each non-dealer must double the dealer at least twice during their 7 hands.</p>
        `;
    } else {
        doublingInstructions.innerHTML = `
            <p>In negative contracts, any player can double any other player.</p>
            <p>If no doubles are placed, the hand will not be played and points will be divided.</p>
        `;
    }
    
    // Set up doubling options
    createDoublingOptions(contractId);
}

// Handle domino positions confirmation
function handleDominoPositions() {
    const positions = [];
    const positionCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    for (let i = 0; i < 4; i++) {
        const positionSelect = document.getElementById(`position-player${i + 1}`);
        const position = parseInt(positionSelect.value);
        
        if (isNaN(position) || position < 1 || position > 4) {
            showError(`Please select a position for ${gameState.players[i].name}`);
            return;
        }
        
        positions.push(position);
        positionCounts[position]++;
    }
    
    // Validate that each position is selected exactly once
    for (let pos = 1; pos <= 4; pos++) {
        if (positionCounts[pos] !== 1) {
            showError('Each position must be assigned to exactly one player');
            return;
        }
    }
    
    // Store positions in game state
    gameState.currentPositions = positions;
    
    // Show doubling section after positions
    getDominoSection().classList.add('hidden');
    showDoublingSection('domino');
}

// Handle score confirmation
function handleScoreConfirmation() {
    const contractId = getContractSelect().value;
    const contract = CONTRACTS.find(c => c.id === contractId);
    
    let scores = [];
    
    if (contract.type === 'negative') {
        scores = calculateNegativeScoresFromUI(contractId);
    } else {
        scores = calculatePositiveScoresFromUI(contractId);
    }
    
    if (!scores) {
        // Error message already shown in calculate functions
        return;
    }
    
    // Validate score entries based on contract type and maximum points
    try {
        validateScores(contractId, scores);
    } catch (error) {
        showError(error.message);
        return;
    }
    
    // Apply doubling adjustments
    const finalScores = applyDoublingAdjustments(
        scores, 
        contractId, 
        gameState.currentDealerIndex,
        gameState.currentDoubles,
        gameState.currentRedoubles,
        gameState.currentSpecialDoubles
    );
    
    // Save hand data
    const handData = {
        handNumber: gameState.currentHand,
        dealerIndex: gameState.currentDealerIndex,
        contract: contractId,
        baseScores: scores,
        finalScores: finalScores,
        doubles: gameState.currentDoubles || [],
        redoubles: gameState.currentRedoubles || [],
        specialDoubles: gameState.currentSpecialDoubles || {}
    };
    
    gameState.hands.push(handData);
    
    // Update player totals
    for (let i = 0; i < 4; i++) {
        gameState.players[i].totalScore += finalScores[i];
    }
    
    // Mark contract as used by current dealer
    gameState.dealerContracts[gameState.currentDealerIndex].push(contractId);
    
    // Update doubling compliance tracking
    if (gameState.currentDoubles) {
        gameState.currentDoubles.forEach(doublerIndex => {
            gameState.doublingCompliance[gameState.currentDealerIndex][doublerIndex]++;
        });
    }
    
    // Move to next hand
    gameState.currentHand++;
    
    // Rotate dealer after 7 hands
    if (gameState.currentHand > 28) {
        // Game completed
        getGameSection().classList.add('hidden');
        getCompletedSection().classList.remove('hidden');
        showFinalResults();
    } else {
        // Reset UI for next hand
        resetHandState();
        resetHandUI();
        updateGameUI();
    }
    
    // Save game state
    saveGameState();
}

// Calculate scores for negative contracts from UI inputs
function calculateNegativeScoresFromUI(contractId) {
    const scoreInputs = [];
    
    try {
        if (contractId === 'no-tricks' || contractId === 'no-hearts' || contractId === 'no-queens') {
            for (let i = 0; i < 4; i++) {
                const input = document.getElementById(`score-${i}`);
                scoreInputs.push(input.value);
            }
            return calculateNegativeScores(contractId, scoreInputs);
        } else if (contractId === 'no-king-hearts') {
            const kingTaker = document.querySelector('input[name="king-hearts-taker"]:checked');
            if (!kingTaker) {
                showError('Please select which player took the King of Hearts');
                return null;
            }
            scoreInputs.kingTaker = kingTaker.value;
            return calculateNegativeScores(contractId, scoreInputs);
        } else if (contractId === 'no-last-two') {
            const secondLastSelect = document.getElementById('second-last-trick');
            const lastSelect = document.getElementById('last-trick');
            scoreInputs.secondLastTaker = secondLastSelect.value;
            scoreInputs.lastTaker = lastSelect.value;
            return calculateNegativeScores(contractId, scoreInputs);
        }
    } catch (error) {
        showError(error.message);
        return null;
    }
}

// Calculate scores for positive contracts from UI inputs
function calculatePositiveScoresFromUI(contractId) {
    const scoreInputs = [];
    
    try {
        if (contractId === 'trumps') {
            for (let i = 0; i < 4; i++) {
                const input = document.getElementById(`score-${i}`);
                scoreInputs.push(input.value);
            }
            return calculatePositiveScores(contractId, scoreInputs);
        } else if (contractId === 'domino') {
            // For domino, we already have positions from earlier step
            return calculatePositiveScores(contractId, scoreInputs, gameState.currentPositions);
        }
    } catch (error) {
        showError(error.message);
        return null;
    }
}

// Undo last hand
function undoLastHand() {
    if (gameState.hands.length === 0) {
        showError('No hands to undo');
        return;
    }
    
    // Get last hand data
    const lastHand = gameState.hands.pop();
    
    // Subtract scores from players
    for (let i = 0; i < 4; i++) {
        gameState.players[i].totalScore -= lastHand.finalScores[i];
    }
    
    // Remove contract from dealer's used list
    const dealerContracts = gameState.dealerContracts[lastHand.dealerIndex];
    const contractIndex = dealerContracts.indexOf(lastHand.contract);
    if (contractIndex > -1) {
        dealerContracts.splice(contractIndex, 1);
    }
    
    // Decrement hand counter
    gameState.currentHand--;
    
    // If we were on the last hand, hide completed section and show game section
    if (gameState.currentHand <= 28) {
        getCompletedSection().classList.add('hidden');
        getGameSection().classList.remove('hidden');
    }
    
    // Reset UI
    resetHandState();
    resetHandUI();
    updateGameUI();
    
    // Save updated state
    saveGameState();
}

// Export game data
function exportGame() {
    const gameData = {
        players: gameState.players,
        currentDealerIndex: gameState.currentDealerIndex,
        currentHand: gameState.currentHand,
        hands: gameState.hands,
        dealerContracts: gameState.dealerContracts
    };
    
    const dataStr = JSON.stringify(gameData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `barbu-game-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Show statistics handler
function showStatsHandler() {
    const stats = calculateGameStats();
    showStats(stats);
}

// Start new game
function startNewGame() {
    // Reset game state
    initGameState();
    
    // Clear local storage
    clearGameState();
    
    // Hide completed section and show setup section
    getCompletedSection().classList.add('hidden');
    getSetupSection().classList.remove('hidden');
    
    // Reset form inputs
    document.getElementById('player1').value = '';
    document.getElementById('player2').value = '';
    document.getElementById('player3').value = '';
    document.getElementById('player4').value = '';
}

// Restart game function
function restartGame() {
    // Reset game state
    initGameState();
    
    // Clear local storage
    clearGameState();
    
    // Hide game section and show setup section
    getGameSection().classList.add('hidden');
    getSetupSection().classList.remove('hidden');
    
    // Reset form inputs
    document.getElementById('player1').value = '';
    document.getElementById('player2').value = '';
    document.getElementById('player3').value = '';
    document.getElementById('player4').value = '';
}

export { initGame };

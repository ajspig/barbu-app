// Barbu Card Game Scoring App
// Game constants
const CONTRACTS = [
    { id: 'no-tricks', name: 'No Tricks', type: 'negative', maxPoints: -26 },
    { id: 'no-hearts', name: 'No Hearts', type: 'negative', maxPoints: -30 },
    { id: 'no-queens', name: 'No Queens', type: 'negative', maxPoints: -24 },
    { id: 'no-king-hearts', name: 'No King of Hearts', type: 'negative', maxPoints: -20 },
    { id: 'no-last-two', name: 'No Last Two', type: 'negative', maxPoints: -30 },
    { id: 'trumps', name: 'Trumps', type: 'positive', maxPoints: 65 },
    { id: 'domino', name: 'Domino', type: 'positive', maxPoints: 65 }
];

// Game state
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

// DOM elements
const setupSection = document.getElementById('setup-section');
const gameSection = document.getElementById('game-section');
const completedSection = document.getElementById('completed-section');
const playerForm = document.getElementById('player-form');
const startGameBtn = document.getElementById('start-game');
const currentDealerSpan = document.getElementById('current-dealer');
const currentHandSpan = document.getElementById('current-hand');
const contractsList = document.getElementById('contracts-list');
const contractSelect = document.getElementById('contract-select');
const confirmContractBtn = document.getElementById('confirm-contract');
const doublingSection = document.getElementById('doubling-section');
const doublingInstructions = document.getElementById('doubling-instructions');
const doublingOptions = document.getElementById('doubling-options');
const confirmDoublesBtn = document.getElementById('confirm-doubles');
const biddingSection = document.getElementById('bidding-section');
const confirmBidsBtn = document.getElementById('confirm-bids');
const dominoSection = document.getElementById('domino-section');
const confirmPositionsBtn = document.getElementById('confirm-positions');
const scoringSection = document.getElementById('scoring-section');
const scoreInputs = document.getElementById('score-inputs');
const confirmScoresBtn = document.getElementById('confirm-scores');
const scoresBody = document.getElementById('scores-body');
const handHistory = document.getElementById('hand-history');
const undoHandBtn = document.getElementById('undo-hand');
const exportGameBtn = document.getElementById('export-game');
const showStatsBtn = document.getElementById('show-stats');
const hideStatsBtn = document.getElementById('hide-stats');
const statsSection = document.getElementById('stats-section');
const statsContent = document.getElementById('stats-content');
const newGameBtn = document.getElementById('new-game');
const restartGameBtn = document.getElementById('restart-game');

// Initialize game
function initGame() {
    // Set up player form submission
    playerForm.addEventListener('submit', handlePlayerSetup);
    
    // Set up other event listeners
    confirmContractBtn.addEventListener('click', handleContractSelection);
    confirmDoublesBtn.addEventListener('click', handleDoublingConfirmation);
    confirmBidsBtn.addEventListener('click', handleBiddingConfirmation);
    confirmPositionsBtn.addEventListener('click', handleDominoPositions);
    confirmScoresBtn.addEventListener('click', handleScoreConfirmation);
    undoHandBtn.addEventListener('click', undoLastHand);
    exportGameBtn.addEventListener('click', exportGame);
    showStatsBtn.addEventListener('click', showStats);
    hideStatsBtn.addEventListener('click', hideStats);
    newGameBtn.addEventListener('click', startNewGame);
    restartGameBtn.addEventListener('click', restartGame);
    
    // Load saved game state if available
    loadGameState();
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
    setupSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    
    // Update UI
    updateGameUI();
}

// Update game UI elements
function updateGameUI() {
    // Update dealer info
    currentDealerSpan.textContent = gameState.players[gameState.currentDealerIndex].name;
    
    // Update hand counter
    currentHandSpan.textContent = gameState.currentHand;
    
    // Update available contracts for current dealer
    updateAvailableContracts();
    
    // Update scores table
    updateScoresTable();
    
    // Update hand history
    updateHandHistory();
    
    // Update doubling compliance status
    updateDoublingCompliance();
}

// Update doubling compliance display
function updateDoublingCompliance() {
    const complianceInfo = document.createElement('div');
    complianceInfo.className = 'compliance-info';
    complianceInfo.innerHTML = '<h4>Doubling Compliance Status:</h4>';
    
    for (let player = 0; player < 4; player++) {
        if (player !== gameState.currentDealerIndex) {
            const count = gameState.doublingCompliance[gameState.currentDealerIndex][player];
            const status = count >= 2 ? '✅' : `(${count}/2)`;
            const playerInfo = document.createElement('p');
            playerInfo.textContent = `${gameState.players[player].name}: ${status}`;
            complianceInfo.appendChild(playerInfo);
        }
    }
    
    // Insert compliance info after the dealer info
    const dealerInfo = document.querySelector('.dealer-info');
    const existingCompliance = document.querySelector('.compliance-info');
    if (existingCompliance) {
        existingCompliance.remove();
    }
    dealerInfo.parentNode.insertBefore(complianceInfo, dealerInfo.nextSibling);
}

// Update available contracts display
function updateAvailableContracts() {
    const usedContracts = gameState.dealerContracts[gameState.currentDealerIndex];
    const availableContracts = CONTRACTS.filter(contract => 
        !usedContracts.includes(contract.id)
    );
    
    contractsList.innerHTML = '';
    availableContracts.forEach(contract => {
        const li = document.createElement('li');
        li.textContent = contract.name;
        contractsList.appendChild(li);
    });
    
    // Populate contract selection dropdown
    contractSelect.innerHTML = '<option value="">Choose a contract...</option>';
    availableContracts.forEach(contract => {
        const option = document.createElement('option');
        option.value = contract.id;
        option.textContent = contract.name;
        contractSelect.appendChild(option);
    });
}

// Update scores table
function updateScoresTable() {
    scoresBody.innerHTML = '';
    gameState.players.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.totalScore}</td>
        `;
        scoresBody.appendChild(row);
    });
}

// Update hand history display
function updateHandHistory() {
    handHistory.innerHTML = '';
    gameState.hands.forEach((hand, index) => {
        const handDiv = document.createElement('div');
        handDiv.className = 'hand-history-item';
        
        // Format base scores
        const baseScores = hand.baseScores.map((score, i) => 
            `${gameState.players[i].name}: ${score}`
        ).join(', ');
        
        // Format final scores with doubling adjustments
        const finalScores = hand.finalScores.map((score, i) => 
            `${gameState.players[i].name}: ${score}`
        ).join(', ');
        
        // Format doubles information
        let doublesInfo = '';
        if (hand.doubles && hand.doubles.length > 0) {
            doublesInfo = `<p><strong>Doubles:</strong> ${hand.doubles.map(i => gameState.players[i].name).join(', ')}</p>`;
        }
        
        if (hand.specialDoubles && (hand.specialDoubles.maximum || hand.specialDoubles.family)) {
            const specialDoubles = [];
            if (hand.specialDoubles.maximum) specialDoubles.push('Maximum/Table');
            if (hand.specialDoubles.family) specialDoubles.push('Family/Flanks');
            doublesInfo += `<p><strong>Special Doubles:</strong> ${specialDoubles.join(', ')}</p>`;
        }
        
        if (hand.redoubles && hand.redoubles.length > 0) {
            doublesInfo += `<p><strong>Redoubles:</strong> ${hand.redoubles.map(i => gameState.players[i].name).join(', ')}</p>`;
        }
        
        handDiv.innerHTML = `
            <h4>Hand ${index + 1} - Dealer: ${gameState.players[hand.dealerIndex].name}</h4>
            <p><strong>Contract:</strong> ${getContractName(hand.contract)}</p>
            <p><strong>Base Scores:</strong> ${baseScores}</p>
            <p><strong>Final Scores:</strong> ${finalScores}</p>
            ${doublesInfo}
        `;
        handHistory.appendChild(handDiv);
    });
}

// Calculate and display game statistics
function calculateGameStats() {
    if (gameState.hands.length === 0) return;
    
    const stats = {
        totalHands: gameState.hands.length,
        playerStats: {}
    };
    
    // Initialize player stats
    gameState.players.forEach(player => {
        stats.playerStats[player.id] = {
            name: player.name,
            totalScore: player.totalScore,
            handsDealt: 0,
            contracts: {},
            bestHand: { score: -Infinity, hand: null },
            worstHand: { score: Infinity, hand: null }
        };
    });
    
    // Process each hand
    gameState.hands.forEach(hand => {
        // Count hands dealt by each player
        stats.playerStats[hand.dealerIndex].handsDealt++;
        
        // Track contract usage
        if (!stats.playerStats[hand.dealerIndex].contracts[hand.contract]) {
            stats.playerStats[hand.dealerIndex].contracts[hand.contract] = 0;
        }
        stats.playerStats[hand.dealerIndex].contracts[hand.contract]++;
        
        // Track best and worst hands for each player
        hand.finalScores.forEach((score, playerIndex) => {
            const playerStat = stats.playerStats[playerIndex];
            if (score > playerStat.bestHand.score) {
                playerStat.bestHand.score = score;
                playerStat.bestHand.hand = hand;
            }
            if (score < playerStat.worstHand.score) {
                playerStat.worstHand.score = score;
                playerStat.worstHand.hand = hand;
            }
        });
    });
    
    return stats;
}

// Helper function to get contract name
function getContractName(contractId) {
    const contract = CONTRACTS.find(c => c.id === contractId);
    return contract ? contract.name : 'Unknown';
}

// Helper function to format scores for history display
function formatScoresForHistory(scores) {
    return gameState.players.map((player, index) => 
        `${player.name}: ${scores[index]}`
    ).join(', ');
}

// Handle contract selection
function handleContractSelection() {
    const selectedContract = contractSelect.value;
    
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
    
    if (selectedContract === 'trumps') {
        showBiddingSection();
    } else if (selectedContract === 'domino') {
        showDominoSection();
    } else {
        showDoublingSection(selectedContract);
    }
}

// Show bidding section for Trumps contract
function showBiddingSection() {
    biddingSection.classList.remove('hidden');
    
    // Clear previous bid values
    for (let i = 0; i < 4; i++) {
        const bidInput = document.getElementById(`bid-player${i}`);
        if (bidInput) {
            bidInput.value = '';
        }
    }
}

// Handle bidding confirmation
function handleBiddingConfirmation() {
    const bids = [];
    let totalBids = 0;
    
    for (let i = 0; i < 4; i++) {
        const bidInput = document.getElementById(`bid-player${i}`);
        const bid = parseInt(bidInput.value) || 0;
        
        if (bid < 0 || bid > 65) {
            showError(`Bid for ${gameState.players[i].name} must be between 0 and 65`);
            return;
        }
        
        bids.push(bid);
        totalBids += bid;
    }
    
    // Store bids in game state
    gameState.currentBids = bids;
    
    // Show doubling section after bidding
    biddingSection.classList.add('hidden');
    showDoublingSection('trumps');
}

// Show domino section for Domino contract
function showDominoSection() {
    dominoSection.classList.remove('hidden');
    
    // Clear previous position values
    for (let i = 0; i < 4; i++) {
        const positionSelect = document.getElementById(`position-player${i}`);
        if (positionSelect) {
            positionSelect.value = '';
        }
    }
}

// Handle domino positions confirmation
function handleDominoPositions() {
    const positions = [];
    const positionCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    for (let i = 0; i < 4; i++) {
        const positionSelect = document.getElementById(`position-player${i}`);
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
    dominoSection.classList.add('hidden');
    showDoublingSection('domino');
}

// Show doubling section
function showDoublingSection(contractId) {
    doublingSection.classList.remove('hidden');
    
    // Set up doubling instructions based on contract type
    const contract = CONTRACTS.find(c => c.id === contractId);
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

// Create doubling options UI
function createDoublingOptions(contractId) {
    doublingOptions.innerHTML = '';
    
    const contract = CONTRACTS.find(c => c.id === contractId);
    const currentPlayerIndex = (gameState.currentDealerIndex + 1) % 4;
    
    // Create doubling options for each player
    for (let i = 0; i < 4; i++) {
        if (i === gameState.currentDealerIndex) continue; // Dealer cannot initiate doubles
        
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-doubling';
        playerDiv.innerHTML = `
            <h4>${gameState.players[i].name}</h4>
            <label>
                <input type="checkbox" id="double-${i}" data-player="${i}">
                Double the dealer
            </label>
            <div id="redouble-options-${i}" class="redouble-options hidden">
                <label>
                    <input type="checkbox" id="redouble-${i}" data-player="${i}">
                    Redouble
                </label>
            </div>
        `;
        doublingOptions.appendChild(playerDiv);
        
        // Add event listener for double checkbox
        const doubleCheckbox = document.getElementById(`double-${i}`);
        doubleCheckbox.addEventListener('change', function() {
            const redoubleOptions = document.getElementById(`redouble-options-${i}`);
            if (this.checked) {
                redoubleOptions.classList.remove('hidden');
            } else {
                redoubleOptions.classList.add('hidden');
                document.getElementById(`redouble-${i}`).checked = false;
            }
        });
    }
    
    // Add special doubling options
    const specialDiv = document.createElement('div');
    specialDiv.className = 'special-doubling';
    specialDiv.innerHTML = `
        <h4>Special Doubles</h4>
        <label>
            <input type="checkbox" id="double-maximum">
            Maximum/Table (double all other players)
        </label>
        <label>
            <input type="checkbox" id="double-family">
            Family/Flanks (double the other two non-dealers)
        </label>
    `;
    doublingOptions.appendChild(specialDiv);
}

// Handle doubling confirmation
function handleDoublingConfirmation() {
    // Collect doubling information
    const doubles = [];
    const redoubles = [];
    
    for (let i = 0; i < 4; i++) {
        if (i === gameState.currentDealerIndex) continue;
        
        const doubleCheckbox = document.getElementById(`double-${i}`);
        const redoubleCheckbox = document.getElementById(`redouble-${i}`);
        
        if (doubleCheckbox && doubleCheckbox.checked) {
            doubles.push(i);
        }
        
        if (redoubleCheckbox && redoubleCheckbox.checked) {
            redoubles.push(i);
        }
    }
    
    // Check for special doubles
    const doubleMaximum = document.getElementById('double-maximum');
    const doubleFamily = document.getElementById('double-family');
    
    const specialDoubles = {
        maximum: doubleMaximum.checked,
        family: doubleFamily.checked
    };
    
    // Validate doubling rules based on contract type
    const contractId = contractSelect.value;
    const contract = CONTRACTS.find(c => c.id === contractId);
    
    if (contract.type === 'positive') {
        // In positive contracts, only non-dealers can double the dealer
        if (specialDoubles.maximum || specialDoubles.family) {
            showError('Special doubles cannot be used in positive contracts');
            return;
        }
    }
    
    // Store doubling information
    gameState.currentDoubles = doubles;
    gameState.currentRedoubles = redoubles;
    gameState.currentSpecialDoubles = specialDoubles;
    
    // Hide doubling section and show scoring section
    doublingSection.classList.add('hidden');
    showScoringSection(contractSelect.value);
}

// Show scoring section
function showScoringSection(contractId) {
    scoringSection.classList.remove('hidden');
    scoreInputs.innerHTML = '';
    
    const contract = CONTRACTS.find(c => c.id === contractId);
    
    if (contract.type === 'negative') {
        // For negative contracts, show trick/penalty entry
        createNegativeScoringInputs(contractId);
    } else {
        // For positive contracts, show scoring inputs
        createPositiveScoringInputs(contractId);
    }
}

// Create scoring inputs for negative contracts
function createNegativeScoringInputs(contractId) {
    const contract = CONTRACTS.find(c => c.id === contractId);
    
    if (contractId === 'no-tricks') {
        scoreInputs.innerHTML = `
            <p>Enter number of tricks taken by each player (0-13):</p>
            <div class="score-inputs-grid">
                ${gameState.players.map((player, index) => `
                    <div class="score-input">
                        <label for="score-${index}">${player.name}:</label>
                        <input type="number" id="score-${index}" min="0" max="13" value="0">
                    </div>
                `).join('')}
            </div>
        `;
    } else if (contractId === 'no-hearts') {
        scoreInputs.innerHTML = `
            <p>Enter number of hearts taken by each player:</p>
            <p><strong>Note:</strong> Ace of Hearts = 6 points, Other Hearts = 2 points each</p>
            <div class="score-inputs-grid">
                ${gameState.players.map((player, index) => `
                    <div class="score-input">
                        <label for="score-${index}">${player.name}:</label>
                        <input type="number" id="score-${index}" min="0" max="13" value="0">
                    </div>
                `).join('')}
            </div>
        `;
    } else if (contractId === 'no-queens') {
        scoreInputs.innerHTML = `
            <p>Enter number of queens taken by each player (0-4):</p>
            <div class="score-inputs-grid">
                ${gameState.players.map((player, index) => `
                    <div class="score-input">
                        <label for="score-${index}">${player.name}:</label>
                        <input type="number" id="score-${index}" min="0" max="4" value="0">
                    </div>
                `).join('')}
            </div>
        `;
    } else if (contractId === 'no-king-hearts') {
        scoreInputs.innerHTML = `
            <p>Enter which player took the King of Hearts:</p>
            <div class="score-inputs-grid">
                ${gameState.players.map((player, index) => `
                    <div class="score-input">
                        <label>
                            <input type="radio" name="king-hearts-taker" value="${index}">
                            ${player.name}
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (contractId === 'no-last-two') {
        scoreInputs.innerHTML = `
            <p>Enter which player took the last two tricks:</p>
            <div class="score-inputs-grid">
                <div class="score-input">
                    <label for="second-last-trick">Second-to-last trick:</label>
                    <select id="second-last-trick">
                        <option value="">Select player</option>
                        ${gameState.players.map((player, index) => `
                            <option value="${index}">${player.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="score-input">
                    <label for="last-trick">Last trick:</label>
                    <select id="last-trick">
                        <option value="">Select player</option>
                        ${gameState.players.map((player, index) => `
                            <option value="${index}">${player.name}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `;
    }
}

// Create scoring inputs for positive contracts
function createPositiveScoringInputs(contractId) {
    if (contractId === 'trumps') {
        scoreInputs.innerHTML = `
            <p>Enter number of tricks taken by each player (0-13):</p>
            <div class="score-inputs-grid">
                ${gameState.players.map((player, index) => `
                    <div class="score-input">
                        <label for="score-${index}">${player.name}:</label>
                        <input type="number" id="score-${index}" min="0" max="13" value="0">
                    </div>
                `).join('')}
            </div>
        `;
    } else if (contractId === 'domino') {
        // For domino, we already have positions from earlier step
        scoreInputs.innerHTML = `
            <p>Domino positions have been entered. Scores will be calculated automatically.</p>
            <div class="domino-scores">
                ${gameState.players.map((player, index) => {
                    const position = gameState.currentPositions[index];
                    const points = getDominoPoints(position);
                    return `<p>${player.name}: Position ${position} = ${points} points</p>`;
                }).join('')}
            </div>
        `;
    }
}

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

// Handle score confirmation
function handleScoreConfirmation() {
    const contractId = contractSelect.value;
    const contract = CONTRACTS.find(c => c.id === contractId);
    
    let scores = [];
    
    if (contract.type === 'negative') {
        scores = calculateNegativeScores(contractId);
    } else {
        scores = calculatePositiveScores(contractId);
    }
    
    if (!scores) {
        // Error message already shown in calculate functions
        return;
    }
    
    // Validate score entries based on contract type and maximum points
    if (!validateScores(contractId, scores)) {
        return;
    }
    
    // Apply doubling adjustments
    const finalScores = applyDoublingAdjustments(scores, contractId);
    
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
        gameSection.classList.add('hidden');
        completedSection.classList.remove('hidden');
        showFinalResults();
    } else {
        // Reset UI for next hand
        resetHandUI();
        updateGameUI();
    }
    
    // Save game state
    saveGameState();
}

// Calculate scores for negative contracts
function calculateNegativeScores(contractId) {
    const scores = [0, 0, 0, 0];
    
    if (contractId === 'no-tricks') {
        for (let i = 0; i < 4; i++) {
            const tricksInput = document.getElementById(`score-${i}`);
            const tricks = parseInt(tricksInput.value) || 0;
            
            if (tricks < 0 || tricks > 13) {
                showError(`Invalid number of tricks for ${gameState.players[i].name}`);
                return null;
            }
            
            scores[i] = tricks * -2;
        }
    } else if (contractId === 'no-hearts') {
        for (let i = 0; i < 4; i++) {
            const heartsInput = document.getElementById(`score-${i}`);
            const hearts = parseInt(heartsInput.value) || 0;
            
            if (hearts < 0 || hearts > 13) {
                showError(`Invalid number of hearts for ${gameState.players[i].name}`);
                return null;
            }
            
            scores[i] = hearts * -2;
        }
    } else if (contractId === 'no-queens') {
        for (let i = 0; i < 4; i++) {
            const queensInput = document.getElementById(`score-${i}`);
            const queens = parseInt(queensInput.value) || 0;
            
            if (queens < 0 || queens > 4) {
                showError(`Invalid number of queens for ${gameState.players[i].name}`);
                return null;
            }
            
            scores[i] = queens * -6;
        }
    } else if (contractId === 'no-king-hearts') {
        const kingTaker = document.querySelector('input[name="king-hearts-taker"]:checked');
        if (!kingTaker) {
            showError('Please select which player took the King of Hearts');
            return null;
        }
        
        const takerIndex = parseInt(kingTaker.value);
        scores[takerIndex] = -20;
    } else if (contractId === 'no-last-two') {
        const secondLastSelect = document.getElementById('second-last-trick');
        const lastSelect = document.getElementById('last-trick');
        
        const secondLastTaker = parseInt(secondLastSelect.value);
        const lastTaker = parseInt(lastSelect.value);
        
        if (isNaN(secondLastTaker) || isNaN(lastTaker)) {
            showError('Please select players for both last tricks');
            return null;
        }
        
        scores[secondLastTaker] = -10;
        scores[lastTaker] = -20;
    }
    
    return scores;
}

// Calculate scores for positive contracts
function calculatePositiveScores(contractId) {
    const scores = [0, 0, 0, 0];
    
    if (contractId === 'trumps') {
        for (let i = 0; i < 4; i++) {
            const tricksInput = document.getElementById(`score-${i}`);
            const tricks = parseInt(tricksInput.value) || 0;
            
            if (tricks < 0 || tricks > 13) {
                showError(`Invalid number of tricks for ${gameState.players[i].name}`);
                return null;
            }
            
            scores[i] = tricks * 5;
        }
    } else if (contractId === 'domino') {
        // Use positions already entered
        for (let i = 0; i < 4; i++) {
            const position = gameState.currentPositions[i];
            scores[i] = getDominoPoints(position);
        }
    }
    
    return scores;
}

// Apply doubling adjustments to scores
function applyDoublingAdjustments(baseScores, contractId) {
    const finalScores = [...baseScores];
    const contract = CONTRACTS.find(c => c.id === contractId);
    
    // If no doubles were placed, handle special case for negative contracts
    if (contract.type === 'negative' && 
        (!gameState.currentDoubles || gameState.currentDoubles.length === 0) &&
        !gameState.currentSpecialDoubles?.maximum &&
        !gameState.currentSpecialDoubles?.family) {
        
        // In negative games with no doubles, don't play - divide negative points equally among non-dealers
        const totalNegativePoints = baseScores.reduce((sum, score) => sum + score, 0);
        const pointsPerNonDealer = Math.floor(totalNegativePoints / 3);
        const remainder = totalNegativePoints % 3;
        
        for (let i = 0; i < 4; i++) {
            if (i === gameState.currentDealerIndex) {
                // Dealer scores 0 or +1 if there's a remainder
                finalScores[i] = remainder > 0 ? 1 : 0;
            } else {
                // Non-dealers get equal share of negative points
                finalScores[i] = pointsPerNonDealer;
            }
        }
        
        return finalScores;
    }
    
    // Apply normal doubling adjustments
    const dealerIndex = gameState.currentDealerIndex;
    
    // Handle regular doubles
    if (gameState.currentDoubles) {
        gameState.currentDoubles.forEach(doublerIndex => {
            // Calculate score difference between doubler and dealer
            let scoreDiff = Math.abs(baseScores[doublerIndex] - baseScores[dealerIndex]);
            
            // If redoubled, double the difference
            if (gameState.currentRedoubles && gameState.currentRedoubles.includes(doublerIndex)) {
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
    if (gameState.currentSpecialDoubles) {
        if (gameState.currentSpecialDoubles.maximum) {
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
        
        if (gameState.currentSpecialDoubles.family) {
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

// Reset UI for next hand
function resetHandUI() {
    // Reset contract selection
    contractSelect.value = '';
    document.querySelector('.contract-selection').classList.remove('hidden');
    
    // Hide all other sections
    biddingSection.classList.add('hidden');
    dominoSection.classList.add('hidden');
    doublingSection.classList.add('hidden');
    scoringSection.classList.add('hidden');
    
    // Clear any previous inputs
    if (gameState.currentBids) {
        delete gameState.currentBids;
    }
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

// Validate scores based on contract type
function validateScores(contractId, scores) {
    const contract = CONTRACTS.find(c => c.id === contractId);
    
    if (contract.type === 'negative') {
        // For negative contracts, ensure scores don't exceed maximum penalties
        for (let i = 0; i < scores.length; i++) {
            if (scores[i] < contract.maxPoints) {
                showError(`${gameState.players[i].name}'s penalty score cannot exceed ${Math.abs(contract.maxPoints)} points`);
                return false;
            }
        }
        
        // Special validation for specific contracts
        if (contractId === 'no-tricks') {
            // Total tricks should be 13
            const totalTricks = scores.reduce((sum, score) => sum + Math.abs(score / -2), 0);
            if (totalTricks !== 13) {
                showError(`Total tricks must equal 13 (currently ${totalTricks})`);
                return false;
            }
        } else if (contractId === 'no-queens') {
            // Total queens should be 4
            const totalQueens = scores.reduce((sum, score) => sum + Math.abs(score / -6), 0);
            if (totalQueens !== 4) {
                showError(`Total queens must equal 4 (currently ${totalQueens})`);
                return false;
            }
        }
    } else {
        // For positive contracts, ensure scores don't exceed maximum points
        for (let i = 0; i < scores.length; i++) {
            if (scores[i] > contract.maxPoints) {
                showError(`${gameState.players[i].name}'s score cannot exceed ${contract.maxPoints} points`);
                return false;
            }
        }
        
        // Special validation for specific contracts
        if (contractId === 'trumps') {
            // Total tricks should be 13
            const totalTricks = scores.reduce((sum, score) => sum + score / 5, 0);
            if (totalTricks !== 13) {
                showError(`Total tricks must equal 13 (currently ${totalTricks})`);
                return false;
            }
        }
    }
    
    return true;
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

// Show final results
function showFinalResults() {
    // Validate doubling compliance before showing results
    if (!validateDoublingCompliance()) {
        showError('Game cannot be completed: Each non-dealer must double each dealer at least twice');
        gameState.currentHand--;
        gameSection.classList.remove('hidden');
        completedSection.classList.add('hidden');
        updateGameUI();
        return;
    }
    
    const finalResults = document.getElementById('final-results');
    finalResults.innerHTML = `
        <h3>Final Scores</h3>
        <table>
            <thead>
                <tr>
                    <th>Player</th>
                    <th>Total Score</th>
                </tr>
            </thead>
            <tbody>
                ${gameState.players.map(player => `
                    <tr>
                        <td>${player.name}</td>
                        <td>${player.totalScore}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
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
        completedSection.classList.add('hidden');
        gameSection.classList.remove('hidden');
    }
    
    // Reset UI
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

// Start new game
function startNewGame() {
    // Reset game state
    gameState = {
        players: [],
        currentDealerIndex: 0,
        currentHand: 1,
        hands: [],
        dealerContracts: {}
    };
    
    // Clear local storage
    localStorage.removeItem('barbuGameState');
    
    // Hide completed section and show setup section
    completedSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
    
    // Reset form inputs
    document.getElementById('player1').value = '';
    document.getElementById('player2').value = '';
    document.getElementById('player3').value = '';
    document.getElementById('player4').value = '';
}

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
            gameState = JSON.parse(savedState);
            
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
            
            // Hide setup section and show game section
            setupSection.classList.add('hidden');
            gameSection.classList.remove('hidden');
            updateGameUI();
        }
    } catch (e) {
        console.error('Failed to load game state:', e);
        // Start fresh game
        gameState = {
            players: [],
            currentDealerIndex: 0,
            currentHand: 1,
            hands: [],
            dealerContracts: {}
        };
    }
}

// Show error message
function showError(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error');
    existingErrors.forEach(error => error.remove());
    
    // Create new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    // Insert error message at the top of the game section
    gameSection.insertBefore(errorDiv, gameSection.firstChild);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Show statistics section
function showStats() {
    const stats = calculateGameStats();
    if (!stats) {
        showError('No statistics available - no hands have been played yet');
        return;
    }
    
    // Format statistics content
    let statsHTML = `
        <h4>Overall Game Statistics</h4>
        <p><strong>Total Hands Played:</strong> ${stats.totalHands}</p>
        <h4>Player Statistics</h4>
        <div class="player-stats-grid">
    `;
    
    // Add player-specific stats
    Object.values(stats.playerStats).forEach(playerStat => {
        statsHTML += `
            <div class="player-stat-card">
                <h5>${playerStat.name}</h5>
                <p><strong>Total Score:</strong> ${playerStat.totalScore}</p>
                <p><strong>Hands Dealt:</strong> ${playerStat.handsDealt}</p>
                <p><strong>Best Hand:</strong> ${playerStat.bestHand.score} points</p>
                <p><strong>Worst Hand:</strong> ${playerStat.worstHand.score} points</p>
                <h6>Contract Usage:</h6>
                <ul>
        `;
        
        Object.entries(playerStat.contracts).forEach(([contractId, count]) => {
            const contractName = getContractName(contractId);
            statsHTML += `<li>${contractName}: ${count}</li>`;
        });
        
        statsHTML += `
                </ul>
            </div>
        `;
    });
    
    statsHTML += '</div>';
    statsContent.innerHTML = statsHTML;
    statsSection.classList.remove('hidden');
}

// Hide statistics section
function hideStats() {
    statsSection.classList.add('hidden');
}

// Restart game function
function restartGame() {
    // Reset game state
    gameState = {
        players: [],
        currentDealerIndex: 0,
        currentHand: 1,
        hands: [],
        dealerContracts: {},
        doublingCompliance: {}
    };
    
    // Initialize doubling compliance tracking
    for (let dealer = 0; dealer < 4; dealer++) {
        gameState.doublingCompliance[dealer] = {};
        for (let player = 0; player < 4; player++) {
            if (player !== dealer) {
                gameState.doublingCompliance[dealer][player] = 0;
            }
        }
    };
    
    // Clear local storage
    localStorage.removeItem('barbuGameState');
    
    // Hide game section and show setup section
    gameSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
    
    // Reset form inputs
    document.getElementById('player1').value = '';
    document.getElementById('player2').value = '';
    document.getElementById('player3').value = '';
    document.getElementById('player4').value = '';
    
    // Reattach form submission listener to ensure it works after restart
    playerForm.removeEventListener('submit', handlePlayerSetup);
    playerForm.addEventListener('submit', handlePlayerSetup);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initGame);

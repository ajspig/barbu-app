import { CONTRACTS } from './game-constants.js';
import { gameState } from './game-state.js';
import { getDominoPoints } from './scoring-logic.js';

// DOM elements
let setupSection, gameSection, completedSection, playerForm, startGameBtn;
let currentDealerSpan, currentHandSpan, contractsList, contractSelect, confirmContractBtn;
let doublingSection, doublingInstructions, doublingOptions, confirmDoublesBtn;
let dominoSection, confirmPositionsBtn;
let scoringSection, scoreInputs, confirmScoresBtn;
let scoresBody, handHistory, undoHandBtn, exportGameBtn, showStatsBtn, hideStatsBtn;
let statsSection, statsContent, newGameBtn, restartGameBtn;

// Initialize DOM elements
function initDOMElements() {
    setupSection = document.getElementById('setup-section');
    gameSection = document.getElementById('game-section');
    completedSection = document.getElementById('completed-section');
    playerForm = document.getElementById('player-form');
    startGameBtn = document.getElementById('start-game');
    currentDealerSpan = document.getElementById('current-dealer');
    currentHandSpan = document.getElementById('current-hand');
    contractsList = document.getElementById('contracts-list');
    contractSelect = document.getElementById('contract-select');
    confirmContractBtn = document.getElementById('confirm-contract');
    doublingSection = document.getElementById('doubling-section');
    doublingInstructions = document.getElementById('doubling-instructions');
    doublingOptions = document.getElementById('doubling-options');
    confirmDoublesBtn = document.getElementById('confirm-doubles');
    dominoSection = document.getElementById('domino-section');
    confirmPositionsBtn = document.getElementById('confirm-positions');
    scoringSection = document.getElementById('scoring-section');
    scoreInputs = document.getElementById('score-inputs');
    confirmScoresBtn = document.getElementById('confirm-scores');
    scoresBody = document.getElementById('scores-body');
    handHistory = document.getElementById('hand-history');
    undoHandBtn = document.getElementById('undo-hand');
    exportGameBtn = document.getElementById('export-game');
    showStatsBtn = document.getElementById('show-stats');
    hideStatsBtn = document.getElementById('hide-stats');
    statsSection = document.getElementById('stats-section');
    statsContent = document.getElementById('stats-content');
    newGameBtn = document.getElementById('new-game');
    restartGameBtn = document.getElementById('restart-game');
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

// Helper function to get contract name
function getContractName(contractId) {
    const contract = CONTRACTS.find(c => c.id === contractId);
    return contract ? contract.name : 'Unknown';
}

// Show domino section for Domino contract
function showDominoSection() {
    dominoSection.classList.remove('hidden');
    
    // Clear previous position values
    for (let i = 0; i < 4; i++) {
        const positionSelect = document.getElementById(`position-player${i + 1}`);
        if (positionSelect) {
            positionSelect.value = '';
        }
    }
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
        if (doubleCheckbox) {
            doubleCheckbox.addEventListener('change', function() {
                const redoubleOptions = document.getElementById(`redouble-options-${i}`);
                if (this.checked) {
                    redoubleOptions.classList.remove('hidden');
                } else {
                    redoubleOptions.classList.add('hidden');
                    const redoubleCheckbox = document.getElementById(`redouble-${i}`);
                    if (redoubleCheckbox) {
                        redoubleCheckbox.checked = false;
                    }
                }
            });
        }
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

// Show error message
function showError(message, styleClass = 'error') {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error, .warning');
    existingErrors.forEach(error => error.remove());
    
    // Create new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = styleClass;
    errorDiv.textContent = message;
    
    // Insert error message at the top of the visible section
    if (setupSection.classList.contains('hidden')) {
        gameSection.insertBefore(errorDiv, gameSection.firstChild);
    } else {
        setupSection.appendChild(errorDiv);
    }
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Show statistics section
function showStats(stats) {
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

// Show final results
function showFinalResults() {
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

// Reset UI for next hand
function resetHandUI() {
    // Reset contract selection
    contractSelect.value = '';
    document.querySelector('.contract-selection').classList.remove('hidden');
    
    // Hide all other sections
    dominoSection.classList.add('hidden');
    doublingSection.classList.add('hidden');
    scoringSection.classList.add('hidden');
}

// Getter functions for DOM elements that need external access
function getSetupSection() {
    return setupSection;
}

function getGameSection() {
    return gameSection;
}

function getCompletedSection() {
    return completedSection;
}

function getPlayerForm() {
    return playerForm;
}

function getContractSelect() {
    return contractSelect;
}

function getConfirmContractBtn() {
    return confirmContractBtn;
}

function getDoublingSection() {
    return doublingSection;
}

function getDominoSection() {
    return dominoSection;
}

function getScoringSection() {
    return scoringSection;
}

function getConfirmDoublesBtn() {
    return confirmDoublesBtn;
}

function getConfirmPositionsBtn() {
    return confirmPositionsBtn;
}

function getConfirmScoresBtn() {
    return confirmScoresBtn;
}

function getUndoHandBtn() {
    return undoHandBtn;
}

function getExportGameBtn() {
    return exportGameBtn;
}

function getShowStatsBtn() {
    return showStatsBtn;
}

function getHideStatsBtn() {
    return hideStatsBtn;
}

function getNewGameBtn() {
    return newGameBtn;
}

function getRestartGameBtn() {
    return restartGameBtn;
}

function getDoublingInstructions() {
    return doublingInstructions;
}

export { 
    initDOMElements, 
    updateGameUI, 
    updateDoublingCompliance, 
    updateAvailableContracts, 
    updateScoresTable, 
    updateHandHistory,
    showDominoSection,
    createDoublingOptions,
    createNegativeScoringInputs,
    createPositiveScoringInputs,
    showError,
    showStats,
    hideStats,
    showFinalResults,
    resetHandUI,
    getContractName,
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
};

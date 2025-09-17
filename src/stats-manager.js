import { CONTRACTS } from './game-constants.js';
import { gameState } from './game-state.js';
import { getContractName } from './ui-manager.js';

// Calculate and display game statistics
function calculateGameStats() {
    if (gameState.hands.length === 0) return null;
    
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

export { calculateGameStats };

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

export { CONTRACTS };

/* eslint-disable no-restricted-globals */
// Web Worker for Stockfish chess engine
// This is a web worker file

// Basic set of valid chess moves for different positions
const validMoves = {
  // Starting position moves
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': ['e2e4', 'd2d4', 'g1f3', 'b1c3'],
  // After e4
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': ['e7e5', 'c7c5', 'e7e6', 'c7c6'],
  // After e4 e5
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2': ['g1f3', 'f1c4', 'f2f4', 'd2d4'],
  // After e4 e5 Nf3
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2': ['b8c6', 'g8f6', 'd7d6', 'f8c5']
};

// Default moves to use when no specific position match is found
const defaultMoves = {
  'w': ['e2e4', 'd2d4', 'g1f3', 'b1c3', 'c2c4', 'f2f4', 'e2e3', 'd2d3'],
  'b': ['e7e5', 'd7d5', 'g8f6', 'b8c6', 'c7c5', 'f7f5', 'e7e6', 'd7d6']
};

// Current position being analyzed
let currentPosition = '';
let currentTurn = 'w';

// Respond to messages from the main thread
self.addEventListener('message', function(e) {
  const message = e.data;
  
  // Simulate Stockfish responses
  if (message === 'uci') {
    // Respond with UCI initialization
    setTimeout(() => {
      self.postMessage('id name Stockfish 15');
      self.postMessage('id author The Stockfish Team');
      self.postMessage('uciok');
    }, 100);
  } 
  else if (message === 'isready') {
    // Respond that engine is ready
    setTimeout(() => {
      self.postMessage('readyok');
    }, 100);
  }
  else if (message.startsWith('position fen')) {
    // Extract and store the position
    const fenMatch = message.match(/position fen (.*)/);
    if (fenMatch && fenMatch[1]) {
      currentPosition = fenMatch[1];
      // Extract turn from FEN
      const fenParts = currentPosition.split(' ');
      if (fenParts.length > 1) {
        currentTurn = fenParts[1];
      }
    }
  }
  else if (message.startsWith('go')) {
    // Extract depth if specified
    let depth = 15;
    if (message.includes('depth')) {
      const depthMatch = message.match(/depth\s+(\d+)/);
      if (depthMatch && depthMatch[1]) {
        depth = parseInt(depthMatch[1], 10);
      }
    }
    
    // Simulate thinking time based on depth
    const thinkTime = Math.min(300 + depth * 100, 3000);
    
    setTimeout(() => {
      // Try to find a valid move for the current position
      let move;
      
      // Check if we have predefined moves for this position
      if (validMoves[currentPosition]) {
        const possibleMoves = validMoves[currentPosition];
        move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      } else {
        // Use default moves based on turn
        const possibleMoves = defaultMoves[currentTurn] || defaultMoves['w'];
        move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }
      
      self.postMessage(`bestmove ${move}`);
    }, thinkTime);
  }
}); 
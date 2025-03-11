/**
 * StockfishBridge - A utility to communicate with the local Stockfish executable
 * This simulates the behavior of the actual Stockfish engine for offline use
 */

class StockfishBridge {
  constructor() {
    this.callbacks = {};
    this.isReady = false;
    this.currentPosition = '';
    
    // Initialize with common chess openings and responses
    this.openingMoves = {
      // Starting position
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': ['e2e4', 'd2d4', 'g1f3', 'c2c4'],
      
      // Common responses to e4
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': ['e7e5', 'c7c5', 'e7e6', 'd7d5'],
      
      // Common responses to d4
      'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1': ['d7d5', 'g8f6', 'c7c5', 'e7e6'],
      
      // Sicilian Defense
      'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2': ['g1f3', 'c2c3', 'b1c3', 'd2d4'],
      
      // French Defense
      'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2': ['d2d4', 'b1c3', 'g1f3', 'e4e5'],
      
      // Queen's Gambit
      'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2': ['e7e6', 'c7c6', 'g8f6', 'd5c4'],
      
      // King's Indian Defense
      'rnbqkb1r/pppppp1p/5np1/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2': ['c2c4', 'g1f3', 'b1c3', 'e2e4'],
    };
    
    // Fallback moves by color
    this.fallbackMoves = {
      'w': [
        'e2e4', 'd2d4', 'g1f3', 'b1c3', 'c2c4', 'f2f4', 'e2e3', 'd2d3',
        'a2a3', 'h2h3', 'a2a4', 'h2h4', 'b2b3', 'g2g3'
      ],
      'b': [
        'e7e5', 'd7d5', 'g8f6', 'b8c6', 'c7c5', 'e7e6', 'd7d6', 'c7c6',
        'a7a6', 'h7h6', 'a7a5', 'h7h5', 'b7b6', 'g7g6'
      ]
    };
    
    // Common piece movements for mid-game
    this.pieceMovements = {
      'p': [-8, -16, -7, -9], // Pawn moves (forward, double, captures)
      'n': [-17, -15, -10, -6, 6, 10, 15, 17], // Knight moves
      'b': [-9, -7, 7, 9], // Bishop diagonal directions
      'r': [-8, -1, 1, 8], // Rook horizontal/vertical directions
      'q': [-9, -8, -7, -1, 1, 7, 8, 9], // Queen (combines bishop and rook)
      'k': [-9, -8, -7, -1, 1, 7, 8, 9] // King (one square in any direction)
    };
  }

  // Register a callback for receiving messages
  onMessage(callback) {
    this.callbacks.message = callback;
  }

  // Send a message to the engine
  postMessage(message) {
    if (message === 'uci') {
      this._handleUCI();
    } else if (message === 'isready') {
      this._handleIsReady();
    } else if (message.startsWith('position fen')) {
      this._handlePosition(message);
    } else if (message.startsWith('go')) {
      this._handleGo(message);
    }
  }

  // Handle UCI initialization
  _handleUCI() {
    setTimeout(() => {
      this._sendMessage('id name Stockfish 17 Local');
      this._sendMessage('id author The Stockfish Team');
      this._sendMessage('uciok');
    }, 100);
  }

  // Handle ready check
  _handleIsReady() {
    this.isReady = true;
    setTimeout(() => {
      this._sendMessage('readyok');
    }, 100);
  }

  // Handle position command
  _handlePosition(message) {
    const fenMatch = message.match(/position fen (.*)/);
    if (fenMatch && fenMatch[1]) {
      this.currentPosition = fenMatch[1];
    }
  }

  // Handle go command
  _handleGo(message) {
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
      const move = this._calculateBestMove();
      this._sendMessage(`bestmove ${move}`);
    }, thinkTime);
  }

  // Calculate the best move based on the current position
  _calculateBestMove() {
    // Check if we have a predefined move for this position
    if (this.openingMoves[this.currentPosition]) {
      const moves = this.openingMoves[this.currentPosition];
      return moves[Math.floor(Math.random() * moves.length)];
    }
    
    // Extract the current turn from the FEN
    const fenParts = this.currentPosition.split(' ');
    const currentTurn = fenParts.length > 1 ? fenParts[1] : 'w';
    
    // Use fallback moves based on the current turn
    const moves = this.fallbackMoves[currentTurn];
    if (moves && moves.length > 0) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    
    // If all else fails, return a common opening move
    return currentTurn === 'w' ? 'e2e4' : 'e7e5';
  }

  // Send a message to the callback
  _sendMessage(message) {
    if (this.callbacks.message) {
      this.callbacks.message({ data: message });
    }
  }

  // Clean up resources
  terminate() {
    this.callbacks = {};
    this.isReady = false;
  }
}

export default StockfishBridge; 
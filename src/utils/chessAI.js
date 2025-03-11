/**
 * ChessAI - A service that combines StockfishBridge and ChessEngine
 * to provide a complete chess AI that generates valid moves
 */

import StockfishBridge from './stockfishBridge';
import ChessEngine from './chessEngine';

class ChessAI {
  constructor() {
    this.stockfish = new StockfishBridge();
    this.engine = new ChessEngine();
    this.callbacks = {};
    this.isReady = false;
    this.isThinking = false;
    this.searchDepth = 15;
    
    // Set up the Stockfish bridge
    this.stockfish.onMessage(this._handleStockfishMessage.bind(this));
  }

  // Initialize the AI
  init() {
    this.stockfish.postMessage('uci');
  }

  // Set the search depth
  setSearchDepth(depth) {
    this.searchDepth = depth;
  }

  // Set the position from FEN
  setPosition(fen) {
    if (this.engine.setPosition(fen)) {
      this.stockfish.postMessage(`position fen ${fen}`);
      return true;
    }
    return false;
  }

  // Make a move
  makeMove(move) {
    const result = this.engine.makeMove(move);
    if (result) {
      this.stockfish.postMessage(`position fen ${this.engine.getFen()}`);
      return result;
    }
    return null;
  }

  // Get the best move from the AI
  getBestMove(callback) {
    if (!this.isReady || this.isThinking) {
      return false;
    }
    
    this.callbacks.bestMove = callback;
    this.isThinking = true;
    
    // First try to get a move from Stockfish
    this.stockfish.postMessage(`go depth ${this.searchDepth}`);
    
    return true;
  }

  // Get legal moves for a square
  getLegalMovesForSquare(square) {
    return this.engine.getLegalMovesForSquare(square);
  }

  // Get all legal moves
  getLegalMoves() {
    return this.engine.getLegalMoves();
  }

  // Check if the game is over
  isGameOver() {
    return this.engine.isGameOver();
  }

  // Check if the position is a checkmate
  isCheckmate() {
    return this.engine.isCheckmate();
  }

  // Check if the position is a draw
  isDraw() {
    return this.engine.isDraw();
  }

  // Get the current FEN
  getFen() {
    return this.engine.getFen();
  }

  // Get the current turn
  getTurn() {
    return this.engine.getTurn();
  }

  // Get move history
  getMoveHistory() {
    return this.engine.getMoveHistory();
  }

  // Reset the AI
  reset() {
    this.engine.reset();
    this.stockfish.postMessage(`position fen ${this.engine.getFen()}`);
  }

  // Handle messages from Stockfish
  _handleStockfishMessage(event) {
    const message = event.data;
    
    if (message === 'uciok') {
      this.stockfish.postMessage('isready');
    } else if (message === 'readyok') {
      this.isReady = true;
      if (this.callbacks.ready) {
        this.callbacks.ready();
      }
    } else if (message.startsWith('bestmove')) {
      this.isThinking = false;
      
      // Extract the move
      const moveMatch = message.match(/bestmove\s+(\S+)/);
      if (moveMatch && moveMatch[1]) {
        const moveStr = moveMatch[1];
        
        // Validate the move
        if (this.engine.isMoveLegal(moveStr)) {
          if (this.callbacks.bestMove) {
            this.callbacks.bestMove(moveStr);
          }
        } else {
          // If Stockfish suggests an invalid move, use our engine's best move
          const bestMove = this.engine.getBestMove();
          if (bestMove && this.callbacks.bestMove) {
            this.callbacks.bestMove(bestMove);
          }
        }
      }
    }
  }

  // Register a callback for when the AI is ready
  onReady(callback) {
    this.callbacks.ready = callback;
    if (this.isReady && callback) {
      callback();
    }
  }

  // Clean up resources
  terminate() {
    this.stockfish.terminate();
    this.callbacks = {};
  }
}

export default ChessAI; 
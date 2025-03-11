/**
 * ChessEngine - A utility to validate and generate legal chess moves
 * This works with the StockfishBridge to ensure only valid moves are suggested
 */

import { Chess } from 'chess.js';

class ChessEngine {
  constructor() {
    this.chess = new Chess();
    this.moveHistory = [];
  }

  // Set the position from FEN
  setPosition(fen) {
    try {
      this.chess.load(fen);
      return true;
    } catch (e) {
      console.error('Invalid FEN:', fen, e);
      return false;
    }
  }

  // Get the current FEN
  getFen() {
    return this.chess.fen();
  }

  // Get the current turn
  getTurn() {
    return this.chess.turn();
  }

  // Make a move and return the result
  makeMove(move) {
    try {
      const result = this.chess.move(move);
      if (result) {
        this.moveHistory.push(result);
        return result;
      }
    } catch (e) {
      console.error('Invalid move:', move, e);
    }
    return null;
  }

  // Get all legal moves for the current position
  getLegalMoves() {
    return this.chess.moves({ verbose: true });
  }

  // Get legal moves for a specific square
  getLegalMovesForSquare(square) {
    return this.chess.moves({
      square: square,
      verbose: true
    });
  }

  // Check if a move is legal
  isMoveLegal(move) {
    try {
      // Create a temporary chess instance to validate the move
      const tempChess = new Chess(this.chess.fen());
      const result = tempChess.move(move);
      return !!result;
    } catch (e) {
      return false;
    }
  }

  // Generate a random legal move
  getRandomMove() {
    const moves = this.getLegalMoves();
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Get the best move based on simple heuristics
  getBestMove() {
    const moves = this.getLegalMoves();
    if (moves.length === 0) return null;
    
    // Prioritize captures, checks, and promotions
    const captures = moves.filter(move => move.flags.includes('c'));
    const checks = moves.filter(move => move.san.includes('+'));
    const promotions = moves.filter(move => move.flags.includes('p'));
    
    if (promotions.length > 0) {
      return promotions[Math.floor(Math.random() * promotions.length)];
    }
    
    if (captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    
    if (checks.length > 0) {
      return checks[Math.floor(Math.random() * checks.length)];
    }
    
    // Otherwise, return a random move
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Check if the game is over
  isGameOver() {
    return this.chess.isGameOver();
  }

  // Check if the position is a checkmate
  isCheckmate() {
    return this.chess.isCheckmate();
  }

  // Check if the position is a draw
  isDraw() {
    return this.chess.isDraw();
  }

  // Reset the engine to the starting position
  reset() {
    this.chess.reset();
    this.moveHistory = [];
  }

  // Get the move history
  getMoveHistory() {
    return this.moveHistory;
  }
}

export default ChessEngine; 
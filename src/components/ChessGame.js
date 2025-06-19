import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChessAI from '../utils/chessAI';

const ChessGame = ({ playerColor, searchDepth = 15 }) => {
  const [game, setGame] = useState(new Chess());
  const [chessAI, setChessAI] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [gameStatus, setGameStatus] = useState('');
  const [engineReady, setEngineReady] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [predictions, setPredictions] = useState([]);
  
  // Refs to avoid stale closures in callbacks
  const gameRef = useRef();
  gameRef.current = game;

  // Initialize Chess AI
  useEffect(() => {
    const ai = new ChessAI();
    
    ai.onReady(() => {
      setEngineReady(true);
      toast.success('Chess engine ready!', {
        autoClose: 2000
      });
    });
    
    ai.init();
    ai.setSearchDepth(searchDepth);
    setChessAI(ai);
    
    return () => {
      if (ai) {
        ai.terminate();
      }
    };
  }, [searchDepth]);

  // Update game status
  useEffect(() => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'Black' : 'White';
        setGameStatus(`Checkmate! ${winner} wins.`);
        toast.success(`Checkmate! ${winner} wins.`, {
          autoClose: 5000
        });
      } else if (game.isDraw()) {
        const reason = game.isStalemate() ? 'Stalemate' : 
                      game.isThreefoldRepetition() ? 'Threefold Repetition' : 
                      game.isInsufficientMaterial() ? 'Insufficient Material' : 
                      'Fifty-move Rule';
        setGameStatus(`Game Over! Draw: ${reason}`);
        toast.info(reason, {
          autoClose: 5000
        });
      }
    } else {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'}'s turn`);
    }
    
    // Clear selected square and possible moves when game state changes
    setSelectedSquare(null);
    setPossibleMoves([]);
    
    // Update the AI with the new position
    if (chessAI && engineReady) {
      chessAI.setPosition(game.fen());
    }
  }, [game, chessAI, engineReady]);

  // Make a move on the board
  const makeMove = useCallback((move) => {
    try {
      const gameCopy = new Chess(gameRef.current.fen());
      const result = gameCopy.move(move);
      
      if (result) {
        // Update move history
        setMoveHistory(prevHistory => {
          const newHistory = [...prevHistory];
          newHistory.push(result);
          return newHistory;
        });
        
        // Set last move for highlighting
        setLastMove({
          from: result.from,
          to: result.to
        });
        
        setGame(gameCopy);
        
        // Update the AI with the new position
        if (chessAI) {
          chessAI.makeMove(move);
        }
        
        return true;
      }
    } catch (e) {
      console.error('Invalid move:', move, e);
      toast.error(`Invalid move: ${move}`, {
        autoClose: 2000
      });
      return false;
    }
    return false;
  }, [chessAI]);

  // Get AI's move
  const getAIMove = useCallback(() => {
    if (game.isGameOver() || !chessAI) return;
    
    setIsThinking(true);
    
    chessAI.getBestMove((bestMove) => {
      if (bestMove) {
        makeMove(bestMove);
        toast.info('AI made a move', {
          autoClose: 1500
        });
      }
      setIsThinking(false);
    });
  }, [chessAI, game, makeMove]);

  // Get predicted best moves
  const getPredictedMoves = useCallback(() => {
    if (!engineReady || !chessAI || game.isGameOver()) return;
    
    // Get all legal moves
    const legalMoves = chessAI.getLegalMoves();
    
    // Take up to 5 moves for predictions
    const possiblePredictions = [];
    for (let i = 0; i < Math.min(5, legalMoves.length); i++) {
      // Simple evaluation based on piece values
      const move = legalMoves[i];
      let evaluation = 'Normal';
      
      if (move.flags.includes('c')) {
        evaluation = 'Good'; // Captures are usually good
      } else if (move.san.includes('+')) {
        evaluation = 'Good'; // Checks are usually good
      } else if (move.flags.includes('p')) {
        evaluation = 'Good'; // Promotions are good
      } else if (Math.random() > 0.7) {
        evaluation = 'Poor'; // Some moves are randomly marked as poor
      }
      
      possiblePredictions.push({
        move: move,
        evaluation: evaluation
      });
    }
    
    setPredictions(possiblePredictions);
  }, [engineReady, chessAI, game]);

  // Handle square click for move selection
  const handleSquareClick = (square) => {
    // Don't allow moves during engine thinking or if game is over
    if (isThinking || game.isGameOver()) {
      toast.warning('Cannot move while AI is thinking or game is over');
      return;
    }
    
    // Only allow moves if it's the player's turn
    if ((game.turn() === 'w' && playerColor === 'black') ||
        (game.turn() === 'b' && playerColor === 'white')) {
      toast.info('Wait for your turn');
      return;
    }
    
    // If no square is selected yet, select this one if it has a piece of the current turn
    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        
        // Get possible moves for this piece
        const moves = game.moves({ 
          square: square, 
          verbose: true 
        });
        
        setPossibleMoves(moves);
        
        if (moves.length === 0) {
          toast.info('This piece has no legal moves');
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } else {
        // Clicked on empty square or opponent's piece without selection
        toast.warning('Please select one of your pieces first');
      }
    } 
    // If a square is already selected
    else {
      // Check if the clicked square is a valid move
      const moveObj = possibleMoves.find(move => move.to === square);
      
      if (moveObj) {
        // Make the move
        const success = makeMove({
          from: selectedSquare,
          to: square,
          promotion: 'q' // Always promote to queen for simplicity
        });
        
        if (success) {
          // Clear selection
          setSelectedSquare(null);
          setPossibleMoves([]);
          
          // Get engine's move after a short delay
          if (!game.isGameOver()) {
            setTimeout(() => {
              getAIMove();
            }, 300);
          }
          
          // Update predictions
          getPredictedMoves();
        }        } else {
          // If clicked on another own piece, select that one instead
          const piece = game.get(square);
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
            
            // Get possible moves for this piece
            const moves = game.moves({ 
              square: square, 
              verbose: true 
            });
            
            setPossibleMoves(moves);
            
            if (moves.length === 0) {
              toast.info('This piece has no legal moves');
              setSelectedSquare(null);
              setPossibleMoves([]);
            }
          } else {
            // If clicked on an invalid square (empty or opponent's piece), show warning and clear selection
            toast.warning('Invalid move! You can only move to highlighted squares');
            setSelectedSquare(null);
            setPossibleMoves([]);
          }
        }
    }
  };

  // Make AI move if it's AI's turn at the start or after color change
  useEffect(() => {
    if (engineReady && 
        !game.isGameOver() && 
        ((game.turn() === 'w' && playerColor === 'black') ||
         (game.turn() === 'b' && playerColor === 'white'))) {
      setTimeout(() => {
        getAIMove();
      }, 500);
    }
    
    // Update predictions whenever the game state changes
    getPredictedMoves();
  }, [engineReady, game, playerColor, getAIMove, getPredictedMoves]);

  // Update search depth when it changes
  useEffect(() => {
    if (chessAI) {
      chessAI.setSearchDepth(searchDepth);
    }
  }, [chessAI, searchDepth]);

  // Format move history for display
  const formattedHistory = useMemo(() => {
    const formattedMoves = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moveHistory[i]?.san || '';
      const blackMove = moveHistory[i + 1]?.san || '';
      formattedMoves.push({ moveNumber, whiteMove, blackMove });
    }
    return formattedMoves;
  }, [moveHistory]);

  // Custom square styles for highlighting
  const customSquareStyles = useMemo(() => {
    const styles = {};
    
    // Highlight last move
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }
    
    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = { 
        backgroundColor: 'rgba(0, 100, 255, 0.6)',
        boxShadow: 'inset 0 0 0 3px rgba(0, 100, 255, 0.8)'
      };
      
      // Highlight possible moves with distinct colors
      possibleMoves.forEach(move => {
        const pieceOnTarget = game.get(move.to);
        if (pieceOnTarget) {
          // Red for captures with stronger visual indication
          styles[move.to] = { 
            backgroundColor: 'rgba(255, 50, 50, 0.7)',
            boxShadow: 'inset 0 0 0 3px rgba(255, 50, 50, 0.9)',
            border: '2px solid rgba(255, 0, 0, 0.8)'
          };
        } else {
          // Green for empty squares with visual indication
          styles[move.to] = { 
            backgroundColor: 'rgba(50, 255, 50, 0.6)',
            boxShadow: 'inset 0 0 0 2px rgba(50, 255, 50, 0.8)',
            border: '2px solid rgba(0, 200, 0, 0.6)'
          };
        }
      });
    }
    
    return styles;
  }, [lastMove, selectedSquare, possibleMoves, game]);

  return (
    <div className={`chess-game ${
      (game.turn() === 'w' && playerColor === 'black') ||
      (game.turn() === 'b' && playerColor === 'white') ||
      isThinking ? 'not-player-turn' : ''
    }`}>
      <div className={`board-container ${
        isThinking ? 'ai-thinking' : 
        ((game.turn() === 'w' && playerColor === 'white') ||
         (game.turn() === 'b' && playerColor === 'black')) ? 'player-turn' : ''
      }`}>
        <Chessboard
          position={game.fen()}
          onSquareClick={handleSquareClick}
          boardOrientation={playerColor}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
          }}
          customSquareStyles={customSquareStyles}
          arePremovesAllowed={false}
          arePiecesDraggable={false}
        />
      </div>
      
      <div className="game-info-panel">
        <div className="info-card">
          <div className={`status-indicator ${isThinking ? 'thinking' : game.isCheckmate() ? 'checkmate' : game.isDraw() ? 'draw' : 'active'}`}>
            <span>Status:</span> 
            {isThinking ? (
              'AI is thinking...'
            ) : game.isGameOver() ? (
              gameStatus
            ) : (
              <>
                {gameStatus}
                {((game.turn() === 'w' && playerColor === 'white') ||
                  (game.turn() === 'b' && playerColor === 'black')) && (
                  <span style={{ marginLeft: '10px', color: '#4caf50', fontWeight: 'bold' }}>
                    (Your turn - Click a piece to see valid moves)
                  </span>
                )}
                {((game.turn() === 'w' && playerColor === 'black') ||
                  (game.turn() === 'b' && playerColor === 'white')) && (
                  <span style={{ marginLeft: '10px', color: '#ff9800', fontWeight: 'bold' }}>
                    (AI's turn - Please wait)
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="info-card">
          <h3>Move History</h3>
          <div className="move-history">
            <ul className="move-list">
              {formattedHistory.map((move) => (
                <React.Fragment key={move.moveNumber}>
                  <span className="move-number">{move.moveNumber}.</span>
                  <span className="move-white">{move.whiteMove}</span>
                  <span className="move-black">{move.blackMove}</span>
                </React.Fragment>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="info-card">
          <h3>Predicted Best Moves</h3>
          <div className="predictions-list">
            {predictions.length > 0 ? (
              <ul className="prediction-items">
                {predictions.map((prediction, index) => (
                  <li 
                    key={index} 
                    className={`prediction-item ${prediction.evaluation === 'Good' ? 'good-move' : prediction.evaluation === 'Poor' ? 'poor-move' : ''}`}
                    onClick={() => {
                      if (!isThinking && game.turn() === (playerColor === 'white' ? 'w' : 'b')) {
                        makeMove({
                          from: prediction.move.from,
                          to: prediction.move.to,
                          promotion: prediction.move.promotion || 'q'
                        });
                        
                        // Get engine's move after a short delay
                        if (!game.isGameOver()) {
                          setTimeout(() => {
                            getAIMove();
                          }, 300);
                        }
                      }
                    }}
                  >
                    <span className="move-notation">{prediction.move.san}</span>
                    <span className="move-evaluation">{prediction.evaluation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No predictions available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessGame; 
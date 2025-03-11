import React, { useState, useEffect } from 'react';
import './App.css';
import ChessGame from './components/ChessGame.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [playerColor, setPlayerColor] = useState('white');
  const [difficulty, setDifficulty] = useState('medium');
  const [showSettings, setShowSettings] = useState(false);
  const [gameKey, setGameKey] = useState(1);
  
  // Map difficulty levels to search depth
  const difficultyMap = {
    easy: 5,
    medium: 12,
    hard: 18,
    expert: 22
  };

  // Handle new game
  const handleNewGame = () => {
    toast.info('Starting new game...', {
      autoClose: 1500
    });
    // Force re-render of the ChessGame component
    setGameKey(prevKey => prevKey + 1);
    setShowSettings(false);
  };

  // Handle color switch
  const handleColorSwitch = () => {
    setPlayerColor(playerColor === 'white' ? 'black' : 'white');
    toast.info(`Now playing as ${playerColor === 'white' ? 'Black' : 'White'}`, {
      autoClose: 1500
    });
  };

  // Handle difficulty change
  const handleDifficultyChange = (e) => {
    const newDifficulty = e.target.value;
    setDifficulty(newDifficulty);
    toast.info(`Difficulty set to ${newDifficulty.charAt(0).toUpperCase() + newDifficulty.slice(1)}`, {
      autoClose: 1500
    });
  };

  // Show welcome message on first load
  useEffect(() => {
    toast.success('Welcome to Chess with Stockfish!', {
      autoClose: 3000
    });
  }, []);

  return (
    <div className="App">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />
      <header className="App-header">
        <h1>Chess with Stockfish</h1>
      </header>
      <main>
        <div className="controls-panel">
          <div className="button-group">
            <button 
              className="btn btn-primary"
              onClick={handleColorSwitch}
            >
              <i className="fas fa-exchange-alt"></i>
              Play as {playerColor === 'white' ? 'Black' : 'White'}
            </button>
            <button 
              className="btn btn-success" 
              onClick={handleNewGame}
            >
              <i className="fas fa-redo"></i>
              New Game
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowSettings(!showSettings)}
            >
              <i className="fas fa-cog"></i>
              {showSettings ? 'Hide Settings' : 'Settings'}
            </button>
          </div>
          
          <div className="difficulty-selector">
            <label htmlFor="difficulty">AI Difficulty:</label>
            <select 
              id="difficulty" 
              value={difficulty} 
              onChange={handleDifficultyChange}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
        
        {showSettings && (
          <div className="settings-panel info-card">
            <h3>Game Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>Board Theme:</label>
                <select>
                  <option value="default">Default</option>
                  <option value="wood">Wood</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Piece Style:</label>
                <select>
                  <option value="default">Default</option>
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Move Highlighting:</label>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="setting-item">
                <label>Sound Effects:</label>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>
        )}
        
        <ChessGame 
          playerColor={playerColor} 
          searchDepth={difficultyMap[difficulty]}
          key={`${gameKey}-${playerColor}-${difficulty}`} // Force re-render on changes
        />
      </main>
      <footer>
        <p>
          Powered by Stockfish Chess Engine | 
          <a href="https://github.com/official-stockfish/Stockfish" target="_blank" rel="noopener noreferrer">GitHub</a> | 
          <a href="#" onClick={(e) => {
            e.preventDefault(); 
            toast.info('Help: Click on a piece to select it, then click on a highlighted square to move it. You can also click on a predicted move to play it directly.', {
              autoClose: 5000
            });
          }}>Help</a>
        </p>
      </footer>
    </div>
  );
}

export default App; 
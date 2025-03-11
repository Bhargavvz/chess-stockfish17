# Modern Chess Application

![Chess App](https://img.shields.io/badge/Chess-App-1a237e?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![Stockfish](https://img.shields.io/badge/Stockfish-15-607D8B?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A modern, responsive chess application built with React that allows you to play against the powerful Stockfish chess engine locally. This application features a clean, intuitive UI with customizable settings, move predictions, and game analysis.

![Chess App Screenshot](https://via.placeholder.com/800x450.png?text=Chess+App+Screenshot)

## Features

- 🎮 Play against Stockfish chess engine locally
- 🔄 Switch between playing as white or black
- 🎚️ Adjustable difficulty levels (Beginner to Grandmaster)
- 🎯 Click-based move selection (no drag and drop required)
- 🔍 Move suggestions and predictions
- 📊 Real-time position evaluation
- 📜 Move history with algebraic notation
- 🎨 Customizable board themes and piece styles
- 🔊 Optional sound effects for moves and captures
- 🔆 Highlighted legal moves and last move played
- 📱 Fully responsive design for all devices

## Installation

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chess-app.git
   cd chess-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## How to Play

1. **Start a New Game**: Click the "New Game" button to start a fresh game.
2. **Choose Your Color**: Click "Switch Colors" to play as black or white.
3. **Select Difficulty**: Choose from 5 difficulty levels in the settings panel.
4. **Make a Move**: Click on a piece to select it, then click on a highlighted square to move.
5. **View Predictions**: The app shows potential moves and their evaluations.
6. **Game Status**: The status indicator shows whose turn it is and the game state.

## Technical Implementation

### Architecture

The application is built with a modular architecture:

- **React Components**: Modular UI components for the board, pieces, and controls
- **Chess Logic**: Uses chess.js for game rules and validation
- **AI Engine**: Integrates Stockfish via Web Workers for move generation
- **State Management**: React hooks for local state management
- **Styling**: Modern CSS with responsive design principles

### Key Components

- `ChessGame`: Main component that orchestrates the game logic
- `ChessBoard`: Renders the board and handles user interactions
- `ChessAI`: Manages communication with the Stockfish engine
- `MoveHistory`: Displays the history of moves in algebraic notation
- `GameControls`: Provides UI controls for game settings

## Customization

The app offers several customization options:

- **Board Themes**: Classic, Wooden, Blue, Green
- **Piece Styles**: Standard, Neo, Alpha, Leipzig
- **Highlight Options**: Toggle move highlighting
- **Sound Effects**: Toggle sound for moves and captures

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Stockfish](https://stockfishchess.org/) - The powerful open-source chess engine
- [chess.js](https://github.com/jhlywa/chess.js) - Chess logic implementation
- [React](https://reactjs.org/) - UI library
- [React Chess](https://github.com/rexxars/react-chess) - Inspiration for the board design

---

Made with ♟️ and ❤️ 
declare module 'stockfish' {
  export class Engine {
    constructor(path: string);
    onmessage: (event: MessageEvent) => void;
    postMessage(message: string): void;
    terminate(): void;
  }
}

declare module 'react-chessboard' {
  import { ComponentType } from 'react';
  
  interface ChessboardProps {
    position?: string;
    onPieceDrop?: (source: string, target: string) => boolean;
    boardOrientation?: 'white' | 'black';
  }
  
  export const Chessboard: ComponentType<ChessboardProps>;
} 
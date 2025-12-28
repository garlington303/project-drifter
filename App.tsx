import React from 'react';
import { GameCanvas } from './components/GameCanvas';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950">
      <GameCanvas />
    </div>
  );
};

export default App;
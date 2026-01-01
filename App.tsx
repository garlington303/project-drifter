import React from 'react';
import { GameCanvas } from './components/GameCanvas';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#2e3d20]">
      <GameCanvas />
    </div>
  );
};

export default App;
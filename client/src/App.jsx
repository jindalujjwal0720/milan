import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import LobbyPage from "./pages/Lobby";
import RoomPage from "./pages/Room";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:roomId" element={<LobbyPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/feedback" element={<div>Feedback</div>} />
      </Routes>
    </div>
  );
}

export default App;

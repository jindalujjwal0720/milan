import React, { useEffect } from "react";
import styles from "./LobbyPage.module.css";
import { useParams } from "react-router-dom";
import { useSocket } from "../../context/SocketProvider";

const LobbyPage = () => {
  const { roomId } = useParams();
  const socket = useSocket();

  const handleRoomJoin = () => {
    socket.emit("room:join", roomId);
  };

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div>
      <h1>Lobby: {roomId}</h1>
      <button onClick={handleRoomJoin}>Ask to Join</button>
    </div>
  );
};

export default LobbyPage;

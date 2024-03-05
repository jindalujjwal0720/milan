import React, { useCallback, useEffect } from "react";
import styles from "./LobbyPage.module.css";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketProvider";

const LobbyPage = () => {
  const { roomId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();

  const handleRoomJoin = () => {
    socket.emit("room:join", roomId);
  };

  const handleRoomJoined = useCallback(
    (room) => {
      console.log("Room Joined", room);
      navigate(`/room/${room.id}`, {
        state: { host: false, room: room },
        replace: true,
      });
    },
    [navigate]
  );

  const handleRoomNotFound = useCallback(() => {
    console.log("Room Not Found");
  }, []);

  useEffect(() => {
    socket.on("room:joined", handleRoomJoined);
    socket.on("room:not-found", handleRoomNotFound);

    return () => {
      socket.off("room:joined", handleRoomJoined);
      socket.off("room:not-found", handleRoomNotFound);
    };
  }, [socket, handleRoomJoined, handleRoomNotFound]);

  return (
    <div>
      <h1>Lobby: {roomId}</h1>
      <button onClick={handleRoomJoin}>Ask to Join</button>
    </div>
  );
};

export default LobbyPage;

import React, { useCallback, useEffect } from "react";
import styles from "./HomePage.module.css";
import { useSocket } from "../../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const socket = useSocket();
  const navigate = useNavigate();

  const handleStartCall = () => {
    socket.emit("room:create");
  };

  const handleRoomCreated = useCallback(
    (roomId) => {
      console.log("Room Created", roomId);
      navigate(`/room/${roomId}`, { state: { host: true } });
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:created", handleRoomCreated);

    return () => {
      socket.off("room:created", handleRoomCreated);
    };
  }, [socket, handleRoomCreated]);

  return (
    <div>
      <h1>Milan Video Call</h1>
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Start or Join a Video Call</h2>
          <p>
            Start a video call and share the link with others to invite them.
          </p>
          <button className={styles.start} onClick={handleStartCall}>
            Start a Video Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

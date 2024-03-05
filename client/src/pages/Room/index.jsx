import React, { useCallback, useEffect, useState } from "react";
import styles from "./RoomPage.module.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import peerService from "../../service/Peer";
import { useSocket } from "../../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  /** @type {[MediaStream, (stream: MediaStream) => void]} */
  const [myStream, setMyStream] = useState(null);
  /** @type {[MediaStream, (stream: MediaStream) => void]} */
  const [peerStream, setPeerStream] = useState(null);

  const stopMyStream = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => {
        track.stop();
      });
      setMyStream(null);
    }
  }, [myStream]);

  const toggleMyVideo = () => {
    if (myStream) {
      if (!isAudioEnabled && isVideoEnabled) {
        // If audio is disabled and video is enabled,
        // after disabling video, stream will be stopped
        // and set to null
        console.log("stopping stream");
        stopMyStream();
        setIsVideoEnabled(false);
      } else {
        // If audio is enabled or video is disabled,
        // only video will be toggled
        console.log("toggling video");
        myStream.getVideoTracks().forEach((track) => {
          track.enabled = !isVideoEnabled;
        });
        setIsVideoEnabled(!isVideoEnabled);
      }
    } else {
      // If stream is null, get the video stream
      console.log("getting stream");
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          stream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
          setMyStream(stream);
          setIsVideoEnabled(true);
        })
        .catch((err) => {
          console.log("Error getting video stream", err);
        });
    }
  };

  const toggleMyAudio = () => {
    if (myStream) {
      if (!isVideoEnabled && isAudioEnabled) {
        // If video is disabled and audio is enabled,
        // after disabling audio, stream will be stopped
        // and set to null
        console.log("stopping stream");
        stopMyStream();
        setIsAudioEnabled(false);
      } else {
        // If video is enabled or audio is disabled,
        // only audio will be toggled
        console.log("toggling audio");
        myStream.getAudioTracks().forEach((track) => {
          track.enabled = !isAudioEnabled;
        });
        setIsAudioEnabled(!isAudioEnabled);
      }
    } else {
      // If stream is null, get the audio stream
      console.log("getting stream");
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          stream.getVideoTracks().forEach((track) => {
            track.enabled = false;
          });
          setMyStream(stream);
          setIsAudioEnabled(true);
        })
        .catch((err) => {
          console.log("Error getting audio stream", err);
        });
    }
  };

  const handleRoomLeave = useCallback(() => {
    console.log("Leaving room");
    stopMyStream();
    socket.emit("room:leave", roomId);
  }, [stopMyStream, socket, roomId]);

  const handlePeerJoinPermission = useCallback(
    (user) => {
      const allowed = window.confirm("A user wants to join");
      if (allowed) {
        socket.emit("room:join:accepted", user);
      } else {
        socket.emit("room:join:denied", user);
      }
    },
    [socket]
  );

  // cannot join room directly from URL
  useEffect(() => {
    if (!location.state) {
      return navigate("/", { replace: true });
    }
    const { from, isCreator } = location.state;
    if (from !== "lobby" && !isCreator) {
      navigate("/", { replace: true });
    }
  }, [socket, roomId, location, navigate, handleRoomLeave]);

  // listener for window close event
  useEffect(() => {
    window.addEventListener("beforeunload", handleRoomLeave);
    return () => {
      window.removeEventListener("beforeunload", handleRoomLeave);
    };
  }, [handleRoomLeave]);

  // socket listeners
  useEffect(() => {
    socket.on("room:join:permission", handlePeerJoinPermission);
    return () => {
      socket.off("room:join:permission", handlePeerJoinPermission);
    };
  }, [handlePeerJoinPermission, socket]);

  return (
    <div>
      <h1>Room: {roomId}</h1>
      <p>
        Audio: {isAudioEnabled ? "Enabled" : "Disabled"} | Video:{" "}
        {isVideoEnabled ? "Enabled" : "Disabled"}
      </p>
      <div className={styles.container}>
        <div className={styles.videos}>
          {myStream ? (
            <video
              autoPlay
              playsInline
              ref={(video) => {
                if (video) {
                  video.srcObject = myStream;
                }
              }}
              className={styles.myVideo}
            ></video>
          ) : (
            <div className={styles.myVideo}>
              <p>No Video</p>
            </div>
          )}
        </div>
        <div className={styles.controls}>
          <button onClick={toggleMyAudio}>Toggle Audio</button>
          <button onClick={toggleMyVideo}>Toggle Video</button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;

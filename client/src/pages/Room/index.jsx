import React, { useCallback, useEffect, useState } from "react";
import styles from "./RoomPage.module.css";
import { useParams, useLocation } from "react-router-dom";
import { useSocket } from "../../context/SocketProvider";

const RoomPage = () => {
  const { roomId } = useParams();
  const socket = useSocket();
  const location = useLocation();
  /** @type {[MediaStream, (stream: MediaStream) => void]} */
  const [localStream, setLocalStream] = useState(null);
  /** @type {[MediaStream, (stream: MediaStream) => void]} */
  const [remoteStream, setRemoteStream] = useState(null);
  /** @type {[RTCPeerConnection, (peerConnection: RTCPeerConnection) => void]} */
  const [peerConnection, setPeerConnection] = useState(null);
  const [text, setText] = useState("");

  const addTracks = useCallback(() => {
    try {
      if (peerConnection && localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });
      }
    } catch (error) {
      console.log("Error adding tracks", error);
    }
  }, [peerConnection, localStream]);

  useEffect(() => {
    addTracks();
  }, [addTracks]);

  const getUserMedia = useCallback(async () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        setLocalStream(stream);
        addTracks();
      })
      .catch((err) => {
        console.error("Error accessing media devices.", err);
      });
  }, [addTracks]);

  const createPeerConnection = useCallback(() => {
    const config = {
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
    };
    const pc = new RTCPeerConnection(config);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New ICE candidate", event.candidate);
        socket.emit("room:call:ice-candidate", roomId, event.candidate);
      }
    };
    pc.oniceconnectionstatechange = (event) => {
      console.log("ICE connection state change", event);
    };
    pc.ontrack = (event) => {
      // on receiving remote stream
      console.log("New Track", event.streams[0]);
      setRemoteStream(event.streams[0]);
    };
    console.log("Peer Connection created", pc);
    setPeerConnection(pc);
  }, [socket, roomId]);

  const createOffer = useCallback(async () => {
    try {
      if (peerConnection) {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        console.log("Offer Created", offer);
        return offer;
      }
    } catch (error) {
      console.log("Error creating offer", error);
    }
  }, [peerConnection]);

  const createAnswer = useCallback(async () => {
    try {
      if (peerConnection) {
        const answer = await peerConnection.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        console.log("Answer Created", answer);
        return answer;
      }
    } catch (error) {
      console.log("Error creating answer", error);
    }
  }, [peerConnection]);

  const setLocalDescription = useCallback(
    async (offer) => {
      try {
        if (!offer) return;
        console.log("Setting Local Description", offer);
        if (peerConnection) {
          const desc = new RTCSessionDescription(offer);
          await peerConnection.setLocalDescription(desc);
        }
      } catch (error) {
        console.log("Error setting local description", error);
      }
    },
    [peerConnection]
  );

  const setRemoteDescription = useCallback(
    async (offer) => {
      try {
        if (!offer) return;
        console.log("Setting Remote Description", offer);
        if (peerConnection) {
          const desc = new RTCSessionDescription(offer);
          await peerConnection.setRemoteDescription(desc);
        }
      } catch (error) {
        console.log("Error setting remote description", error);
      }
    },
    [peerConnection]
  );

  const addIceCandidate = useCallback(
    async (candidate) => {
      try {
        console.log("Adding ICE candidate", candidate);
        if (peerConnection) {
          const iceCandidate = new RTCIceCandidate(candidate);
          await peerConnection.addIceCandidate(iceCandidate);
        }
      } catch (error) {
        console.log("Error adding ICE candidate", error);
      }
    },
    [peerConnection]
  );

  const handleNewUserJoined = useCallback((userId) => {
    console.log("User Joined", userId);
    createOffer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const call = useCallback(async () => {
    const offer = await createOffer();
    console.log("Calling...", offer);
    await setLocalDescription(offer);
    socket.emit("room:call:offer", offer);
  }, [createOffer, socket, setLocalDescription]);

  const answerCall = useCallback(async () => {
    const answer = await createAnswer();
    console.log("Answering...", answer);
    await setLocalDescription(answer);
    socket.emit("room:call:answer", answer);
  }, [createAnswer, setLocalDescription, socket]);

  const handleRoomCallOffered = useCallback(
    async (from, offer) => {
      if (!offer) return;
      console.log("Call Offer received", from, offer);
      await setRemoteDescription(offer);
      answerCall();
    },
    [setRemoteDescription, answerCall]
  );

  const handleRoomCallAnswered = useCallback(
    async (from, answer) => {
      if (!answer) return;
      console.log("Call Answer received", from, answer);
      await setRemoteDescription(answer);
    },
    [setRemoteDescription]
  );

  const handleRoomCallIceCandidate = useCallback(
    async (from, candidate) => {
      console.log("ICE Candidate received", candidate);
      await addIceCandidate(candidate);
    },
    [addIceCandidate]
  );

  useEffect(() => {
    console.log("Room page rendered", location.state);

    if (location.state && location.state.host) {
      createPeerConnection();
      getUserMedia();
    } else if (location.state && location.state.room) {
      createPeerConnection();
      getUserMedia().then(() => {
        socket.emit("room:call");
      });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // socket event listeners
  useEffect(() => {
    socket.on("room:user:joined", handleNewUserJoined);
    socket.on("room:call:offered", handleRoomCallOffered);
    socket.on("room:call:answered", handleRoomCallAnswered);
    socket.on("room:call:ice-candidate", handleRoomCallIceCandidate);
    socket.on("room:call", call);

    return () => {
      socket.off("room:user:joined", handleNewUserJoined);
      socket.off("room:call:offered", handleRoomCallOffered);
      socket.off("room:call:answered", handleRoomCallAnswered);
      socket.off("room:call:ice-candidate", handleRoomCallIceCandidate);
    };
  }, [
    socket,
    handleNewUserJoined,
    handleRoomCallOffered,
    handleRoomCallAnswered,
    handleRoomCallIceCandidate,
    call,
  ]);

  return (
    <div>
      <h1>Room: {roomId}</h1>
      <div className={styles.container}>
        <div className={styles.videos}>
          {localStream ? (
            <video
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (video) {
                  video.srcObject = localStream;
                }
              }}
              className={styles.myVideo}
            ></video>
          ) : (
            <div className={styles.myVideo}>
              <p>No Video</p>
            </div>
          )}
          {remoteStream ? (
            <video
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (video) {
                  video.srcObject = remoteStream;
                }
              }}
              className={styles.remoteVideo}
            ></video>
          ) : (
            <div className={styles.remoteVideo}>
              <p>No Video</p>
            </div>
          )}
        </div>
        <div className={styles.controls}>
          <button onClick={call}>Call</button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;

const { Server } = require("socket.io");
const uid = require("./utils/uid");
require("dotenv").config();

const io = new Server(5000, {
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

const rooms = {};
const users = {};

const handleRoomCreate = (socket) => {
  const roomId = uid();
  socket.join(roomId);
  socket.emit("room:created", roomId);
  rooms[roomId] = {
    id: roomId,
    users: [socket.id],
    host: socket.id,
  };
  users[socket.id] = roomId;
};

const handleRoomLeave = (socket) => {
  const roomId = users[socket.id];
  if (roomId) {
    socket.leave(roomId);
    const room = rooms[roomId];
    if (room) {
      room.users = room.users.filter((id) => id !== socket.id);
      if (room.users.length === 0) {
        delete rooms[roomId];
      } else if (socket.id === room.host) {
        room.host = room.users[0];
        socket.to(room.host).emit("room:host:changed", room.host);
      }
    }
    delete users[socket.id];
  }
};

const handleRoomJoin = (socket, roomId) => {
  const room = rooms[roomId];
  if (room) {
    socket.join(roomId);
    room.users = [...new Set([...room.users, socket.id])];
    users[socket.id] = roomId;
    socket.to(room.host).emit("room:user:joined", socket.id);
    socket.emit("room:joined", room);
  } else {
    socket.emit("room:not-found");
  }
};

const handleRoomCallOffer = (socket, offer) => {
  console.log("room:call:offer", socket.id);
  const roomId = users[socket.id];
  if (roomId) {
    socket.to(roomId).emit("room:call:offered", socket.id, offer);
  }
};

const handleRoomCallAnswer = (socket, answer) => {
  console.log("room:call:answer", socket.id);
  const roomId = users[socket.id];
  if (roomId) {
    socket.to(roomId).emit("room:call:answered", socket.id, answer);
  }
};

const handleRoomCallIceCandidate = (socket, roomId, candidate) => {
  console.log("room:call:ice-candidate", socket.id, roomId);
  socket.to(roomId).emit("room:call:ice-candidate", socket.id, candidate); // from, candidate
};

const lastCallTime = {};
const handleRoomCall = (socket) => {
  console.log("room:call", socket.id);
  const lastTime = lastCallTime[socket.id] || 0;
  const currentTime = Date.now();
  if (currentTime - lastTime < 5000) {
    return;
  }
  lastCallTime[socket.id] = currentTime;
  setTimeout(() => {
    socket.emit("room:call");
  }, 3000);
};

const handleSocketDisconnect = (socket) => {
  console.log("socket disconnected", socket.id);

  // remove user from room and delete room if empty
  handleRoomLeave(socket);
};

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("room:create", (...args) => handleRoomCreate(socket, ...args));
  socket.on("room:join", (...args) => handleRoomJoin(socket, ...args));
  socket.on("room:leave", (...args) => handleRoomLeave(socket, ...args));
  socket.on("room:call:offer", (...args) =>
    handleRoomCallOffer(socket, ...args)
  );
  socket.on("room:call:answer", (...args) =>
    handleRoomCallAnswer(socket, ...args)
  );
  socket.on("room:call:ice-candidate", (...args) =>
    handleRoomCallIceCandidate(socket, ...args)
  );
  socket.on("room:call", (...args) => handleRoomCall(socket, ...args));

  socket.on("disconnect", () => handleSocketDisconnect(socket));
});

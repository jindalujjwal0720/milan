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

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("room:create", () => {
    const roomId = uid();
    socket.join(roomId);
    socket.emit("room:created", roomId);
    rooms[roomId] = {
      users: [socket.id],
      admin: socket.id,
    };
    users[socket.id] = roomId;
  });

  socket.on("room:join", (roomId) => {

  })

  socket.on("disconnect", () => {
    console.log("socket disconnected", socket.id);
  });
});

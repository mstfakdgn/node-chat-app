const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const { generateMessage } = require("./utils/messages");
const { generateLocation } = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

//use request body
app.use(express.json());

// app.listen(port, () => {
//   console.log("Server is up on port" + port);
// });

// let count = 0

io.on("connection", (socket) => {
  console.log("New WebSocket Connection");

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    message = "Welcome";
    socket.emit("welcome", generateMessage(user.username ,"Welcome"));
    socket.broadcast
      .to(user.room)
      .emit("welcome", generateMessage(user.username ,`${user.username} has joined`));
    io.to(user.room).emit('roomData', {
      room:user.room,
      users:getUsersInRoom(user.room)
    })

    callback();
  });

  socket.on("clientMessage", (message, callback) => {
    const filter = new Filter();

    const user = getUser(socket.id)

    if (filter.isProfane(message)) {
      return callback("Bad boy");
    }
    io.to(user.room).emit("welcome", generateMessage(user.username, message));
    callback();
  });

  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id)


    io.to(user.room).emit(
      "locationMessage",
      generateLocation(
        user.username,
        `https://google.com/maps?q=${location.latitute},${location.longitute}`
      )
    );
    callback();
  });
  // socket.emit('countUpdated', count)

  // socket.on('increment', () => {
  //   count++
  //   // socket.emit('countUpdated', count)
  //   io.emit('countUpdated', count)
  // })

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("welcome", generateMessage(user.username , `${user.username} has left`));
      io.to(user.room).emit('roomData', {
        room:user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });
});

server.listen(port, () => {
  console.log("Server is up on port" + port);
});

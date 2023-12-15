const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Actualizar a la url especifica cuando se dejen las pruebas
    credentials: true
  }
});

let users = {};
let messageIdCounter = 1;

app.get("/", (req, res) => {
  res.send("Server chat is running");
});

io.on("connection", (socket) => {
  console.log("An user connected");

  socket.on("join", (username) => {
    console.log(`${username} joined the chat with socketId ${socket.id}`)
    users[socket.id] = username;
  });

  socket.on("message", (message) => {
    const user = users[socket.id] || "User";
    const messageId = messageIdCounter++;

    let data = { user, message, messageId };

    io.emit("message", { user, message, messageId });
    console.log(`Message ${data} sent`);
  });

  socket.on("deleteMessage", (messageId) => {
    io.emit("messageDeleted", messageId);
    console.log(`Message ${messageId} deleted`);
  });

  socket.on("disconnect", () => {
    console.log(`The user ${users[socket.id]} has left the chat.`)
    delete users[socket.id];
  });

  socket.on("closerDriversMessage", (data) => {
    const user = users[socket.id] || "User";
    console.log(data.recipient);
    if (data.recipient && Array.isArray(data.recipient)) {
      data.recipient.forEach((recipient) => {
        const recipientString = recipient.toString();
        //const messageId = messageIdCounter++;
        const recipientSocket = Object.keys(users).find(
          (socketId) => users[socketId] === recipientString
        );
        if (recipientSocket) {
          io.to(recipientSocket).emit("privateMessage", {
            user,
            recipient: recipient,
            message: data.message,
            messageId: data.messageId,
          });
          console.log(`id viaje: ${data.messageId}`);
          console.log(`Private message sent to ${recipient}`);
        }

      })
    }
  });


  socket.on("privateMessage", (data) => {
    const user = users[socket.id] || "User";
    //const messageId = messageIdCounter++;
    const recipientSocket = Object.keys(users).find(
      (socketId) => users[socketId] === data.recipient
    );
    if (recipientSocket) {
      io.to(recipientSocket).emit("privateMessage", {
        user,
        recipient: data.recipient,
        message: data.message,
        messageId: data.messageId,
      });
      console.log(`Private message sent to ${data.recipient}`);
    }
  });


});

const PORT = process.env.PORT || 3010;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

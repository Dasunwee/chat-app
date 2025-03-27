const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Track connected users
const users = new Map();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  // When a new user joins
  socket.on('new user', (username) => {
    users.set(socket.id, username);
    socket.broadcast.emit('user joined', username);
    io.emit('update users', Array.from(users.values()));
  });

  socket.on('chat message', (msg) => {
    const username = users.get(socket.id);
    io.emit('chat message', {  // Use io.emit instead of socket.broadcast.emit
        user: username,
        text: msg,
        time: new Date().toLocaleTimeString()
    });
});

  // When user disconnects
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      io.emit('user left', username);
      io.emit('update users', Array.from(users.values()));
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
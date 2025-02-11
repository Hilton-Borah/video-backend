const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PeerServer } = require('peer');

const app = express();
const server = http.createServer(app);

// Socket.io for chat
const io = new Server(server, {
  cors: {
    origin: 'https://video-calling-hai.netlify.app', // Allow React app to connect
    methods: ['GET', 'POST'],
  },
});

// PeerJS for WebRTC signaling
const peerServer = PeerServer({ port: 9000, path: '/myapp' });

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://Hilton:hilton@cluster0.rgtirz5.mongodb.net/video_calling?retryWrites=true&w=majority/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Socket.io connection for chat
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle peer ID sharing
  socket.on('share_peer_id', (peerId) => {
    socket.broadcast.emit('peer_id_shared', peerId); // Broadcast to all other users
  });

  // Handle chat messages
  socket.on('send_message', (data) => {
    io.emit('receive_message', data);
  });

  // Handle WebRTC signaling
  socket.on('call_user', (data) => {
    io.to(data.to).emit('call_made', { signal: data.signal, from: data.from });
  });

  socket.on('answer_call', (data) => {
    io.to(data.to).emit('call_answered', { signal: data.signal });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
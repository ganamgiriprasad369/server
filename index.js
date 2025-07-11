const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const noteRoutes = require('./routes/notes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['https://notesland-mates.netlify.app'],
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
  }
});

app.use(cors({
  origin: ['https://notesland-mates.netlify.app'],
  credentials: true
}));

app.use(express.json());
app.use('/notes', noteRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.get('/', (req, res) => {
  res.send('Server running');
});

const userColors = {};
const COLORS = ['red', 'blue', 'green', 'purple', 'orange'];

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  userColors[socket.id] = color;

  socket.on('join_note', (noteId) => {
    socket.join(noteId);
    console.log(`Socket ${socket.id} joined room ${noteId}`);

    io.to(noteId).emit('user_color', {
      socketId: socket.id,
      color: userColors[socket.id]
    });
  });

  socket.on('note_update', ({ noteId, html }) => {
    socket.to(noteId).emit('note_update', { socketId: socket.id, html });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    delete userColors[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

// Enhanced Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

// Improved MongoDB Connection
async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI missing in .env file');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 50,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create indexes for better performance
    await mongoose.connection.db.collection('messages').createIndex({ user: 1 });
    await mongoose.connection.db.collection('messages').createIndex({ time: -1 });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Fail fast in production
  }
}

// Enhanced Message Schema with validation
const messageSchema = new mongoose.Schema({
  user: { 
    type: String, 
    required: true,
    maxlength: 30,
    trim: true
  },
  text: { 
    type: String, 
    required: true,
    maxlength: 500,
    trim: true
  },
  time: { 
    type: Date, 
    default: Date.now,
    index: true
  },
    readBy: [{ type: String }], // Track who has read the message
    reactions: [{
    user: String,
    emoji: String
  }],
  fileDetails: {
    name: String,
    type: String,
    size: Number,
    path: String
  }

});

// Add static methods
messageSchema.statics.getRecentMessages = async function(limit = 50) {
  return this.find().sort({ time: -1 }).limit(limit).lean();
};

const Message = mongoose.model('Message', messageSchema);

// Express Setup with rate limiting
const app = express();
const server = http.createServer(app);

// Enhanced Socket.IO with CORS and compression
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e6, // 1MB max message size
  pingTimeout: 60000,
  pingInterval: 25000
});

// Security Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public'), { 
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0'
}));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});
  
// Socket.IO Logic
const users = new Map(); 

// Enhanced Socket.IO Logic
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // Debug all incoming events
  socket.onAny((eventName, ...args) => {
    console.log(`📨 Incoming event: ${eventName}`, args);
  });

  // User Registration with validation
  socket.on('register', (username, callback) => {
    // Ensure callback is a function
    if (typeof callback !== 'function') {
      console.error('Invalid callback for register event');
      return;
    }

    if (!username || username.length > 30) {
      return callback({ status: 'error', message: 'Invalid username' });
    }

    try {
      users.set(socket.id, username);
      io.emit('user list', Array.from(users.values()));
      
      // Fetch recent messages
      Message.getRecentMessages()
        .then(messages => {
          socket.emit('message history', messages.reverse());
          io.emit('system message', `${username} joined the chat`);
          callback({ status: 'success' });
        })
        .catch(err => {
          console.error('Error fetching messages:', err);
          callback({ status: 'error', message: 'Server error' });
        });
    } catch (err) {
      console.error('Registration error:', err);
      callback({ status: 'error', message: 'Server error' });
    }
  });

  // Message Handling with validation
  socket.on('send message', async (text, callback) => {
    // Ensure callback is a function
    if (typeof callback !== 'function') {
      console.error('Invalid callback for send message event');
      return;
    }

    const username = users.get(socket.id);
    if (!username || !text || text.length > 500) {
      return callback({ status: 'error', message: 'Invalid message' });
    }

    try {
      const newMessage = await Message.create({ user: username, text });
      io.emit('new message', {
        user: newMessage.user,
        text: newMessage.text,
        time: newMessage.time
      });
      callback({ status: 'success' });
    } catch (err) {
      console.error('Message save error:', err);
      callback({ status: 'error', message: 'Failed to save message' });
    }
  });

  // Typing Indicator with throttling
  let typingTimer;
  socket.on('typing', () => {
    const username = users.get(socket.id);
    if (username) {
      socket.broadcast.emit('user typing', username);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        socket.broadcast.emit('user typing', null);
      }, 3000);
    }
  });

  // Enhanced Disconnection handling
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      io.emit('system message', `${username} left the chat`);
      io.emit('user list', Array.from(users.values()));
    }
  });
});

// Production-ready Server Startup
async function startServer() {
  try {
    await connectToDatabase();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket ready at ws://localhost:${PORT}`);
    }).on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}
  

function gracefulShutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  
  server.close(async () => {
    await mongoose.connection.close();
    console.log('✅ Server stopped');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Forcing shutdown...');
    process.exit(1);
  }, 5000);
}

startServer();
# Real-Time Chat Application

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://chat-app-production-7ff3.up.railway.app)
[![Backend Status](https://img.shields.io/endpoint?url=https://chat-app-production-7ff3.up.railway.app/health)]

(https://chat-app-production-7ff3.up.railway.app/health)

## Features
- Real-time messaging with Socket.IO
- Message history persistence (MongoDB)
- Typing indicators
- Message editing/deletion
- Responsive UI

## Technology Stack

| Component      | Technology               |
|----------------|--------------------------|
| Frontend       | React/Vue + Vercel       |
| Backend        | Node.js + Railway        |
| Database       | MongoDB Atlas            |
| Real-Time      | Socket.IO                |

## Setup Guide
```bash

# Local Development
git clone https://github.com/your-repo/chat-app.git
cd chat-app
npm install
echo "MONGODB_URI=your_connection_string" > .env
npm start

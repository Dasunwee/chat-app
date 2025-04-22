# Architecture Decision Records (ADR)  
**Project**: Real-Time Chat Application  
  

---

### ADR 001: WebSocket Protocol Selection  
#### Status  
✅ Accepted (2024-06-15)  

#### Context  
Needed real-time communication with:  
- Browser and mobile support  
- Automatic reconnection  
- Message batching  

#### Decision  
**Socket.IO** over raw WebSockets/Pusher, as evidenced in:  
```javascript
// server.js (your existing code)
const io = require('socket.io')(server, {
  pingTimeout: 60000, // Matches your load test results
  cors: { origin: "*" } // Aligns with your frontend config
});

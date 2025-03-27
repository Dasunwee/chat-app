document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const form = document.getElementById('message-form');
    const input = document.getElementById('message-input');
    const messages = document.getElementById('message-container');
    const usersList = document.getElementById('user-list');
    const userCount = document.getElementById('user-count');
    const typingIndicator = document.getElementById('typing-indicator');
  
    // Verify element existence
    if (!form || !input || !messages || !usersList || !userCount) {
      console.error('One or more required DOM elements are missing:', {
        form: !!form,
        input: !!input,
        messages: !!messages,
        usersList: !!usersList,
        userCount: !!userCount
      });
      return;
    }
  
    // User registration
    const username = prompt('Enter your name:') || `User${Math.floor(Math.random() * 1000)}`;
    socket.emit('register', username, (response) => {
      if (response.status === 'error') {
        alert(`Registration failed: ${response.message}`);
      } else {
        console.log('Registration successful');
      }
    });
  
    // Message display functions
    function addSystemMessage(text) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message system';
      messageElement.innerHTML = `<em>${text}</em>`;
      messages.appendChild(messageElement);
      messages.scrollTop = messages.scrollHeight;
    }
  
    function addChatMessage(data, isSent = false) {
      const messageElement = document.createElement('div');
      messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
      
      messageElement.innerHTML = `
        <div class="message-info">
          ${!isSent ? `<strong>${data.user}</strong>` : ''}
          <span>${new Date(data.time).toLocaleTimeString()}</span>
        </div>
        <div class="message-text">${data.text}</div>
      `;
      
      messages.appendChild(messageElement);
      messages.scrollTop = messages.scrollHeight;
    }
  
    function updateUserList(users) {
      usersList.innerHTML = '';
      userCount.textContent = users.length;
      
      users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="user-status"></span>
          ${user} ${user === username ? '(You)' : ''}
        `;
        usersList.appendChild(li);
      });
    }
  
    // Event handlers
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value.trim()) {
        socket.emit('send message', input.value, (response) => {
          if (response.status === 'error') {
            console.error('Message send failed:', response.message);
            addSystemMessage(`Failed to send message: ${response.message}`);
          }
        });
        input.value = '';
      }
    });
  
    let typingTimeout;

// Typing detection
input.addEventListener('input', () => {
  socket.emit('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop typing');
  }, 2000);
});

// Display typing indicator
socket.on('user typing', (username) => {
  typingIndicator.textContent = `${username} is typing...`;
  typingIndicator.style.display = 'block';
});

socket.on('user stopped typing', () => {
  typingIndicator.style.display = 'none';
});
    // Socket event listeners
    socket.on('connect', () => {
      console.log('✅ Connected to server with ID:', socket.id);
    });
  
    socket.on('system message', addSystemMessage);
    socket.on('user list', updateUserList);
    socket.on('new message', (data) => {
      addChatMessage(data, data.user === username);
    });
  
    socket.on('message history', (messages) => {
      console.log('Received message history:', messages);
      messages.forEach(msg => {
        addChatMessage(msg, msg.user === username);
      });
    });
  
    socket.on('user typing', (typingUser) => {
      if (typingUser && typingUser !== username) {
        typingIndicator.textContent = `${typingUser} is typing...`;
      } else {
        typingIndicator.textContent = '';
      }
    });
  
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      alert('Connection error: ' + err.message);
    });
  
    // Debugging events
    socket.onAny((event, ...args) => {
      console.log(`📨 Received event: ${event}`, args);
    });
        
    
  });
  
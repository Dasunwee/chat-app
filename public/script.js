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

  // Username handling
  const storedUsername = localStorage.getItem('chatUsername');
  const username = storedUsername || prompt('Enter your name:') || `User${Math.floor(Math.random() * 1000)}`;

  // Registration function
  function registerUser(name) {
    socket.emit('register', name, (response) => {
      if (response.status === 'success') {
        localStorage.setItem('chatUsername', name);
        console.log('Registration successful');
      } else {
        alert(`Registration failed: ${response.message}`);
      }
    });
  }

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
    messageElement.dataset.messageId = data._id || data.id;
    
    const messageControls = isSent ? `
      <div class="message-controls">
        <button class="edit-message-btn">Edit</button>
        <button class="delete-message-btn">Delete</button>
      </div>
    ` : '';
    
    messageElement.innerHTML = `
      <div class="message-info">
        ${!isSent ? `<strong>${data.user}</strong>` : ''}
        <span>${new Date(data.time).toLocaleTimeString()}</span>
      </div>
      <div class="message-text">${data.text}</div>
      ${messageControls}
    `;
    
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
    
    // Add event listeners for edit and delete buttons
    if (isSent) {
      const editBtn = messageElement.querySelector('.edit-message-btn');
      const deleteBtn = messageElement.querySelector('.delete-message-btn');
      
      editBtn.addEventListener('click', () => handleEditMessage(data));
      deleteBtn.addEventListener('click', () => handleDeleteMessage(data));
    }
    return messageElement;
  }

  function handleEditMessage(message) {
    // Prompt user to edit the message
    const newText = prompt('Edit your message:', message.text);
    
    if (newText !== null && newText.trim() !== message.text.trim()) {
      // Emit socket event to update message
      socket.emit('edit message', {
        messageId: message._id || message.id,
        newText: newText.trim()
      }, (response) => {
        if (response.status === 'error') {
          addSystemMessage(`Failed to edit message: ${response.message}`);
        }
      });
    }
  }

  function handleDeleteMessage(message) {
    // Confirm deletion
    if (confirm('Are you sure you want to delete this message?')) {
      // Emit socket event to delete message
      socket.emit('delete message', {
        messageId: message._id || message.id
      }, (response) => {
        if (response.status === 'error') {
          addSystemMessage(`Failed to delete message: ${response.message}`);
        }
      });
    }
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

  // Initial and reconnection registration
  socket.on('connect', () => {
    console.log('✅ Connected to server with ID:', socket.id);
    registerUser(username);
  });

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

  // Socket event listeners
  socket.on('system message', addSystemMessage);
  socket.on('user list', updateUserList);

  // Message history handling
  socket.on('message history', (messageList) => {
    console.log('Received message history:', messageList);
    messageList.forEach(msg => {
      const messageElement = addChatMessage(msg, msg.user === username);
      messageElement.dataset.messageId = msg._id;
    });
  });

  // New message handling
  socket.on('new message', (data) => {
    const messageElement = addChatMessage(data, data.user === username);
    messageElement.dataset.messageId = data._id;
  });

  // Handle message edit event
  socket.on('message edited', (editedMessage) => {
    const messageElement = document.querySelector(`[data-message-id="${editedMessage.id}"] .message-text`);
    if (messageElement) {
      messageElement.textContent = editedMessage.newText;
    }
  });

  // Handle message delete event
  socket.on('message deleted', (deletedMessageId) => {
    const messageElement = document.querySelector(`[data-message-id="${deletedMessageId}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  });

  // Typing indicator events
  socket.on('user typing', (typingUser) => {
    if (typingUser && typingUser !== username) {
      typingIndicator.textContent = `${typingUser} is typing...`;
      typingIndicator.style.display = 'block';
    } else {
      typingIndicator.textContent = '';
      typingIndicator.style.display = 'none';
    }
  });

  socket.on('user stopped typing', () => {
    typingIndicator.style.display = 'none';
  });

  // Connection error handling
  socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
    alert('Connection error: ' + err.message);
  });

  // Debugging events
  socket.onAny((event, ...args) => {
    console.log(`📨 Received event: ${event}`, args);
  });
});
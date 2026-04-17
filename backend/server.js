const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Real-time synchronization state
let users = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', async (userData) => {
    const { id, name, avatarSeed } = userData;
    
    // Upsert user in DB
    try {
      const user = await prisma.user.upsert({
        where: { id: id },
        update: { lastSeen: new Date() },
        create: {
          id: id,
          name: name,
          avatarSeed: avatarSeed,
        }
      });

      users[socket.id] = id;
      
      // Join room
      socket.join('study-room');
      
      // Broadcast user joined
      socket.to('study-room').emit('user-joined', user);
      
      // Send current users to new user
      const dbUsers = await prisma.user.findMany({
        where: {
          lastSeen: {
            gt: new Date(Date.now() - 1000 * 60 * 5) // Last 5 mins
          }
        }
      });
      socket.emit('all-users', dbUsers);
      
      // Send initial todos and messages
      const todos = await prisma.todo.findMany();
      const messages = await prisma.chatMessage.findMany({
          take: 50,
          orderBy: { createdAt: 'asc' },
          include: { user: true }
      });
      socket.emit('initial-data', { todos, messages });
    } catch (error) {
      console.error('Error in join:', error);
    }
  });

  socket.on('update-state', async (data) => {
    const userId = users[socket.id];
    if (!userId) return;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: data.status,
        isActive: data.isActive,
        startTime: data.startTime ? new Date(data.startTime) : null,
        totalSeconds: data.totalSeconds,
        lastSeen: new Date()
      }
    });

    socket.to('study-room').emit('state-changed', updatedUser);
  });

  socket.on('add-todo', async (text) => {
    const userId = users[socket.id];
    if (!userId) return;

    const todo = await prisma.todo.create({
      data: {
        text,
        userId
      }
    });
    io.to('study-room').emit('todo-added', todo);
  });

  socket.on('toggle-todo', async (todoId) => {
    const todo = await prisma.todo.findUnique({ where: { id: todoId } });
    if (!todo) return;

    const updatedTodo = await prisma.todo.update({
      where: { id: todoId },
      data: { completed: !todo.completed }
    });
    io.to('study-room').emit('todo-toggled', updatedTodo);
  });

  socket.on('send-message', async (text) => {
    const userId = users[socket.id];
    if (!userId) return;

    const message = await prisma.chatMessage.create({
      data: {
        text,
        userId
      },
      include: { user: true }
    });
    io.to('study-room').emit('message-received', message);
  });

  socket.on('disconnect', async () => {
    const userId = users[socket.id];
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false, lastSeen: new Date() }
      });
      socket.to('study-room').emit('user-left', userId);
      delete users[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

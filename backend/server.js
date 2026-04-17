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
    const { id, name, avatarSeed, roomId } = userData;
    const room = roomId || "0000";
    console.log(`[JOIN] User:${name} ID:${id} Room:${room} Socket:${socket.id}`);

    try {
      const user = await prisma.user.upsert({
        where: { id: id },
        update: { 
            name: name,
            avatarSeed: avatarSeed,
            roomId: room,
            lastSeen: new Date() 
        },
        create: {
          id: id,
          name: name,
          avatarSeed: avatarSeed,
          roomId: room
        }
      });

      users[socket.id] = { id, roomId: room };
      
      socket.join(room);
      socket.to(room).emit('user-joined', user);
      
      const dbUsers = await prisma.user.findMany({
        where: {
          roomId: room,
          lastSeen: { gt: new Date(Date.now() - 1000 * 60 * 60) }
        }
      });
      console.log(`[ROOM STATE] Room:${room} ActiveUsers:${dbUsers.length}`);
      socket.emit('all-users', dbUsers);
      
      const todos = await prisma.todo.findMany({ where: { roomId: room } });
      const messages = await prisma.chatMessage.findMany({
          where: { roomId: room },
          take: 100,
          orderBy: { createdAt: 'asc' },
          include: { user: true }
      });
      socket.emit('initial-data', { todos, messages });
    } catch (error) {
      console.error('Error in join:', error);
    }
  });

  socket.on('update-state', async (data) => {
    const session = users[socket.id];
    if (!session) return;
    // console.log(`[UPDATE] UserID:${session.id} Status:${data.status}`);

    try {
        const updatedUser = await prisma.user.update({
          where: { id: session.id },
          data: {
            status: data.status,
            isActive: data.isActive,
            startTime: data.startTime ? new Date(data.startTime) : null,
            totalSeconds: data.totalSeconds,
            lastSeen: new Date()
          }
        });
        socket.to(session.roomId).emit('state-changed', updatedUser);
    } catch(e) {}
  });

  socket.on('add-todo', async (text) => {
    const session = users[socket.id];
    if (!session) return;
    console.log(`[TODO] Room:${session.roomId} Text:${text}`);

    const todo = await prisma.todo.create({
      data: {
        text,
        userId: session.id,
        roomId: session.roomId
      }
    });
    io.to(session.roomId).emit('todo-added', todo);
  });

  socket.on('toggle-todo', async (todoId) => {
    const session = users[socket.id];
    if (!session) return;

    const todo = await prisma.todo.findUnique({ where: { id: todoId } });
    if (!todo) return;

    const updatedTodo = await prisma.todo.update({
      where: { id: todoId },
      data: { completed: !todo.completed }
    });
    io.to(session.roomId).emit('todo-toggled', updatedTodo);
  });

  socket.on('send-message', async (text) => {
    const session = users[socket.id];
    if (!session) return;
    console.log(`[CHAT] Room:${session.roomId} Text:${text}`);

    const message = await prisma.chatMessage.create({
      data: {
        text,
        userId: session.id,
        roomId: session.roomId
      },
      include: { user: true }
    });
    io.to(session.roomId).emit('message-received', message);
  });

  socket.on('disconnect', async () => {
    const session = users[socket.id];
    if (session) {
      await prisma.user.update({
        where: { id: session.id },
        data: { isActive: false, lastSeen: new Date() }
      });
      socket.to(session.roomId).emit('user-left', session.id);
      delete users[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const DATA_FILE = path.join(__dirname, 'data.json');

// Veriyi yükle veya boş başlat
let userData = {};
if (fs.existsSync(DATA_FILE)) {
    try {
        userData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        console.error("Veri okuma hatası:", e);
        userData = {};
    }
}

// Veriyi kaydetme fonksiyonu
const saveData = () => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
};

// Soket ID'lerini kullanıcı ID'leri ile eşleştir (Ayrılma takibi için)
const socketToUser = {};

io.on('connection', (socket) => {
    console.log('Yeni kullanıcı bağlandı:', socket.id);

    // Kullanıcı odaya katıldığında
    socket.on('join', (userDataFromClient) => {
        const { id, name, avatarSeed } = userDataFromClient;
        socketToUser[socket.id] = id;

        // Her girişte süreleri ve durumu sıfırla (Kullanıcının isteği üzerine)
        userData[id] = { 
            ...userDataFromClient, 
            totalSeconds: 0, 
            isActive: false, 
            status: 'working', 
            startTime: null 
        };
        
        saveData();
        
        // Kullanıcıya sıfırlanmış durumunu bildir
        socket.emit('init-state', userData[id]);
        
        // Yeni kullanıcıyı herkese duyur
        socket.broadcast.emit('user-joined', userData[id]);
        
        // Mevcut diğer kullanıcıları yeni gelene gönder
        socket.emit('all-users', Object.values(userData).filter(u => u.id !== id));
    });

    // Durum güncellemesi
    socket.on('update-state', (data) => {
        if (userData[data.id]) {
            userData[data.id] = { ...userData[data.id], ...data };
            saveData();
            socket.broadcast.emit('state-changed', userData[data.id]);
        }
    });

    socket.on('disconnect', () => {
        const userId = socketToUser[socket.id];
        if (userId) {
            console.log(`Kullanıcı ayrıldı: ${userId}`);
            socket.broadcast.emit('user-left', userId);
            delete socketToUser[socket.id];
            // Not: userData'dan silmiyoruz ki süresi kalsın
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// --- STABİL STATİK DOSYA SUNUMU ---
// Dosyaların MIME tiplerini ve yollarını garanti altına alalım
app.use(express.static(path.resolve(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- STATE (BELLEKTE TUTULUR, HIZLI VE STABİL) ---
let userData = {};
const socketToUser = {};

io.on('connection', (socket) => {
    console.log('Bağlantı sağlandı:', socket.id);

    socket.on('join', (data) => {
        if (!data || !data.id) return;

        const { id, name, avatarSeed } = data;
        socketToUser[socket.id] = id;

        // Kullanıcıyı odaya kaydet (veya güncelle)
        userData[id] = {
            ...data,
            totalSeconds: 0, // Her girişte sıfırla isteği üzerine
            isActive: false,
            status: 'working',
            startTime: null
        };

        console.log(`${name} odaya katıldı.`);

        // Yeni kullanıcıyı duyur
        socket.broadcast.emit('user-joined', userData[id]);
        
        // Mevcut kullanıcıları yeni gelene gönder
        socket.emit('all-users', Object.values(userData).filter(u => u.id !== id));
    });

    socket.on('update-state', (data) => {
        if (data && data.id && userData[data.id]) {
            userData[data.id] = { ...userData[data.id], ...data };
            socket.broadcast.emit('state-changed', userData[data.id]);
        }
    });

    socket.on('disconnect', () => {
        const userId = socketToUser[socket.id];
        if (userId) {
            console.log(`Kullanıcı ayrıldı: ${userId}`);
            socket.broadcast.emit('user-left', userId);
            delete socketToUser[socket.id];
            
            // Eğer kimse kalmadıysa odayı tamamen sıfırla (Temizlik)
            if (Object.keys(socketToUser).length === 0) {
                console.log("Oda boşaldı, veriler temizleniyor...");
                userData = {};
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`StudyBuddies Pro Sunucusu ${PORT} portunda hazır!`);
});

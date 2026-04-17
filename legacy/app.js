// --- KONFİGÜRASYON ---
const SERVER_URL = window.location.origin;
const socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// --- STATE ---
let currentUser = {
    id: localStorage.getItem('study_user_id') || Math.random().toString(36).substr(2, 9),
    name: localStorage.getItem('study_user_name') || "",
    avatarSeed: localStorage.getItem('study_user_avatar') || "Mimi",
    status: "working",
    isActive: false,
    startTime: null,
    totalSeconds: 0
};
localStorage.setItem('study_user_id', currentUser.id);

let remoteUser = null;
let timerInterval = null;

// --- DOM ELEMENTS ---
const screens = {
    login: document.getElementById('login-screen'),
    study: document.getElementById('study-screen')
};

const displays = {
    localName: document.getElementById('local-name'),
    localTimer: document.getElementById('local-timer'),
    localAvatar: document.getElementById('local-avatar').querySelector('img'),
    remoteName: document.getElementById('remote-name'),
    remoteTimer: document.getElementById('remote-timer'),
    remoteCard: document.getElementById('remote-user'),
    remoteAvatar: document.getElementById('remote-avatar').querySelector('img')
};

const buttons = {
    join: document.getElementById('join-btn'),
    timerToggle: document.getElementById('timer-toggle'),
    breakToggle: document.getElementById('break-toggle'),
    leave: document.getElementById('leave-btn')
};

// --- INITIALIZATION ---
function init() {
    setupAvatarGrid();

    buttons.join.addEventListener('click', joinApp);
    buttons.timerToggle.addEventListener('click', toggleTimer);
    buttons.breakToggle.addEventListener('click', toggleBreak);
    buttons.leave.addEventListener('click', () => {
        localStorage.removeItem('study_user_name');
        location.reload();
    });

    document.getElementById('username-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinApp();
    });

    // Otomatik giriş
    if (currentUser.name) {
        document.getElementById('username-input').value = currentUser.name;
        // Opsiyonel: Direkt giriş yapılabilir veya kullanıcı tıklar.
    }

    setupSocket();
    startTimerLoop();
    
    // Lucide ikonlarını ilk başta ve her güncellemede bas
    if (window.lucide) lucide.createIcons();
}

function setupAvatarGrid() {
    const seeds = [
        "Mimi", "Jasper", "Sheba", "Coco", "Luna", "Leo", "Buster", "Cleo",
        "Felix", "Willow", "Oliver", "Pepper", "Ziggy", "Sasha", "Toby", "Bella",
        "Cookie", "Nala", "Milo", "Daisy", "Rocky", "Ruby", "Shadow", "Sophie"
    ];
    const grid = document.getElementById('avatar-grid');
    if (!grid) return;

    grid.innerHTML = ""; // Temizle
    seeds.forEach(seed => {
        const item = document.createElement('div');
        item.className = `avatar-item ${currentUser.avatarSeed === seed ? 'selected' : ''}`;
        item.innerHTML = `<img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}" alt="${seed}">`;
        item.onclick = () => {
            document.querySelectorAll('.avatar-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            currentUser.avatarSeed = seed;
            localStorage.setItem('study_user_avatar', seed);
        };
        grid.appendChild(item);
    });
}

// --- CORE FUNCTIONS ---

function joinApp() {
    const nameInput = document.getElementById('username-input');
    const name = nameInput.value.trim();
    if (!name) {
        alert("Lütfen bir isim gir!");
        return;
    }

    currentUser.name = name;
    localStorage.setItem('study_user_name', name);
    
    displays.localName.innerText = name;
    displays.localAvatar.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.avatarSeed}`;
    
    switchScreen('study');
    socket.emit('join', currentUser);
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => {
        if (s) s.classList.remove('active');
    });
    if (screens[screenName]) screens[screenName].classList.add('active');
}

function toggleTimer() {
    if (currentUser.status === 'break') toggleBreak();

    currentUser.isActive = !currentUser.isActive;
    
    if (currentUser.isActive) {
        currentUser.startTime = Date.now();
        buttons.timerToggle.innerHTML = '<i data-lucide="pause"></i> Duraklat';
        buttons.timerToggle.classList.replace('play', 'pause');
        document.getElementById('local-user').classList.add('working-pulsate');
    } else {
        if (currentUser.startTime) {
            const elapsed = Math.floor((Date.now() - currentUser.startTime) / 1000);
            currentUser.totalSeconds += elapsed;
        }
        currentUser.startTime = null;
        buttons.timerToggle.innerHTML = '<i data-lucide="play"></i> Başla';
        buttons.timerToggle.classList.replace('pause', 'play');
        document.getElementById('local-user').classList.remove('working-pulsate');
    }
    
    if (window.lucide) lucide.createIcons();
    syncWithServer();
}

function toggleBreak() {
    if (currentUser.status === 'working') {
        if (currentUser.isActive) {
            const elapsed = Math.floor((Date.now() - currentUser.startTime) / 1000);
            currentUser.totalSeconds += elapsed;
            currentUser.isActive = false;
            currentUser.startTime = null;
            
            buttons.timerToggle.innerHTML = '<i data-lucide="play"></i> Başla';
            buttons.timerToggle.classList.replace('pause', 'play');
            document.getElementById('local-user').classList.remove('working-pulsate');
        }
        currentUser.status = 'break';
        buttons.breakToggle.innerHTML = '<i data-lucide="book-open"></i> Çalışmaya Dön';
        buttons.timerToggle.disabled = true;
    } else {
        currentUser.status = 'working';
        buttons.breakToggle.innerHTML = '<i data-lucide="coffee"></i> Mola Al';
        buttons.timerToggle.disabled = false;
    }
    
    updateStatusUI('local', currentUser.status);
    if (window.lucide) lucide.createIcons();
    syncWithServer();
}

function updateStatusUI(type, status) {
    const card = type === 'local' ? document.getElementById('local-user') : document.getElementById('remote-user');
    if (!card) return;
    const tag = card.querySelector('.status-tag');
    
    if (status === 'working') {
        tag.innerText = "Çalışıyor";
        tag.className = "status-tag working";
        card.classList.remove('on-break');
    } else {
        tag.innerText = "Molada";
        tag.className = "status-tag break";
        card.classList.remove('working-pulsate');
        card.classList.add('on-break');
    }
}

function startTimerLoop() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        // Local
        let localSec = currentUser.totalSeconds;
        if (currentUser.isActive && currentUser.startTime) {
            localSec += Math.floor((Date.now() - currentUser.startTime) / 1000);
        }
        displays.localTimer.innerText = formatTime(localSec);

        // Remote
        if (remoteUser) {
            let remoteSec = remoteUser.totalSeconds;
            if (remoteUser.isActive && remoteUser.startTime) {
                remoteSec += Math.floor((Date.now() - remoteUser.startTime) / 1000);
            }
            displays.remoteTimer.innerText = formatTime(remoteSec);
        }
    }, 1000);
}

function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
}

// --- SOCKET LOGIC ---
function setupSocket() {
    socket.on('connect', () => console.log("Sunucuya bağlandık!"));

    socket.on('user-joined', (user) => {
        if (!remoteUser || remoteUser.id === user.id) showRemoteUser(user);
    });

    socket.on('all-users', (users) => {
        if (users.length > 0) showRemoteUser(users[0]);
    });

    socket.on('state-changed', (user) => {
        if (remoteUser && remoteUser.id === user.id) {
            remoteUser = user;
            updateStatusUI('remote', user.status);
            displays.remoteName.innerText = user.name;
            displays.remoteAvatar.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.avatarSeed}`;
        }
    });

    socket.on('user-left', (id) => {
        if (remoteUser && remoteUser.id === id) hideRemoteUser();
    });
}

function syncWithServer() {
    socket.emit('update-state', currentUser);
}

function showRemoteUser(data) {
    remoteUser = data;
    displays.remoteCard.classList.remove('empty');
    displays.remoteCard.querySelector('.waiting-state').classList.add('hidden');
    displays.remoteCard.querySelector('.user-content').classList.remove('hidden');
    
    displays.remoteName.innerText = data.name;
    displays.remoteAvatar.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.avatarSeed}`;
    updateStatusUI('remote', data.status);
}

function hideRemoteUser() {
    remoteUser = null;
    displays.remoteCard.classList.add('empty');
    displays.remoteCard.querySelector('.waiting-state').classList.remove('hidden');
    displays.remoteCard.querySelector('.user-content').classList.add('hidden');
}

init();

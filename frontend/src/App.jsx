import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Play, Pause, Coffee, BookOpen, Send, Plus, 
  CheckCircle2, Circle, Users, MessageSquare, 
  LogOut, Timer, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('study_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [todos, setTodos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [todoInput, setTodoInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("Mimi");

  const chatEndRef = useRef(null);

  const avatars = ["Mimi", "Jasper", "Sheba", "Coco", "Luna", "Leo", "Buster", "Cleo", "Felix", "Willow"];

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('user-joined', (newUser) => {
      setRemoteUsers(prev => [...prev.filter(u => u.id !== newUser.id), newUser]);
    });

    socket.on('all-users', (users) => {
      if (user) {
        setRemoteUsers(users.filter(u => u.id !== user.id));
      } else {
        setRemoteUsers(users);
      }
    });

    socket.on('initial-data', ({ todos, messages }) => {
      setTodos(todos);
      setMessages(messages);
    });

    socket.on('state-changed', (updatedUser) => {
      setRemoteUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    });

    socket.on('user-left', (userId) => {
      setRemoteUsers(prev => prev.filter(u => u.id !== userId));
    });

    socket.on('todo-added', (todo) => setTodos(prev => [...prev, todo]));
    socket.on('todo-toggled', (updatedTodo) => {
      setTodos(prev => prev.map(t => t.id === updatedTodo.id ? updatedTodo : t));
    });
    socket.on('message-received', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 100);
    });

  }, [socket, user]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const joinSession = () => {
    if (!inputValue.trim()) return;
    const userData = {
      id: user?.id || Math.random().toString(36).substr(2, 9),
      name: inputValue,
      avatarSeed: avatarSeed,
      status: 'working',
      isActive: false,
      totalSeconds: 0
    };
    setUser(userData);
    localStorage.setItem('study_user', JSON.stringify(userData));
    socket.emit('join', userData);
    setIsJoined(true);
  };

  const toggleTimer = () => {
    const updatedUser = { ...user, isActive: !user.isActive };
    if (updatedUser.isActive) {
      updatedUser.startTime = Date.now();
    } else {
      if (user.startTime) {
        const elapsed = Math.floor((Date.now() - user.startTime) / 1000);
        updatedUser.totalSeconds += elapsed;
      }
      updatedUser.startTime = null;
    }
    setUser(updatedUser);
    socket.emit('update-state', updatedUser);
  };

  const toggleBreak = () => {
    const isWorking = user.status === 'working';
    const updatedUser = { ...user };
    
    if (isWorking) {
        if (user.isActive) {
            const elapsed = Math.floor((Date.now() - user.startTime) / 1000);
            updatedUser.totalSeconds += elapsed;
            updatedUser.isActive = false;
            updatedUser.startTime = null;
        }
        updatedUser.status = 'break';
    } else {
        updatedUser.status = 'working';
    }
    
    setUser(updatedUser);
    socket.emit('update-state', updatedUser);
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!todoInput.trim()) return;
    socket.emit('add-todo', todoInput);
    setTodoInput("");
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    socket.emit('send-message', messageInput);
    setMessageInput("");
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
  };

  // Timer Tick Hook
  useEffect(() => {
    const interval = setInterval(() => {
        if (user?.isActive) {
            // No need to update state every second to server, just local UI
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  if (!isJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">StudyBuddies Pro</h1>
            <p className="text-text/70">Birlikte çalışmak daha eğlenceli!</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">İsminiz</label>
              <input 
                type="text" 
                className="input-field w-full"
                placeholder="Örn: Muhammed"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && joinSession()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Avatar Seçin</label>
              <div className="grid grid-cols-5 gap-3">
                {avatars.map(seed => (
                  <button 
                    key={seed}
                    onClick={() => setAvatarSeed(seed)}
                    className={`rounded-xl p-1 transition-all ${avatarSeed === seed ? 'bg-primary ring-2 ring-primary ring-offset-2' : 'bg-white hover:bg-accent'}`}
                  >
                    <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`} alt={seed} />
                  </button>
                ) )}
              </div>
            </div>

            <button onClick={joinSession} className="btn-primary w-full mt-4">
              Hadi Başlayalım!
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-white">
                <BookOpen size={24} />
            </div>
            <h1 className="text-2xl font-bold text-primary">StudyBuddies</h1>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('study_user'); window.location.reload(); }}
          className="flex items-center gap-2 text-text/60 hover:text-primary transition-colors"
        >
          <LogOut size={20} /> <span className="hidden sm:inline">Ayrıl</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Users Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Local User Card */}
            <UserCard 
                user={user} 
                isLocal={true} 
                toggleTimer={toggleTimer} 
                toggleBreak={toggleBreak}
            />

            {/* Remote User Card */}
            {remoteUsers.length > 0 ? (
                <UserCard user={remoteUsers[0]} isLocal={false} />
            ) : (
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center opacity-60 dashed-border">
                    <Users size={48} className="text-primary mb-4" />
                    <h3 className="font-semibold">Arkadaş Bekleniyor...</h3>
                    <p className="text-sm">Oda linkini paylaşarak bir arkadaşını davet et.</p>
                </div>
            )}
          </div>

          {/* Todo List */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 size={24} className="text-primary" /> Paylaşımlı Görevler
              </h2>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                {todos.filter(t => t.completed).length}/{todos.length}
              </span>
            </div>

            <form onSubmit={addTodo} className="flex gap-2 mb-4">
              <input 
                type="text" 
                className="input-field flex-1"
                placeholder="Yeni bir görev ekle..."
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
              />
              <button type="submit" className="btn-primary p-3">
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto sweet-scrollbar pr-2">
              <AnimatePresence>
                {todos.map(todo => (
                  <motion.div 
                    key={todo.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer ${todo.completed ? 'bg-secondary/20 opacity-60' : 'bg-white'}`}
                    onClick={() => socket.emit('toggle-todo', todo.id)}
                  >
                    {todo.completed ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-primary/40" />}
                    <span className={todo.completed ? 'line-through' : ''}>{todo.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {todos.length === 0 && (
                <div className="text-center py-8 text-text/40 italic">Henüz hiç görev eklenmemiş.</div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="lg:col-span-4 glass-card flex flex-col h-[600px] lg:h-auto overflow-hidden">
          <div className="p-4 border-b border-primary/10 flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            <h2 className="font-bold">Sohbet</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 sweet-scrollbar">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.userId === user.id ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-text rounded-tl-none'}`}>
                  {msg.userId !== user.id && <div className="font-bold text-[10px] mb-1 opacity-70">{(msg.user || remoteUsers.find(u => u.id === msg.userId))?.name || 'Anonim'}</div>}
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-white/50 flex gap-2">
            <input 
              type="text" 
              className="input-field flex-1"
              placeholder="Mesaj yaz..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <button type="submit" className="btn-primary p-3">
              <Send size={20} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

function UserCard({ user, isLocal, toggleTimer, toggleBreak }) {
    const [currentTime, setCurrentTime] = useState(user.totalSeconds);

    useEffect(() => {
        let interval;
        if (user.isActive) {
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - new Date(user.startTime).getTime()) / 1000);
                setCurrentTime(user.totalSeconds + elapsed);
            }, 1000);
        } else {
            setCurrentTime(user.totalSeconds);
        }
        return () => clearInterval(interval);
    }, [user.isActive, user.totalSeconds, user.startTime]);

    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
    };

    return (
        <div className={`glass-card p-6 flex flex-col items-center relative overflow-hidden transition-all ${user.isActive ? 'ring-2 ring-primary ring-offset-4 working-pulsate' : ''}`}>
            {user.status === 'break' && (
                <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-secondary text-text font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <Coffee size={18} /> Molada
                    </div>
                </div>
            )}
            
            <div className={`w-24 h-24 rounded-full bg-white p-2 mb-4 shadow-inner ${user.isActive ? 'animate-bounce' : ''}`}>
                <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.avatarSeed}`} alt={user.name} />
            </div>

            <h3 className="text-xl font-bold mb-1">{user.name} {isLocal && "(Sen)"}</h3>
            
            <div className="flex items-center gap-2 text-3xl font-mono font-bold text-primary mb-6">
                <Timer size={24} /> {formatTime(currentTime)}
            </div>

            {isLocal && (
                <div className="flex gap-3 w-full">
                    <button 
                        onClick={toggleTimer}
                        disabled={user.status === 'break'}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                            user.isActive 
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                            : 'bg-primary text-white hover:opacity-90'
                        } disabled:opacity-50`}
                    >
                        {user.isActive ? <Pause size={20} /> : <Play size={20} />}
                        {user.isActive ? 'Duraklat' : 'Başlat'}
                    </button>
                    <button 
                        onClick={toggleBreak}
                        className={`p-3 rounded-xl transition-all ${
                            user.status === 'break' 
                            ? 'bg-primary text-white' 
                            : 'bg-secondary text-text hover:opacity-90'
                        }`}
                    >
                        {user.status === 'break' ? <BookOpen size={20} /> : <Coffee size={20} />}
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Terminal, Globe, FileText, Calculator, Settings, X, Minus, Maximize2, 
  Wifi, Search, Command, Folder, Image as ImageIcon, 
  LayoutGrid, ChevronLeft, ChevronRight, RotateCw, Edit3, ArrowLeft,
  LogOut, Power, RefreshCw, Moon, File, List, Bold, Italic, 
  ListOrdered, Link, Trash, Type, Eye, EyeOff, Heading1, Plus,
  FileSpreadsheet, Box, FileCode, Film, Video, Music, User, ArrowRight, Lock,
  Snowflake, Gift, Mail, Quote
} from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc, writeBatch, deleteDoc, collection, getDocs } from "firebase/firestore";

/**
 * --- ASSETS & THEME ---
 */
const WALLPAPERS = {
  'Cozy Fireplace': `${import.meta.env.BASE_URL}images/wallpaper_illustration_1.png`,
  'Snowy Village': `${import.meta.env.BASE_URL}images/wallpaper_illustration_2.png`,
  'Santa Workshop': `${import.meta.env.BASE_URL}images/wallpaper_illustration_4.png`,
};

const THEME_COLOR = "red"; // Changing global accent to Red for Christmas

const AppleLogo = ({ size = 20, className = "", fill = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 384 512" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
  </svg>
);

const ICONS = {
  finder: { icon: <Folder className="text-white" fill="white" />, bg: "bg-gradient-to-b from-red-500 to-red-700" },
  safari: { icon: <Globe className="text-blue-500" />, bg: "bg-white" }, 
  terminal: { icon: <Terminal className="text-white" />, bg: "bg-gray-900" },
  textedit: { icon: <Edit3 className="text-white" />, bg: "bg-green-600" },
  notes: { icon: <FileText className="text-white" fill="white" />, bg: "bg-gradient-to-b from-yellow-400 to-orange-400" },
  calculator: { icon: <Calculator className="text-white" />, bg: "bg-gray-700" },
  settings: { icon: <Settings className="text-white" />, bg: "bg-gray-500" },
  preview: { icon: <ImageIcon className="text-white" />, bg: "bg-blue-400" },
  quicktime: { icon: <Film className="text-white" />, bg: "bg-gradient-to-br from-gray-600 to-gray-800", hiddenFromDock: true },
};

const INITIAL_FILE_SYSTEM = {
  '/Desktop': [
    { id: 'f1', name: 'My Christmas List.txt', type: 'txt', x: 20, y: 20, size: '4 KB', date: 'Today, 9:41 AM', content: '# 🎄 My Christmas List 2024\n\n### Big Wishes\n- [ ] New MacBook Pro M4\n- [ ] Noise Cancelling Headphones\n- [ ] Espresso Machine\n\n### Stocking Stuffers\n- [ ] Fuzzy Socks\n- [ ] Dark Chocolate\n- [ ] Gift Cards' },
    { id: 'f2', name: 'Decorations.jpg', type: 'img', x: 20, y: 140, size: '2.4 MB', date: 'Yesterday, 4:20 PM', src: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&q=80' },
  ],
  '/Documents': [
    { id: 'f3', name: 'Holiday Recipes.pdf', type: 'pdf', size: '450 KB', date: 'Dec 12, 2024', src: 'https://pdfobject.com/pdf/sample.pdf' },
    { id: 'f4', name: 'Naughty or Nice.xls', type: 'xls', size: '1.2 MB', date: 'Dec 01, 2024' },
  ],
  '/Downloads': [
    { id: 'f5', name: 'Elf_Installer.dmg', type: 'dmg', size: '145 MB', date: 'Just now' },
    { id: 'f8', name: 'Jingle Bells.mp3', type: 'mp3', size: '4.2 MB', date: 'Today, 10:00 AM' },
  ],
  '/Movies': [
    { id: 'f7', name: 'Fireplace 4K.mp4', type: 'mp4', size: '1.2 GB', date: 'Dec 20, 2024', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
  ],
  '/Pictures': [
    { id: 'f6', name: 'Family_Xmas.jpg', type: 'img', size: '3.1 MB', date: 'Dec 25, 2023', src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80' },
  ]
};

/**
 * --- UTILITIES ---
 */
const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

// Snow Component
const Snowfall = () => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: Math.random() * 3 + 5 + 's', // 5-8 seconds
      animationDelay: Math.random() * 5 + 's',
      opacity: Math.random() * 0.5 + 0.3,
      size: Math.random() * 10 + 5 + 'px',
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9000] overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute bg-white rounded-full animate-fall"
          style={{
            left: flake.left,
            top: '-10px',
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animation: `fall ${flake.animationDuration} linear infinite`,
            animationDelay: flake.animationDelay,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) translateX(0px); }
          100% { transform: translateY(110vh) translateX(20px); }
        }
      `}</style>
      </div>
  );
};

// Helper to render file icons consistently
const FileIconAsset = ({ type, src, className = "" }) => {
    switch (type) {
        case 'img': return <img src={src} className={`w-full h-full object-cover rounded shadow-sm border-2 border-white pointer-events-none ${className}`} alt="" />;
        case 'folder': return <Folder size={56} className={`text-red-600 drop-shadow-md ${className}`} fill="#dc2626" />;
        case 'pdf': return (
            <div className={`relative flex items-center justify-center ${className}`}>
                <FileText size={56} className="text-red-500 drop-shadow-md" strokeWidth={0.8} fill="white" />
                <span className="absolute bottom-2 right-0 text-[8px] font-bold text-red-600 bg-white px-0.5 rounded border border-gray-200 shadow-sm">PDF</span>
            </div>
        );
        case 'txt': return (
            <div className={`relative flex items-center justify-center ${className}`}>
                <FileText size={56} className="text-gray-500 drop-shadow-md" strokeWidth={0.8} fill="white" />
                <span className="absolute bottom-2 right-0 text-[8px] font-bold text-gray-600 bg-white px-0.5 rounded border border-gray-200 shadow-sm">TXT</span>
            </div>
        );
        case 'mp4':
        case 'mov': return (
            <div className={`relative flex items-center justify-center ${className}`}>
                <Film size={56} className="text-blue-400 drop-shadow-md" strokeWidth={0.8} fill="#1e3a8a" />
                <span className="absolute bottom-2 right-0 text-[8px] font-bold text-blue-600 bg-white px-0.5 rounded border border-gray-200 shadow-sm">{type.toUpperCase()}</span>
            </div>
        );
        case 'mp3':
        case 'wav': return (
            <div className={`relative flex items-center justify-center ${className}`}>
                <Music size={56} className="text-green-600 drop-shadow-md" strokeWidth={0.8} fill="#15803d" />
                <span className="absolute bottom-2 right-0 text-[8px] font-bold text-green-700 bg-white px-0.5 rounded border border-gray-200 shadow-sm">{type.toUpperCase()}</span>
            </div>
        );
        case 'xls': return (
            <div className={`relative flex items-center justify-center ${className}`}>
                <FileSpreadsheet size={56} className="text-green-600 drop-shadow-md" strokeWidth={0.8} fill="white" />
            </div>
        );
        case 'dmg': return (
            <div className={`relative flex items-center justify-center ${className}`}>
                <Gift size={56} className="text-red-500 drop-shadow-md" strokeWidth={0.8} fill="#fee2e2" />
                <span className="absolute bottom-2 text-[8px] font-bold text-red-600 bg-white/80 px-1 rounded">GIFT</span>
            </div>
        );
        default: return <FileText size={56} className={`text-white drop-shadow-md ${className}`} strokeWidth={0.8} fill="white" />;
    }
};

/**
 * --- APP COMPONENTS ---
 */

const BootScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const finishRef = useRef(onFinish);
  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);
  useEffect(() => {
    const timer = setTimeout(() => { setProgress(100); setTimeout(() => { if (finishRef.current) finishRef.current(); }, 500); }, 1500);
    const barTimer = setInterval(() => { setProgress(p => (p >= 100 ? 100 : p + 5)); }, 50);
    return () => { clearTimeout(timer); clearInterval(barTimer); };
  }, []);
  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
      <AppleLogo size={80} className="text-white mb-8" fill="white" />
      <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} /></div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        // 1. Validate Username
        if (!username || username.length < 3) throw new Error('Username must be at least 3 chars');
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) throw new Error('Username can only contain letters, numbers, and underscores');
        
        // 2. Check Availability
        const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
        if (usernameDoc.exists()) throw new Error('Username is already taken');

        // 3. Create Auth User
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        // 4. Create Firestore Data
        const batch = writeBatch(db);
        // Reserve username
        batch.set(doc(db, 'usernames', username.toLowerCase()), {
            email: email,
            uid: user.uid
        });
        // Create user profile
        batch.set(doc(db, 'users', user.uid), {
            fileSystem: INITIAL_FILE_SYSTEM,
            settings: { wallpaper: WALLPAPERS['Cozy Fireplace'], darkMode: true, snowEffect: true },
            username: username,
            family: 'Unknown' // Default family
        });
        await batch.commit();

      } else {
        // Login Logic
        let loginEmail = email;
        if (!email.includes('@')) {
            // Treat as username
            const usernameDoc = await getDoc(doc(db, 'usernames', email.toLowerCase()));
            if (usernameDoc.exists()) {
                loginEmail = usernameDoc.data().email;
            } else {
                throw new Error('Username not found');
            }
        }
        await signInWithEmailAndPassword(auth, loginEmail, password);
      }
      // Auth state listener in App will handle transition
    } catch (err) {
      console.error(err);
      let msg = 'Authentication failed';
      if (err.message) msg = err.message;
      if (err.code === 'auth/invalid-email') msg = 'Invalid email address';
      if (err.code === 'auth/user-disabled') msg = 'User disabled';
      if (err.code === 'auth/user-not-found') msg = 'User not found';
      if (err.code === 'auth/wrong-password') msg = 'Wrong password';
      if (err.code === 'auth/email-already-in-use') msg = 'Email already in use';
      if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters';
      if (err.code === 'auth/invalid-credential') msg = 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${WALLPAPERS['Cozy Fireplace']})` }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
      <div className="z-10 flex flex-col items-center w-full max-w-xs animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md shadow-2xl mb-6 flex items-center justify-center border border-white/20">
          <Snowflake size={48} className="text-white" />
        </div>
        <h2 className="text-white text-xl font-medium mb-6 drop-shadow-md">David's List 2025</h2>

        <form onSubmit={handleAuth} className="w-full space-y-4">
          {isRegistering && (
            <div className="relative group">
                <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-gray-900/60 text-white placeholder-gray-300 px-4 py-2 rounded-full border border-transparent focus:border-red-500/50 outline-none transition-all text-center backdrop-blur-md"
                required
                disabled={loading}
                />
            </div>
          )}
          <div className="relative group">
             <input 
               type="text"
               name="email"
               autoComplete="username"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder={isRegistering ? "Email Address" : "Email or Username"}
               className="w-full bg-gray-900/60 text-white placeholder-gray-300 px-4 py-2 rounded-full border border-transparent focus:border-red-500/50 outline-none transition-all text-center backdrop-blur-md"
               autoFocus={!isRegistering}
               required
               disabled={loading}
             />
          </div>
          <div className="relative group">
             <input 
               type="password"
               name="password"
               autoComplete={isRegistering ? "new-password" : "current-password"}
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="Password"
               className="w-full bg-gray-900/60 text-white placeholder-gray-300 px-4 py-2 rounded-full border border-transparent focus:border-red-500/50 outline-none transition-all text-center backdrop-blur-md"
               required
               disabled={loading}
             />
             <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={16} />
        </button>
      </div>
          
          {error && <div className="mt-3 text-red-300 text-xs text-center shadow-black drop-shadow-md bg-black/40 rounded px-2 py-1">{error}</div>}
          
          <div className="text-center mt-4">
            <button 
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-xs text-gray-300 hover:text-white underline bg-black/20 px-3 py-1.5 rounded-full transition-colors"
            >
              {isRegistering ? 'Have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
          
          <div className="text-center">
             <span className="text-xs text-white/50 uppercase tracking-widest font-bold">
                {isRegistering ? 'Registering' : 'Logging In'}
             </span>
          </div>
        </form>

        <div className="mt-8 flex flex-col items-center text-white/60 text-xs">
           <div className="flex items-center space-x-2 mb-2">
             <Lock size={12} />
             <span>North Pole Secure Login</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const ShutdownScreen = ({ onPowerOn }) => (
  <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-1000">
    <button onClick={onPowerOn} className="group flex flex-col items-center justify-center text-gray-600 hover:text-white transition-colors duration-500">
      <Power size={64} strokeWidth={1} className="mb-4" />
      <span className="text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500">Click to Start</span>
    </button>
  </div>
);

// Desktop File Icon
const FileIcon = ({ file, onDragStart, onClick, onDoubleClick, onContextMenu, isDesktop, isRenaming, onRename, isDragging }) => {
  const [tempName, setTempName] = useState(file.name);
  const inputRef = useRef(null);

  const handleMouseDown = (e) => { 
    if (onDragStart && !isRenaming) { 
      e.stopPropagation(); 
      onDragStart(e, file.id); 
    } 
    if (onClick) onClick(); 
  };

  const handleContextMenu = (e) => {
    if (onContextMenu) {
      e.stopPropagation();
      e.preventDefault();
      onContextMenu(e, file);
    }
  };

  const handleRenameSubmit = () => {
    if (tempName.trim()) {
      onRename(file.id, tempName);
    } else {
      setTempName(file.name); 
      onRename(file.id, file.name);
    }
  };

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const folderPath = isDesktop && file.type === 'folder' ? `/Desktop/${file.name}` : undefined;

  return (
    <div 
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); if (!isRenaming) onDoubleClick(file); }}
      onContextMenu={handleContextMenu}
      data-folder-path={folderPath} 
      className={`flex flex-col items-center w-24 group absolute select-none ${isDragging ? 'z-[10000] cursor-grabbing scale-105 opacity-80 pointer-events-none' : 'cursor-pointer z-0'}`}
      style={isDesktop ? { left: file.x, top: file.y } : { position: 'relative' }}
    >
      <div className="w-16 h-20 mb-1 relative flex items-center justify-center transition-opacity group-hover:opacity-80">
         <FileIconAsset type={file.type} src={file.src} />
      </div>
      {isRenaming ? (
        <input 
          ref={inputRef}
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          className="text-[11px] text-center w-20 bg-red-600 text-white rounded px-1 outline-none border border-white/50"
          onClick={(e) => e.stopPropagation()} 
        />
      ) : (
        <span className="text-white text-[11px] font-medium px-2 py-0.5 bg-black/20 rounded backdrop-blur-sm shadow-sm text-center leading-tight line-clamp-2 pointer-events-none drop-shadow-md">{file.name}</span>
      )}
    </div>
  );
};

const TextEditApp = ({ file, onSave }) => {
  const [content, setContent] = useState(file ? file.content : '');
  const handleChange = (e) => {
    setContent(e.target.value);
    if (file && onSave) onSave(file.id, e.target.value);
  };
  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
       <div className="flex-1">
          <textarea 
            className="w-full h-full p-4 resize-none border-none outline-none font-mono text-sm leading-relaxed" 
            value={content} 
            onChange={handleChange}
            placeholder="Type here..."
          />
       </div>
    </div>
  );
};

const CalculatorApp = () => {
  const [display, setDisplay] = useState('0'); const [prev, setPrev] = useState(null); const [op, setOp] = useState(null); const [newNumber, setNewNumber] = useState(true);
  const handleNum = (num) => { if (newNumber) { setDisplay(num.toString()); setNewNumber(false); } else { setDisplay(display === '0' ? num.toString() : display + num); } };
  const handleOp = (operator) => { setOp(operator); setPrev(parseFloat(display)); setNewNumber(true); };
  const calculate = () => { if (op && prev !== null) { const current = parseFloat(display); let result = 0; switch(op) { case '+': result = prev + current; break; case '-': result = prev - current; break; case '×': result = prev * current; break; case '÷': result = prev / current; break; } setDisplay(result.toString()); setOp(null); setPrev(null); setNewNumber(true); } };
  const clear = () => { setDisplay('0'); setPrev(null); setOp(null); setNewNumber(true); };
  const btn = "h-10 sm:h-12 rounded-full text-lg font-medium transition active:scale-95 flex items-center justify-center select-none";
  const gray = `${btn} bg-gray-300 dark:bg-gray-600 text-black dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500`;
  const orange = `${btn} bg-red-500 text-white hover:bg-red-600`;
  const dark = `${btn} bg-gray-700 dark:bg-gray-800 text-white hover:bg-gray-600 dark:hover:bg-gray-700`;
  return (
    <div className="h-full w-full bg-black p-4 flex flex-col">
      <div className="flex-1 flex items-end justify-end text-white text-4xl font-light px-4 pb-2 mb-2 overflow-hidden tracking-widest leading-tight">{display}</div>
      <div className="grid grid-cols-4 gap-3"><button className={gray} onClick={clear}>AC</button><button className={gray} onClick={() => setDisplay((parseFloat(display)*-1).toString())}>+/-</button><button className={gray} onClick={() => setDisplay((parseFloat(display)/100).toString())}>%</button><button className={orange} onClick={() => handleOp('÷')}>÷</button>{[7,8,9].map(n => <button key={n} className={dark} onClick={() => handleNum(n)}>{n}</button>)}<button className={orange} onClick={() => handleOp('×')}>×</button>{[4,5,6].map(n => <button key={n} className={dark} onClick={() => handleNum(n)}>{n}</button>)}<button className={orange} onClick={() => handleOp('-')}>-</button>{[1,2,3].map(n => <button key={n} className={dark} onClick={() => handleNum(n)}>{n}</button>)}<button className={orange} onClick={() => handleOp('+')}>+</button><button className={`${dark} col-span-2 rounded-full pl-6 justify-start`} onClick={() => handleNum(0)}>0</button><button className={dark} onClick={() => !display.includes('.') && setDisplay(display + '.')}>.</button><button className={orange} onClick={calculate}>=</button></div></div>
  );
};

const QuickTimeApp = ({ file }) => {
    return (
        <div className="flex flex-col h-full bg-black text-white items-center justify-center">
            {file && (file.type === 'mp4' || file.type === 'mov') ? (
                <video src={file.src} controls className="max-h-full max-w-full w-full h-auto outline-none" autoPlay />
            ) : file && (file.type === 'mp3' || file.type === 'wav') ? (
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 bg-green-900 rounded-2xl flex items-center justify-center shadow-2xl border border-green-700">
                        <Music size={64} className="text-green-400" />
                    </div>
                    <h2 className="text-lg font-medium">{file.name}</h2>
                    <audio src={file.src} controls className="w-64 mt-4" autoPlay />
                </div>
            ) : (
                <div className="flex flex-col items-center text-gray-500 space-y-2">
                    <Film size={48} />
                    <p>No media source</p>
                </div>
            )}
        </div>
    );
}

const FinderApp = ({ fileSystem, openFile, initialPath = '/Desktop', onContextMenu, renamingId, onRename, onFinderDragStart }) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [history, setHistory] = useState([initialPath]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = (path) => {
    if (path === currentPath) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
    setSearchQuery('');
  };

  const handleBack = () => { if (historyIndex > 0) { setHistoryIndex(prev => prev - 1); setCurrentPath(history[historyIndex - 1]); } };
  const handleForward = () => { if (historyIndex < history.length - 1) { setHistoryIndex(prev => prev + 1); setCurrentPath(history[historyIndex + 1]); } };
  const filteredFiles = (fileSystem[currentPath] || []).filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDoubleClick = (file) => {
    if (file.type === 'folder') {
        const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        navigate(newPath);
    } else {
        openFile(file);
    }
  };

  const handleRenameSubmit = (id, name) => {
      if (name.trim()) onRename(id, name.trim());
      else onRename(id, fileSystem[currentPath].find(f => f.id === id)?.name);
  };

  return (
    <div className="flex h-full bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-200 font-sans">
      <div className="w-48 bg-gray-100/80 dark:bg-[#282828]/80 backdrop-blur-xl border-r border-gray-200 dark:border-black/50 p-3 flex flex-col space-y-1">
        <div className="px-2 mb-2 mt-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Locations</div>
        {['Desktop', 'Documents', 'Downloads', 'Movies', 'Pictures'].map(item => (<div key={item} onClick={() => navigate(`/${item}`)} className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${currentPath === `/${item}` ? 'bg-gray-300 dark:bg-white/20' : 'hover:bg-gray-300/50 dark:hover:bg-white/10'}`}><Folder size={14} className={`mr-2 ${item === 'Desktop' || item === 'Documents' ? 'text-red-500' : 'text-red-400'}`} fill="currentColor" /> {item}</div>))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-gray-200 dark:border-black/50 flex items-center px-4 space-x-4 bg-gray-50/50 dark:bg-[#2a2a2a]">
          <div className="flex space-x-2">
            <button onClick={handleBack} disabled={historyIndex === 0} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded disabled:opacity-30 transition-colors"><ChevronLeft size={18} /></button>
            <button onClick={handleForward} disabled={historyIndex === history.length - 1} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded disabled:opacity-30 transition-colors"><ChevronRight size={18} /></button>
          </div>
          <span className="font-bold text-sm dark:text-white flex-1 text-center">{currentPath === '/' ? 'Macintosh HD' : currentPath.split('/').pop()}</span>
          <div className="flex items-center space-x-3">
             <div className="flex bg-gray-200 dark:bg-black/30 rounded-md p-0.5"><button onClick={() => setViewMode('grid')} className={`p-1 rounded-sm ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'}`}><LayoutGrid size={14} /></button><button onClick={() => setViewMode('list')} className={`p-1 rounded-sm ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'}`}><List size={14} /></button></div>
             <div className="relative group"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-7 pr-2 py-1 bg-gray-200 dark:bg-black/20 rounded text-xs w-24 focus:w-40 transition-all outline-none border border-transparent focus:border-red-500/50 focus:bg-white dark:focus:bg-black/40" placeholder="Search" /></div>
          </div>
        </div>
        <div 
            className="flex-1 p-4 overflow-auto"
            data-finder-path={currentPath} 
            onContextMenu={(e) => {
                e.preventDefault();
                if (e.target === e.currentTarget) {
                    onContextMenu({ x: e.clientX, y: e.clientY, showFileOps: true });
                }
            }}
        >
          {viewMode === 'grid' ? (
              <div className="grid grid-cols-4 gap-4">
                {filteredFiles.length > 0 ? filteredFiles.map((file) => (
                    <div 
                        key={file.id} 
                        onDoubleClick={() => handleDoubleClick(file)} 
                        onMouseDown={(e) => onFinderDragStart && onFinderDragStart(e, file)}
                        className="flex flex-col items-center group cursor-pointer p-2 rounded-lg hover:bg-red-100 dark:hover:bg-white/10 active:bg-red-200 transition"
                        onContextMenu={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onContextMenu({ x: e.clientX, y: e.clientY, targetId: file.id, showFileOps: true });
                        }}
                    >
                        <div className="w-16 h-16 mb-2 flex items-center justify-center">
                            <FileIconAsset type={file.type} src={file.src} />
                        </div>
                        
                        {renamingId === file.id ? (
                            <input 
                                autoFocus
                                defaultValue={file.name}
                                onBlur={(e) => handleRenameSubmit(file.id, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(file.id, e.currentTarget.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-center w-full bg-white border border-red-500 rounded px-1 outline-none text-black"
                            />
                        ) : (
                            <span className="text-xs text-center font-medium px-2 py-0.5 rounded group-hover:text-red-600 dark:group-hover:text-red-400 line-clamp-2 w-full break-words">{file.name}</span>
                        )}
                    </div>
                )) : <div className="col-span-full flex flex-col items-center justify-center text-gray-400 mt-20"><span className="text-sm">No items found</span></div>}
              </div>
          ) : (
              <div className="flex flex-col w-full">
                  <div className="flex text-[10px] text-gray-500 border-b border-gray-200 dark:border-white/10 pb-1 mb-1 px-2 select-none"><div className="flex-1">Name</div><div className="w-24">Date Modified</div><div className="w-16 text-right">Size</div><div className="w-20 text-right">Kind</div></div>
                  {filteredFiles.length > 0 ? filteredFiles.map((file, i) => (
                      <div 
                        key={file.id} 
                        onDoubleClick={() => handleDoubleClick(file)} 
                        onMouseDown={(e) => onFinderDragStart && onFinderDragStart(e, file)}
                        className={`flex items-center px-2 py-1.5 rounded text-xs cursor-pointer ${i % 2 === 0 ? 'bg-transparent' : 'bg-gray-50/50 dark:bg-white/5'} hover:bg-red-500 hover:text-white group`}
                        onContextMenu={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onContextMenu({ x: e.clientX, y: e.clientY, targetId: file.id, showFileOps: true });
                        }}
                      >
                          <div className="flex-1 flex items-center min-w-0">
                              <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                  {/* Simple icon for list view */}
                                  {file.type === 'folder' ? <Folder size={14} fill="currentColor" /> : <FileText size={14} />}
                              </div>
                              
                              {renamingId === file.id ? (
                                <input 
                                    autoFocus
                                    defaultValue={file.name}
                                    onBlur={(e) => handleRenameSubmit(file.id, e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(file.id, e.currentTarget.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs bg-white border border-red-500 rounded px-1 outline-none text-black w-32"
                                />
                              ) : (
                                <span className="truncate">{file.name}</span>
                              )}
                          </div>
                          <div className="w-24 text-gray-500 group-hover:text-blue-100 truncate">{file.date || 'Today'}</div>
                          <div className="w-16 text-right text-gray-500 group-hover:text-blue-100">{file.size || '--'}</div>
                          <div className="w-20 text-right text-gray-500 group-hover:text-blue-100 uppercase">{file.type}</div>
                      </div>
                  )) : <div className="text-center text-gray-400 text-sm mt-10">No items found</div>}
              </div>
          )}
        </div>
        <div className="h-6 border-t border-gray-200 dark:border-black/50 bg-gray-50 dark:bg-[#222] flex items-center px-4 text-[10px] text-gray-500">{filteredFiles.length} items</div>
      </div>
    </div>
  );
};

const SafariApp = () => {
  const [inputUrl, setInputUrl] = useState('northpole.com'); const [url, setUrl] = useState('https://www.northpole.com');
  const handleNavigate = (e) => { if (e.key === 'Enter') setUrl(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`); }
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-800"><div className="h-12 bg-white dark:bg-gray-800 flex items-center px-4 space-x-3 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10"><div className="flex-1 flex justify-center"><div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 w-full max-w-xl flex items-center text-sm"><Search size={12} className="text-gray-400 mr-2" /><input className="bg-transparent border-none outline-none flex-1 dark:text-white text-center" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} onKeyDown={handleNavigate} /></div></div></div><div className="flex-1 bg-white relative"><iframe src={url} className="w-full h-full border-none" title="browser" sandbox="allow-scripts allow-same-origin" /></div></div>
  );
};

const NotesApp = ({ family, lists, userNotes, onUpdateMasterList, onUpdateUserNote }) => {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isPreview, setIsPreview] = useState(true); 
  const textareaRef = useRef(null);

  // Helper to merge user's checked state into master list
  const mergeListState = useCallback((masterContent, userContent) => {
    if (!userContent) return masterContent;
    const masterLines = masterContent.split('\n');
    const userLines = userContent.split('\n');
    const checkedItems = new Set();
    userLines.forEach(line => {
        if (line.includes('[x] ')) {
            checkedItems.add(line.replace('[x] ', '').trim()); // Store the text without the box
        }
    });
    return masterLines.map(line => {
        // If master has a box
        if (line.includes('[ ] ')) {
            const cleanLine = line.replace('[ ] ', '').trim();
            // If user checked this item
            if (checkedItems.has(cleanLine)) {
                return line.replace('[ ] ', '[x] ');
            }
        }
        // If master has it checked (admin checked it?), we respect master? 
        // Admin usually doesn't check boxes on master list, but if they did, it would come through as '[x] ' in masterLines.
        // This logic preserves Master structure.
        return line;
    }).join('\n');
  }, []);

  useEffect(() => {
    if (family === 'Admin') {
        // Admin Views: Direct access to Master Lists
        setNotes([
            { id: 'Dorfman', title: 'Dorfman List', content: lists.Dorfman || '', date: 'Master List' },
            { id: 'Maliglowka', title: 'Maliglowka List', content: lists.Maliglowka || '', date: 'Master List' },
            { id: 'Unknown', title: 'Unknown List', content: lists.Unknown || '', date: 'Master List' }
        ]);
        if (!activeNoteId) setActiveNoteId('Dorfman');
    } else {
        // User View: Merged List
        let masterContent = lists.Unknown || '';
        if (family === 'Dorfman') masterContent = lists.Dorfman || '';
        else if (family === 'Maliglowka') masterContent = lists.Maliglowka || '';

        // Load user's previous state for this note
        const userContent = userNotes['christmas2025'];
        const mergedContent = mergeListState(masterContent, userContent);

        setNotes([
            { id: 'christmas2025', title: 'My Christmas List 2025', content: mergedContent, date: 'Today' }
        ]);
        if (!activeNoteId) setActiveNoteId('christmas2025');
    }
  }, [family, lists, userNotes, mergeListState]);

  // If activeNoteId becomes invalid (e.g. switching families), reset it?
  // The effect above handles initialization if empty.

  const activeNote = notes.find(n => n.id === activeNoteId) || { title: 'No Notes', content: '' };

  const updateNote = (content) => {
    const noteId = activeNoteId;
    if (!noteId) return;

    // Optimistic Update
    setNotes(prevNotes => prevNotes.map(n => n.id === noteId ? { ...n, content, title: content.split('\n')[0].replace(/^[#\s]+/, '') || 'New Note' } : n));

    // Propagate
    if (family === 'Admin') {
        if (noteId === 'Dorfman' || noteId === 'Maliglowka' || noteId === 'Unknown') {
            onUpdateMasterList(noteId, content);
        }
    } else {
        onUpdateUserNote(noteId, content);
    }
  };

  const onCheckboxClick = (lineIndex) => {
    const lines = activeNote.content.split('\n');
    if (lineIndex >= lines.length) return;
    
    const line = lines[lineIndex];
    if (line.includes('[ ] ')) {
        lines[lineIndex] = line.replace('[ ] ', '[x] ');
    } else if (line.includes('[x] ')) {
        lines[lineIndex] = line.replace('[x] ', '[ ] ');
    }
    updateNote(lines.join('\n'));
  };

  const createNewNote = () => {
      // Admin shouldn't really create new notes in this constrained version, but keep logic for now
      const newId = Date.now();
      const newNote = { id: newId, title: 'New Note', content: '', date: 'Just now' };
      setNotes(prev => [newNote, ...prev]); 
      setActiveNoteId(newId);
      setIsPreview(false);
  };

  const insertText = (prefix, suffix = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = activeNote.content;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    const newText = before + prefix + selection + suffix + after;
    updateNote(newText);
    setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertLink = () => {
      const text = prompt('Enter link text:');
      const url = prompt('Enter URL:');
      if (text && url) insertText(`[${text}](`, `${url})`);
  };

  const deleteNote = () => {
      // Prevent deleting Master Lists
      if (activeNoteId === 'Dorfman' || activeNoteId === 'Maliglowka' || activeNoteId === 'Unknown' || activeNoteId === 'christmas2025') {
          alert("Cannot delete this list.");
          return;
      }
      const remaining = notes.filter(n => n.id !== activeNoteId);
      setNotes(remaining);
      if (remaining.length > 0) setActiveNoteId(remaining[0].id);
      else createNewNote();
  };

  const renderMarkdown = (text) => {
      if (!text) return null;
      const lines = text.split('\n');
      const output = [];
      let listBuffer = [];
      let listType = null;

      const flushList = () => {
          if (listBuffer.length > 0) {
              if (listType === 'ul') {
                  output.push(<ul key={`list-${output.length}`} className="list-disc list-inside ml-4 mb-2 space-y-1 dark:text-white">{[...listBuffer]}</ul>);
              } else {
                  output.push(<ol key={`list-${output.length}`} className="list-decimal list-inside ml-4 mb-2 space-y-1 dark:text-white">{[...listBuffer]}</ol>);
              }
              listBuffer = [];
              listType = null;
          }
      };

      const parseInline = (str, keyBase, lineIndex) => {
          const parts = [];
          let lastIndex = 0;
          const regex = /(\*\*(.*?)\*\*)|(_(.*?)_)|(!?\[(.*?)\]\((.*?)\))/g;
          let match;
          while ((match = regex.exec(str)) !== null) {
              if (match.index > lastIndex) parts.push(str.substring(lastIndex, match.index));
              if (match[1]) parts.push(<strong key={`${keyBase}-${match.index}`}>{match[2]}</strong>);
              else if (match[3]) parts.push(<em key={`${keyBase}-${match.index}`}>{match[4]}</em>);
              else if (match[5]) {
                  const isImg = match[5].startsWith('!');
                  const alt = match[6];
                  let src = match[7];
                  if (src && src.trim().toLowerCase().startsWith('javascript:')) { src = '#blocked'; }
                  if (isImg) parts.push(<img key={`${keyBase}-${match.index}`} src={src} alt={alt} className="rounded-lg my-2 max-h-64 object-cover shadow-md" />);
                  else parts.push(<a key={`${keyBase}-${match.index}`} href={src} target="_blank" rel="noreferrer" className="text-red-500 underline hover:text-red-600">{alt}</a>);
              }
              lastIndex = regex.lastIndex;
          }
          if (lastIndex < str.length) parts.push(str.substring(lastIndex));
          return parts.length > 0 ? parts : str;
      };

      lines.forEach((line, i) => {
          // Handle Blockquotes
          if (line.trim().startsWith('> ')) {
              flushList();
              output.push(
                  <blockquote key={i} className="border-l-4 border-gray-300 dark:border-gray-500 pl-4 italic text-gray-600 dark:text-gray-400 my-2">
                      {parseInline(line.trim().substring(2), i)}
                  </blockquote>
              );
              return;
          }

          // Handle Checkboxes specially
          if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')) {
              if (listType !== null) flushList(); 
              const isChecked = line.trim().startsWith('- [x] ');
              const content = line.trim().substring(6);
              output.push(
                  <div key={i} className="flex items-start space-x-2 mb-1 ml-1 group">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => onCheckboxClick(i)}
                        className="mt-1.5 w-4 h-4 accent-red-500 cursor-pointer" 
                      />
                      <span className={`dark:text-white leading-relaxed ${isChecked ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                        {parseInline(content, i)}
                      </span>
                  </div>
              );
              return;
          }

          if (line.trim().startsWith('- ')) {
              if (listType !== 'ul') flushList();
              listType = 'ul';
              listBuffer.push(<li key={`li-${i}`}>{parseInline(line.substring(2), i)}</li>);
              return;
          }
          if (line.trim().match(/^\d+\. /)) {
              if (listType !== 'ol') flushList();
              listType = 'ol';
              listBuffer.push(<li key={`li-${i}`}>{parseInline(line.replace(/^\d+\. /, ''), i)}</li>);
              return;
          }
          flushList();
          if (line.startsWith('# ')) output.push(<h1 key={i} className="text-2xl font-bold mb-3 mt-4 border-b pb-1 dark:border-gray-700 dark:text-white text-red-600">{parseInline(line.substring(2), i)}</h1>);
          else if (line.startsWith('## ')) output.push(<h2 key={i} className="text-xl font-bold mb-2 mt-3 dark:text-white text-red-500">{parseInline(line.substring(3), i)}</h2>);
          else if (line.startsWith('### ')) output.push(<h3 key={i} className="text-lg font-bold mb-2 mt-2 dark:text-white text-green-600">{parseInline(line.substring(4), i)}</h3>);
          else if (line.trim() === '') output.push(<div key={i} className="h-4" />);
          else output.push(<p key={i} className="mb-1 leading-relaxed text-gray-800 dark:text-white">{parseInline(line, i)}</p>);
      });
      flushList();
      return output;
  };

  // Determine if Read-Only Mode
  // Admin: Can edit Master Lists.
  // User: Can ONLY click checkboxes (which is handled by input logic, text editing hidden).
  const isReadOnly = family !== 'Admin'; 

  return (
    <div className="flex h-full bg-white dark:bg-[#1e1e1e]">
      <div className="w-48 bg-gray-50 dark:bg-[#282828] border-r border-gray-200 dark:border-black/50 flex flex-col">
        <div className="h-10 flex items-center justify-between px-3 border-b border-gray-200 dark:border-black/50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">iCloud</span>
            {!isReadOnly && <button onClick={createNewNote} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded text-gray-500"><Plus size={14} /></button>}
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.map(note => (
            <div key={note.id} onClick={() => { setActiveNoteId(note.id); setIsPreview(true); }} className={`p-3 border-b border-gray-100 dark:border-white/5 cursor-pointer ${activeNoteId === note.id ? 'bg-red-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-300'}`}>
               <div className={`font-bold text-sm ${activeNoteId === note.id ? 'text-white' : 'text-gray-800 dark:text-white'} truncate`}>{note.title || 'New Note'}</div>
               <div className={`text-xs mt-1 opacity-70 truncate`}>{note.date}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e]">
         {!isReadOnly && (
             <div className="h-10 border-b border-gray-200 dark:border-black/50 flex items-center px-2 space-x-1 bg-gray-50 dark:bg-[#2a2a2a] overflow-x-auto scrollbar-none min-w-0">
                <button onClick={() => insertText('**', '**')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex-shrink-0" title="Bold"><Bold size={16} /></button>
                <button onClick={() => insertText('_', '_')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex-shrink-0" title="Italic"><Italic size={16} /></button>
                <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1 flex-shrink-0" />
                <button onClick={() => insertText('# ')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex-shrink-0" title="Heading"><Heading1 size={16} /></button>
                <button onClick={() => insertText('- ')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex-shrink-0" title="Bullet List"><List size={16} /></button>
                <button onClick={() => insertText('1. ')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex-shrink-0" title="Numbered List"><ListOrdered size={16} /></button>
                <button onClick={() => insertText('> ')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex-shrink-0" title="Quote"><Quote size={16} /></button>
                <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1 flex-shrink-0" />
                <button onClick={insertLink} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex-shrink-0" title="Link"><Link size={16} /></button>
                <button onClick={() => { const url = prompt('Enter Image URL:'); if(url) insertText('![Image](', ` ${url})`); }} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex-shrink-0" title="Image"><ImageIcon size={16} /></button>
                <div className="flex-1 min-w-[10px]" />
                <button onClick={deleteNote} className="p-1.5 rounded hover:bg-red-100 hover:text-red-500 text-gray-500 flex-shrink-0" title="Delete Note"><Trash size={16} /></button>
                <button onClick={() => setIsPreview(!isPreview)} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 flex-shrink-0 ${isPreview ? 'text-red-500' : 'text-gray-500'}`} title="Toggle Preview">
                    {isPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
             </div>
         )}
         <div className="flex-1 overflow-auto relative">
            {(isPreview || isReadOnly) ? (
                <div className="p-8 prose dark:prose-invert max-w-none">{renderMarkdown(activeNote.content)}</div>
            ) : (
                <textarea 
                    ref={textareaRef}
                    className="w-full h-full p-8 resize-none border-none outline-none text-lg font-mono leading-relaxed bg-transparent dark:text-gray-200 placeholder-gray-300" 
                    value={activeNote.content} 
                    onChange={(e) => updateNote(e.target.value)} 
                    placeholder="Type your note here... (Markdown supported)"
                />
            )}
         </div>
      </div>
    </div>
  );
};

const PreviewApp = ({ file }) => {
  if (!file) return <div className="flex items-center justify-center h-full text-gray-400">No file selected</div>;
  
  // Handle PDF Simulation
  if (file.type === 'pdf') {
      return (
          <div className="flex flex-col h-full bg-[#333] text-white">
              <div className="h-10 bg-[#222] flex items-center justify-center border-b border-black text-sm font-medium">{file.name}</div>
              <div className="flex-1 overflow-hidden relative">
                  {file.src ? (
                      <iframe src={file.src} className="w-full h-full border-none" title="pdf-preview" />
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                          <FileText size={64} className="opacity-50" />
                          <p>No PDF source available</p>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-[#2a2a2a] text-white"><div className="flex-1 flex items-center justify-center overflow-hidden bg-[#1e1e1e]">{file.type === 'img' ? <img src={file.src} className="max-w-full max-h-full object-contain shadow-2xl" alt={file.name} /> : <div className="p-8 bg-white text-black h-[80%] w-[80%] shadow-xl whitespace-pre-wrap font-mono text-sm overflow-auto">{file.content || "Binary content not displayed."}</div>}</div></div>
  );
};

const TerminalApp = ({ fileSystem, setFileSystem }) => {
  const [history, setHistory] = useState(["Last login: " + new Date().toUTCString() + " on northpole_node_1"]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState('/Desktop'); // Current Working Directory
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const args = input.trim().split(' ');
      const cmd = args[0].toLowerCase();
      let output = "";
      switch(cmd) {
        case 'clear': setHistory([]); setInput(""); return;
        case 'ls': output = (fileSystem[cwd] || []).map(f => f.name + (f.type==='folder'?'/':'')).join('  '); break;
        case 'pwd': output = cwd; break;
        case 'date': output = new Date().toString(); break;
        case 'cd':
           const target = args[1];
           if (!target) { output = ""; } 
           else if (target === '..') {
               const parts = cwd.split('/');
               parts.pop();
               const newPath = parts.join('/') || '/';
               if(fileSystem[newPath] || newPath === '/') setCwd(newPath);
           } else {
               const newPath = cwd === '/' ? `/${target}` : `${cwd}/${target}`;
               const folderExists = fileSystem[cwd]?.find(f => f.name === target && f.type === 'folder');
               if(folderExists || fileSystem[newPath]) setCwd(newPath);
               else output = `cd: no such file or directory: ${target}`;
           }
           break;
        case 'mkdir':
           const folderName = args[1];
           if(folderName) {
               setFileSystem(prev => {
                   const newFs = {...prev};
                   newFs[cwd] = [...(newFs[cwd]||[]), { id: Date.now(), name: folderName, type: 'folder', date: 'Today' }];
                   newFs[cwd === '/' ? `/${folderName}` : `${cwd}/${folderName}`] = [];
                   return newFs;
               });
           }
           break;
        case 'touch':
           const fileName = args[1];
           if(fileName) setFileSystem(prev => ({ ...prev, [cwd]: [...(prev[cwd]||[]), { id: Date.now(), name: fileName, type: 'txt', content: '', date: 'Today' }] }));
           break;
        case 'whoami': output = "david"; break;
        default: output = cmd ? `zsh: command not found: ${cmd}` : "";
      }
      setHistory([...history, `david@macbook:${cwd === '/Desktop' ? '~/Desktop' : cwd}$ ${input}`, output].filter(Boolean));
      setInput("");
    }
  };
  return (
    <div className="bg-[#1e1e1e]/95 backdrop-blur-md text-white font-mono p-2 h-full w-full text-xs sm:text-sm overflow-auto" onClick={() => document.getElementById('term-input')?.focus()}>
      {history.map((line, i) => <div key={i} className={`mb-0.5 break-words ${line.startsWith('santa') ? 'font-bold text-green-400' : 'text-gray-300'}`}>{line}</div>)}
      <div className="flex"><span className="mr-2 text-green-400 font-bold">david@macbook:{cwd === '/Desktop' ? '~/Desktop' : cwd}$</span><input id="term-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleCommand} className="bg-transparent border-none outline-none flex-1 text-white" autoFocus /></div><div ref={endRef} />
    </div>
  );
};

const Window = ({ window, onClose, onMinimize, onMaximize, onFocus, isActive, updatePosition, updateSize, children }) => {
  const handleMouseDown = (e) => {
    if (window.isMaximized) return;
    e.preventDefault(); onFocus(window.id);
    const startX = e.clientX - window.position.x;
    const startY = e.clientY - window.position.y;
    const handleMouseMove = (ev) => updatePosition(window.id, ev.clientX - startX, ev.clientY - startY);
    const handleMouseUp = () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startW = window.size.w; const startH = window.size.h; const startX = e.clientX; const startY = e.clientY;
    const handleMouseMove = (ev) => { updateSize(window.id, Math.max(350, startW + (ev.clientX - startX)), Math.max(250, startH + (ev.clientY - startY))); };
    const handleMouseUp = () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp);
  };

  if (window.isMinimized) return null;

  return (
    <div 
        className={`absolute rounded-lg flex flex-col overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 ${window.isMaximized ? '!top-8 !left-0 !w-full !h-[calc(100%-2rem)] !rounded-none !transform-none' : ''} ${isActive ? 'shadow-2xl ring-1 ring-red-500/30' : 'shadow-lg opacity-95 grayscale-[0.2]'}`} 
        style={{ width: window.size.w, height: window.size.h, transform: `translate(${window.position.x}px, ${window.position.y}px)`, zIndex: window.zIndex }} 
        onMouseDown={() => onFocus(window.id)}
        data-window-id={window.id} // Identifier for context menu checks
        data-app-id={window.appId}
    >
      <div onMouseDown={handleMouseDown} onDoubleClick={() => onMaximize(window.id)} className={`h-9 bg-[#e3e3e3] dark:bg-[#2a2a2a] border-b border-gray-300 dark:border-black flex items-center px-4 select-none space-x-4 justify-between`}><div className="flex space-x-2 group"><div onClick={() => onClose(window.id)} className={`w-3 h-3 rounded-full flex items-center justify-center ${isActive ? 'bg-[#FF5F57]' : 'bg-gray-500'} hover:bg-[#FF5F57]/80 cursor-pointer`}></div><div onClick={() => onMinimize(window.id)} className={`w-3 h-3 rounded-full flex items-center justify-center ${isActive ? 'bg-[#FEBC2E]' : 'bg-gray-500'} hover:bg-[#FEBC2E]/80 cursor-pointer`}></div><div onClick={() => onMaximize(window.id)} className={`w-3 h-3 rounded-full flex items-center justify-center ${isActive ? 'bg-[#28C840]' : 'bg-gray-500'} hover:bg-[#28C840]/80 cursor-pointer`}></div></div><div className="text-xs font-bold text-gray-600 dark:text-gray-300 flex-1 text-center">{window.title}</div><div className="w-12"></div></div>
      <div className="flex-1 overflow-hidden relative bg-white dark:bg-[#1e1e1e]">{children}{!window.isMaximized && <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 bg-transparent" onMouseDown={handleResizeDown} />}</div>
    </div>
  );
};

// Helper function for the app name
const getAppName = (appId) => {
  if (!appId) return 'Finder';
  if (appId === 'quicktime') return 'QuickTime Player';
  if (appId === 'textedit') return 'TextEdit';
  return appId.charAt(0).toUpperCase() + appId.slice(1);
};

const MenuBar = ({ activeApp, date, toggleSpotlight, darkMode, onAction, isSaving }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const menus = {
    'apple': [{ label: 'About This Mac' }, { label: 'System Settings...', action: 'settings' }, { type: 'sep' }, { label: 'Restart...', action: 'restart' }, { label: 'Shut Down...', action: 'shutdown' }],
    'File': [{ label: 'New Window', action: 'new-window' }, { label: 'New Folder', action: 'new-folder' }, { type: 'sep' }, { label: 'Close Window', action: 'close-window' }],
    'Edit': [{ label: 'Undo' }, { label: 'Redo' }, { type: 'sep' }, { label: 'Cut' }, { label: 'Copy' }, { label: 'Paste' }],
    'View': [{ label: 'Enter Full Screen', action: 'fullscreen' }],
    'Help': [{ label: 'Search', action: 'spotlight' }, { label: 'Get Help' }]
  };
  
  const appName = getAppName(activeApp?.appId);
  const appMenu = [{ label: `Quit ${appName}`, action: 'quit-app' }];

  useEffect(() => { const close = () => setOpenMenu(null); if (openMenu) window.addEventListener('click', close); return () => window.removeEventListener('click', close); }, [openMenu]);

  return (
    <div className={`h-8 fixed top-0 w-full z-[9999] flex justify-between px-4 text-[13px] font-medium select-none backdrop-blur-xl transition-colors ${darkMode ? 'bg-black/30 text-white' : 'bg-white/40 text-black'} border-b border-white/5`}>
      <div className="flex items-center space-x-4 h-full">
        <div className="relative h-full flex items-center px-2 cursor-default hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); setOpenMenu('apple'); }}><AppleLogo size={18} />{openMenu === 'apple' && <Dropdown items={menus['apple']} top={32} left={0} darkMode={darkMode} onAction={onAction} />}</div>
        <div className="relative h-full flex items-center px-2 cursor-default hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); setOpenMenu('app-menu'); }}><span className="font-bold">{appName}</span>{openMenu === 'app-menu' && <Dropdown items={appMenu} top={32} left={0} darkMode={darkMode} onAction={onAction} />}</div>
        {['File', 'Edit', 'View', 'Help'].map(m => (<div key={m} className="relative h-full flex items-center px-2 cursor-default hover:bg-white/20 rounded hidden sm:flex" onClick={(e) => { e.stopPropagation(); setOpenMenu(m); }}><span>{m}</span>{openMenu === m && <Dropdown items={menus[m]} top={32} left={0} darkMode={darkMode} onAction={onAction} />}</div>))}
      </div>
      <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-3 opacity-90">
             {isSaving && <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse mr-2">Saving...</span>}
             <Wifi size={16} />
             <Search size={14} className="cursor-pointer" onClick={toggleSpotlight} />
          </div>
          <div onClick={toggleSpotlight} className="cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded transition flex space-x-2">
              <span>{formatDate(date)}</span>
              <span>{formatTime(date)}</span>
          </div>
      </div>
    </div>
  );
};

const Dropdown = ({ items, top, left, darkMode, onAction }) => (
    <div className={`absolute min-w-[200px] py-1.5 rounded-lg shadow-xl border backdrop-blur-xl z-[10005] ${darkMode ? 'bg-[#2a2a2a]/90 border-white/10 text-white' : 'bg-white/90 border-gray-200 text-black'}`} style={{ top, left }}>
        {items.map((item, i) => item.type === 'sep' ? <div key={i} className={`h-[1px] my-1 mx-3 ${darkMode ? 'bg-white/20' : 'bg-gray-300'}`} /> : <div key={i} onClick={() => item.action && onAction(item.action)} className={`px-4 py-1 mx-1 rounded cursor-default text-sm flex justify-between ${darkMode ? 'hover:bg-red-600' : 'hover:bg-red-500 hover:text-white'}`}><span>{item.label}</span></div>)}
    </div>
);

const Dock = ({ apps, openApp, openWindowIds }) => (
  <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[9999]">
    <div className="flex items-end px-3 pb-3 pt-2 bg-white/20 dark:bg-black/20 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl gap-3 transition-all hover:scale-[1.01]">
      {apps.map((app) => {
        const isOpen = openWindowIds.includes(app.id);
        return (
          <div key={app.id} onClick={() => openApp(app.id)} className="group relative flex flex-col items-center cursor-pointer">
             <div className="transition-all duration-200 ease-out group-hover:-translate-y-4">
                <div className={`w-12 h-12 rounded-[12px] shadow-lg flex items-center justify-center active:brightness-75 ${ICONS[app.id]?.bg || 'bg-gray-500'}`}>{ICONS[app.id]?.icon}</div>
             </div>
             <div className={`w-1 h-1 rounded-full bg-black dark:bg-white mt-1 absolute -bottom-2 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
             <div className="absolute -top-10 bg-gray-800/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition backdrop-blur-sm pointer-events-none border border-white/10">{app.name}</div>
          </div>
        );
      })}
    </div>
  </div>
);

const Spotlight = ({ isOpen, onClose, onLaunch, fileSystem }) => {
  const [query, setQuery] = useState('');
  if (!isOpen) return null;
  
  // Flatten files for search
  const allFiles = Object.entries(fileSystem).flatMap(([path, files]) => 
      files.map(file => ({ ...file, parentPath: path }))
  );
  const apps = Object.keys(ICONS);
  
  const filteredApps = apps.filter(a => a.toLowerCase().includes(query.toLowerCase()));
  const filteredFiles = allFiles.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex justify-center pt-[20vh]" onClick={onClose}>
      <div className="w-[600px] bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/20 flex flex-col overflow-hidden h-fit max-h-[500px]" onClick={e => e.stopPropagation()}>
        <div className="h-14 flex items-center px-4 space-x-4 border-b border-gray-200 dark:border-white/10 shrink-0"><Search size={24} className="text-gray-400" /><input autoFocus className="flex-1 bg-transparent text-2xl font-light outline-none dark:text-white placeholder-gray-400" placeholder="Spotlight Search" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { if(filteredApps.length > 0) onLaunch(filteredApps[0]); else if(filteredFiles.length > 0) onLaunch('preview', { file: filteredFiles[0], title: filteredFiles[0].name }); onClose(); } }} /></div>
        {query && (
          <div className="overflow-y-auto py-2">
            {filteredApps.length > 0 && <div className="px-4 text-xs font-bold text-gray-500 mb-1 mt-2">APPLICATIONS</div>}
            {filteredApps.map((app) => (<div key={app} className={`px-4 py-2 flex items-center space-x-3 cursor-pointer hover:bg-red-500 hover:text-white dark:text-white`} onClick={() => { onLaunch(app); onClose(); }}><div className={`w-6 h-6 rounded text-[10px] flex items-center justify-center ${ICONS[app].bg}`}>{React.cloneElement(ICONS[app].icon, { size: 14 })}</div><span className="capitalize font-medium">{app}</span></div>))}
            {filteredFiles.length > 0 && <div className="px-4 text-xs font-bold text-gray-500 mb-1 mt-2">DOCUMENTS</div>}
            {filteredFiles.map((file) => (
                <div 
                    key={file.id} 
                    className={`px-4 py-2 flex items-center space-x-3 cursor-pointer hover:bg-red-500 hover:text-white dark:text-white`} 
                    onClick={() => { 
                        if (file.type === 'folder') {
                             // If folder, construct path and launch Finder
                             const path = file.parentPath === '/' ? `/${file.name}` : `${file.parentPath}/${file.name}`;
                             onLaunch('finder', { initialPath: path });
                        } else {
                             onLaunch(file.type === 'txt' ? 'textedit' : file.type === 'pdf' ? 'preview' : file.type === 'mp4' || file.type === 'mov' || file.type === 'mp3' || file.type === 'wav' ? 'quicktime' : 'preview', { file, title: file.name });
                        }
                        onClose(); 
                    }}
                >
                    <div className="w-4 h-4 flex items-center justify-center">
                        {/* Use FileIconAsset for correct icon rendering, small scale */}
                        <div className="scale-50 origin-center">
                            <FileIconAsset type={file.type} src={file.src} className="drop-shadow-none" />
                        </div>
                    </div>
                    <span className="font-medium">{file.name}</span>
                </div>
            ))}
            {filteredApps.length === 0 && filteredFiles.length === 0 && <div className="px-6 py-4 text-gray-500 text-sm">No results found</div>}
          </div>
        )}
      </div>
    </div>
  );
};

const ContextMenu = ({ x, y, onClose, onAction, targetId, showFileOps }) => (
  <div className="fixed z-[10005] w-48 bg-white/90 dark:bg-[#2a2a2a]/90 backdrop-blur-xl rounded-lg shadow-xl border border-gray-200 dark:border-white/10 py-1 text-sm text-gray-800 dark:text-gray-200" style={{ top: y, left: x }}>
    {targetId ? (
      <>
        <div className="hover:bg-red-500 hover:text-white px-4 py-1 cursor-pointer" onClick={() => onAction('rename')}>Rename</div>
        <div className="h-[1px] bg-gray-200 dark:bg-white/10 my-1" />
      </>
    ) : null}
    
    {showFileOps && (
      <>
        <div className="hover:bg-red-500 hover:text-white px-4 py-1 cursor-pointer" onClick={() => onAction('new-folder')}>New Folder</div>
        <div className="hover:bg-red-500 hover:text-white px-4 py-1 cursor-pointer" onClick={() => onAction('new-file')}>New Text File</div>
        <div className="h-[1px] bg-gray-200 dark:bg-white/10 my-1" />
      </>
    )}
    
    <div className="hover:bg-red-500 hover:text-white px-4 py-1 cursor-pointer" onClick={() => onAction('wallpaper')}>Change Wallpaper</div>
    <div className="hover:bg-red-500 hover:text-white px-4 py-1 cursor-pointer" onClick={() => onAction('cleanup')}>Clean Up</div>
  </div>
);

const SettingsApp = ({ darkMode, setDarkMode, snowEffect, setSnowEffect, wallpaper, setWallpaper, username, onUpdateUsername }) => {
    const [newUsername, setNewUsername] = useState(username || '');
    
    useEffect(() => { setNewUsername(username || ''); }, [username]);

    return (
        <div className="p-6 bg-gray-100 dark:bg-[#1e1e1e] h-full text-gray-800 dark:text-white overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          
          <div className="p-4 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm mb-4">
             <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Account</h3>
             <div className="flex items-center space-x-2">
                <input 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1 bg-gray-100 dark:bg-black/20 border border-transparent focus:border-red-500 rounded px-3 py-1.5 text-sm outline-none dark:text-white"
                    placeholder="Username"
                />
                <button 
                    onClick={() => onUpdateUsername(newUsername)}
                    className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                    disabled={newUsername === username}
                >
                    Update
                </button>
             </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm mb-4">
             <span>Dark Mode</span>
             <div onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${darkMode ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${darkMode ? 'translate-x-6' : ''}`} /></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm mb-4">
             <span>Snow Effect</span>
             <div onClick={() => setSnowEffect(!snowEffect)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${snowEffect ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${snowEffect ? 'translate-x-6' : ''}`} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
             {Object.entries(WALLPAPERS).map(([k, v]) => (<img key={k} src={v} onClick={() => setWallpaper(v)} className={`w-full h-24 object-cover rounded border-2 cursor-pointer ${wallpaper === v ? 'border-red-500' : 'border-transparent'}`} alt={k} />))}
          </div>
        </div>
    );
};

/**
 * --- MAIN OS ---
 */
const App = () => {
  const [powerState, setPowerState] = useState('on'); 
  const [booting, setBooting] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  const [darkMode, setDarkMode] = useState(true);
  const [snowEffect, setSnowEffect] = useState(true);
  const [wallpaper, setWallpaper] = useState(WALLPAPERS['Cozy Fireplace']);
  const [username, setUsername] = useState('');
  const [family, setFamily] = useState('Unknown');
  const [lists, setLists] = useState({ Dorfman: '', Maliglowka: '', Unknown: '' });
  const [userNotes, setUserNotes] = useState({}); // Persist user-specific note data (e.g. checkboxes)
  const [date, setDate] = useState(new Date());
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [zIndex, setZIndex] = useState(10);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [fileSystem, setFileSystem] = useState(INITIAL_FILE_SYSTEM);
  const [renamingId, setRenamingId] = useState(null);
  const [draggedFileId, setDraggedFileId] = useState(null);
  const [phantomFile, setPhantomFile] = useState(null); // For Finder -> Desktop Drag
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Lists
  useEffect(() => {
      const fetchLists = async () => {
          if (!isLoggedIn) return;
          
          try {
              const dorfmanRef = doc(db, 'lists', 'Dorfman');
              const maliglowkaRef = doc(db, 'lists', 'Maliglowka');
              const unknownRef = doc(db, 'lists', 'Unknown');
              
              const dorfmanSnap = await getDoc(dorfmanRef);
              const maliglowkaSnap = await getDoc(maliglowkaRef);
              const unknownSnap = await getDoc(unknownRef);

              setLists({
                  Dorfman: dorfmanSnap.exists() ? dorfmanSnap.data()?.content : '',
                  Maliglowka: maliglowkaSnap.exists() ? maliglowkaSnap.data()?.content : '',
                  Unknown: unknownSnap.exists() ? unknownSnap.data()?.content : ''
              });
          } catch (e) {
              console.error("Error fetching lists:", e);
          }
      };
      fetchLists();
  }, [isLoggedIn]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true);
        setIsLoadingData(true);
        setLoadError(false);
        // Load user data or create if not exists
        const userDocRef = doc(db, "users", currentUser.uid);
        
        // Subscribe to realtime updates
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.fileSystem) setFileSystem(data.fileSystem);
            if (data.username) setUsername(data.username);
            if (data.family) setFamily(data.family);
            else setFamily('Unknown'); // Explicitly default if missing
            
            if (data.notes) setUserNotes(data.notes); // Load user notes

            if (data.settings) {
              if (data.settings.wallpaper) setWallpaper(data.settings.wallpaper);
              if (data.settings.darkMode !== undefined) setDarkMode(data.settings.darkMode);
              if (data.settings.snowEffect !== undefined) setSnowEffect(data.settings.snowEffect);
            }
          } else {
            // Initialize new user
            setDoc(userDocRef, {
              fileSystem: INITIAL_FILE_SYSTEM,
              settings: { wallpaper: WALLPAPERS['Cozy Fireplace'], darkMode: true, snowEffect: true },
              family: 'Unknown'
            });
          }
          setIsLoadingData(false);
        }, (error) => {
           console.error("Error fetching user data:", error);
           setLoadError(true);
           setIsLoadingData(false);
        });
        return () => unsubDoc();
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setIsLoadingData(false);
        setLoadError(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync state to Firestore (Debounced)
  const saveTimeoutRef = useRef(null);
  const saveState = useCallback(() => {
    if (!user) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      const userDocRef = doc(db, "users", user.uid);
      // Only update what changed - simplified here to update structure
      setDoc(userDocRef, {
        fileSystem,
        settings: { wallpaper, darkMode, snowEffect },
        username,
        family,
        notes: userNotes
      }, { merge: true })
      .then(() => setIsSaving(false))
      .catch((err) => {
          console.error("Error saving state:", err);
          setIsSaving(false);
      });
    }, 1000); // Reduced debounce to 1 second
  }, [user, fileSystem, wallpaper, darkMode, snowEffect, username, family, userNotes]);

  useEffect(() => {
    if (isLoggedIn && !booting && !isLoadingData && !loadError) {
        saveState();
    }
  }, [fileSystem, wallpaper, darkMode, snowEffect, username, family, userNotes, isLoggedIn, booting, isLoadingData, loadError, saveState]);

  useEffect(() => {
    const t = setInterval(() => setDate(new Date()), 1000);
    const handleKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.code === 'Space') { e.preventDefault(); setSpotlightOpen(p => !p); } };
    window.addEventListener('keydown', handleKey);
    return () => { clearInterval(t); window.removeEventListener('keydown', handleKey); };
  }, []);

  // Auto-launch Notes on Login
  useEffect(() => {
      if (isLoggedIn && !isLoadingData) {
          // Calculate center
          const isMobile = window.innerWidth < 640;
          const width = isMobile ? 320 : 800;
          const height = isMobile ? 500 : 600;
          const x = Math.max(0, (window.innerWidth - width) / 2);
          const y = Math.max(0, (window.innerHeight - height) / 2);
          
          launchApp('notes', { position: { x, y } });
      }
  }, [isLoggedIn, isLoadingData]);

  // --- Desktop Drag Logic ---
  const handleIconDrag = (e, fileId) => {
    const file = fileSystem['/Desktop'].find(f => f.id === fileId);
    if (!file) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;
    
    const handleMouseMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!isDragging && Math.sqrt(dx*dx + dy*dy) > 5) {
          isDragging = true;
          setDraggedFileId(fileId); 
      }
      if (isDragging) {
          setFileSystem(prev => ({ ...prev, '/Desktop': prev['/Desktop'].map(f => f.id === fileId ? { ...f, x: file.x + dx, y: file.y + dy } : f) }));
      }
    };
    
    const handleMouseUp = (ev) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (!isDragging) return;
      setDraggedFileId(null);

      // Check for drop targets (Folder or Window)
      const dropTarget = document.elementFromPoint(ev.clientX, ev.clientY);
      const folderTarget = dropTarget?.closest('[data-folder-path]');
      const windowTarget = dropTarget?.closest('[data-finder-path]');
      
      let targetPath = null;
      if (folderTarget) targetPath = folderTarget.getAttribute('data-folder-path');
      else if (windowTarget) targetPath = windowTarget.getAttribute('data-finder-path');

      if (targetPath && targetPath !== '/Desktop') {
          setFileSystem(prev => {
              const sourceFile = prev['/Desktop'].find(f => f.id === fileId);
              if (!sourceFile) return prev;
              // Prevent circular move
              if (sourceFile.type === 'folder' && targetPath.startsWith('/Desktop/' + sourceFile.name)) return prev;

              const newFs = { ...prev };
              newFs['/Desktop'] = newFs['/Desktop'].filter(f => f.id !== fileId);
              if (!newFs[targetPath]) newFs[targetPath] = [];
              newFs[targetPath] = [...newFs[targetPath], { ...sourceFile, x: 20, y: 20 }]; 
              return newFs;
          });
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // --- Finder Window Drag Logic (Phantom Drag) ---
  const handleFinderDragStart = (e, file) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const initialSourcePath = e.target.closest('[data-finder-path]').getAttribute('data-finder-path');
      
      setPhantomFile({ file, x: startX, y: startY, sourcePath: initialSourcePath });

      const handleMouseMove = (ev) => {
          setPhantomFile(prev => ({ ...prev, x: ev.clientX, y: ev.clientY }));
      };

      const handleMouseUp = (ev) => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          setPhantomFile(null);

          // Logic to drop onto Desktop or another Folder/Window
          const dropTarget = document.elementFromPoint(ev.clientX, ev.clientY);
          
          // 1. Drop on Desktop Background?
          // We need to check if we are NOT hovering over a window
          const hoveringWindow = dropTarget?.closest('[data-window-id]');
          
          if (!hoveringWindow) {
              // Dropped on Desktop
              setFileSystem(prev => {
                  if (initialSourcePath === '/Desktop') return prev; // No-op
                  
                  const sourceList = prev[initialSourcePath] || [];
                  const fileToMove = sourceList.find(f => f.id === file.id);
                  if (!fileToMove) return prev;

                  const newFs = { ...prev };
                  newFs[initialSourcePath] = sourceList.filter(f => f.id !== file.id);
                  newFs['/Desktop'] = [...newFs['/Desktop'], { ...fileToMove, x: ev.clientX - 30, y: ev.clientY - 30 }];
                  return newFs;
              });
              return;
          }

          // 2. Drop on Folder in Desktop
          const folderTarget = dropTarget?.closest('[data-folder-path]');
          if (folderTarget) {
              const targetPath = folderTarget.getAttribute('data-folder-path');
              if (targetPath !== initialSourcePath) {
                  setFileSystem(prev => {
                      const sourceList = prev[initialSourcePath] || [];
                      const fileToMove = sourceList.find(f => f.id === file.id);
                      if (!fileToMove) return prev;

                      const newFs = { ...prev };
                      newFs[initialSourcePath] = sourceList.filter(f => f.id !== file.id);
                      if (!newFs[targetPath]) newFs[targetPath] = [];
                      newFs[targetPath] = [...newFs[targetPath], { ...fileToMove, x: 20, y: 20 }];
                      return newFs;
                  });
              }
          }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };

  const createItem = (type, path, name) => {
      const id = Date.now();
      const newItem = { id, name, type, date: 'Today, ' + formatTime(new Date()), x: contextMenu ? contextMenu.x - 50 : 100, y: contextMenu ? contextMenu.y - 50 : 100 };
      if (type === 'txt') newItem.content = '';
      if (type === 'folder') {
          setFileSystem(prev => ({ ...prev, [path === '/' ? `/${name}` : `${path}/${name}`]: [] }));
      }
      setFileSystem(prev => ({ ...prev, [path]: [...(prev[path] || []), newItem] }));
  };
  
  const updateFileContent = (id, content) => {
      setFileSystem(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(path => {
              next[path] = next[path].map(f => f.id === id ? { ...f, content } : f);
          });
          return next;
      });
  };

  const renameFile = (id, newName) => {
      setFileSystem(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(path => {
              next[path] = next[path].map(f => f.id === id ? { ...f, name: newName } : f);
          });
          return next;
      });
      setRenamingId(null);
  };

  const handleCleanUp = () => {
      setFileSystem(prev => ({ ...prev, '/Desktop': prev['/Desktop'].map((f, i) => ({ ...f, x: 20, y: 20 + (i * 170) })) }));
      setContextMenu(null);
  };

  const closeWindow = (id) => { setWindows(prev => prev.filter(w => w.id !== id)); if (activeWindowId === id) setActiveWindowId(null); };
  const toggleMax = (id) => setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));

  const triggerSystemAction = (action) => {
      if (action === 'restart') { 
          setPowerState('restarting'); 
          setTimeout(() => { 
              setPowerState('on'); 
              setBooting(true); 
              // setIsLoggedIn(false); // Auth state handles this naturally if we signed out, but restart is just visual here usually
          }, 2000); 
      } 
      else if (action === 'shutdown') { 
          setPowerState('shutdown'); 
          signOut(auth);
      } 
      else if (action === 'wallpaper' || action === 'settings') { launchApp('settings'); } 
      else if (action === 'cleanup') { handleCleanUp(); } 
      else if (action === 'spotlight') { setSpotlightOpen(true); }
      else if (action === 'close-window' && activeWindowId) { closeWindow(activeWindowId); } 
      else if (action === 'fullscreen' && activeWindowId) { toggleMax(activeWindowId); } 
      else if (action === 'new-window') { const activeApp = windows.find(w => w.id === activeWindowId); launchApp(activeApp ? activeApp.appId : 'finder', { forceNew: true }); }
      else if (action === 'new-folder') { createItem('folder', '/Desktop', 'Untitled Folder'); }
      else if (action === 'new-file') { createItem('txt', '/Desktop', 'Untitled.txt'); }
      else if (action === 'rename' && contextMenu?.targetId) { setRenamingId(contextMenu.targetId); }
      else if (action === 'quit-app') { 
          const activeApp = windows.find(w => w.id === activeWindowId);
          if (activeApp) {
              setWindows(prev => prev.filter(w => w.appId !== activeApp.appId));
              setActiveWindowId(null);
          }
      }
      setContextMenu(null);
  };

  const launchApp = (appId, props = {}) => {
    const existing = windows.find(w => w.appId === appId && !w.isMultiInstance && !props.forceNew);
    if (existing) {
      const newWindows = windows.map(w => {
          if (w.id === existing.id) {
              return { 
                  ...w, 
                  isMinimized: false, 
                  zIndex: zIndex + 1,
                  // Update position if provided
                  ...(props.position ? { position: props.position } : {})
              };
          }
          return w;
      });
      setWindows(newWindows);
      setActiveWindowId(existing.id); setZIndex(z => z + 1); return;
    }
    const id = Date.now();
    const isMobile = window.innerWidth < 640;
    const config = {
      id, appId, title: props.title || appId.charAt(0).toUpperCase() + appId.slice(1),
      position: { x: isMobile ? 20 : 100 + (windows.length * 20), y: isMobile ? 50 : 50 + (windows.length * 20) },
      size: { w: isMobile ? 320 : 800, h: isMobile ? 500 : 600 },
      zIndex: zIndex + 1, isMultiInstance: appId === 'preview' || appId === 'textedit' || appId === 'finder' || appId === 'quicktime', ...props
    };
    if (appId === 'calculator') config.size = { w: 280, h: 460 }; 
    if (appId === 'notes') config.size = { w: 800, h: 600 };
    if (appId === 'quicktime') config.size = { w: 500, h: 350 };
    setWindows([...windows, config]); setActiveWindowId(id); setZIndex(z => z + 1);
  };

  const focusWindow = (id) => { setActiveWindowId(id); setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: zIndex + 1 } : w)); setZIndex(z => z + 1); };
  const updatePos = (id, x, y) => setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x, y } } : w));
  const updateSize = (id, w, h) => setWindows(prev => prev.map(win => win.id === id ? { ...win, size: { w, h } } : win));
  const toggleMin = (id) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w)); setActiveWindowId(null); };

  const handleUsernameChange = async (newUsername) => {
      if (!user || !newUsername) return;
      const lower = newUsername.trim().toLowerCase();
      const currentLower = (username || '').toLowerCase();
      
      if (lower === currentLower) return;
      if (lower.length < 3) { alert('Username too short'); return; }
      const regex = /^[a-zA-Z0-9_]+$/;
      if (!regex.test(lower)) { alert('Invalid characters'); return; }

      try {
          // Check availability
          const newUsernameDoc = await getDoc(doc(db, 'usernames', lower));
          if (newUsernameDoc.exists()) { alert('Username taken'); return; }

          const batch = writeBatch(db);
          // Reserve new
          batch.set(doc(db, 'usernames', lower), { email: user.email, uid: user.uid });
          // Remove old (if exists)
          if (currentLower) {
              batch.delete(doc(db, 'usernames', currentLower));
          }
          // Update user profile
          const userRef = doc(db, 'users', user.uid);
          batch.set(userRef, { username: newUsername }, { merge: true });
          
          await batch.commit();
          setUsername(newUsername);
          alert('Username updated!');
      } catch (e) {
          console.error(e);
          alert('Error updating username: ' + e.message);
      }
  };

  const handleUpdateMasterList = async (listName, content) => {
      setLists(prev => ({ ...prev, [listName]: content }));
      try {
          await setDoc(doc(db, 'lists', listName), { content }, { merge: true });
      } catch (e) {
          console.error("Error updating master list:", e);
      }
  };

  const handleUpdateUserNote = (noteId, content) => {
      setUserNotes(prev => ({ ...prev, [noteId]: content }));
  };

  const renderContent = (win) => {
    switch(win.appId) {
      case 'finder': return <FinderApp fileSystem={fileSystem} initialPath={win.initialPath} openFile={(f) => launchApp(f.type === 'txt' ? 'textedit' : f.type === 'pdf' ? 'preview' : f.type === 'mp4' || f.type === 'mov' || f.type === 'mp3' || f.type === 'wav' ? 'quicktime' : 'preview', { file: f, title: f.name })} onContextMenu={setContextMenu} renamingId={renamingId} onRename={renameFile} onFinderDragStart={handleFinderDragStart} />;
      case 'safari': return <SafariApp />;
      case 'notes': return <NotesApp family={family} lists={lists} userNotes={userNotes} onUpdateMasterList={handleUpdateMasterList} onUpdateUserNote={handleUpdateUserNote} />;
      case 'terminal': return <TerminalApp fileSystem={fileSystem} setFileSystem={setFileSystem} />;
      case 'preview': return <PreviewApp file={win.file} />;
      case 'textedit': return <TextEditApp file={win.file} onSave={updateFileContent} />;
      case 'calculator': return <CalculatorApp />; 
      case 'quicktime': return <QuickTimeApp file={win.file} />;
      case 'settings': return (
        <SettingsApp 
            darkMode={darkMode} setDarkMode={setDarkMode}
            snowEffect={snowEffect} setSnowEffect={setSnowEffect}
            wallpaper={wallpaper} setWallpaper={setWallpaper}
            username={username} onUpdateUsername={handleUsernameChange}
        />
      );
      default: return <div className="flex items-center justify-center h-full text-gray-500">App Under Construction</div>;
    }
  };

  if (powerState === 'shutdown') return <ShutdownScreen onPowerOn={() => { setPowerState('on'); setBooting(true); }} />;
  if (powerState === 'restarting') return <div className="fixed inset-0 bg-black z-[9999]" />; 
  if (booting) return <BootScreen onFinish={() => setBooting(false)} />;
  if (!isLoggedIn) return <LoginScreen onLogin={() => {}} wallpaper={wallpaper} />;
  if (isLoadingData) return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
        <AppleLogo size={80} className="text-white mb-8 animate-pulse" fill="white" />
        <div className="text-white/50 text-sm font-light">Loading your preferences...</div>
    </div>
  );

  return (
    <div 
        className={`fixed inset-0 bg-cover bg-center select-none ${darkMode ? 'dark' : ''}`} 
        style={{ backgroundImage: `url(${wallpaper})` }} 
        onContextMenu={(e) => { 
            e.preventDefault(); 
            // Context-aware check
            const windowTarget = e.target.closest('[data-window-id]');
            const appId = windowTarget ? windowTarget.getAttribute('data-app-id') : null;
            const showFileOps = !appId || appId === 'finder';
            
            setContextMenu({ x: e.clientX, y: e.clientY, showFileOps }); 
        }} 
        onClick={() => { setContextMenu(null); setSpotlightOpen(false); }}
    >
      {snowEffect && <Snowfall />}
      <MenuBar activeApp={windows.find(w => w.id === activeWindowId)} date={date} toggleSpotlight={(e) => { e.stopPropagation(); setSpotlightOpen(p => !p); }} darkMode={darkMode} onAction={triggerSystemAction} isSaving={isSaving} />
      
      <div className="absolute inset-0 z-0">
         {fileSystem['/Desktop'].map(file => (
           <FileIcon 
             key={file.id} 
             file={file} 
             isDesktop={true} 
             onDragStart={handleIconDrag} 
             onDoubleClick={(f) => {
                 if (f.type === 'folder') launchApp('finder', { initialPath: `/Desktop/${f.name}` });
                 else launchApp(f.type === 'txt' ? 'textedit' : f.type === 'pdf' ? 'preview' : f.type === 'mp4' || f.type === 'mov' || f.type === 'mp3' || f.type === 'wav' ? 'quicktime' : 'preview', { file: f, title: f.name });
             }}
             onContextMenu={(e, f) => { setContextMenu({ x: e.clientX, y: e.clientY, targetId: f.id, showFileOps: true }); }}
             isRenaming={renamingId === file.id}
             onRename={renameFile}
             isDragging={draggedFileId === file.id}
           />
         ))}
      </div>
      
      {windows.map(win => (
        <Window key={win.id} window={win} isActive={activeWindowId === win.id} onClose={closeWindow} onFocus={focusWindow} onMinimize={toggleMin} onMaximize={toggleMax} updatePosition={updatePos} updateSize={updateSize}>
          {renderContent(win)}
        </Window>
      ))}
      
      {/* Phantom File for Finder Dragging */}
      {phantomFile && (
          <div className="fixed z-[20000] pointer-events-none opacity-80" style={{ left: phantomFile.x, top: phantomFile.y, transform: 'translate(-50%, -50%)' }}>
              <div className="w-16 h-16 flex items-center justify-center">
                  <FileIconAsset type={phantomFile.file.type} src={phantomFile.file.src} />
              </div>
          </div>
      )}

      <Dock 
        apps={Object.keys(ICONS)
          .filter(key => !ICONS[key].hiddenFromDock || windows.some(w => w.appId === key))
          .map(k => ({ id: k, name: k }))} 
        openApp={launchApp} 
        openWindowIds={windows.map(w => w.appId)} 
      />
      <Spotlight isOpen={spotlightOpen} onClose={() => setSpotlightOpen(false)} onLaunch={launchApp} fileSystem={fileSystem} />
      {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} onAction={triggerSystemAction} />}
    </div>
  );
};

export default App;

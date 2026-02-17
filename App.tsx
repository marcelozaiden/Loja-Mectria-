import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  Product, 
  Order, 
  Role, 
  OrderStatus,
  AppBranding,
  ClockifyData
} from './types';
import { 
  GearLogo, 
  ADMIN_EMAIL 
} from './constants';
import { parseClockifyReport } from './services/geminiService';

// Importação do banco de dados centralizado
import { db } from './firebase';

// Firebase Firestore Hooks e Métodos
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  addDoc,
  writeBatch,
  increment,
  setDoc
} from "firebase/firestore";

// --- UI Components ---
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-8 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const ImageAdjuster: React.FC<{ 
  src: string; 
  onConfirm: (base64: string) => void; 
  onCancel: () => void 
}> = ({ src, onConfirm, onCancel }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const saveAdjustedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, 400, 400);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 400, 400);
      
      const drawWidth = 400 * scale;
      const drawHeight = (img.height / img.width) * drawWidth;
      
      const centerX = 200 + position.x;
      const centerY = 200 + position.y;

      ctx.save();
      ctx.beginPath();
      ctx.arc(200, 200, 200, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, centerX - drawWidth/2, centerY - drawHeight/2, drawWidth, drawHeight);
      ctx.restore();

      onConfirm(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = src;
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white">
      <h2 className="text-xl font-black uppercase tracking-widest mb-8">Ajustar Foto</h2>
      <div 
        ref={containerRef}
        className="relative w-72 h-72 rounded-full border-4 border-mectria-red overflow-hidden bg-slate-800 cursor-move touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <img 
          src={src} 
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="w-full h-full object-contain pointer-events-none"
        />
        <div className="absolute inset-0 pointer-events-none border-[40px] border-slate-900/40 rounded-full"></div>
      </div>
      <div className="w-full max-w-xs mt-12 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex justify-between">
            <span>Zoom</span>
            <span>{Math.round(scale * 100)}%</span>
          </label>
          <input 
            type="range" min="1" max="5" step="0.1" 
            value={scale} 
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-mectria-red"
          />
        </div>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-4 rounded-2xl bg-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-colors">Cancelar</button>
          <button onClick={saveAdjustedImage} className="flex-1 py-4 rounded-2xl bg-mectria-red font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-colors">Confirmar</button>
        </div>
      </div>
      <canvas ref={canvasRef} width="400" height="400" className="hidden" />
    </div>
  );
};

const FeedbackToast: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => (
  <div className="fixed top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[150] bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 flex items-center gap-4 animate-in slide-in-from-top-full duration-500">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'}`}>
      {order.status === OrderStatus.DELIVERED ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
      )}
    </div>
    <div className="flex-1">
      <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-wider">
        {order.status === OrderStatus.DELIVERED ? 'Resgate Aprovado! ✅' : 'Resgate Recusado ❌'}
      </h4>
      <p className="text-slate-400 text-[9px] font-bold uppercase mt-0.5">{order.productName}</p>
    </div>
    <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
  </div>
);

const Button: React.FC<{ 
  onClick?: () => void; 
  className?: string; 
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ onClick, className = '', children, variant = 'primary', disabled = false, type = 'button' }) => {
  const base = "px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-mectria-red text-white hover:bg-red-800",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    outline: "border-2 border-mectria-red text-mectria-red hover:bg-red-50",
    danger: "bg-red-100 text-red-600 hover:bg-red-200",
    success: "bg-green-100 text-green-600 hover:bg-green-200"
  };
  return <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

const Input: React.FC<{
  label?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, type = 'text', required = false, placeholder }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
    <input type={type} required={required} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-mectria-red transition-all text-sm font-medium" />
  </div>
);

const FileInput: React.FC<{
  label: string;
  accept?: string;
  onChange: (base64: string, mimeType: string) => void;
  preview?: string | null;
}> = ({ label, accept = "image/*", onChange, preview }) => {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <input type="file" accept={accept} onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          setLoading(true);
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => { onChange(reader.result as string, file.type); setLoading(false); };
        }
      }} className="hidden" id={`file-${label.replace(/\s+/g, '-').toLowerCase()}`} />
      <label htmlFor={`file-${label.replace(/\s+/g, '-').toLowerCase()}`} className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-mectria-red cursor-pointer text-xs font-bold text-slate-400 bg-slate-50/50 transition-all overflow-hidden">
        {loading ? <span className="animate-pulse text-mectria-red">Aguarde...</span> : preview ? <img src={preview} className="w-full h-32 object-contain" /> : <span>Selecionar Imagem</span>}
      </label>
    </div>
  );
};

// --- Pages ---
const Login: React.FC<{ members: User[], onLogin: (user: User) => void; branding: AppBranding }> = ({ members, onLogin, branding }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => 
    members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name)).slice(0, 8)
  , [searchTerm, members]);

  const handleLogin = () => {
    if (!selectedUser) return setError('Selecione seu nome.');
    if (email.trim().toLowerCase() !== selectedUser.email.toLowerCase() && email.trim().toLowerCase() !== ADMIN_EMAIL) return setError('E-mail incorreto.');
    onLogin(selectedUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 flex flex-col items-center gap-8">
        <div className="bg-red-50 p-6 rounded-3xl animate-bounce-subtle">
          {branding.loginLogo ? <img src={branding.loginLogo} className="w-20 h-20 object-contain" /> : <GearLogo />}
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mectria Store</h1>
        <div className="w-full space-y-5 relative">
          <div className="relative">
            <Input label="Quem é você?" value={selectedUser ? selectedUser.name : searchTerm} onChange={e => { setSearchTerm(e.target.value); setSelectedUser(null); setShowDropdown(true); }} placeholder="Seu nome..." />
            {showDropdown && searchTerm && !selectedUser && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                {filtered.map(m => (
                  <button key={m.id} onClick={() => { setSelectedUser(m); setShowDropdown(false); }} className="w-full px-5 py-4 text-left hover:bg-red-50 flex items-center gap-3 border-b last:border-0 transition-colors">
                    <img src={m.avatar} className="w-9 h-9 rounded-full object-cover" />
                    <span className="font-bold text-slate-700 text-sm">{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Input label="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center bg-red-50 py-3 rounded-xl">{error}</p>}
          <Button onClick={handleLogin} className="w-full py-5 text-sm uppercase font-black tracking-widest">Entrar</Button>
        </div>
      </div>
    </div>
  );
};

const Store: React.FC<{ user: User; products: Product[]; branding: AppBranding; onBuy: (p: Product) => void }> = ({ user, products, branding, onBuy }) => (
  <div className="p-6 pb-32 space-y-8 max-w-2xl mx-auto">
    <div className="flex items-center justify-between">
      {branding.storeLogo ? <img src={branding.storeLogo} className="h-8 object-contain" /> : <img src="https://mectria.com/wp-content/uploads/2021/04/Logo-Mectria-01.png" className="h-8" />}
      <div className="flex items-center gap-3 bg-white p-1.5 pr-5 rounded-full border shadow-sm">
        <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" />
        <span className="text-[10px] font-black text-slate-800 uppercase">{user.name.split(' ')[0]}</span>
      </div>
    </div>
    <div className="bg-mectria-red rounded-[3rem] p-12 text-white shadow-2xl text-center group relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-[10px] font-black tracking-widest opacity-50 uppercase mb-3">Saldo</p>
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-7xl font-black tracking-tighter">{user.balance}</h2>
          <span className="text-xl font-bold opacity-60">TK</span>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-5">
      {products.map(p => (
        <div key={p.id} className="bg-white rounded-[2.5rem] p-5 shadow-sm border hover:shadow-2xl transition-all group">
          <img src={p.image} className="w-full h-36 object-cover rounded-[1.5rem] mb-5 group-hover:scale-105 transition-transform" />
          <h4 className="font-bold text-slate-800 text-xs truncate uppercase px-1">{p.name}</h4>
          <div className="flex items-center justify-between mt-4">
             <span className="text-[10px] font-black text-mectria-red">{p.price} TK</span>
             <Button onClick={() => onBuy(p)} disabled={user.balance < p.price} className="px-4 py-2 text-[9px] uppercase font-black">Resgatar</Button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Profile: React.FC<{ user: User; orders: Order[]; onLogout: () => void; onStartAvatarUpdate: (b: string) => void }> = ({ user, orders, onLogout, onStartAvatarUpdate }) => (
  <div className="p-6 pb-32 max-w-2xl mx-auto space-y-8">
    <div className="flex flex-col items-center gap-6 mt-12">
      <div className="relative group">
        <img src={user.avatar} className="w-40 h-40 rounded-[3.5rem] border-8 border-white shadow-2xl object-cover bg-slate-100" />
        <label htmlFor="user-upload" className="absolute inset-0 bg-black/50 rounded-[3.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer text-white">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </label>
        <input id="user-upload" type="file" accept="image/*" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => onStartAvatarUpdate(reader.result as string);
          }
        }} />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{user.name}</h2>
        <span className="text-[10px] font-black text-white bg-mectria-red px-3 py-1 rounded-full uppercase tracking-widest mt-2 inline-block">{user.role}</span>
      </div>
    </div>
    <div className="space-y-4">
      <h4 className="font-black uppercase text-xs text-slate-400 border-l-4 border-mectria-red px-3">Seus Pedidos</h4>
      <div className="grid gap-3">
        {orders.filter(o => o.userId === user.id).map(o => (
          <div key={o.id} className="bg-white p-6 rounded-[2rem] border flex items-center justify-between shadow-sm">
            <div>
                <h5 className="font-black text-slate-800 text-sm uppercase">{o.productName}</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{o.date}</p>
            </div>
            <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase ${o.status === OrderStatus.PENDING ? 'bg-orange-50 text-orange-600' : o.status === OrderStatus.REJECTED ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{o.status}</span>
          </div>
        ))}
      </div>
    </div>
    <Button variant="outline" onClick={onLogout} className="w-full py-5 rounded-[2rem] text-[10px] font-black uppercase">Sair</Button>
  </div>
);

const AdminPanel: React.FC<{ 
  members: User[]; 
  products: Product[]; 
  orders: Order[]; 
  branding: AppBranding; 
  onAction: (type: string, p: any) => void; 
  onImportFile: (base64: string, mime: string) => Promise<void>; 
}> = ({ members, products, orders, branding, onAction, onImportFile }) => {
  const [tab, setTab] = useState<'orders' | 'members' | 'products' | 'clockify' | 'branding'>('orders');
  const [loading, setLoading] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingBalance, setAdjustingBalance] = useState<{ id: string, name: string, current: number } | null>(null);
  
  const [newMember, setNewMember] = useState({ name: '', email: '', clockifyId: '' });
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, image: '' });
  const [balanceAdjustValue, setBalanceAdjustValue] = useState<number>(0);

  return (
    <div className="p-6 pb-32 max-w-4xl mx-auto space-y-8">
      <div className="flex bg-slate-200/50 p-2 rounded-[2rem] overflow-x-auto gap-2">
        {['orders', 'members', 'products', 'clockify', 'branding'].map(t => (
          <button key={t} onClick={() => setTab(t as any)} className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${tab === t ? 'bg-white shadow-lg text-mectria-red' : 'text-slate-500'}`}>
            {t === 'orders' ? 'Pedidos' : t === 'members' ? 'Time' : t === 'products' ? 'Loja' : t === 'clockify' ? 'Conversor' : 'Sistema'}
          </button>
        ))}
      </div>

      {tab === 'clockify' && (
        <div className="bg-white p-12 rounded-[3.5rem] border shadow-sm text-center space-y-8">
          <h4 className="font-black uppercase text-lg text-slate-800 tracking-tight">Importar Clockify</h4>
          <FileInput label="Relatório PDF" accept="application/pdf,image/*" onChange={async (b, m) => { setLoading(true); await onImportFile(b, m); setLoading(false); }} />
          {loading && <p className="text-[10px] font-black text-mectria-red animate-pulse">PROCESSANDO...</p>}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          <h4 className="font-black uppercase text-xs px-2 border-l-4 border-mectria-red">Pedidos Pendentes</h4>
          {orders.filter(o => o.status === OrderStatus.PENDING).map(o => {
            const m = members.find(u => u.id === o.userId);
            return (
              <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border flex items-center gap-6 shadow-sm">
                <img src={m?.avatar} className="w-14 h-14 rounded-2xl object-cover bg-slate-50" />
                <div className="flex-1">
                  <h5 className="font-black text-slate-800 text-sm uppercase">{m?.name}</h5>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{o.productName} • {o.price} TK</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => onAction('approve_order', o)} variant="success" className="p-3"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></Button>
                  <Button onClick={() => onAction('reject_order', o)} variant="danger" className="p-3"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-black uppercase text-xs px-2 border-l-4 border-mectria-red">Equipe Mectria</h4>
            <Button onClick={() => setShowMemberModal(true)} variant="primary" className="text-[10px] px-6 rounded-full font-black uppercase">Novo Membro</Button>
          </div>
          <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[9px] font-black uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">Membro</th>
                  <th className="px-6 py-4">Saldo</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {members.sort((a,b)=>a.name.localeCompare(b.name)).map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3 font-bold"><img src={m.avatar} className="w-8 h-8 rounded-full object-cover" /> {m.name}</td>
                    <td className="px-6 py-4 font-black text-mectria-red">{m.balance} TK</td>
                    <td className="px-6 py-4 flex items-center gap-4">
                      <button onClick={() => setAdjustingBalance({ id: m.id, name: m.name, current: m.balance })} className="text-blue-500 hover:text-blue-700 font-black uppercase text-[9px]">Ajustar</button>
                      <button onClick={() => onAction('delete_member', m.id)} className="text-red-400 hover:text-red-600 font-black uppercase text-[9px]">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-black uppercase text-xs px-2 border-l-4 border-mectria-red">Itens da Loja</h4>
            <Button onClick={() => setShowProductModal(true)} variant="primary" className="text-[10px] px-6 rounded-full font-black uppercase">Novo Produto</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-[2rem] border flex flex-col gap-3 group relative">
                <img src={p.image} className="w-full h-24 object-cover rounded-2xl" />
                <div>
                   <h6 className="font-black text-xs uppercase truncate">{p.name}</h6>
                   <p className="text-[10px] font-bold text-mectria-red">{p.price} TK</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingProduct(p)} className="p-2 bg-white/90 rounded-xl text-blue-500 shadow-sm hover:bg-blue-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => onAction('delete_product', p.id)} className="p-2 bg-white/90 rounded-xl text-red-500 shadow-sm hover:bg-red-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'branding' && (
        <div className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-10">
          <h4 className="font-black uppercase text-xs px-2 border-l-4 border-mectria-red">Identidade Visual</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FileInput label="Logo da Tela de Login" preview={branding.loginLogo} onChange={(b) => onAction('update_branding', { ...branding, loginLogo: b })} />
            <FileInput label="Logo do Topo da Loja" preview={branding.storeLogo} onChange={(b) => onAction('update_branding', { ...branding, storeLogo: b })} />
          </div>
          <p className="text-center text-[9px] font-bold text-slate-400 uppercase">Dica: Use logos em PNG transparente para melhor resultado.</p>
        </div>
      )}

      {/* Modal Adicionar Membro */}
      {showMemberModal && (
        <Modal title="Novo Membro" onClose={() => setShowMemberModal(false)}>
          <div className="space-y-4">
            <Input label="Nome Completo" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="Ex: Marcelo Zaiden" />
            <Input label="E-mail Corporativo" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} placeholder="Ex: marcelo.zaiden@mectria.com" />
            <Input label="ID Clockify (Nome no Relatório)" value={newMember.clockifyId} onChange={e => setNewMember({...newMember, clockifyId: e.target.value})} placeholder="Nome exato do Clockify" />
            <Button onClick={() => { onAction('add_member', newMember); setShowMemberModal(false); setNewMember({name:'', email:'', clockifyId:''}); }} className="w-full py-4 text-[10px] font-black uppercase mt-4">Salvar Membro</Button>
          </div>
        </Modal>
      )}

      {/* Modal Adicionar Produto */}
      {showProductModal && (
        <Modal title="Novo Produto" onClose={() => setShowProductModal(false)}>
          <div className="space-y-4">
            <Input label="Nome do Produto" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            <Input label="Preço (Tokens)" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value) || 0})} />
            <FileInput label="Imagem do Produto" onChange={(b) => setNewProduct({...newProduct, image: b})} preview={newProduct.image} />
            <Button onClick={() => { onAction('add_product', newProduct); setShowProductModal(false); setNewProduct({name:'', price:0, image:''}); }} className="w-full py-4 text-[10px] font-black uppercase mt-4">Cadastrar Item</Button>
          </div>
        </Modal>
      )}

      {/* Modal Editar Produto */}
      {editingProduct && (
        <Modal title="Editar Produto" onClose={() => setEditingProduct(null)}>
          <div className="space-y-4">
            <Input label="Nome do Produto" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
            <Input label="Preço (Tokens)" type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} />
            <FileInput label="Alterar Imagem" onChange={(b) => setEditingProduct({...editingProduct, image: b})} preview={editingProduct.image} />
            <Button onClick={() => { onAction('update_product', editingProduct); setEditingProduct(null); }} className="w-full py-4 text-[10px] font-black uppercase mt-4">Salvar Alterações</Button>
          </div>
        </Modal>
      )}

      {/* Modal Ajustar Saldo */}
      {adjustingBalance && (
        <Modal title={`Ajustar Saldo: ${adjustingBalance.name}`} onClose={() => setAdjustingBalance(null)}>
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase">Saldo Atual</span>
              <p className="text-2xl font-black text-slate-800">{adjustingBalance.current} TK</p>
            </div>
            <Input label="Valor a adicionar/remover" type="number" value={balanceAdjustValue} onChange={e => setBalanceAdjustValue(parseInt(e.target.value) || 0)} placeholder="Ex: 10 ou -10" />
            <div className="flex gap-3">
              <Button onClick={() => { onAction('adjust_balance', { id: adjustingBalance.id, amount: balanceAdjustValue }); setAdjustingBalance(null); setBalanceAdjustValue(0); }} variant="primary" className="flex-1 py-4 text-[10px] font-black uppercase">Atualizar Saldo</Button>
            </div>
            <p className="text-[9px] font-bold text-slate-400 text-center uppercase">Use valores negativos para remover tokens do membro.</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Main App ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [branding, setBranding] = useState<AppBranding>({ loginLogo: null, storeLogo: null });
  const [page, setPage] = useState<'home' | 'profile' | 'admin'>('home');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [activeNotification, setActiveNotification] = useState<Order | null>(null);
  const [adjustingAvatar, setAdjustingAvatar] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubMembers = onSnapshot(collection(db, "members"), ss => {
        const loaded = ss.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setMembers(loaded);
        setIsInitializing(false);
      });
      const unsubProducts = onSnapshot(collection(db, "products"), ss => setProducts(ss.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))));
      const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("timestamp", "desc")), ss => {
        const allOrders = ss.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(allOrders);
        if (user) {
          const unviewed = allOrders.find(o => o.userId === user.id && o.status !== OrderStatus.PENDING && !o.viewed);
          if (unviewed) setActiveNotification(unviewed);
        }
      });
      const unsubBranding = onSnapshot(doc(db, "config", "branding"), ds => ds.exists() && setBranding(ds.data() as AppBranding));
      return () => { unsubMembers(); unsubProducts(); unsubOrders(); unsubBranding(); };
    } catch (e) { setIsInitializing(false); }
  }, [user]);

  useEffect(() => {
    if (user) {
      const live = members.find(m => m.id === user.id);
      if (live && (live.balance !== user.balance || live.avatar !== user.avatar)) setUser(live);
    }
  }, [members, user]);

  const handleAction = async (type: string, p: any) => {
    try {
      if (type === 'approve_order') await updateDoc(doc(db, "orders", p.id), { status: OrderStatus.DELIVERED, viewed: false, updatedAt: Date.now() });
      if (type === 'reject_order') {
        await updateDoc(doc(db, "orders", p.id), { status: OrderStatus.REJECTED, viewed: false, updatedAt: Date.now() });
        await updateDoc(doc(db, "members", p.userId), { balance: increment(p.price) });
      }
      if (type === 'delete_member') await deleteDoc(doc(db, "members", p));
      if (type === 'add_member') await addDoc(collection(db, "members"), { ...p, role: Role.USER, balance: 0, avatar: 'https://i.pravatar.cc/150' });
      if (type === 'adjust_balance') await updateDoc(doc(db, "members", p.id), { balance: increment(p.amount) });
      if (type === 'delete_product') await deleteDoc(doc(db, "products", p));
      if (type === 'add_product') await addDoc(collection(db, "products"), p);
      if (type === 'update_product') {
        const { id, ...data } = p;
        await updateDoc(doc(db, "products", id), data);
      }
      if (type === 'update_branding') await setDoc(doc(db, "config", "branding"), p);
    } catch (e) { console.error(type, e); }
  };

  const handleBuy = async (p: Product) => {
    if (!user || user.balance < p.price) return;
    try {
      const orderData = {
        userId: user.id, productId: p.id, productName: p.name, price: p.price, status: OrderStatus.PENDING,
        date: new Date().toLocaleDateString('pt-BR'), timestamp: Date.now(), viewed: false
      };
      await addDoc(collection(db, "orders"), orderData);
      await updateDoc(doc(db, "members", user.id), { balance: increment(-p.price) });
    } catch (e) { alert("Erro ao processar pedido."); }
  };

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-widest text-[10px]">Sincronizando Mectria...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {!user ? (
        <Login members={members} onLogin={setUser} branding={branding} />
      ) : (
        <>
          {adjustingAvatar && <ImageAdjuster src={adjustingAvatar} onConfirm={async b => { await updateDoc(doc(db, "members", user.id), { avatar: b }); setAdjustingAvatar(null); }} onCancel={() => setAdjustingAvatar(null)} />}
          {activeNotification && <FeedbackToast order={activeNotification} onClose={async () => { await updateDoc(doc(db, "orders", activeNotification.id), { viewed: true }); setActiveNotification(null); }} />}

          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-white/80 backdrop-blur-2xl px-10 py-6 flex items-center justify-between z-50 rounded-[3.5rem] shadow-2xl border border-white">
            <button onClick={() => setPage('home')} className={`flex flex-col items-center gap-1.5 ${page === 'home' ? 'text-mectria-red font-black scale-110' : 'text-slate-300'}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
              <span className="text-[7px] uppercase font-black">Loja</span>
            </button>
            <button onClick={() => setPage('profile')} className={`flex flex-col items-center gap-1.5 relative ${page === 'profile' ? 'text-mectria-red font-black scale-110' : 'text-slate-300'}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
              <span className="text-[7px] uppercase font-black">Perfil</span>
            </button>
            {user.role === Role.ADMIN && (
              <button onClick={() => setPage('admin')} className={`flex flex-col items-center gap-1.5 ${page === 'admin' ? 'text-mectria-red font-black scale-110' : 'text-slate-300'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
                <span className="text-[7px] uppercase font-black">Admin</span>
              </button>
            )}
          </nav>
          <main>
            {page === 'home' && <Store user={user} products={products} branding={branding} onBuy={handleBuy} />}
            {page === 'profile' && <Profile user={user} orders={orders} onLogout={() => setUser(null)} onStartAvatarUpdate={setAdjustingAvatar} />}
            {page === 'admin' && (
              <AdminPanel 
                members={members} products={products} orders={orders} branding={branding} onAction={handleAction} 
                onImportFile={async (b, m) => {
                  const data = await parseClockifyReport(b, m);
                  const batch = writeBatch(db);
                  data.forEach(entry => {
                    const m = members.find(u => u.name.toLowerCase().includes(entry.user.toLowerCase()) || u.clockifyId.toLowerCase() === entry.user.toLowerCase());
                    if (m) batch.update(doc(db, "members", m.id), { balance: increment(entry.tokens) });
                  });
                  await batch.commit();
                }} 
              />
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
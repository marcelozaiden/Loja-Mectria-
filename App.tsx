
import React, { useState, useEffect } from 'react';
import { User, Product, Order, Role, OrderStatus, SiteSettings, ClockifyData } from './types';
import { GearLogo, ADMIN_EMAIL, INITIAL_MEMBERS, INITIAL_PRODUCTS } from './constants';
import { db } from './firebase';
import { 
  collection, onSnapshot, doc, query, orderBy, writeBatch, 
  increment, getDocs, updateDoc, setDoc, deleteDoc 
} from "firebase/firestore";
import { parseClockifyReport } from './services/geminiService';

// --- Componentes de UI ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button" }: any) => {
  const styles = {
    primary: "bg-[#8B0000] text-white hover:bg-red-800",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700",
    info: "bg-blue-50 text-blue-600 hover:bg-blue-100"
  };
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const IconSearch = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;

const LegendaryEmbers = () => {
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Math.random();
      const left = Math.random() * 100;
      const size = Math.random() * 5 + 3;
      const duration = Math.random() * 2 + 1.5;
      setParticles(prev => [...prev.slice(-25), { id, left, size, duration }]);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="ember-particle"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

const ImportModal = ({ isOpen, onClose, onImport, members }: { isOpen: boolean, onClose: () => void, onImport: (data: ClockifyData[]) => void, members: User[] }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ClockifyData[]>([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await parseClockifyReport(base64, file.type);
        setPreviewData(result);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
        <div className="p-8 border-b flex justify-between items-center">
          <h2 className="text-xl font-black uppercase">Importar Horas (Clockify)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>
        <div className="p-8 overflow-y-auto flex-1">
          {!previewData.length ? (
            <div className="text-center py-12">
              <label className={`cursor-pointer inline-block px-10 py-6 rounded-3xl border-2 border-dashed border-gray-200 hover:border-[#8B0000] transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-black text-gray-400 uppercase">A IA está processando o CSV...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    <p className="text-sm font-black text-gray-400 uppercase">Selecionar Relatório CSV</p>
                  </div>
                )}
                <input type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={isProcessing} />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-4">Prévia da Conversão (Taxa 0.4 TK/h - Arredondado p/ Cima)</p>
              {previewData.map((d, i) => {
                const member = members.find(m => m.name.toLowerCase().includes(d.user.toLowerCase()));
                return (
                  <div key={i} className={`p-4 rounded-2xl flex items-center justify-between ${member ? 'bg-gray-50' : 'bg-red-50 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${member ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="text-sm font-black uppercase">{d.user}</p>
                        <p className="text-[10px] font-bold text-gray-400">{d.duration} • {member ? 'Membro Identificado' : 'Não encontrado'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-[#8B0000]">{d.tokens} TK</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-8 border-t bg-gray-50 flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => setPreviewData([])}>LIMPAR</Button>
          <Button className="flex-1" disabled={!previewData.length || isProcessing} onClick={() => onImport(previewData)}>CONFIRMAR E CREDITAR</Button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({ loginLogo: '', storeLogo: '' });
  const [view, setView] = useState<'store' | 'profile' | 'admin'>('store');
  const [adminTab, setAdminTab] = useState<'orders' | 'members' | 'products' | 'logos'>('orders');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', image: '' });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [adjAmounts, setAdjAmounts] = useState<{[key: string]: string}>({});

  useEffect(() => {
    async function init() {
      const membersSnap = await getDocs(collection(db, "members"));
      if (membersSnap.empty) {
        const batch = writeBatch(db);
        INITIAL_MEMBERS.forEach(m => batch.set(doc(db, "members", m.id), { ...m, isMemberOfMonth: false }));
        INITIAL_PRODUCTS.forEach(p => batch.set(doc(db, "products", p.id), p));
        await batch.commit();
      }
      onSnapshot(doc(db, "settings", "branding"), (doc) => {
        if (doc.exists()) setSettings(doc.data() as SiteSettings);
      });
    }
    init();

    const unsubMembers = onSnapshot(collection(db, "members"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setMembers(data);
      if (user) {
        const updated = data.find(m => m.id === user.id);
        if (updated) {
          const finalUser = updated.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? { ...updated, role: Role.ADMIN } : updated;
          setUser(finalUser);
        }
      }
      setLoading(false);
    });

    onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });

    onSnapshot(query(collection(db, "orders"), orderBy("timestamp", "desc")), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });
  }, [user?.id]);

  const handleBuy = async (p: Product) => {
    // Garante que o saldo seja tratado como inteiro para segurança
    const userBalance = Math.floor(user?.balance || 0);
    if (!user || userBalance < p.price) return;
    try {
      const batch = writeBatch(db);
      const orderRef = doc(collection(db, "orders"));
      batch.set(orderRef, {
        userId: user.id, userName: user.name, productId: p.id, productName: p.name,
        price: p.price, status: OrderStatus.PENDING, date: new Date().toLocaleDateString('pt-BR'),
        timestamp: Date.now()
      });
      batch.update(doc(db, "members", user.id), { balance: increment(-p.price) });
      await batch.commit();
      alert("Resgate realizado com sucesso!");
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateUser = async (uId: string, data: Partial<User>) => {
    // Se o balanço for atualizado, garantimos que seja inteiro
    if (data.balance !== undefined) {
      data.balance = Math.ceil(data.balance);
    }
    await updateDoc(doc(db, "members", uId), data);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;
    try {
      const id = `m${Date.now()}`;
      const email = newMemberEmail.toLowerCase().trim();
      const newMember: User = {
        id, name: newMemberName, email,
        role: email === ADMIN_EMAIL.toLowerCase() ? Role.ADMIN : Role.USER,
        isMemberOfMonth: false, clockifyId: newMemberName, balance: 0,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };
      await setDoc(doc(db, "members", id), newMember);
      setIsAddingMember(false);
      setNewMemberName(''); setNewMemberEmail('');
      alert("Membro cadastrado!");
    } catch (err: any) { alert("Erro: " + err.message); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, price, image } = productForm;
    if (!name || !price || !image) {
      alert("Preencha todos os campos e selecione uma imagem.");
      return;
    }
    
    try {
      const finalPrice = Math.ceil(Number(price));
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), {
          name, price: finalPrice, image
        });
        alert("Produto atualizado!");
        setEditingProduct(null);
      } else {
        const id = `p${Date.now()}`;
        await setDoc(doc(db, "products", id), {
          id, name, price: finalPrice, image
        });
        alert("Produto adicionado!");
        setIsAddingProduct(false);
      }
      setProductForm({ name: '', price: '', image: '' });
    } catch (err: any) { alert("Erro: " + err.message); }
  };

  const handleImportClockify = async (data: ClockifyData[]) => {
    try {
      const batch = writeBatch(db);
      let count = 0;
      data.forEach(d => {
        const member = members.find(m => m.name.toLowerCase().includes(d.user.toLowerCase()));
        if (member) {
          // Os tokens da IA já devem vir inteiros, mas garantimos aqui novamente
          const tokensToAdd = Math.ceil(d.tokens);
          batch.update(doc(db, "members", member.id), { balance: increment(tokensToAdd) });
          count++;
        }
      });
      await batch.commit();
      setIsImportModalOpen(false);
      alert(`${count} membros receberam créditos com sucesso!`);
    } catch (err: any) {
      alert("Erro ao aplicar créditos: " + err.message);
    }
  };

  const startEditingProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ name: p.name, price: String(p.price), image: p.image });
    setIsAddingProduct(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Deseja remover este produto?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateSettings = async (data: Partial<SiteSettings>) => {
    await setDoc(doc(db, "settings", "branding"), data, { merge: true });
    alert("Configurações atualizadas!");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Login members={members} onLogin={setUser} settings={settings} />;

  const isMemberOfMonth = user.isMemberOfMonth;

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col pb-32">
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {settings.storeLogo ? <img src={settings.storeLogo} className="h-8" alt="Logo" /> : <GearLogo />}
          <div className="relative hidden md:block">
            <input 
              type="text" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-full border-none focus:ring-1 focus:ring-red-800 text-sm w-64"
            />
            <div className="absolute left-3 top-2.5 text-gray-400"><IconSearch /></div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <img 
            src={user.avatar} 
            className={`w-10 h-10 rounded-full border border-gray-200 object-cover ${isMemberOfMonth ? 'legendary-avatar' : ''}`} 
            alt="Avatar" 
          />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 animate-fade-in">
        {view === 'store' && (
          <div className="space-y-8">
            <div className={`rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 shadow-lg ${isMemberOfMonth ? 'legendary-card' : 'bg-[#8B0000]'}`}>
               {isMemberOfMonth && <LegendaryEmbers />}
               <div className="flex items-center gap-8 z-10">
                  <div className="relative">
                    <img 
                      src={user.avatar} 
                      className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-white/20 shadow-2xl object-cover transition-transform hover:scale-105 ${isMemberOfMonth ? 'legendary-avatar' : ''}`} 
                      alt="Sua foto" 
                    />
                    {isMemberOfMonth && <div className="absolute -top-3 -right-3 bg-yellow-400 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg animate-bounce">Lendário ★</div>}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Bem-vindo(a),</p>
                    <h1 className="text-3xl md:text-5xl font-black">{user.name.split(' ')[0]}</h1>
                    <div className="flex flex-wrap gap-2 mt-4">
                       <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-black/10">
                         {user.role === Role.ADMIN ? 'Administrador ⚙️' : 'Membro Staff 🤝'}
                       </span>
                       {isMemberOfMonth && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white text-orange-600">Membro do Mês 🏆</span>}
                    </div>
                  </div>
               </div>
               <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-10 flex flex-col items-center justify-center border border-white/10 z-10 min-w-[240px] shadow-inner text-center">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Seus Tokens</span>
                 <div className="flex items-center gap-3">
                   <span className="text-6xl font-black tabular-nums">{Math.floor(user.balance)}</span>
                   <span className="text-sm font-bold opacity-80">TK</span>
                 </div>
               </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">Vitrine</h2>
              <span className="text-xs text-gray-400 font-bold uppercase">{products.length} itens</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} className="bg-white rounded-[2rem] p-5 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all border border-gray-100">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-50">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800 line-clamp-1 uppercase">{p.name}</h3>
                    <p className="text-xs text-[#8B0000] font-black mt-1">● {p.price} tokens</p>
                  </div>
                  <Button onClick={() => handleBuy(p)} disabled={Math.floor(user.balance) < p.price} className="w-full mt-auto py-3">RESGATAR</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="max-w-xl mx-auto py-4">
            <div className={`rounded-[3.5rem] p-12 text-center relative overflow-hidden shadow-lg bg-white ${isMemberOfMonth ? 'legendary-card text-white' : ''}`}>
               {isMemberOfMonth && <LegendaryEmbers />}
               <h2 className={`text-xs font-black uppercase tracking-[0.4em] ${isMemberOfMonth ? 'text-white/60' : 'text-gray-400'} mb-10 z-10 relative`}>Meu Perfil</h2>
               <div className="relative inline-block mb-6 group z-10">
                  <img src={user.avatar} className={`w-40 h-40 rounded-[2.5rem] mx-auto border-4 border-white shadow-xl object-cover ${isMemberOfMonth ? 'legendary-avatar' : ''}`} alt="Avatar" />
                  <label className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (base64) => handleUpdateUser(user.id, { avatar: base64 }))} />
                  </label>
               </div>
               <h3 className={`text-4xl font-black tracking-tight ${isMemberOfMonth ? 'text-white' : 'text-gray-900'} relative z-10`}>{user.name}</h3>
               <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-60 relative z-10`}>{user.email}</p>
               <div className={`mt-10 p-10 rounded-3xl flex items-center justify-between z-10 relative ${isMemberOfMonth ? 'bg-white/10' : 'bg-gray-50'}`}>
                  <div className="text-left">
                    <p className={`text-[10px] font-black uppercase ${isMemberOfMonth ? 'text-white/50' : 'text-gray-400'}`}>Saldo Atual</p>
                    <p className={`text-4xl font-black ${isMemberOfMonth ? 'text-white' : 'text-gray-800'}`}>{Math.floor(user.balance)} <span className="text-sm">TK</span></p>
                  </div>
                  <div className={`p-4 rounded-2xl ${isMemberOfMonth ? 'bg-white text-orange-600' : 'bg-red-50 text-[#8B0000]'}`}>
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/></svg>
                  </div>
               </div>
               <Button variant="outline" className={`w-full mt-12 py-5 border-2 rounded-2xl ${isMemberOfMonth ? 'border-white text-white hover:bg-white/10' : ''}`} onClick={() => setUser(null)}>SAIR DA CONTA</Button>
            </div>
          </div>
        )}

        {view === 'admin' && user.role === Role.ADMIN && (
          <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col border border-gray-100 animate-fade-in">
            <div className="px-10 py-8 border-b border-gray-100 bg-gray-50/20 flex justify-between items-center">
               <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Painel de <span className="text-[#8B0000]">Gestão</span></h2>
               <Button variant="info" onClick={() => setIsImportModalOpen(true)}>IMPORTAR CLOCKIFY</Button>
            </div>
            <div className="flex px-10 border-b border-gray-100 bg-white overflow-x-auto no-scrollbar">
               {[
                 { id: 'orders', label: 'PEDIDOS' },
                 { id: 'members', label: 'MEMBROS' },
                 { id: 'products', label: 'ESTOQUE' },
                 { id: 'logos', label: 'LOGOS' }
               ].map((tab) => (
                 <button 
                   key={tab.id} 
                   onClick={() => setAdminTab(tab.id as any)} 
                   className={`px-8 py-5 text-[10px] font-black tracking-widest transition-all ${adminTab === tab.id ? 'text-[#8B0000] border-b-4 border-[#8B0000]' : 'text-gray-400'}`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            <div className="p-10 flex-1 overflow-y-auto">
              {adminTab === 'members' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-gray-400">Controle de Membros</h3>
                    <Button onClick={() => setIsAddingMember(!isAddingMember)} variant={isAddingMember ? "danger" : "primary"}>
                      {isAddingMember ? "CANCELAR" : "+ NOVO MEMBRO"}
                    </Button>
                  </div>
                  {isAddingMember && (
                    <form onSubmit={handleAddMember} className="bg-gray-50 border p-8 rounded-[2rem] space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" required value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="w-full bg-white px-5 py-3 rounded-xl border outline-none" placeholder="Nome" />
                        <input type="email" required value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} className="w-full bg-white px-5 py-3 rounded-xl border outline-none" placeholder="Email @mectria.com" />
                      </div>
                      <Button type="submit" className="w-full py-4">CADASTRAR</Button>
                    </form>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {members.map(m => (
                      <div key={m.id} className={`p-6 rounded-3xl border transition-all ${m.isMemberOfMonth ? 'border-orange-200 bg-orange-50' : 'bg-gray-50 border-gray-100'}`}>
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                               <img src={m.avatar} className="w-14 h-14 rounded-2xl object-cover border border-white" alt="Membro" />
                               <div>
                                  <p className="text-sm font-black text-gray-900">{m.name}</p>
                                  <div className="flex gap-1 mt-1">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${m.role === Role.ADMIN ? 'bg-red-800 text-white' : 'bg-gray-200 text-gray-400'}`}>{m.role}</span>
                                    {m.isMemberOfMonth && <span className="text-[8px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-full">★ MÊS</span>}
                                  </div>
                               </div>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                                <select value={m.role} onChange={(e) => handleUpdateUser(m.id, { role: e.target.value as Role })}
                                  className="text-[9px] font-black border rounded-lg p-1.5 bg-white outline-none uppercase">
                                  <option value={Role.USER}>Membro</option>
                                  <option value={Role.ADMIN}>Admin</option>
                                </select>
                                <button onClick={() => handleUpdateUser(m.id, { isMemberOfMonth: !m.isMemberOfMonth })}
                                  className={`text-[9px] font-black px-2 py-1.5 rounded-lg uppercase ${m.isMemberOfMonth ? 'bg-orange-600 text-white' : 'bg-white text-gray-400 border shadow-sm'}`}>
                                  {m.isMemberOfMonth ? 'REMOVER DESTAQUE' : 'DESTAQUE MÊS'}
                                </button>
                            </div>
                         </div>
                         <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-50">
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase">Saldo</p>
                               <p className="text-xl font-black text-gray-900">{Math.floor(m.balance)} TK</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                 <input type="number" step="1" value={adjAmounts[m.id] || ''} onChange={(e) => setAdjAmounts({...adjAmounts, [m.id]: e.target.value})}
                                   className="w-14 bg-gray-50 border rounded-lg px-2 py-1.5 text-xs font-black outline-none" />
                                 <button onClick={() => { 
                                   const val = Math.ceil(Math.abs(Number(adjAmounts[m.id]))); 
                                   if (val) handleUpdateUser(m.id, { balance: increment(-val) }); 
                                   setAdjAmounts({...adjAmounts, [m.id]: ''}); 
                                 }}
                                   className="w-8 h-8 rounded-lg bg-red-50 text-red-600 font-black">-</button>
                                 <button onClick={() => { 
                                   const val = Math.ceil(Math.abs(Number(adjAmounts[m.id]))); 
                                   if (val) handleUpdateUser(m.id, { balance: increment(val) }); 
                                   setAdjAmounts({...adjAmounts, [m.id]: ''}); 
                                 }}
                                   className="w-8 h-8 rounded-lg bg-green-50 text-green-600 font-black">+</button>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {adminTab === 'orders' && (
                <div className="space-y-4">
                  {orders.filter(o => o.status === OrderStatus.PENDING).map(o => (
                    <div key={o.id} className="bg-gray-50 p-8 rounded-3xl flex items-center justify-between border border-gray-100">
                      <div className="flex items-center gap-6">
                        <div className="bg-white p-5 rounded-2xl shadow-sm text-[#8B0000] font-black text-2xl">{o.price}</div>
                        <div>
                          <p className="text-md font-black text-gray-900 uppercase">{o.userName}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase">{o.productName}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <Button onClick={async () => {
                           const batch = writeBatch(db);
                           batch.update(doc(db, "orders", o.id), { status: OrderStatus.REJECTED });
                           batch.update(doc(db, "members", o.userId), { balance: increment(o.price) });
                           await batch.commit();
                         }} variant="danger">RECUSAR</Button>
                         <Button onClick={() => updateDoc(doc(db, "orders", o.id), { status: OrderStatus.DELIVERED })} variant="success">ENTREGAR</Button>
                      </div>
                    </div>
                  ))}
                  {orders.filter(o => o.status === OrderStatus.PENDING).length === 0 && <p className="text-center text-gray-400 py-16 font-black uppercase text-xs tracking-widest">Sem pedidos pendentes.</p>}
                </div>
              )}
              {adminTab === 'products' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-gray-400">Estoque de Produtos</h3>
                    <Button onClick={() => { 
                      setIsAddingProduct(!isAddingProduct); 
                      setEditingProduct(null); 
                      setProductForm({ name: '', price: '', image: '' });
                    }} variant={(isAddingProduct || editingProduct) ? "danger" : "primary"}>
                      {(isAddingProduct || editingProduct) ? "CANCELAR" : "+ NOVO PRODUTO"}
                    </Button>
                  </div>
                  
                  {(isAddingProduct || editingProduct) && (
                    <form onSubmit={handleProductSubmit} className="bg-gray-50 border p-8 rounded-[2rem] space-y-6 animate-fade-in shadow-inner">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-white border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center relative group overflow-hidden">
                           {productForm.image ? (
                             <img src={productForm.image} className="w-full h-full object-cover" />
                           ) : (
                             <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                           )}
                           <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                             <span className="text-white text-[10px] font-black uppercase">Alterar Foto</span>
                             <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleFileUpload(e, (base64) => setProductForm({...productForm, image: base64}))} />
                           </label>
                        </div>
                        <div className="flex-1 space-y-4">
                          <input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-white px-5 py-3 rounded-xl border outline-none font-bold" placeholder="Nome do Produto" />
                          <input type="number" step="1" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-white px-5 py-3 rounded-xl border outline-none font-bold" placeholder="Preço em Tokens" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full py-4">{editingProduct ? "SALVAR ALTERAÇÕES" : "ADICIONAR PRODUTO"}</Button>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {products.map(p => (
                      <div key={p.id} className="bg-white border p-4 rounded-3xl flex flex-col gap-3 shadow-sm group hover:border-[#8B0000]/30 transition-colors">
                         <img src={p.image} className="w-full aspect-square object-cover rounded-2xl bg-gray-50" />
                         <div className="flex items-center justify-between">
                           <div>
                             <p className="font-black text-sm uppercase text-gray-800">{p.name}</p>
                             <p className="text-xs font-bold text-[#8B0000]">{p.price} TK</p>
                           </div>
                           <div className="flex gap-1">
                             <button onClick={() => startEditingProduct(p)} className="p-2 text-gray-300 hover:text-blue-600 transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                             </button>
                             <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {adminTab === 'logos' && (
                <div className="space-y-12">
                   <div className="bg-gray-50 p-8 rounded-[2.5rem] border space-y-6">
                     <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Logo de Login</h3>
                     <div className="flex items-center gap-8">
                        <div className="w-32 h-32 bg-white border rounded-3xl flex items-center justify-center p-4">
                           {settings.loginLogo ? <img src={settings.loginLogo} className="max-w-full" /> : <GearLogo />}
                        </div>
                        <div className="flex-1 space-y-3">
                           <p className="text-xs text-gray-500">Esta logo aparecerá na tela de entrada do sistema.</p>
                           <label className="inline-block bg-[#8B0000] text-white px-6 py-3 rounded-xl font-bold text-xs cursor-pointer hover:bg-red-800">
                              ALTERAR LOGO LOGIN
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (base64) => updateSettings({ loginLogo: base64 }))} />
                           </label>
                        </div>
                     </div>
                   </div>

                   <div className="bg-gray-50 p-8 rounded-[2.5rem] border space-y-6">
                     <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Logo da Loja (Header)</h3>
                     <div className="flex items-center gap-8">
                        <div className="w-32 h-32 bg-white border rounded-3xl flex items-center justify-center p-4">
                           {settings.storeLogo ? <img src={settings.storeLogo} className="max-w-full" /> : <GearLogo />}
                        </div>
                        <div className="flex-1 space-y-3">
                           <p className="text-xs text-gray-500">Esta logo aparecerá no topo da loja.</p>
                           <label className="inline-block bg-[#8B0000] text-white px-6 py-3 rounded-xl font-bold text-xs cursor-pointer hover:bg-red-800">
                              ALTERAR LOGO LOJA
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (base64) => updateSettings({ storeLogo: base64 }))} />
                           </label>
                        </div>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav-container">
        <div 
          onClick={() => setView('store')} 
          className={`nav-item ${view === 'store' ? 'active' : 'inactive'}`}
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="nav-label">LOJA</span>
        </div>
        
        <div 
          onClick={() => setView('profile')} 
          className={`nav-item ${view === 'profile' ? 'active' : 'inactive'}`}
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span className="nav-label">PERFIL</span>
        </div>

        {user.role === Role.ADMIN && (
          <div 
            onClick={() => { setAdminTab('orders'); setView('admin'); }} 
            className={`nav-item ${view === 'admin' ? 'active' : 'inactive'}`}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
            </svg>
            <span className="nav-label">ADMIN</span>
          </div>
        )}
      </nav>

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={handleImportClockify}
        members={members}
      />
    </div>
  );
}

function Login({ members, onLogin, settings }: { members: User[], onLogin: (u: User) => void, settings: SiteSettings }) {
  const [email, setEmail] = useState('');
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white p-14 rounded-[4rem] card-shadow text-center flex flex-col items-center gap-10 border border-white">
        <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center border border-gray-100 p-2 shadow-inner">
           {settings.loginLogo ? <img src={settings.loginLogo} className="max-w-[80%]" alt="Marca" /> : <GearLogo />}
        </div>
        <div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Mectria <span className="text-[#8B0000]">Store</span></h1>
           <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-[0.6em]">Portal Staff</p>
        </div>
        
        <div className="w-full space-y-6">
           <input type="email" value={email} onChange={e => setEmail(e.target.value)} 
             placeholder="usuario@mectria.com"
             className="w-full px-8 py-5 bg-gray-50 rounded-3xl border-none outline-none text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-[#8B0000]/10 transition-all text-center" />
           <button 
             onClick={() => {
               const normalizedEmail = email.trim().toLowerCase();
               const m = members.find(u => u.email.toLowerCase() === normalizedEmail);
               if (m) {
                 const finalUser = normalizedEmail === ADMIN_EMAIL.toLowerCase() ? { ...m, role: Role.ADMIN } : m;
                 onLogin(finalUser);
               } else if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
                 onLogin({
                   id: 'admin-root', name: 'Marcelo Admin', email: normalizedEmail,
                   role: Role.ADMIN, clockifyId: 'Marcelo Admin', balance: 0, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`
                 });
               } else {
                 alert("E-mail não autorizado.");
               }
             }} 
             className="w-full py-6 bg-[#8B0000] text-white font-black rounded-3xl shadow-xl hover:bg-red-800 transition-all uppercase tracking-widest text-[11px]"
           >
              ENTRAR NA CONTA
           </button>
        </div>
        <div className="w-full border-t border-gray-100 pt-8 mt-4">
           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed text-center">
             Uso exclusivo interno da Mectria. <br/>
             <span className="opacity-50 text-center">v4.6 - Edição Corporativa</span>
           </p>
        </div>
      </div>
    </div>
  );
}

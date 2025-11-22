
import React, { useState, useEffect } from 'react';
import { User, Item, Reservation, ReservationItem, DamageReport } from './types';
import { Login } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Team } from './components/Team';
import { Reservations } from './components/Reservations';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  CalendarRange, 
  LogOut,
  Moon,
  Sun,
  Shield
} from 'lucide-react';

export default function App() {
  // --- STATE ---
  // Helper para carregar dados ou iniciar vazio
  const loadData = <T,>(key: string, initial: T): T => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initial;
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'inventory' | 'team' | 'reservations' | 'super-admin'>('dashboard');
  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState('#2563eb'); // Default Blue
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Data State com Persistência
  const [items, setItems] = useState<Item[]>(() => loadData('st_items', []));
  const [users, setUsers] = useState<User[]>(() => loadData('st_users', []));
  const [reservations, setReservations] = useState<Reservation[]>(() => loadData('st_reservations', []));

  // --- EFFECTS ---
  
  // 1. User Session Persistence
  useEffect(() => {
    const storedUser = localStorage.getItem('clubflow_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      // If super admin is logged in, set correct view
      if (parsedUser.role === 'super-admin') {
          setView('super-admin');
      }
    }

    const storedTheme = localStorage.getItem('clubflow_theme');
    if (storedTheme) setThemeColor(storedTheme);

    const storedMode = localStorage.getItem('clubflow_dark_mode');
    if (storedMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // 2. Data Persistence (Auto-save whenever data changes)
  useEffect(() => { localStorage.setItem('st_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('st_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('st_reservations', JSON.stringify(reservations)); }, [reservations]);

  // Apply theme color
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', themeColor);
  }, [themeColor]);

  // Apply Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('clubflow_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('clubflow_dark_mode', 'false');
    }
  }, [isDarkMode]);

  // --- ACTIONS ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('clubflow_user', JSON.stringify(user));
    if (user.role === 'super-admin') {
        setView('super-admin');
    } else {
        setView('dashboard');
    }
  };

  const handlePasswordChange = (userId: string, newPassword: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, password: newPassword, mustChangePassword: false };
      }
      return u;
    });
    setUsers(updatedUsers);

    const updatedUser = updatedUsers.find(u => u.id === userId);
    if (updatedUser) {
      handleLogin(updatedUser);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('clubflow_user');
    setView('dashboard');
  };

  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    localStorage.setItem('clubflow_theme', color);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleRegisterClub = (name: string, email: string, password: string, clubName: string, recoveryCode: string) => {
    // Verificar se o email já existe
    if (users.some(u => u.email === email)) {
      alert('Este email já está registado.');
      return;
    }

    const newUser: User = {
      id: `admin-${Date.now()}`,
      name,
      email,
      role: 'admin',
      clubName,
      password,
      recoveryCode, // Guarda o código de recuperação
    };
    
    setUsers(prev => [...prev, newUser]);
    handleLogin(newUser);
  };

  const handleRecoverPassword = (email: string, recoveryCode: string, newPassword: string): boolean => {
      const userIndex = users.findIndex(u => u.email === email);
      
      if (userIndex === -1) return false;
      
      const user = users[userIndex];
      
      // Verificar o código de recuperação
      if (!user.recoveryCode || user.recoveryCode !== recoveryCode) return false;

      // Atualizar password
      const updatedUsers = [...users];
      updatedUsers[userIndex] = { ...user, password: newPassword };
      setUsers(updatedUsers);
      
      return true;
  };

  const handleDeleteAccount = () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    if (window.confirm("⚠️ AVISO CRÍTICO: Tem a certeza absoluta?\n\nAo confirmar:\n1. A sua conta de Administrador será apagada.\n2. TODOS os treinadores associados ao seu clube serão apagados.\n3. Todas as reservas do clube serão perdidas.\n\nEsta ação é irreversível.")) {
      const clubName = currentUser.clubName;
      
      if (!clubName) return;

      // 1. Encontrar IDs a eliminar:
      // - O próprio Admin
      // - Todos os utilizadores (treinadores) que têm o mesmo clubName
      const usersToDelete = users.filter(u => u.clubName === clubName || u.id === currentUser.id);
      const userIdsToDelete = usersToDelete.map(u => u.id);

      // 2. Atualizar estado de Utilizadores (Filtra para MANTER apenas quem NÃO está na lista de eliminação)
      setUsers(prev => prev.filter(u => !userIdsToDelete.includes(u.id)));

      // 3. Limpar as reservas desses utilizadores apagados
      setReservations(prev => prev.filter(r => !userIdsToDelete.includes(r.coachId)));

      // 4. Logout imediato
      handleLogout();
      alert("Conta e clube eliminados com sucesso. Todos os dados associados foram removidos.");
    }
  };

  // Inventory Actions
  const addItem = (item: Item) => setItems(prev => [...prev, item]);
  
  const deleteItem = (id: string) => {
    const hasActiveReservations = reservations.some(r => 
      r.status === 'active' && r.items.some(i => i.itemId === id)
    );
    if (hasActiveReservations) {
      alert('Não é possível apagar este item pois existem reservas ativas associadas.');
      return;
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (updatedItem: Item) => {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const handleFixDamage = (reservationId: string, itemId: string) => {
    handleResolveDamage(reservationId, itemId);
    setTargetItemId(itemId);
    setView('inventory');
  };

  const handleResolveDamage = (reservationId: string, itemId: string) => {
    setReservations(prev => prev.map(r => {
      if (r.id === reservationId && r.damageReports) {
        return {
          ...r,
          damageReports: r.damageReports.map(d => 
            d.itemId === itemId ? { ...d, isResolved: true } : d
          )
        };
      }
      return r;
    }));
  };

  // Team Actions
  const addCoach = (coach: User) => {
    if (users.some(u => u.email === coach.email)) {
        alert('Este email já está registado.');
        return;
    }
    // CRÍTICO: Vincular o treinador ao nome do clube do admin atual
    // Isso garante que, se o admin for apagado, o sistema apaga também os treinadores deste clube (Cascata)
    const newCoach: User = { 
        ...coach, 
        clubName: currentUser?.clubName // Vínculo vital para a função handleDeleteAccount
    };
    setUsers(prev => [...prev, newCoach]);
  };
  
  const deleteCoach = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  // Reservation Actions
  const checkAvailability = (newItems: ReservationItem[], date: string, startTime: string, endTime: string, excludeReservationId?: string): { available: boolean; error?: string } => {
    
    const overlappingReservations = reservations.filter(r => 
      r.id !== excludeReservationId &&
      r.date === date && 
      r.status === 'active' &&
      (startTime < r.endTime && endTime > r.startTime)
    );

    for (const requestedItem of newItems) {
      const inventoryItem = items.find(i => i.id === requestedItem.itemId);
      if (!inventoryItem) return { available: false, error: `Item não encontrado.` };

      let reservedCount = 0;
      overlappingReservations.forEach(res => {
        const found = res.items.find(i => i.itemId === requestedItem.itemId);
        if (found) {
          reservedCount += found.quantity;
        }
      });

      const availableStock = inventoryItem.quantity - reservedCount;

      if (requestedItem.quantity > availableStock) {
        return { 
          available: false, 
          error: `Stock insuficiente para "${inventoryItem.name}" neste horário. Disponível: ${availableStock}.` 
        };
      }
    }
    
    return { available: true };
  };

  const addReservation = (res: Reservation): { success: boolean; message: string } => {
    const check = checkAvailability(res.items, res.date, res.startTime, res.endTime);
    
    if (check.available) {
      setReservations(prev => [...prev, res]);
      return { success: true, message: 'Reserva confirmada com sucesso!' };
    }
    return { success: false, message: check.error || 'Erro de disponibilidade.' };
  };

  const updateReservation = (updatedRes: Reservation): { success: boolean; message: string } => {
    const check = checkAvailability(updatedRes.items, updatedRes.date, updatedRes.startTime, updatedRes.endTime, updatedRes.id);
    
    if (check.available) {
      setReservations(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));
      return { success: true, message: 'Reserva atualizada com sucesso!' };
    }
    return { success: false, message: check.error || 'Erro de disponibilidade.' };
  };

  const cancelReservation = (id: string) => setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));

  const returnReservation = (id: string, damageReports: DamageReport[]) => {
    setReservations(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'completed',
          returnedAt: new Date().toISOString(),
          damageReports: damageReports.length > 0 ? damageReports : undefined
        };
      }
      return r;
    }));

    if (damageReports.length > 0) {
      setItems(prevItems => prevItems.map(item => {
        const report = damageReports.find(d => d.itemId === item.id);
        if (report) {
          const newQuantity = Math.max(0, item.quantity - report.quantityDamaged);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }));
    }
  };

  // --- RENDER ---
  if (!currentUser) {
    return (
      <Login 
        onLogin={handleLogin} 
        onRegister={handleRegisterClub} 
        onPasswordChange={handlePasswordChange}
        onRecover={handleRecoverPassword}
        allUsers={users} 
      />
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, roles: ['admin', 'coach'] },
    { id: 'reservations', label: 'Reservas', icon: CalendarRange, roles: ['admin', 'coach'] },
    { id: 'inventory', label: 'Inventário', icon: Package, roles: ['admin', 'coach'] },
    { id: 'team', label: 'Treinadores', icon: Users, roles: ['admin'] },
    { id: 'super-admin', label: 'Visão Global', icon: Shield, roles: ['super-admin'] },
  ].filter(item => item.roles.includes(currentUser.role));

  const renderView = () => {
    switch (view) {
      case 'super-admin':
        return <SuperAdminDashboard allUsers={users} />;
      case 'dashboard':
        return <Dashboard 
          user={currentUser} 
          items={items} 
          users={users} 
          reservations={reservations} 
          onFixDamage={handleFixDamage}
          onResolveDamage={handleResolveDamage}
          onUpdateTheme={handleThemeChange}
          onDeleteAccount={handleDeleteAccount}
        />;
      case 'inventory':
        return <Inventory 
            userRole={currentUser.role}
            items={items} 
            onAdd={addItem} 
            onDelete={deleteItem} 
            onUpdate={updateItem} 
            targetItemId={targetItemId}
            onClearTarget={() => setTargetItemId(null)}
          />;
      case 'team':
        return currentUser.role === 'admin' ? 
          <Team 
            // Only show coaches that belong to this admin's club
            coaches={users.filter(u => u.role === 'coach' && u.clubName === currentUser.clubName)} 
            onAdd={addCoach} 
            onDelete={deleteCoach} 
          /> : null;
      case 'reservations':
        return <Reservations 
          user={currentUser} 
          items={items} 
          reservations={reservations} 
          onAdd={addReservation} 
          onUpdate={updateReservation}
          onCancel={cancelReservation}
          onReturn={returnReservation}
        />;
      default:
        return <Dashboard user={currentUser} items={items} users={users} reservations={reservations} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col transition-colors duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              S
            </div>
            SportTrack
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-10">Gestão Desportiva</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${view === item.id 
                    ? 'bg-slate-50 dark:bg-slate-800 text-primary border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <Icon size={20} className={view === item.id ? "text-primary" : ""} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          
          <button 
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>

          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 flex justify-between items-center p-4 transition-colors duration-300">
        <h1 className="text-xl font-bold text-primary">SportTrack</h1>
        <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 text-slate-600 dark:text-slate-400">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-600 dark:text-slate-400">
              <LogOut size={20} />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
      
      {/* Mobile Nav Bottom */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-3 z-10 transition-colors duration-300">
         {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium
                  ${view === item.id ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
      </nav>
    </div>
  );
}

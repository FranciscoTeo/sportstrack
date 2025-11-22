
import React, { useState } from 'react';
import { User } from '../types';
import { Card, Button, Input } from './Layout';
import { Trophy, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (name: string, email: string, pass: string, clubName: string, recoveryCode: string) => void;
  onPasswordChange: (userId: string, newPass: string) => void;
  onRecover: (email: string, recoveryCode: string, newPass: string) => boolean;
  allUsers: User[];
}

type AuthView = 'login' | 'register' | 'recovery' | 'change-password';

export const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onPasswordChange, onRecover, allUsers }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [clubName, setClubName] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  
  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (view === 'register') {
      if (!name || !email || !password || !clubName || !recoveryCode) {
        setError('Por favor preencha todos os campos.');
        return;
      }
      if (password.length < 6) {
        setError('A palavra-passe deve ter pelo menos 6 caracteres.');
        return;
      }
      if (recoveryCode.length < 4) {
        setError('O código de recuperação deve ter pelo menos 4 caracteres.');
        return;
      }
      onRegister(name, email, password, clubName, recoveryCode);
    } else if (view === 'login') {
      
      // --- SUPER ADMIN CHECK ---
      // Verifica explicitamente as credenciais do Super Admin (Login Secreto)
      // Case insensitive para o username
      if (email.trim().toLowerCase() === 'sportstrack' && password === 'umaia2025') {
          onLogin({
              id: 'super-admin',
              name: 'Super Admin',
              email: 'superadmin@umaia.pt', // Email de exibição genérico
              role: 'super-admin',
              clubName: 'Administração Global'
          });
          return;
      }
      // -----------------------

      const user = allUsers.find(u => u.email === email);
      
      if (!user) {
        setError('Utilizador não encontrado. Verifique ou registe o seu clube.');
        return;
      }

      if (user.password !== password) {
        setError('Palavra-passe incorreta.');
        return;
      }

      // Check if user must change password
      if (user.mustChangePassword) {
        setPendingUser(user);
        setView('change-password');
        setError('');
        return;
      }

      onLogin(user);

    } else if (view === 'recovery') {
      if (!email || !recoveryCode || !newPassword) {
        setError('Preencha todos os campos para redefinir.');
        return;
      }
      if (newPassword.length < 6) {
          setError('A nova palavra-passe deve ter no mínimo 6 caracteres.');
          return;
      }

      const success = onRecover(email, recoveryCode, newPassword);
      if (success) {
          setSuccessMsg('Palavra-passe alterada com sucesso! Pode entrar agora.');
          setTimeout(() => {
              switchView('login');
              setPassword('');
              setRecoveryCode('');
              setNewPassword('');
          }, 3000);
      } else {
          setError('Dados incorretos. O email ou o código de recuperação não correspondem.');
      }

    } else if (view === 'change-password') {
      if (newPassword.length < 6) {
        setError('A nova palavra-passe deve ter pelo menos 6 caracteres.');
        return;
      }
      if (newPassword === '123') {
         setError('A nova palavra-passe não pode ser igual à anterior.');
         return;
      }
      if (pendingUser) {
        onPasswordChange(pendingUser.id, newPassword);
      }
    }
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    setError('');
    setSuccessMsg('');
    // Reset specific fields based on view
    if (newView === 'login') {
        setPendingUser(null);
        setNewPassword('');
        setRecoveryCode('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20">
            <Trophy size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">SportTrack</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Gestão profissional para clubes desportivos</p>
        </div>

        <Card className="p-8 shadow-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700">
          
          {/* Header Buttons */}
          {view !== 'recovery' && view !== 'change-password' && (
            <div className="flex gap-4 mb-6 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <button 
                onClick={() => switchView('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'login' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Entrar
              </button>
              <button 
                onClick={() => switchView('register')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'register' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Registar Clube
              </button>
            </div>
          )}

          {view === 'recovery' && (
             <div className="mb-6">
                 <button onClick={() => switchView('login')} className="flex items-center text-sm text-slate-500 hover:text-primary mb-2">
                     <ArrowLeft size={16} className="mr-1" /> Voltar ao Login
                 </button>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recuperar Acesso</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Insira o seu email e o Código de Recuperação (PIN) definido no registo.</p>
             </div>
          )}

          {view === 'change-password' && (
             <div className="mb-6">
                 <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-4">
                    <KeyRound size={24} />
                 </div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Definir Nova Palavra-passe</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Por motivos de segurança, deve alterar a sua palavra-passe temporária antes de continuar.
                 </p>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <>
                 <Input 
                  label="Nome do Clube" 
                  placeholder="Ex: Sport Lisboa e..." 
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                />
                <Input 
                  label="Nome do Administrador" 
                  placeholder="Seu nome completo" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </>
            )}
            
            {(view === 'login' || view === 'register' || view === 'recovery') && (
              <Input 
                label="Email" 
                type="text" 
                placeholder="admin@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            )}
            
            {(view === 'login' || view === 'register') && (
                <>
                    <Input 
                    label="Palavra-passe" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    />
                    {view === 'register' && (
                        <p className="text-xs text-slate-400">Mínimo de 6 caracteres.</p>
                    )}
                </>
            )}

            {(view === 'register' || view === 'recovery') && (
                <div className="relative">
                    <Input 
                        label={view === 'register' ? "Criar Código de Recuperação (PIN)" : "Código de Recuperação (PIN)"}
                        type="text" 
                        placeholder="Ex: PIN1234, palavra secreta..." 
                        value={recoveryCode}
                        onChange={e => setRecoveryCode(e.target.value)}
                    />
                    {view === 'register' && (
                         <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                            <ShieldCheck size={12} /> IMPORTANTE: Guarde este código. Será a única forma de recuperar a palavra-passe.
                         </p>
                    )}
                </div>
            )}

            {(view === 'change-password' || view === 'recovery') && (
               <Input 
                label="Nova Palavra-passe" 
                type="password" 
                placeholder="Nova palavra-passe segura" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoFocus={view === 'change-password'}
              />
            )}

            {view === 'login' && (
                <div className="flex justify-end">
                    <button type="button" onClick={() => switchView('recovery')} className="text-xs text-primary hover:underline">
                        Esqueceu-se da palavra-passe?
                    </button>
                </div>
            )}

            {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded animate-in fade-in">{error}</p>}
            
            {successMsg && (
                <p className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-900/30 flex items-center gap-2 animate-in fade-in">
                    <ShieldCheck size={16} />
                    {successMsg}
                </p>
            )}

            <Button type="submit" className="w-full py-2.5 text-base" disabled={!!successMsg}>
              {view === 'register' ? 'Registar Clube' : 
               view === 'recovery' ? 'Redefinir Palavra-passe' : 
               view === 'change-password' ? 'Alterar e Entrar' : 'Entrar na Plataforma'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} SportTrack. Todos os direitos reservados.
          </div>
        </Card>
      </div>
    </div>
  );
};

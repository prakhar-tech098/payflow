import { useContext } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from './ui/button';
import { LogOut, Home, FileText, Settings, CreditCard, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden">
      {/* Sidebar - Glassmorphism */}
      <aside className="w-72 border-r border-slate-800/50 bg-slate-900/40 backdrop-blur-xl flex flex-col z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-2 rounded-lg shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">PayFlow</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="relative block">
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800/50 mt-auto">
          <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

        <header className="h-20 border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-md flex items-center px-10 z-10 sticky top-0">
          <h2 className="text-xl font-semibold text-slate-100 tracking-wide">
            {navItems.find(i => i.path === location.pathname)?.name || 'Overview'}
          </h2>
        </header>

        <div className="flex-1 p-10 overflow-y-auto z-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Layout;

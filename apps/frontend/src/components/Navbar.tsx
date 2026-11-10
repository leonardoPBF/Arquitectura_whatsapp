import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Package, LogOut, User, LayoutDashboard, Settings } from 'lucide-react';
import { Logo } from './Logo';
import { CartDrawer } from './CartDrawer';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center gap-3 min-h-16 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link to={isAdmin ? '/dashboard' : '/'} className="flex items-center gap-2 text-foreground dark:text-white hover:opacity-80 transition-opacity">
              <Logo className="w-8 h-8" />
              <span className="font-bold text-lg text-foreground">LUMINA</span>
            </Link>
            
            {!isAdmin && (
              <div className="hidden md:flex items-center gap-4">
                <Link to="/tienda" className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:underline font-medium transition-colors">
                  Productos
                </Link>
                <Link to="/my-orders" className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:underline flex items-center gap-1 font-medium transition-colors">
                  <Package className="w-4 h-4" />
                  Mis Pedidos
                </Link>
              </div>
            )}

            {isAdmin && (
              <>
                <Link to="/dashboard" className="text-sm text-foreground dark:text-foreground hover:text-primary dark:hover:text-primary hover:underline flex items-center gap-1 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/admin" className="text-sm text-foreground dark:text-foreground hover:text-primary dark:hover:text-primary hover:underline flex items-center gap-1 transition-colors">
                  <Settings className="w-4 h-4" />
                  Administración
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Carrito - Solo para clientes normales */}
            {!isAdmin && (
              <CartDrawer />
            )}

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{user?.name}</span>
              {isAdmin && (
                <span className="text-xs bg-primary text-primary-foreground text-primary-foreground px-2 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
            <Button className="text-muted-foreground hover:text-foreground" variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};


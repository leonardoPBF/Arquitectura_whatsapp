import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Package, LogOut, User, LayoutDashboard, Settings } from 'lucide-react';
import { Logo } from './Logo';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="border-b-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-white via-emerald-50/30 to-teal-50/30 dark:from-[hsl(200_20%_12%)] dark:via-[hsl(200_18%_14%)] dark:to-[hsl(200_15%_16%)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to={isAdmin ? "/dashboard" : "/"} className="flex items-center gap-2 text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
              <Logo className="w-8 h-8" />
              <span className="font-bold text-lg bg-gradient-to-r from-[#10B981] to-[#14B8A6] bg-clip-text text-transparent">LUMINA</span>
            </Link>
            
            {!isAdmin && (
              <div className="hidden md:flex items-center gap-4">
                <Link to="/" className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:underline font-medium transition-colors">
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
                <Link to="/dashboard" className="text-sm text-gray-700 dark:text-gray-300 hover:text-[#10B981] dark:hover:text-[#10B981] hover:underline flex items-center gap-1 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/admin" className="text-sm text-gray-700 dark:text-gray-300 hover:text-[#10B981] dark:hover:text-[#10B981] hover:underline flex items-center gap-1 transition-colors">
                  <Settings className="w-4 h-4" />
                  Administración
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{user?.name}</span>
              {isAdmin && (
                <span className="text-xs bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white px-2 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
            <Button className="bg-gradient-to-r from-[#b91026] to-[#b81466] text-white hover:from-[#9f3c0e] hover:to-[#99780d] dark:hover:from-[#9f710e] dark:hover:to-[#99900d]" variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};


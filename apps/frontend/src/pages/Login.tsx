import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { LoaderCircle, Sun, ArrowLeft, ShieldCheck, ShoppingBag } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isLogin = searchParams.get('mode') !== 'register';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('¡Bienvenido!');
      } else {
        await register({ email, password, name, phone });
        toast.success('¡Registro exitoso!');
      }

      // Navigate will be handled by the App component based on role
    } catch (error: any) {
      toast.error(error.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      {loading && <LoadingScreen overlay message={isLogin ? 'Iniciando sesión...' : 'Creando tu cuenta...'} />}
      <aside className="auth-story">
        <Link to="/" className="auth-brand"><Sun size={28} strokeWidth={1.2} />LUMINA</Link>
        <div><span className="text-xs tracking-widest text-muted-foreground">TU ESPACIO EN LUMINA</span><h1>Lo cotidiano,<br /><em>extraordinario.</em></h1><p>Descubre productos que van contigo. Guarda tu carrito y consulta tus pedidos desde un solo lugar.</p></div>
        <div className="auth-benefits"><span><ShoppingBag size={15} />Tu selección, a tu ritmo</span><span><ShieldCheck size={15} />Pagos con Culqi</span></div>
      </aside>
      <section className="auth-form-side" aria-labelledby="auth-title">
        <ThemeToggle />
        <div className="auth-panel">
          <Link className="auth-back" to="/"><ArrowLeft size={15} />Volver a LUMINA</Link>
          <h2 id="auth-title">{isLogin ? 'Qué bueno verte.' : 'Empieza algo nuevo.'}</h2>
          <p className="text-sm text-muted-foreground mb-8">{isLogin ? 'Inicia sesión para continuar con tu selección.' : 'Crea tu cuenta y descubre nuestra colección.'}</p>
          <form onSubmit={handleSubmit}>
            <fieldset disabled={loading} aria-busy={loading} className="space-y-5">
              {!isLogin && <>
                <div><label htmlFor="auth-name">Nombre completo</label><Input id="auth-name" name="name" autoComplete="name" placeholder="Tu nombre completo" value={name} onChange={e => setName(e.target.value)} required /></div>
                <div><label htmlFor="auth-phone">Teléfono</label><Input id="auth-phone" name="phone" type="tel" autoComplete="tel" placeholder="51999999999" value={phone} onChange={e => setPhone(e.target.value)} required pattern="\+?[0-9]{7,15}" /></div>
              </>}
              <div><label htmlFor="auth-email">Correo electrónico</label><Input id="auth-email" name="email" type="email" autoComplete="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div><label htmlFor="auth-password">Contraseña</label><Input id="auth-password" name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={isLogin ? 'Tu contraseña' : 'Al menos 12 caracteres'} value={password} onChange={e => setPassword(e.target.value)} required minLength={isLogin ? undefined : 12} maxLength={72} />{!isLogin && <p className="text-xs text-muted-foreground mt-2">Usa al menos 12 caracteres.</p>}</div>
              <Button type="submit" disabled={loading} className="w-full h-12">{loading && <LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />}{loading ? (isLogin ? 'Iniciando sesión...' : 'Creando cuenta...') : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</Button>
              <p className="text-center text-sm text-muted-foreground">{isLogin ? '¿Primera vez en LUMINA?' : '¿Ya tienes una cuenta?'}{' '}<button className="font-semibold text-foreground underline underline-offset-4" type="button" onClick={() => setSearchParams(isLogin ? { mode: 'register' } : {})}>{isLogin ? 'Crear cuenta' : 'Iniciar sesión'}</button></p>
            </fieldset>
          </form>
        </div>
      </section>
    </main>
  );
}

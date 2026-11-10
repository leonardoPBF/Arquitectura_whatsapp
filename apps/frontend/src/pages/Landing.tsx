import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowRight, ArrowLeft, Plus, Sun, ShoppingBag, ShieldCheck, Package, MousePointer2 } from 'lucide-react';
import { analyticsAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import './Landing.css';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  isActive?: boolean;
}

const price = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  const [failed, setFailed] = useState(false);
  return product.imageUrl && !failed ? (
    <img className={className} src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <div className={`lp-image-placeholder ${className}`} aria-label={product.name} role="img"><ShoppingBag strokeWidth={0.8} /><span>LUMINA</span></div>
  );
}

export default function Landing() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { addItem } = useCart();
  const [selected, setSelected] = useState<Product | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ index: 0, start: true, end: false });
  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['public-products'],
    queryFn: async (): Promise<Product[]> => {
      const response = await analyticsAPI.getAllProducts();
      if (!Array.isArray(response.data)) throw new Error('Catálogo no disponible');
      return response.data.filter((p: Product) => p.isActive !== false && typeof p._id === 'string' && typeof p.name === 'string' && Number.isFinite(p.price));
    },
  });
  const hero = products.find(p => p.stock > 0) || products[0];
  const accountLink = isAdmin ? '/dashboard' : '/tienda';

  const updatePosition = () => {
    const element = track.current;
    if (!element) return;
    const width = element.firstElementChild?.getBoundingClientRect().width || 1;
    setPosition({ index: Math.round(element.scrollLeft / (width + 24)), start: element.scrollLeft < 4, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 4 });
  };

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(updatePosition);
    observer.observe(element);
    updatePosition();
    return () => observer.disconnect();
  }, [products.length]);

  const move = (direction: number) => {
    const element = track.current;
    if (!element) return;
    const width = element.firstElementChild?.getBoundingClientRect().width || 300;
    element.scrollBy({ left: direction * (width + 24), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return (
    <div className="landing">
      <a className="lp-skip" href="#contenido">Saltar al contenido</a>
      <header className="lp-header lp-container">
        <Link className="lp-wordmark" to="/" aria-label="LUMINA, inicio"><Sun strokeWidth={1.2} /> LUMINA<span className="lp-wordmark-dot">®</span></Link>
        <nav className="lp-nav" aria-label="Navegación principal"><a href="#nosotros">Nuestra esencia</a><a href="#coleccion">La colección</a></nav>
        <div className="lp-auth"><ThemeToggle />
          {isAuthenticated ? <Link className="lp-button lp-button-dark" to={accountLink}>{isAdmin ? 'Mi panel' : 'Ir a la tienda'}<ArrowUpRight size={16} /></Link> : <><Link className="lp-login" to="/login">Iniciar sesión</Link><Link className="lp-button lp-button-dark" to="/login?mode=register">Crear cuenta<ArrowUpRight size={16} /></Link></>}
        </div>
      </header>

      <main id="contenido">
        <section className="lp-hero lp-container" aria-labelledby="hero-title">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow"><span /> BIENVENIDO A LUMINA</p>
            <h1 id="hero-title">Lo cotidiano,<br /><em>extraordinario.</em></h1>
            <p className="lp-intro">Una nueva forma de encontrar eso que va contigo. Descubre nuestra selección y dale espacio a lo que hace especial tu día a día.</p>
            <a href="#coleccion" className="lp-button lp-button-dark lp-explore">Explorar la colección<ArrowUpRight size={18} /></a>
            <div className="lp-hero-note"><span className="lp-small-line" /> TU PRÓXIMO HALLAZGO EMPIEZA AQUÍ</div>
          </div>
          <div className="lp-hero-visual">
            <div className="lp-visual-top"><span>OBJETOS CON POSIBILIDADES</span><Sun size={26} strokeWidth={1} /></div>
            {hero ? <button className="lp-hero-product" onClick={() => setSelected(hero)} aria-label={`Ver detalles de ${hero.name}`}><ProductImage key={hero._id} product={hero} /><span className="lp-hero-product-cta">Descubrir producto<ArrowUpRight size={18} /></span></button> : <div className="lp-hero-empty"><ShoppingBag strokeWidth={0.65} /><span>El gusto está<br />en los detalles.</span></div>}
            <div className="lp-visual-bottom"><span>{hero?.category || 'LA SELECCIÓN LUMINA'}</span><span>EST. ONLINE · PERÚ</span></div>
          </div>
          <div className="lp-hero-caption"><span>MENOS RUIDO. MÁS DESCUBRIMIENTOS.</span><a href="#nosotros">Conoce LUMINA<ArrowRight size={15} /></a></div>
        </section>

        <section id="nosotros" className="lp-about lp-container" aria-labelledby="about-title">
          <p className="lp-eyebrow">01 / NUESTRA ESENCIA</p>
          <div><h2 id="about-title">Encontrar algo especial<br />debería sentirse <em>natural.</em></h2><p>Somos LUMINA, una tienda online para descubrir productos, elegir con calma y comprar a tu manera. Reunimos nuestro catálogo en un solo lugar, con la información que necesitas para decidir.</p><a href="#como-comprar" className="lp-text-link">Así funciona tu compra<ArrowUpRight size={16} /></a></div>
        </section>

        <section id="coleccion" className="lp-collection" aria-labelledby="collection-title">
          <div className="lp-container">
            <div className="lp-section-heading"><div><p className="lp-eyebrow">02 / LA COLECCIÓN</p><h2 id="collection-title">Tu próximo <em>favorito.</em></h2></div><p>Explora. Acércate. Descubre los detalles.<br /><span>Haz clic en una tarjeta para ampliarla.</span></p></div>
            {isLoading ? <div className="lp-catalog-state" role="status"><span className="lp-spinner" />Preparando la colección...</div> : isError ? <div className="lp-catalog-state" role="alert"><p>No pudimos cargar la colección.</p><button className="lp-button lp-button-outline" onClick={() => refetch()}>Volver a intentar</button></div> : products.length === 0 ? <div className="lp-catalog-state"><ShoppingBag /><p>Estamos preparando nuestra próxima selección. Vuelve pronto.</p></div> : <>
              <div ref={track} className="lp-product-track" onScroll={updatePosition} role="region" aria-roledescription="carrusel" aria-label="Colección de productos" tabIndex={0} onKeyDown={event => { if (event.target === event.currentTarget && ['ArrowRight', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } }}>
                {products.map((product, index) => <button key={product._id} className="lp-product-card" onClick={() => setSelected(product)} aria-haspopup="dialog" aria-label={`Ver detalles de ${product.name}`}>
                  <div className={`lp-product-image lp-tone-${index % 3}`}><span className="lp-product-number">{String(index + 1).padStart(2, '0')}</span><ProductImage product={product} /><span className="lp-expand"><Plus size={20} /></span>{product.stock <= 0 && <span className="lp-sold-out">Agotado</span>}</div>
                  <div className="lp-product-meta"><span>{product.category || 'Colección LUMINA'}</span><span>{price(product.price)}</span></div><h3>{product.name}</h3><span className="lp-card-detail">Ver detalles<ArrowUpRight size={14} /></span>
                </button>)}
              </div>
              <div className="lp-carousel-footer"><span aria-live="polite">{String(Math.min(position.index + 1, products.length)).padStart(2, '0')}<span className="lp-counter-divider">/</span>{String(products.length).padStart(2, '0')}</span><div className="lp-carousel-line" /><div className="lp-carousel-controls"><button aria-label="Productos anteriores" onClick={() => move(-1)} disabled={position.start}><ArrowLeft size={20} /></button><button aria-label="Productos siguientes" onClick={() => move(1)} disabled={position.end}><ArrowRight size={20} /></button></div></div>
            </>}
          </div>
        </section>

        <section id="como-comprar" className="lp-process lp-container" aria-labelledby="process-title"><div className="lp-section-heading"><div><p className="lp-eyebrow">03 / SIMPLE, DE PRINCIPIO A FIN</p><h2 id="process-title">Elige con calma.<br /><em>Compra con confianza.</em></h2></div></div><div className="lp-process-grid">{[{ icon: MousePointer2, title: 'Descubre a tu ritmo', text: 'Explora el catálogo y amplía cada producto para conocer sus detalles.' }, { icon: ShieldCheck, title: 'Tu compra, en tu cuenta', text: 'Crea una cuenta, prepara tu carrito y realiza el pago a través de Culqi.' }, { icon: Package, title: 'Todo en un solo lugar', text: 'Consulta tus pedidos y el estado de tus pagos desde tu cuenta.' }].map(({ icon: Icon, title, text }, index) => <div key={title} className="lp-process-item"><div><Icon strokeWidth={1.3} size={24} /><span>0{index + 1}</span></div><h3>{title}</h3><p>{text}</p></div>)}</div></section>

        <section className="lp-invitation lp-container"><Sun size={40} strokeWidth={1} /><p className="lp-eyebrow">UN ESPACIO PARA DESCUBRIR</p><h2>Lo que buscas.<br /><em>Y lo que no esperabas.</em></h2><Link className="lp-button lp-button-cream" to={isAuthenticated ? accountLink : '/login?mode=register'}>{isAuthenticated ? 'Continuar a mi cuenta' : 'Forma parte de LUMINA'}<ArrowUpRight size={18} /></Link></section>
      </main>
      <footer className="lp-footer lp-container"><Link className="lp-wordmark" to="/"><Sun strokeWidth={1.2} />LUMINA</Link><span>Encuentra algo que va contigo.</span><p>© {new Date().getFullYear()} LUMINA</p></footer>

      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        {selected && <DialogContent className="lp-expanded-card"><div className="lp-expanded-image"><ProductImage key={selected._id} product={selected} /></div><div className="lp-expanded-copy"><p className="lp-eyebrow">{selected.category || 'COLECCIÓN LUMINA'}</p><DialogTitle className="lp-expanded-title">{selected.name}</DialogTitle><p className="lp-expanded-price">{price(selected.price)}</p><DialogDescription className="lp-expanded-description">{selected.description || 'Descubre este producto de nuestra colección LUMINA.'}</DialogDescription><p className="lp-availability"><span />{selected.stock > 0 ? 'Disponible en nuestra tienda' : 'Temporalmente agotado'}</p>{isAuthenticated && !isAdmin ? <button className="lp-button lp-button-dark" disabled={selected.stock <= 0} onClick={() => addItem(selected, 1)}>Agregar al carrito<Plus size={18} /></button> : <Link className="lp-button lp-button-dark" to={isAuthenticated ? '/dashboard' : '/login'}>{isAuthenticated ? 'Ir a mi panel' : 'Inicia sesión para comprar'}<ArrowUpRight size={18} /></Link>}<Link className="lp-text-link" to={isAuthenticated ? accountLink : '/login?mode=register'}>{isAuthenticated ? 'Continuar a mi cuenta' : '¿Primera vez? Crea tu cuenta'}<ArrowRight size={16} /></Link></div></DialogContent>}
      </Dialog>
    </div>
  );
}

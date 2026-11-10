import { LoaderCircle } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  overlay?: boolean;
}

export function LoadingScreen({ message = 'Cargando LUMINA...', overlay = false }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`${overlay ? 'fixed inset-0 z-50 bg-card/95 dark:bg-background/95' : 'min-h-screen bg-emerald-50 dark:bg-background'} flex flex-col items-center justify-center gap-4 p-6 text-center`}
    >
      <LoaderCircle aria-hidden="true" className="h-12 w-12 animate-spin motion-reduce:animate-none text-emerald-600" />
      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">LUMINA</p>
      <p className="text-foreground dark:text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground dark:text-muted-foreground">Esto puede tardar unos segundos.</p>
    </div>
  );
}

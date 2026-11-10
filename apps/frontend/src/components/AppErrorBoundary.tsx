import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error al mostrar la aplicación:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 bg-emerald-50 dark:bg-background p-6 text-center">
          <h1 className="text-2xl font-bold text-foreground dark:text-white">No pudimos cargar esta pantalla</h1>
          <p className="text-muted-foreground dark:text-foreground">Ocurrió un error inesperado. Puedes recargar la aplicación para intentarlo de nuevo.</p>
          <Button onClick={() => window.location.reload()}>Recargar aplicación</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

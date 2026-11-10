import { Sun } from 'lucide-react';

export const Logo = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <Sun aria-label="LUMINA" role="img" className={className} strokeWidth={1.2} />
);

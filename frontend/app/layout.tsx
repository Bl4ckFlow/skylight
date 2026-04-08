import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skylight — Gestion de votre activité',
  description: 'Gérez votre stock, clients, commandes et factures simplement.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

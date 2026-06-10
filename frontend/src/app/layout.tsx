import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenRoad Agent - Hacker Onboarding Platform',
  description: 'Generate personalized contribution roadmaps for open source projects',
  keywords: ['open source', 'github', 'contribution', 'roadmap', 'onboarding'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-hacker-bg text-hacker-text antialiased">
        <div className="min-h-screen relative">
          {/* Subtle grid background */}
          <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,136,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
          
          {/* Main content */}
          <main className="relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

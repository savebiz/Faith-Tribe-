import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
           {/* Logos are in public/ as logo-white.png and logo-black.png. 
               Since bg is dark (default in my theme update), use white logo if available, 
               but wait, I set background to dark color in :root? 
               --background: 240 10% 3.9%; which is dark.
           */}
          <div className="h-12 w-12 relative">
             {/* Placeholder for logo if image load fails, or use text */}
             <div className="absolute inset-0 bg-primary rounded-full opacity-20 animate-pulse"></div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">FaithTribe</span>
        </div>
        <div className="space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Join the Tribe</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground">
            The Digital <span className="text-primary">Tabernacle</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A persistent community where discipleship continues 24/7. 
            By Teens, For Teens.
          </p>
        </div>

        {/* Portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* Kids Portal */}
          <Link href="/kids" className="group relative overflow-hidden rounded-2xl border bg-card p-8 hover:border-[color:var(--kids-primary)] transition-colors">
            <div className="absolute inset-0 bg-[color:var(--kids-primary)] opacity-0 group-hover:opacity-5 transition-opacity" />
            <h3 className="text-2xl font-bold mb-2 text-[color:var(--kids-primary)]">Faith Explorers</h3>
            <p className="text-muted-foreground">For Kids</p>
          </Link>

          {/* Teens Portal */}
          <Link href="/teens" className="group relative overflow-hidden rounded-2xl border bg-card p-8 hover:border-[color:var(--teens-primary)] transition-colors">
            <div className="absolute inset-0 bg-[color:var(--teens-primary)] opacity-0 group-hover:opacity-5 transition-opacity" />
            <h3 className="text-2xl font-bold mb-2 text-[color:var(--teens-primary)]">The Tribe</h3>
            <p className="text-muted-foreground">For Teens</p>
          </Link>

          {/* Teachers Portal */}
          <Link href="/teachers" className="group relative overflow-hidden rounded-2xl border bg-card p-8 hover:border-[color:var(--teachers-primary)] transition-colors">
             <div className="absolute inset-0 bg-[color:var(--teachers-primary)] opacity-0 group-hover:opacity-5 transition-opacity" />
            <h3 className="text-2xl font-bold mb-2 text-[color:var(--teachers-primary)]">Shepherd's Staff</h3>
            <p className="text-muted-foreground">For Teachers</p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        © 2026 FaithTribe Ministry. All rights reserved.
      </footer>
    </div>
  );
}

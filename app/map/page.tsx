import AppShell from "@/components/app-shell"

export default function MapPage() {
  return (
    <main className="min-h-dvh relative overflow-hidden">
      {/* Simplified premium background - performance optimized */}
      <div className="absolute inset-0">
        {/* Base gradient layer - static for better performance */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-slate-100/30 to-indigo-100/40"></div>
        
        {/* Single subtle animated overlay - reduced complexity */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/20 via-amber-100/10 to-indigo-200/15 animate-pulse-gentle"></div>
        
        {/* Minimal floating elements - reduced for performance */}
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-300/15 to-indigo-300/10 rounded-full blur-xl"></div>
        
        {/* Foreground overlay for optimal content legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/4 via-white/2 to-white/3"></div>
      </div>
      
      <div className="relative z-10">
        <AppShell />
      </div>
    </main>
  )
}

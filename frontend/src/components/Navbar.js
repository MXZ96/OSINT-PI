import React from 'react';
import { Moon, Sun } from 'lucide-react';

function Navbar({ isDark, toggleTheme, useRealTools, setUseRealTools }) {
  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 nav-blur ${
      isDark
        ? 'bg-cyberdark-900/80 border-b border-cyberdark-700'
        : 'bg-white/80 border-b border-gray-200'
    }`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyberblue-500 to-cybercyan-500 rounded-lg flex items-center justify-center shadow-glow-blue glow-pulse">
            <span className="text-white font-bold text-xl">◆</span>
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">OSINT PI</h1>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Intelligence Platform</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <button type="button" className={`transition-colors ${isDark ? 'text-gray-400 hover:text-cyberblue-400' : 'text-gray-600 hover:text-blue-500'}`}>
            Dashboard
          </button>
          <button type="button" className={`transition-colors ${isDark ? 'text-gray-400 hover:text-cyberblue-400' : 'text-gray-600 hover:text-blue-500'}`}>
            Tools
          </button>
          <a href="https://github.com/MXZ96/OSINT-PI" target="_blank" rel="noreferrer" className={`transition-colors ${isDark ? 'text-gray-400 hover:text-cyberblue-400' : 'text-gray-600 hover:text-blue-500'}`}>
            Documentation
          </a>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Real/Mock Toggle */}
          <button
            onClick={() => setUseRealTools(!useRealTools)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              useRealTools
                ? isDark
                  ? 'bg-cybercyan-900 text-cybercyan-300 border border-cybercyan-600'
                  : 'bg-cyan-100 text-cyan-800 border border-cyan-400'
                : isDark
                ? 'bg-cyberdark-800 text-gray-400 border border-cyberdark-700'
                : 'bg-gray-200 text-gray-600 border border-gray-400'
            }`}
            title={useRealTools ? 'Using Real Tools - Click to use mock' : 'Using Mock Data - Click to use real'}
          >
            {useRealTools ? '🔴 Real Tools' : '⚪ Mock'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all ${
              isDark
                ? 'bg-cyberdark-800 text-cybercyan-400 hover:bg-cyberdark-700'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

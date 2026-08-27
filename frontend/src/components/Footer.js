import React from 'react';
import { Heart, Github, Mail } from 'lucide-react';

function Footer({ isDark }) {
  return (
    <footer className={`border-t transition-colors ${isDark ? 'border-cyberdark-700 bg-cyberdark-900' : 'border-gray-200 bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h4 className="font-bold mb-4">About OSINT PI</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Professional Open Source Intelligence gathering platform for security researchers and ethical investigators.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://github.com/MXZ96/OSINT-PI" target="_blank" rel="noreferrer" className={`transition-colors ${isDark ? 'text-gray-400 hover:text-cyberblue-400' : 'text-gray-600 hover:text-blue-500'}`}>Documentation</a></li>
              <li><button type="button" className={`transition-colors ${isDark ? 'text-gray-400 hover:text-cyberblue-400' : 'text-gray-600 hover:text-blue-500'}`}>API Reference</button></li>
              <li><button type="button" className={`transition-colors ${isDark ? 'text-gray-400 hover:text-cyberblue-400' : 'text-gray-600 hover:text-blue-500'}`}>Security Standards</button></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="https://github.com/MXZ96" target="_blank" rel="noreferrer" aria-label="GitHub" className={`transition-colors ${isDark ? 'text-gray-400 hover:text-cyberblue-400' : 'text-gray-600 hover:text-blue-500'}`}>
                <Github className="size-5" />
              </a>
              <a href="mailto:ikbaarrafih23@gmail.com" aria-label="Email" className={`transition-colors ${isDark ? 'text-gray-400 hover:text-cyberblue-400' : 'text-gray-600 hover:text-blue-500'}`}>
                <Mail className="size-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`border-t ${isDark ? 'border-cyberdark-700' : 'border-gray-200'} pt-8`}></div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            © 2026 OSINT Intelligence Platform. Made with <Heart className="inline size-4 text-red-500" /> for cybersecurity professionals.
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'} mt-4 md:mt-0`}>
            For educational and authorized security research only. Terms of Service | Privacy Policy
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

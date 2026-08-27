import React from 'react';
import { Zap, Search, AlertTriangle, Shield } from 'lucide-react';

function ToolsSection({ isDark }) {
  const tools = [
    {
      name: 'Blackbird',
      description: 'Username search across social platforms',
      status: 'active',
      icon: Search,
    },
    {
      name: 'Analyst Research',
      description: 'Multi-platform intelligence gathering',
      status: 'active',
      icon: Zap,
    },
    {
      name: 'Intelligence X',
      description: 'Leak detection & data exposure',
      status: 'active',
      icon: AlertTriangle,
    },
    {
      name: 'CheckLeaked',
      description: 'Phone & email exposure check',
      status: 'active',
      icon: Shield,
    },
  ];

  return (
    <section className="mb-12 animate-slide-in" style={{ animationDelay: '0.1s' }}>
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">OSINT Tools</span>
        <span className={`text-sm ml-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>(Transparency)</span>
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                isDark
                  ? 'bg-cyberdark-800 border-cyberdark-700 hover:border-cyberblue-500'
                  : 'bg-white border-gray-300 hover:border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={`size-6 ${isDark ? 'text-cyberblue-400' : 'text-blue-500'}`} />
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    tool.status === 'active'
                      ? isDark
                        ? 'bg-green-900 text-green-300'
                        : 'bg-green-100 text-green-800'
                      : isDark
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {tool.status}
                </span>
              </div>
              <h3 className="font-bold mb-1">{tool.name}</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {tool.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ToolsSection;

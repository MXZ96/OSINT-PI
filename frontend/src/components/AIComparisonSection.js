import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function AIComparisonSection({ isDark, results }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mb-12 animate-fade-in">
      <div className={`${isDark ? 'glass' : 'bg-white border border-gray-200'} rounded-xl p-8`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition-opacity"
        >
          <h3 className="text-2xl font-bold">
            <span className="gradient-text">OSINT vs AI Analysis</span>
          </h3>
          {expanded ? (
            <ChevronUp className={`size-6 ${isDark ? 'text-cybercyan-400' : 'text-cyan-500'}`} />
          ) : (
            <ChevronDown className={`size-6 ${isDark ? 'text-cybercyan-400' : 'text-cyan-500'}`} />
          )}
        </button>

        {expanded && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* OSINT Analysis */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-cyberdark-800' : 'bg-gray-100'}`}>
              <h4 className="font-bold text-lg mb-4 text-cyberblue-400">
                🔍 OSINT Tool Analysis
              </h4>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {results.aiComparison.osintAnalysis}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-600">
                <p className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Data Source: Public Databases, Social APIs, Leak Databases
                </p>
              </div>
            </div>

            {/* AI Insight */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-cyberpurple-900 bg-opacity-30' : 'bg-purple-100'}`}>
              <h4 className="font-bold text-lg mb-4 text-cyberpurple-400">
                🧠 AI Intelligence Insight
              </h4>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {results.aiComparison.aiInsight}
              </p>
              <div className="mt-4 pt-4 border-t border-purple-400">
                <p className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Model: Advanced Pattern Recognition & Context Analysis
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default AIComparisonSection;

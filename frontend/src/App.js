import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import InputSection from './components/InputSection';
import ToolsSection from './components/ToolsSection';
import LoadingAnimation from './components/LoadingAnimation';
import ResultsSection from './components/ResultsSection';
import AIComparisonSection from './components/AIComparisonSection';
import Footer from './components/Footer';

const getApiUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.endsWith('.asse.devtunnels.ms')) {
      const backendHost = hostname.replace(/-3000$/, '-5000');
      return `https://${backendHost}`;
    }
  }

  return 'http://localhost:5000';
};

const API_URL = getApiUrl().replace(/\/$/, '');

function App() {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [useRealTools, setUseRealTools] = useState(true);

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleAnalyze = async (data) => {
    setIsLoading(true);
    setResults(null);

    try {
      console.log('[Frontend] API_URL:', API_URL);
      console.log('[Frontend] Request payload:', data);
      
      // Use single endpoint with tool selection flag
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, useRealTools }),
      });

      console.log('[Frontend] Response status:', response.status, response.statusText);
      
      const analysisResults = await response.json();
      console.log('[Frontend] Parsed response:', analysisResults);
      
      if (!response.ok) {
        throw new Error(analysisResults.error || 'Analysis request failed');
      }
      
      if (!useRealTools) {
        // Simulate processing delay for mock data
        setTimeout(() => {
          setResults(analysisResults);
          setIsLoading(false);
        }, 2000);
      } else {
        // Real tools show results immediately
        setResults(analysisResults);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[Frontend] Analysis error:', error);
      
      if (useRealTools) {
        // Show error but don't fall back to mock
        setResults({
          error: 'Real OSINT analysis failed',
          message: error.message,
          query: data,
          osintResults: [],
          leakedData: [],
          insights: [],
          recommendations: [],
          riskScore: 0,
          aiComparison: {
            osintAnalysis: '',
            aiInsight: '',
          },
        });
      } else {
        // Mock mode fallback
        setTimeout(() => {
          setResults(getMockResults(data));
          setIsLoading(false);
        }, 2000);
      }
      setIsLoading(false);
    }
  };

  const getMockResults = (data) => {
    return {
      query: data,
      osintResults: [
        {
          platform: 'GitHub',
          username: data.username || 'unknown_user',
          url: `https://github.com/${data.username || 'user'}`,
          found: !!data.username,
          followersCount: Math.floor(Math.random() * 500),
          reposCount: Math.floor(Math.random() * 50),
          lastActivity: '2 days ago',
        },
        {
          platform: 'Twitter',
          username: data.username || 'unknown_user',
          url: `https://twitter.com/${data.username || 'user'}`,
          found: Math.random() > 0.3,
          followersCount: Math.floor(Math.random() * 10000),
          tweetsCount: Math.floor(Math.random() * 5000),
          lastTweet: '1 hour ago',
        },
        {
          platform: 'LinkedIn',
          email: data.email || 'unknown@email.com',
          url: `https://linkedin.com/in/${data.username || 'user'}`,
          found: Math.random() > 0.4,
          headline: 'Software Engineer | Cybersecurity Enthusiast',
          connections: Math.floor(Math.random() * 5000),
          lastUpdate: '1 week ago',
        },
        {
          platform: 'Stack Overflow',
          username: data.username || 'unknown_user',
          url: `https://stackoverflow.com/users/${Math.floor(Math.random() * 1000000)}`,
          found: !!data.username,
          reputation: Math.floor(Math.random() * 50000),
          answers: Math.floor(Math.random() * 200),
          lastActivity: '3 days ago',
        },
      ],
      leakedData: [
        {
          source: 'LinkedIn Breach (2021)',
          type: 'email_exposed',
          count: 1,
          severity: 'high',
          status: 'compromised',
        },
        {
          source: 'Twitter API Leak',
          type: 'archived_data',
          count: 1,
          severity: 'medium',
          status: 'indexed',
        },
        {
          source: 'Public GitHub Repos',
          type: 'public_data',
          count: 23,
          severity: 'low',
          status: 'active',
        },
      ],
      insights: [
        {
          title: 'Multi-Platform Presence',
          description: `Digital footprint found across ${Math.floor(Math.random() * 5) + 2} major platforms`,
          icon: 'globe',
        },
        {
          title: 'Email Exposure',
          description: data.email ? `Email found in ${Math.floor(Math.random() * 3) + 1} breach(es)` : 'No email exposure detected',
          icon: 'mail',
        },
        {
          title: 'Username Consistency',
          description: 'Same username pattern detected across 4 platforms',
          icon: 'link',
        },
        {
          title: 'Data Available',
          description: `Personal data index in ${Math.floor(Math.random() * 12) + 5} public sources`,
          icon: 'database',
        },
      ],
      riskScore: Math.floor(Math.random() * 70) + 30,
      recommendations: [
        'Enable Two-Factor Authentication (2FA) on all accounts',
        'Review privacy settings on social media profiles',
        'Remove sensitive data from public GitHub repositories',
        'Update passwords on compromised accounts',
        'Monitor email addresses for future breaches',
        'Consider using a VPN for sensitive activities',
      ],
      aiComparison: {
        osintAnalysis: `Our OSINT tools detected that "${data.username || 'the target'}" has a significant digital presence with activity across multiple platforms. The analysis shows potential security gaps and data exposure risks that should be addressed through privacy settings adjustments and account hardening measures.`,
        aiInsight: `The OSINT findings align with expected digital footprint patterns. The detected presence across platforms suggests an active online user. Notably, the email exposure and reused credentials across services present the highest risk factor. Implementing 2FA and regular password updates would significantly improve security posture.`,
      },
    };
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDark ? 'dark' : ''}`}>
      <div className={`relative overflow-hidden ${isDark ? 'bg-cyberdark-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        {/* Animated background layers (dark mode only) */}
        {isDark && (
          <>
            <div className="pointer-events-none fixed inset-0 cyber-grid opacity-[0.5]" />
            <div className="pointer-events-none fixed inset-0 bg-aurora" />
            <div className="pointer-events-none fixed inset-0 bg-radial-fade" />
          </>
        )}

        <Navbar isDark={isDark} toggleTheme={toggleTheme} useRealTools={useRealTools} setUseRealTools={setUseRealTools} />

        <main className="relative z-10 container mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="mb-12 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 hero-badge animate-float">
              <span className="size-2 rounded-full bg-cybercyan-400 glow-pulse" />
              <span className={isDark ? 'text-cybercyan-300' : 'text-blue-600'}>Ethical OSINT Engine · Live</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
              <span className="gradient-text">OSINT Intelligence</span>
              <br />
              <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>Platform</span>
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Professional Open Source Intelligence gathering and analysis. Search across multiple platforms, detect data breaches, and generate comprehensive security reports.
            </p>
          </section>

          {/* Input Section */}
          <InputSection isDark={isDark} onAnalyze={handleAnalyze} />

          {/* Tools Section */}
          <ToolsSection isDark={isDark} />

          {/* Loading Animation */}
          {isLoading && <LoadingAnimation isDark={isDark} />}

          {/* Results Section */}
          {results && !isLoading && (
            <>
              <ResultsSection isDark={isDark} results={results} />
              <AIComparisonSection isDark={isDark} results={results} />
            </>
          )}

          {/* Empty State */}
          {!isLoading && !results && (
            <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="text-xl">Enter target information and click "Analyze" to begin intelligence gathering</p>
            </div>
          )}
        </main>

        <Footer isDark={isDark} />
      </div>
    </div>
  );
}

export default App;

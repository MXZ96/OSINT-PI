import React, { useState } from 'react';
import { Globe, Mail, Link, Database, AlertCircle, TrendingUp, CheckCircle, XCircle, Filter, ShieldCheck, ShieldAlert } from 'lucide-react';

function ResultsSection({ isDark, results }) {
  const [onlyRelated, setOnlyRelated] = useState(false);
  const [yearFilter, setYearFilter] = useState('all'); // all | 1 | 3 | 5

  const visibleResults = onlyRelated
    ? results.osintResults.filter(r => r.isLikelyOwner)
    : results.osintResults;

  const currentYear = new Date().getFullYear();
  const visibleLeaks = results.leakedData.filter(leak => {
    if (yearFilter === 'all' || !leak.year) return true;
    return currentYear - leak.year <= parseInt(yearFilter, 10);
  });

  // Handle error results
  if (results.error) {
    return (
      <section className="mb-12 animate-fade-in">
        <div className={`${isDark ? 'glass' : 'bg-white border border-gray-200'} rounded-xl p-8`}>
          <div className="flex items-center gap-4 mb-4">
            <AlertCircle className={`size-8 ${isDark ? 'text-red-500' : 'text-red-600'}`} />
            <h2 className="text-2xl font-bold text-red-500">Analysis Error</h2>
          </div>
          
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {results.message || results.error}
          </p>
          
          {results.details && (
            <div className={`p-4 rounded-lg ${isDark ? 'bg-cyberdark-800' : 'bg-gray-100'} font-mono text-sm`}>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{results.details}</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  const getRiskColor = (score) => {
    if (score < 30) return 'text-green-500';
    if (score < 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskBgColor = (score) => {
    if (score < 30) return isDark ? 'bg-green-900' : 'bg-green-100';
    if (score < 60) return isDark ? 'bg-yellow-900' : 'bg-yellow-100';
    return isDark ? 'bg-red-900' : 'bg-red-100';
  };

  const getRiskLabel = (score) => {
    if (score < 30) return 'Low';
    if (score < 60) return 'Medium';
    return 'High';
  };

  const getConfidenceBadge = (label) => {
    const styles = {
      High: isDark ? 'bg-green-900 text-green-300 border-green-600' : 'bg-green-100 text-green-800 border-green-400',
      Medium: isDark ? 'bg-yellow-900 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-yellow-800 border-yellow-400',
      Low: isDark ? 'bg-gray-700 text-gray-300 border-gray-500' : 'bg-gray-200 text-gray-600 border-gray-400',
    };
    return styles[label] || styles.Low;
  };

  const iconMap = {
    globe: Globe,
    mail: Mail,
    link: Link,
    database: Database,
    users: Link,
  };

  return (
    <section className="mb-12 animate-fade-in">
      <h2 className="text-3xl font-bold mb-8">
        <span className="gradient-text">Intelligence Report</span>
      </h2>

      {/* OSINT Results */}
      <div className={`${isDark ? 'glass' : 'bg-white border border-gray-200'} rounded-xl p-8 mb-8`}>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Globe className={`size-6 ${isDark ? 'text-cyberblue-400' : 'text-blue-500'}`} />
          OSINT Findings
          <span className={`text-sm font-normal ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            ({visibleResults.length}/{results.osintResults.length})
          </span>
        </h3>

        {/* Correlation Filter */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setOnlyRelated(!onlyRelated)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              onlyRelated
                ? isDark
                  ? 'bg-cybercyan-900 text-cybercyan-300 border-cybercyan-600'
                  : 'bg-cyan-100 text-cyan-800 border-cyan-400'
                : isDark
                  ? 'bg-cyberdark-800 text-gray-400 border-cyberdark-700 hover:border-cyberblue-500'
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
            title="Show only accounts correlated to your identity"
          >
            <Filter className="size-4" />
            {onlyRelated ? 'Showing related only' : 'Show related only'}
          </button>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Confidence scores correlate accounts to your identity (name, location, email)
          </span>
        </div>

        <div className="space-y-4">
          {visibleResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 transition-all card-hover ${
                result.isLikelyOwner
                  ? isDark
                    ? 'bg-cyberdark-800 border-l-cyberblue-500 owner-glow'
                    : 'bg-blue-50 border-l-blue-500 owner-glow'
                  : result.found
                  ? isDark
                    ? 'bg-cyberdark-800 border-l-cybercyan-500 found-glow'
                    : 'bg-cyan-50 border-l-cyan-500 found-glow'
                  : isDark
                    ? 'bg-cyberdark-800 border-l-gray-600'
                    : 'bg-gray-100 border-l-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-lg">{result.platform}</h4>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm ${isDark ? 'text-cyberblue-400 hover:text-cyberblue-300' : 'text-blue-500 hover:text-blue-600'}`}
                  >
                    {result.url}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  {result.found && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium border ${getConfidenceBadge(result.confidenceLabel)}`}
                      title={`Correlation confidence: ${Math.round((result.confidence || 0) * 100)}%`}
                    >
                      {result.confidenceLabel}
                    </span>
                  )}
                  {result.isLikelyOwner ? (
                    <ShieldCheck className="size-6 text-green-500" title="Likely belongs to you" />
                  ) : result.found ? (
                    <ShieldAlert className="size-6 text-yellow-500" title="Possible collision - verify" />
                  ) : (
                    <XCircle className={`size-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  )}
                </div>
              </div>

              {/* Show details for Intelligence X / Email checks even if not found */}
              {(result.platform === 'Intelligence X' || result.platform === 'Email Check' || result.platform === 'Phone Number Check') && (
                <div className={`grid grid-cols-3 gap-4 mt-4 pt-4 border-t ${isDark ? 'border-cyberdark-700' : 'border-gray-200'}`}>
                  {result.email && (
                    <>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                        <p className="font-bold text-sm">{result.email}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Domain</p>
                        <p className="font-bold text-sm">{result.domain}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                        <p className="font-bold text-sm">{result.found ? 'Found' : 'Not Found'}</p>
                      </div>
                    </>
                  )}
                  {/* Show IntelX stats if available */}
                  {result.intelx_stats && (
                    <>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Text Files</p>
                        <p className="font-bold text-lg">{result.intelx_stats.text_files || 0}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>CSV Files</p>
                        <p className="font-bold text-lg">{result.intelx_stats.csv_files || 0}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>DB Files</p>
                        <p className="font-bold text-lg">{result.intelx_stats.db_files || 0}</p>
                      </div>
                      {result.lastDetected && (
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Detected</p>
                          <p className={`font-bold text-lg ${isDark ? 'text-cybercyan-300' : 'text-cyan-700'}`}>
                            {result.lastDetected}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {result.phone && (
                    <>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
                        <p className="font-bold text-sm">{result.phone}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                        <p className="font-bold text-sm">{result.found ? 'Exists' : 'Not Found'}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Source</p>
                        <p className="font-bold text-sm">{result.source}</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Show detailed phone data for Phone OSINT */}
              {result.platform === 'Phone OSINT' && result.whatsapp_data && (
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-cyberdark-700' : 'border-gray-200'}`}>
                  <h5 className="font-bold mb-3">WhatsApp Data</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`p-3 rounded ${isDark ? 'bg-cyberdark-900' : 'bg-gray-100'}`}>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>WhatsApp</p>
                      <p className="font-bold">{result.whatsapp_data.is_wacontact ? '✅ Yes' : '❌ No'}</p>
                    </div>
                    <div className={`p-3 rounded ${isDark ? 'bg-cyberdark-900' : 'bg-gray-100'}`}>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Business</p>
                      <p className="font-bold">{result.whatsapp_data.is_business ? '✅ Yes' : '❌ No'}</p>
                    </div>
                    <div className={`p-3 rounded ${isDark ? 'bg-cyberdark-900' : 'bg-gray-100'}`}>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Verified</p>
                      <p className="font-bold">{result.whatsapp_data.is_verified ? '✅ Yes' : '❌ No'}</p>
                    </div>
                    <div className={`p-3 rounded ${isDark ? 'bg-cyberdark-900' : 'bg-gray-100'}`}>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Country</p>
                      <p className="font-bold">{result.whatsapp_data.country_code}</p>
                    </div>
                  </div>
                  
                  {result.telegram_data && (
                    <div className="mt-3">
                      <h5 className="font-bold mb-2">Telegram Data</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {result.telegram_data.exists ? (
                          <>
                            <div className={`p-3 rounded ${isDark ? 'bg-cyberdark-900' : 'bg-gray-100'}`}>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Telegram</p>
                              <p className="font-bold text-green-500">✅ Found</p>
                            </div>
                            <div className={`p-3 rounded ${isDark ? 'bg-cyberdark-900' : 'bg-gray-100'}`}>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Phone</p>
                              <p className="font-bold text-sm">{result.telegram_data.phone_formatted}</p>
                            </div>
                          </>
                        ) : (
                          <div className={`p-3 rounded ${isDark ? 'bg-cyberdark-900' : 'bg-gray-100'}`}>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Telegram</p>
                            <p className="font-bold">{result.telegram_data.error || 'Not found'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {result.leak_data && (
                    <div className="mt-3">
                      <h5 className="font-bold mb-2">Leak Data</h5>
                      <div className={`p-3 rounded ${isDark ? 'bg-red-900' : 'bg-red-100'}`}>
                        <p className="font-bold text-red-500">⚠️ {result.leak_data.source}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.found && (
                <div className={`grid grid-cols-3 gap-4 mt-4 pt-4 border-t ${isDark ? 'border-cyberdark-700' : 'border-gray-200'}`}>
                  {result.platform === 'GitHub' && (
                    <>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Followers</p>
                        <p className="font-bold text-lg">{result.followersCount}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Repos</p>
                        <p className="font-bold text-lg">{result.reposCount}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Activity</p>
                        <p className="font-bold text-sm">{result.lastActivity}</p>
                      </div>
                    </>
                  )}
                  {(result.platform === 'Email Check' || result.platform === 'Phone Number Check') && (
                    <>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Type</p>
                        <p className="font-bold text-lg">{result.email ? 'Email' : 'Phone'}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Value</p>
                        <p className="font-bold text-sm">{result.email || result.phone}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Source</p>
                        <p className="font-bold text-sm">{result.source}</p>
                      </div>
                    </>
                  )}
                  {result.platform === 'Twitter' && (
                    <>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Followers</p>
                        <p className="font-bold text-lg">{result.followersCount}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tweets</p>
                        <p className="font-bold text-lg">{result.tweetsCount}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Tweet</p>
                        <p className="font-bold text-sm">{result.lastTweet}</p>
                      </div>
                    </>
                  )}
                  {result.platform === 'LinkedIn' && (
                    <>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Connections</p>
                        <p className="font-bold text-lg">{result.connections}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Headline</p>
                        <p className="font-bold text-sm">{result.headline}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Updated</p>
                        <p className="font-bold text-sm">{result.lastUpdate}</p>
                      </div>
                    </>
                  )}
                  {result.platform === 'Stack Overflow' && (
                    <>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Reputation</p>
                        <p className="font-bold text-lg">{result.reputation}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Answers</p>
                        <p className="font-bold text-lg">{result.answers}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Activity</p>
                        <p className="font-bold text-sm">{result.lastActivity}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence Insights - Flex layout */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Intelligence Insights */}
        <div className={`${isDark ? 'glass' : 'bg-white border border-gray-200'} rounded-xl p-8`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className={`size-6 ${isDark ? 'text-cybercyan-400' : 'text-cyan-500'}`} />
            Intelligence Insights
          </h3>

          <div className="space-y-4">
            {results.insights.map((insight, index) => {
              const Icon = iconMap[insight.icon] || Globe;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${isDark ? 'bg-cyberdark-800' : 'bg-gray-100'}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`size-5 mt-1 flex-shrink-0 ${isDark ? 'text-cybercyan-400' : 'text-cyan-500'}`} />
                    <div>
                      <h4 className="font-bold mb-1">{insight.title}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Score & Leaked Data */}
        <div className="space-y-8">
          {/* Risk Score */}
          <div className={`${isDark ? 'glass' : 'bg-white border border-gray-200'} rounded-xl p-8`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertCircle className={`size-6 ${getRiskColor(results.riskScore)}`} />
              Risk Assessment
            </h3>

            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getRiskBgColor(results.riskScore)} mb-4`}>
                <span className={`text-4xl font-bold ${getRiskColor(results.riskScore)}`}>
                  {results.riskScore}
                </span>
              </div>
              <p className="font-bold text-lg mb-2">
                <span className={getRiskColor(results.riskScore)}>
                  {getRiskLabel(results.riskScore)} Risk
                </span>
              </p>

              <div className="w-full bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    results.riskScore < 30
                      ? 'bg-green-500'
                      : results.riskScore < 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${results.riskScore}%` }}
                ></div>
              </div>

              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Digital exposure level and security risk
              </p>
            </div>
          </div>

          {/* Leaked Data */}
          <div className={`${isDark ? 'glass' : 'bg-white border border-gray-200'} rounded-xl p-8`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              Leaked Data
              <span className={`text-sm font-normal ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                ({visibleLeaks.length}/{results.leakedData.length})
              </span>
            </h3>

            {/* Year Filter */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Exposure year:</span>
              {[
                { v: 'all', label: 'All' },
                { v: '1', label: 'Last 1y' },
                { v: '3', label: 'Last 3y' },
                { v: '5', label: 'Last 5y' },
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setYearFilter(opt.v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    yearFilter === opt.v
                      ? isDark
                        ? 'bg-cybercyan-900 text-cybercyan-300 border-cybercyan-600'
                        : 'bg-cyan-100 text-cyan-800 border-cyan-400'
                      : isDark
                        ? 'bg-cyberdark-800 text-gray-400 border-cyberdark-700 hover:border-cyberblue-500'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {visibleLeaks.map((leak, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    leak.severity === 'high'
                      ? isDark
                        ? 'bg-red-900 border-l-red-500'
                        : 'bg-red-100 border-l-red-500'
                      : leak.severity === 'medium'
                      ? isDark
                        ? 'bg-yellow-900 border-l-yellow-500'
                        : 'bg-yellow-100 border-l-yellow-500'
                      : isDark
                        ? 'bg-blue-900 border-l-blue-500'
                        : 'bg-blue-100 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">{leak.source}</p>
                    {leak.year && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          isDark
                            ? 'bg-cyberdark-900 text-gray-300 border-cyberdark-700'
                            : 'bg-gray-200 text-gray-600 border-gray-300'
                        }`}
                        title="Year the data was exposed"
                      >
                        {leak.year}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Documents: {leak.count} | Severity: {leak.severity}
                    {leak.year ? ` | Exposed: ${leak.year}` : ''}
                  </p>
                </div>
              ))}
              {visibleLeaks.length === 0 && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No exposed data within the selected time range.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className={`${isDark ? 'glass' : 'bg-white border border-gray-200'} rounded-xl p-8`}>
        <h3 className="text-xl font-bold mb-6">Security Recommendations</h3>

        <div className="grid md:grid-cols-2 gap-4">
          {results.recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-cyberdark-800' : 'bg-gray-100'}`}
            >
              <CheckCircle className={`size-5 mt-1 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ResultsSection;

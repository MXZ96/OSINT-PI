// Simulated OSINT Data & Analysis Engine

const osintDatabase = {
  socialPlatforms: [
    { name: 'GitHub', domains: ['github.com'], priority: 'high' },
    { name: 'Twitter', domains: ['twitter.com', 'x.com'], priority: 'high' },
    { name: 'LinkedIn', domains: ['linkedin.com'], priority: 'high' },
    { name: 'Stack Overflow', domains: ['stackoverflow.com'], priority: 'medium' },
    { name: 'Reddit', domains: ['reddit.com'], priority: 'medium' },
    { name: 'Mastodon', domains: ['mastodon.social'], priority: 'medium' },
  ],

  leakDatabases: [
    'LinkedIn Breach (2021)',
    'Twitter API Leak',
    'Public GitHub Repos',
    'HaveIBeenPwned',
    'Facebook Leak (2019)',
    'Adobe Breach (2013)',
  ],

  phoneExposures: [
    'Twilio Leak Database',
    'Public Phone Records',
    'SMS Verification Leaks',
    'VoIP Records',
  ],
};

// Analyze target data
function analyzeTarget(targetData) {
  const { email, username, phone, fullName, location } = targetData;

  // Generate realistic findings
  const findings = {
    query: targetData,
    timestamp: new Date().toISOString(),
    osintResults: [],
    leakedData: [],
    insights: [],
    riskScore: calculateRiskScore(email, username, phone),
    recommendations: generateRecommendations(email, username, phone),
    aiComparison: {},
  };

  // Simulate social platform searches with correlation
  findings.osintResults = simulatePlatformSearch(username, email, fullName, location);

  // Simulate leak detection
  findings.leakedData = simulateLeakDetection(email, phone);

  // Add Intelligence X result (email leak intelligence) with last detected year
  if (email) {
    // Last detected = most recent breach year (exclude always-current public_data)
    const breachYears = findings.leakedData
      .filter(l => l.type !== 'public_data')
      .map(l => l.year || 0)
      .filter(Boolean);
    const lastDetected = breachYears.length
      ? Math.max(...breachYears)
      : new Date().getFullYear();

    findings.osintResults.push({
      platform: 'Intelligence X',
      username: email,
      email: email,
      domain: email.split('@')[1] || '',
      url: `https://intelx.io/?s=${encodeURIComponent(email)}`,
      found: true,
      confidence: 1,
      confidenceLabel: 'High',
      isLikelyOwner: true,
      lastDetected,
      intelx_stats: {
        text_files: Math.floor(Math.random() * 500),
        csv_files: Math.floor(Math.random() * 200),
        db_files: Math.floor(Math.random() * 100),
      },
      correlation: { emailMatch: true },
    });
  }

  // Generate insights
  findings.insights = generateInsights(findings.osintResults, findings.leakedData);

  // Generate AI comparison
  findings.aiComparison = generateAIComparison(findings);

  return findings;
}

function simulatePlatformSearch(username, email, fullName, location) {
  const platforms = osintDatabase.socialPlatforms;
  const results = [];

  platforms.forEach(platform => {
    const found = username && Math.random() > 0.2; // 80% chance of finding username

    // Generate mock profile data for correlation
    const mockProfile = generateMockProfile(platform.name, username, email, fullName, location);

    // Calculate confidence score (0-1)
    const confidence = calculateConfidence(mockProfile, fullName, location, email, username);

    results.push({
      platform: platform.name,
      username: username || 'not_found',
      email: email,
      url: `https://${platform.domains[0]}/${username || 'profile'}`,
      found: found,
      followersCount: found ? Math.floor(Math.random() * 10000) : 0,
      reposCount: platform.name === 'GitHub' ? (found ? Math.floor(Math.random() * 50) : 0) : undefined,
      tweetsCount: platform.name === 'Twitter' ? (found ? Math.floor(Math.random() * 5000) : 0) : undefined,
      reputation: platform.name === 'Stack Overflow' ? (found ? Math.floor(Math.random() * 50000) : 0) : undefined,
      answers: platform.name === 'Stack Overflow' ? (found ? Math.floor(Math.random() * 200) : 0) : undefined,
      connections: platform.name === 'LinkedIn' ? (found ? Math.floor(Math.random() * 5000) : 0) : undefined,
      headline: platform.name === 'LinkedIn' ? 'Software Engineer | Cybersecurity' : undefined,
      lastActivity: getRandomActivity(),
      lastTweet: platform.name === 'Twitter' ? getRandomTime() : undefined,
      lastUpdate: platform.name === 'LinkedIn' ? getRandomTime() : undefined,
      // Correlation data
      confidence: confidence,
      confidenceLabel: getConfidenceLabel(confidence),
      isLikelyOwner: found && confidence >= 0.6,
      correlation: {
        nameMatch: !!fullName && confidence >= 0.4,
        locationMatch: !!location && mockProfile.location && mockProfile.location.toLowerCase().includes(location.toLowerCase()),
        emailMatch: !!email && mockProfile.email === email,
      },
      profileData: mockProfile,
    });
  });

  return results;
}

function generateMockProfile(platform, username, email, fullName, location) {
  const firstName = fullName ? fullName.split(' ')[0] : '';
  const lastName = fullName ? fullName.split(' ').slice(1).join(' ') : '';

  const bios = {
    'GitHub': `Developer | ${firstName} ${lastName}`.trim(),
    'Twitter': `${firstName} ${lastName}`.trim() + ' | Tech enthusiast',
    'LinkedIn': `${firstName} ${lastName}`.trim() + ' | Software Engineer',
    'Stack Overflow': `${firstName} ${lastName}`.trim() + ' | Problem solver',
    'Reddit': `u/${username}`,
    'Mastodon': `@${username}@mastodon.social`,
  };

  // Randomize whether this mock profile actually belongs to the target
  const matchesTarget = Math.random() > 0.4; // 60% chance the profile is "related"
  const profileName = matchesTarget
    ? (fullName || `${firstName} ${lastName}`.trim() || username)
    : `${username}_other`; // a different person with the same username

  const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Remote'];
  const profileLocation = matchesTarget
    ? (location || locations[Math.floor(Math.random() * locations.length)])
    : locations[Math.floor(Math.random() * locations.length)];

  return {
    displayName: profileName,
    bio: bios[platform] || '',
    location: profileLocation,
    email: matchesTarget ? email : undefined,
    website: platform === 'GitHub' ? `https://github.com/${username}` : undefined,
    avatarHash: `mock_hash_${username}_${platform}_${matchesTarget ? 'me' : 'other'}`,
    createdAt: '2020-01-15',
  };
}

function calculateConfidence(profile, fullName, location, email, username) {
  if (!username) return 0;

  let score = 0.3; // Base: username match

  // Full name match
  if (fullName && profile.displayName) {
    const nameSimilarity = stringSimilarity(fullName.toLowerCase(), profile.displayName.toLowerCase());
    score += nameSimilarity * 0.3;
  }

  // Location match
  if (location && profile.location) {
    const locSimilarity = stringSimilarity(location.toLowerCase(), profile.location.toLowerCase());
    score += locSimilarity * 0.2;
  }

  // Email in profile
  if (email && profile.email === email) {
    score += 0.25;
  }

  // Bio contains name parts
  if (fullName && profile.bio) {
    const nameParts = fullName.toLowerCase().split(' ').filter(Boolean);
    const bioLower = profile.bio.toLowerCase();
    const matches = nameParts.filter(p => bioLower.includes(p)).length;
    score += (matches / nameParts.length) * 0.15;
  }

  // LinkedIn more likely a real identity
  if (profile.platform === 'LinkedIn' && fullName && profile.displayName) {
    score += 0.1;
  }

  return Math.min(1, Math.round(score * 100) / 100);
}

function stringSimilarity(a, b) {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 && wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size || 0;
}

function getConfidenceLabel(score) {
  if (score >= 0.7) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}

function simulateLeakDetection(email, phone) {
  const leaks = [];
  const severities = ['low', 'medium', 'high'];

  if (email) {
    leaks.push({
      source: 'LinkedIn Breach (2021)',
      type: 'email_exposed',
      count: 1,
      severity: 'high',
      status: 'compromised',
      date: '2021-04-15',
    });

    if (Math.random() > 0.6) {
      leaks.push({
        source: 'Twitter API Leak',
        type: 'archived_data',
        count: 1,
        severity: 'medium',
        status: 'indexed',
        date: '2022-08-20',
      });
    }
  }

  if (phone) {
    leaks.push({
      source: 'Twilio SMS Leak',
      type: 'phone_exposed',
      count: 1,
      severity: 'high',
      status: 'active',
      date: '2023-01-10',
    });
  }

  // Always add public data
  leaks.push({
    source: 'Public GitHub Repos',
    type: 'public_data',
    count: Math.floor(Math.random() * 50),
    severity: 'low',
    status: 'active',
    date: new Date().toISOString().split('T')[0],
  });

  // Attach exposure year for filtering/display
  return leaks.map(l => ({ ...l, year: new Date(l.date).getFullYear() }));
}

function calculateRiskScore(email, username, phone) {
  let score = 25; // Base score

  if (email) score += 25;
  if (username) score += 20;
  if (phone) score += 30;

  // Add randomization
  score += Math.floor(Math.random() * 20) - 10;

  return Math.max(0, Math.min(100, score));
}

function generateInsights(osintResults, leakedData) {
  const platformsFound = osintResults.filter(r => r.found).length;
  const relatedCount = osintResults.filter(r => r.isLikelyOwner).length;

  return [
    {
      title: 'Multi-Platform Presence',
      description: `Digital footprint found across ${platformsFound} major platforms (${relatedCount} likely yours)`,
      icon: 'globe',
      severity: platformsFound > 3 ? 'high' : 'medium',
    },
    {
      title: 'Data Exposure',
      description: `Personal data indexed in ${leakedData.length} breach(es) or source(s)`,
      icon: 'database',
      severity: leakedData.length > 2 ? 'high' : 'medium',
    },
    {
      title: 'Identity Correlation',
      description: relatedCount > 0
        ? `${relatedCount} account(s) strongly correlated to your identity`
        : 'No accounts could be confidently linked to your identity',
      icon: 'link',
      severity: relatedCount > 2 ? 'high' : 'low',
    },
    {
      title: 'Username Collisions',
      description: platformsFound - relatedCount > 0
        ? `${platformsFound - relatedCount} profile(s) share the username but likely belong to others`
        : 'No username collisions detected',
      icon: 'users',
      severity: platformsFound - relatedCount > 0 ? 'medium' : 'low',
    },
    {
      title: 'Exposure Timeline',
      description: 'Data exposure spans across multiple years',
      icon: 'mail',
      severity: 'medium',
    },
  ];
}

function generateRecommendations(email, username, phone) {
  return [
    'Enable Two-Factor Authentication (2FA) on all accounts',
    'Review and restrict privacy settings on social media',
    'Remove sensitive data from public repositories',
    'Update passwords on all compromised accounts',
    'Monitor email addresses using HaveIBeenPwned',
    'Enable activity alerts on financial accounts',
    'Use strong, unique passwords with a password manager',
    'Consider identity theft protection service',
  ];
}

function generateAIComparison(findings) {
  const { query, osintResults, leakedData } = findings;
  const platformCount = osintResults.filter(r => r.found).length;
  const relatedCount = osintResults.filter(r => r.isLikelyOwner).length;

  return {
    osintAnalysis: `Our OSINT tools detected that "${query.username || 'the target'}" returned ${platformCount} platform result(s), of which ${relatedCount} could be confidently correlated to the supplied identity using name and location matching. The remaining profiles share the same username but are likely unrelated individuals (collisions).`,

    aiInsight: `Analysis of the OSINT findings suggests that where a username is common, raw username matching produces false positives. Correlating on display name, location, and email raises confidence: ${relatedCount} account(s) show strong attribution signals while others should be manually verified. Implementing cross-attribute correlation (avatar hash, bio keywords, posting patterns) would further reduce misattribution. The data exposure appears primarily through legacy breaches rather than active compromise, suggesting historical rather than ongoing threats.`,
  };
}

function getRandomActivity() {
  const activities = [
    '1 hour ago',
    '2 hours ago',
    '1 day ago',
    '2 days ago',
    '1 week ago',
    '2 months ago',
  ];
  return activities[Math.floor(Math.random() * activities.length)];
}

function getRandomTime() {
  const times = [
    '30 minutes ago',
    '2 hours ago',
    '1 day ago',
    '3 days ago',
    '1 week ago',
  ];
  return times[Math.floor(Math.random() * times.length)];
}

/**
 * Generate name variations from input
 */
function generateNameVariations(fullName, firstName = '', lastName = '') {
  const name = fullName ? fullName.trim() : `${firstName} ${lastName}`.trim();
  const parts = name.split(/\s+/);

  return {
    fullName: name,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    firstInitial: parts[0] ? parts[0][0] : '',
    lastInitial: parts[1] ? parts[1][0] : '',
    dotNotation: parts.length > 1 ? parts.join('.').toLowerCase() : name.toLowerCase(),
    underscoreName: parts.join('_').toLowerCase(),
    camelCaseName: parts.map((p, i) =>
      i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    ).join(''),
    hyphenatedName: parts.join('-').toLowerCase(),
    initials: parts.map(p => p[0]).join('').toLowerCase(),
    reversedName: parts.length > 1 ? `${parts[1]} ${parts[0]}` : name,
  };
}

/**
 * Select domains based on strategy
 */
function selectDomainsForDiscovery(strategy = 'balanced', maxDomains = 10) {
  const domains = [];
  const tiers = ['tier1', 'tier2', 'tier3'];
  const tierCounts = {
    balanced: [6, 3, 1],
    focused: [10, 0, 0],
    comprehensive: [6, 3, 1],
    professional: [4, 4, 0],
  };

  const counts = tierCounts[strategy] || tierCounts.balanced;

  Object.keys(osintDatabase.discoveryDomains).forEach((tier, index) => {
    const tierDomains = osintDatabase.discoveryDomains[tier];
    const count = counts[index] || 0;

    // Sort by weight and take top domains
    domains.push(...tierDomains
      .sort((a, b) => b.weight - a.weight)
      .slice(0, count));
  });

  return domains.slice(0, maxDomains);
}

/**
 * Calculate domain priority score
 */
function calculateDomainPriority(domain, strategy = 'balanced') {
  let score = domain.weight;

  if (strategy === 'professional' && (domain.type === 'professional' || domain.type === 'developer')) {
    score *= 1.5;
  }

  if (strategy === 'focused' && domain.type === 'social') {
    score *= 1.3;
  }

  return Math.round(score);
}

/**
 * Generate discovery queries for full-name search
 */
function generateDiscoveryQueries(nameVariations, domains, options = {}) {
  const {
    maxQueries = 30,
    strategy = 'balanced',
    queryTypes = ['basic', 'domain', 'context']
  } = options;

  const queries = [];
  const { fullName, firstName, lastName } = nameVariations;

  // Template definitions
  const templates = {
    basic: [
      `"${fullName}"`,
      `"${firstName} ${lastName}"`,
      `"${firstName}" "${lastName}" profile`,
      `"${firstName}" "${lastName}" about`,
      `"${firstName}.${lastName}"`
    ],
    domain: [
      `"${fullName}" site:{domain}`,
      `"${firstName} ${lastName}" site:{domain}`,
      `"${firstName}" "${lastName}" site:{domain}`,
      `"${firstName}" "{lastName}" {domain}`
    ],
    context: [
      `"${firstName} ${lastName}" developer`,
      `"${firstName} ${lastName}" engineer`,
      `"${firstName} ${lastName}" portfolio`,
      `"${firstName} ${lastName}" "about me"`
    ],
    platform: [
      `"${fullName}" GitHub`,
      `"${fullName}" LinkedIn`,
      `"${fullName}" "Twitter"`
    ]
  };

  // Generate basic queries
  if (queryTypes.includes('basic')) {
    templates.basic.forEach((template, index) => {
      queries.push({
        query: template,
        type: 'basic',
        priority: 10 - index,
        domainsTargeted: ['general'],
        strategyContext: strategy
      });
    });
  }

  // Generate domain-specific queries
  if (queryTypes.includes('domain')) {
    const priorityDomains = domains.slice(0, Math.min(15, domains.length));

    priorityDomains.forEach(domain => {
      const domainPriority = calculateDomainPriority(domain, strategy);

      templates.domain.slice(0, 3).forEach(template => {
        const query = template
          .replace(/{domain}/g, domain.domain)
          .replace('{domain}', domain.domain);

        queries.push({
          query: query,
          type: 'domain',
          priority: domainPriority,
          domain: domain.domain,
          domainType: domain.type,
          weight: domain.weight,
          strategyContext: strategy
        });
      });
    });
  }

  // Generate context-based queries
  if (queryTypes.includes('context')) {
    templates.context.forEach((template, index) => {
      queries.push({
        query: template,
        type: 'context',
        priority: 5,
        domainsTargeted: ['general'],
        strategyContext: strategy
      });
    });
  }

  // Generate platform-specific queries if using comprehensive strategy
  if (strategy === 'comprehensive') {
    templates.platform.forEach((template, index) => {
      queries.push({
        query: template,
        type: 'platform',
        priority: 8,
        domainsTargeted: ['general'],
        strategyContext: strategy
      });
    });
  }

  // Sort by priority and limit
  queries.sort((a, b) => b.priority - a.priority);

  return {
    queries: queries.slice(0, maxQueries),
    totalGenerated: queries.length,
    usedQueries: Math.min(queries.length, maxQueries),
    domainCount: new Set(queries.map(q => q.domain).filter(Boolean)).size,
    byType: groupQueriesByType(queries),
    byDomain: groupQueriesByDomain(queries),
    strategy: strategy
  };
}

function groupQueriesByType(queries) {
  const groups = {};
  queries.forEach(q => {
    if (!groups[q.type]) groups[q.type] = [];
    groups[q.type].push(q);
  });
  return groups;
}

function groupQueriesByDomain(queries) {
  const groups = {};
  queries.forEach(q => {
    if (q.domain) {
      if (!groups[q.domain]) groups[q.domain] = [];
      groups[q.domain].push(q);
    }
  });
  return groups;
}

/**
 * Full-Name Discovery System
 * Generates intelligent queries for identity discovery without APIs
 */
function discoverFullName(nameData, options = {}) {
  const {
    fullName = '',
    firstName = '',
    lastName = '',
    strategy = 'balanced',
    maxQueries = 30,
    maxDomains = 10,
    expandDomains = false,
    maxExpandedDomains = 50,
    enableCrawling = false,
    maxLinksPerQuery = 20,
    enableMonitoring = false
  } = nameData;

  // Generate name variations
  const nameVariations = generateNameVariations(fullName, firstName, lastName);

  // Select domains based on strategy
  let domains = selectDomainsForDiscovery(strategy, maxDomains);

  // Optionally expand domain coverage
  if (expandDomains) {
    const allDomains = [
      ...osintDatabase.discoveryDomains.tier1,
      ...osintDatabase.discoveryDomains.tier2,
      ...osintDatabase.discoveryDomains.tier3
    ].sort((a, b) => b.weight - a.weight);

    domains = allDomains.slice(0, maxExpandedDomains);
  }

  // Generate queries
  const querySet = generateDiscoveryQueries(nameVariations, domains, {
    maxQueries,
    strategy,
    queryTypes: strategy === 'comprehensive' ? ['basic', 'domain', 'context', 'platform'] : ['basic', 'domain', 'context']
  });

  // Calculate performance estimates
  const estimatedTime = Math.round(
    querySet.queries.length * 1.5 * 1000 / 1000
  );

  // Create crawling plan if enabled
  let crawlingPlan = null;
  if (enableCrawling) {
    crawlingPlan = {
      maxLinksPerQuery,
      totalPotentialLinks: querySet.queries.length * maxLinksPerQuery,
      estimatedCrawlTime: Math.round(querySet.queries.length * maxLinksPerQuery * 2),
      depthLimit: 2,
      concurrentLimit: 5,
      rateLimitMs: 1000,
      approach: 'Limited HTML crawling with selective link extraction'
    };
  }

  // Anti-blocking measures
  const antiBlocking = {
    measures: [
      'Random user-agent rotation per request',
      '1-second delay between requests to same domain',
      'Maximum 5 concurrent requests',
      'Respects robots.txt when available',
      'Exponential backoff on rate limiting',
      'Random delays (500-1500ms) between requests',
      'Session-based cookie handling',
      'Referer header management'
    ],
    recommendedLimits: {
      maxQueriesPerCycle: 50,
      maxQueriesPerDomain: 5,
      requestsPerMinute: 60,
      cooldownPeriodMs: 5000
    }
  };

  return {
    success: true,
    name: {
      ...nameVariations,
      searchStrategy: strategy
    },
    configuration: {
      strategy: strategy,
      maxQueries: maxQueries,
      domainsConfigured: domains.length,
      domainsAvailable: osintDatabase.discoveryDomains.tier1.length +
                       osintDatabase.discoveryDomains.tier2.length +
                       osintDatabase.discoveryDomains.tier3.length,
      expansionEnabled: expandDomains,
      crawlingEnabled: enableCrawling,
      monitoringEnabled: enableMonitoring
    },
    domains: domains.map(d => ({
      domain: d.domain,
      type: d.type,
      weight: d.weight,
      priorityScore: calculateDomainPriority(d, strategy)
    })),
    queries: querySet,
    crawling: crawlingPlan,
    performance: {
      estimatedExecutionTimeSeconds: estimatedTime,
      queriesPerSecond: 4,
      averageResponseTimeMs: 1500,
      totalPotentialResults: querySet.queries.length * 3,
      memoryEstimateMB: Math.round(querySet.queries.length * 0.5)
    },
    antiBlocking,
    recommendations: generateDiscoveryRecommendations(strategy, domains, nameVariations),
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      methodology: 'Domain-based dorking with HTML scraping (no APIs)',
      purpose: 'Identity discovery and digital footprint analysis'
    }
  };
}

/**
 * Generate recommendations for discovery strategy
 */
function generateDiscoveryRecommendations(strategy, domains, nameVariations) {
  const recs = [];

  recs.push({
    category: 'Query Optimization',
    recommendation: `Use ${strategy} strategy with ${domains.length} priority domains`,
    priority: 'high'
  });

  recs.push({
    category: 'Execution Order',
    recommendation: 'Execute queries from highest to lowest priority to maximize early findings',
    priority: 'high'
  });

  recs.push({
    category: 'Rate Limiting',
    recommendation: 'Implement 1-second delay between domain requests to avoid blocking',
    priority: 'critical'
  });

  if (nameVariations.fullName.split(' ').length === 2) {
    recs.push({
      category: 'Name Variations',
      recommendation: 'Include dot (.), underscore (_), and hyphen (-) variations of the name',
      priority: 'medium'
    });
  }

  recs.push({
    category: 'Link Extraction',
    recommendation: 'Extract profile-related links from search results for deeper investigation',
    priority: 'medium'
  });

  recs.push({
    category: 'Validation',
    recommendation: 'Cross-reference findings across multiple domains for accuracy',
    priority: 'high'
  });

  if (strategy === 'comprehensive') {
    recs.push({
      category: 'Coverage',
      recommendation: 'Comprehensive strategy covers 95% of major platforms - consider reducing for speed',
      priority: 'low'
    });
  }

  return recs;
}

module.exports = {
  analyzeTarget,
  osintDatabase,
  discoverFullName,
  generateNameVariations,
  selectDomainsForDiscovery,
  generateDiscoveryQueries,
};

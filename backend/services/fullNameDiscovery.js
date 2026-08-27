// Full-Name Discovery System - Query Generator
// Domain-based dorking for identity discovery without APIs
// Uses HTML scraping and limited crawling with anti-blocking measures

const DOMAIN_WEIGHTS = {
  high: 10,
  medium: 5,
  low: 2
};

// Tier 1: High-value professional/social platforms (used first)
const TIER_1_DOMAINS = [
  { domain: 'linkedin.com', weight: DOMAIN_WEIGHTS.high, type: 'professional' },
  { domain: 'github.com', weight: DOMAIN_WEIGHTS.high, type: 'developer' },
  { domain: 'twitter.com', weight: DOMAIN_WEIGHTS.high, type: 'social' },
  { domain: 'x.com', weight: DOMAIN_WEIGHTS.high, type: 'social' },
  { domain: 'instagram.com', weight: DOMAIN_WEIGHTS.high, type: 'social' },
  { domain: 'facebook.com', weight: 9, type: 'social' },
  { domain: 'tiktok.com', weight: DOMAIN_WEIGHTS.high, type: 'content' },
  { domain: 'youtube.com', weight: DOMAIN_WEIGHTS.high, type: 'content' },
  { domain: 'medium.com', weight: 9, type: 'content' },
  { domain: 'pinterest.com', weight: 6, type: 'content' },
];

// Tier 2: Professional & development platforms
const TIER_2_DOMAINS = [
  { domain: 'stackoverflow.com', weight: DOMAIN_WEIGHTS.medium, type: 'developer' },
  { domain: 'reddit.com', weight: DOMAIN_WEIGHTS.medium, type: 'community' },
  { domain: 'dev.to', weight: DOMAIN_WEIGHTS.medium, type: 'developer' },
  { domain: 'gitlab.com', weight: DOMAIN_WEIGHTS.medium, type: 'developer' },
  { domain: 'fiverr.com', weight: DOMAIN_WEIGHTS.medium, type: 'professional' },
  { domain: 'upwork.com', weight: DOMAIN_WEIGHTS.medium, type: 'professional' },
  { domain: 'behance.net', weight: DOMAIN_WEIGHTS.medium, type: 'portfolio' },
  { domain: 'dribbble.com', weight: DOMAIN_WEIGHTS.medium, type: 'portfolio' },
  { domain: 'soundcloud.com', weight: 5, type: 'content' },
  { domain: 'twitch.tv', weight: 8, type: 'content' },
];

// Tier 3: Content & community platforms
const TIER_3_DOMAINS = [
  { domain: 'discord.com', weight: DOMAIN_WEIGHTS.low, type: 'community' },
  { domain: 'spotify.com', weight: 3, type: 'content' },
  { domain: 'vimeo.com', weight: 4, type: 'content' },
  { domain: 'blogspot.com', weight: 3, type: 'content' },
  { domain: 'wordpress.com', weight: 4, type: 'content' },
  { domain: 'wix.com', weight: 3, type: 'portfolio' },
  { domain: 'about.me', weight: DOMAIN_WEIGHTS.low, type: 'portfolio' },
  { domain: 'keybase.io', weight: DOMAIN_WEIGHTS.low, type: 'identity' },
];

// All domains sorted by weight
const ALL_DOMAINS = [...TIER_1_DOMAINS, ...TIER_2_DOMAINS, ...TIER_3_DOMAINS]
  .sort((a, b) => b.weight - a.weight);

// Performance limits to prevent over-querying
const PERFORMANCE_LIMITS = {
  MAX_QUERIES_PER_CYCLE: 50,
  MAX_LINKS_PER_QUERY: 20,
  MAX_CONCURRENT_REQUESTS: 5,
  REQUEST_DELAY_MS: 1000,
  MIN_QUERIES: 10,
  MAX_DOMAINS_INITIAL: 10
};

// Query templates for different discovery strategies
const QUERY_TEMPLATES = {
  basic: [
    '"{fullName}"',
    '"{firstName} {lastName}"',
    '"{firstName}" "{lastName}" profile',
    '"{firstName}" "{lastName}" about',
    '"{firstName}.{lastName}"'
  ],
  domain: [
    '"{fullName}" site:{domain}',
    '"{firstName} {lastName}" site:{domain}',
    '"{firstName}" "{lastName}" site:{domain}',
    '"{firstName} {lastName}" "{domain}"'
  ],
  context: [
    '"{firstName} {lastName}" developer',
    '"{firstName} {lastName}" engineer',
    '"{firstName} {lastName}" portfolio',
    '"{firstName} {lastName}" "about me"'
  ],
  platform: [
    '"{fullName}" "GitHub"',
    '"{fullName}" "LinkedIn"',
    '"{firstName}.{lastName}" "{domain}"'
  ]
};

/**
 * Generate name variations from full name input
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
 * Calculate priority score for domain based on strategy
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
 * Select domains based on strategy and performance limits
 */
function selectDomains(strategy = 'balanced', maxDomains = PERFORMANCE_LIMITS.MAX_DOMAINS_INITIAL) {
  const domains = [];
  const tierCounts = {
    balanced: [6, 3, 1],
    focused: [10, 0, 0],
    comprehensive: [6, 3, 1],
    professional: [4, 4, 0],
  };
  
  const counts = tierCounts[strategy] || tierCounts.balanced;
  
  Object.keys({ tier1: TIER_1_DOMAINS, tier2: TIER_2_DOMAINS, tier3: TIER_3_DOMAINS }).forEach((tier, index) => {
    const tierDomains = { tier1: TIER_1_DOMAINS, tier2: TIER_2_DOMAINS, tier3: TIER_3_DOMAINS }[tier];
    const count = counts[index] || 0;
    
    domains.push(...tierDomains
      .sort((a, b) => b.weight - a.weight)
      .slice(0, count));
  });
  
  return domains.slice(0, maxDomains);
}

/**
 * Generate intelligent queries for full-name discovery
 */
function generateDiscoveryQueries(nameVariations, domains, options = {}) {
  const {
    maxQueries = PERFORMANCE_LIMITS.MAX_QUERIES_PER_CYCLE,
    strategy = 'balanced',
    queryTypes = ['basic', 'domain', 'context']
  } = options;
  
  const queries = [];
  const { fullName, firstName, lastName } = nameVariations;
  
  // Generate basic name-based queries
  if (queryTypes.includes('basic')) {
    QUERY_TEMPLATES.basic.forEach((template, index) => {
      const query = template
        .replace(/{fullName}/g, fullName)
        .replace(/{firstName}/g, firstName)
        .replace(/{lastName}/g, lastName);
      
      queries.push({
        query: query,
        type: 'basic',
        priority: 10 - index,
        domainsTargeted: ['general'],
        strategyContext: strategy
      });
    });
  }
  
  // Generate domain-specific dorking queries
  if (queryTypes.includes('domain')) {
    const priorityDomains = domains.slice(0, Math.min(15, domains.length));
    
    priorityDomains.forEach(domain => {
      const domainPriority = calculateDomainPriority(domain, strategy);
      
      QUERY_TEMPLATES.domain.slice(0, 3).forEach(template => {
        const query = template
          .replace(/{fullName}/g, fullName)
          .replace(/{firstName}/g, firstName)
          .replace(/{lastName}/g, lastName)
          .replace(/{domain}/g, domain.domain);
        
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
    QUERY_TEMPLATES.context.forEach(template => {
      const query = template
        .replace(/{firstName}/g, firstName)
        .replace(/{lastName}/g, lastName);
      
      queries.push({
        query: query,
        type: 'context',
        priority: 5,
        domainsTargeted: ['general'],
        strategyContext: strategy
      });
    });
  }
  
  // Generate platform-specific queries for comprehensive strategy
  if (strategy === 'comprehensive') {
    QUERY_TEMPLATES.platform.forEach(template => {
      const query = template
        .replace(/{fullName}/g, fullName)
        .replace(/{firstName}/g, firstName)
        .replace(/{lastName}/g, lastName);
      
      queries.push({
        query: query,
        type: 'platform',
        priority: 8,
        domainsTargeted: ['general'],
        strategyContext: strategy
      });
    });
  }
  
  // Sort by priority and limit
  queries.sort((a, b) => b.priority - a.priority);
  
  const limitedQueries = queries.slice(0, maxQueries);
  
  return {
    queries: limitedQueries,
    totalGenerated: queries.length,
    queriesUsed: limitedQueries.length,
    byType: groupQueriesByType(limitedQueries),
    byDomain: groupQueriesByDomain(limitedQueries),
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
 * Main full-name discovery function
 */
function discoverFullName(nameData, options = {}) {
  const {
    fullName = '',
    firstName = '',
    lastName = '',
    strategy = 'balanced',
    maxQueries = PERFORMANCE_LIMITS.MAX_QUERIES_PER_CYCLE,
    maxDomains = PERFORMANCE_LIMITS.MAX_DOMAINS_INITIAL,
    expandDomains = false,
    maxExpandedDomains = 50,
    enableCrawling = false,
    maxLinksPerQuery = PERFORMANCE_LIMITS.MAX_LINKS_PER_QUERY,
    enableMonitoring = false
  } = nameData;
  
  // Validate input
  if (!fullName && !firstName && !lastName) {
    return {
      success: false,
      error: 'At least one of fullName, firstName, or lastName is required'
    };
  }
  
  // Generate name variations
  const nameVariations = generateNameVariations(fullName, firstName, lastName);
  
  // Select domains based on strategy
  let domains = selectDomains(strategy, maxDomains);
  
  // Optionally expand domain coverage
  if (expandDomains) {
    domains = ALL_DOMAINS.slice(0, maxExpandedDomains);
  }
  
  // Generate queries
  const querySet = generateDiscoveryQueries(nameVariations, domains, {
    maxQueries,
    strategy,
    queryTypes: strategy === 'comprehensive' ? ['basic', 'domain', 'context', 'platform'] : ['basic', 'domain', 'context']
  });
  
  // Calculate performance estimates
  const estimatedTime = Math.round(querySet.queries.length * PERFORMANCE_LIMITS.REQUEST_DELAY_MS / 1000);
  
  // Create crawling plan if enabled
  let crawlingPlan = null;
  if (enableCrawling) {
    crawlingPlan = {
      maxLinksPerQuery,
      totalPotentialLinks: querySet.queries.length * maxLinksPerQuery,
      estimatedCrawlTime: Math.round(querySet.queries.length * maxLinksPerQuery * 2),
      depthLimit: 2,
      concurrentLimit: PERFORMANCE_LIMITS.MAX_CONCURRENT_REQUESTS,
      rateLimitMs: PERFORMANCE_LIMITS.REQUEST_DELAY_MS,
      approach: 'Limited HTML crawling with selective link extraction (no APIs)'
    };
  }
  
  // Anti-blocking measures
  const antiBlocking = {
    measures: [
      'Random user-agent rotation per request',
      '1-second delay between requests to same domain',
      'Maximum 5 concurrent requests',
      'Random delays (500-1500ms) between requests',
      'Referer header management',
      'Session-based handling'
    ],
    recommendedLimits: {
      maxQueriesPerCycle: PERFORMANCE_LIMITS.MAX_QUERIES_PER_CYCLE,
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
      strategy,
      maxQueries,
      domainsConfigured: domains.length,
      domainsAvailable: ALL_DOMAINS.length,
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
      queriesPerSecond: Math.round(1000 / PERFORMANCE_LIMITS.REQUEST_DELAY_MS),
      averageResponseTimeMs: 1500,
      totalPotentialResults: querySet.queries.length * 3,
      memoryEstimateMB: Math.round(querySet.queries.length * 0.1)
    },
    antiBlocking,
    recommendations: generateDiscoveryRecommendations(strategy, domains, nameVariations),
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      methodology: 'Domain-based dorking with HTML scraping (no API dependencies)',
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
  
  if (nameVariations.fullName.split(' ').length >= 2) {
    recs.push({
      category: 'Name Variations',
      recommendation: 'Include . _ and - variations of the name in searches',
      priority: 'medium'
    });
  }
  
  recs.push({
    category: 'Validation',
    recommendation: 'Cross-reference findings across multiple domains for accuracy',
    priority: 'high'
  });
  
  if (strategy === 'comprehensive' && domains.length > 15) {
    recs.push({
      category: 'Coverage vs Speed',
      recommendation: 'Consider reducing domain count for faster execution',
      priority: 'low'
    });
  }
  
  return recs;
}

module.exports = {
  discoverFullName,
  generateNameVariations,
  selectDomains,
  generateDiscoveryQueries,
  ALL_DOMAINS,
  PERFORMANCE_LIMITS,
  TIER_1_DOMAINS,
  TIER_2_DOMAINS,
  TIER_3_DOMAINS
};
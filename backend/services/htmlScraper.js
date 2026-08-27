// HTML Scraping and Limited Crawling Module
// No API dependencies - pure HTML parsing with rate limiting

const { RateLimiter } = require('./rateLimiter');

const SCRAPING_CONFIG = {
  timeout: 15000,
  maxRetries: 2,
  requestDelay: 1000,
  maxRedirects: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  maxLinksPerPage: 20,
  crawlDepth: 2
};

const requestTracker = new Map();

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return '';
  }
}

/**
 * Clean and normalize URL
 */
function normalizeUrl(url, baseUrl = '') {
  if (!url) return null;
  
  url = url.trim();
  
  // Skip non-HTTP URLs
  if (url.startsWith('mailto:') || url.startsWith('javascript:') || url.startsWith('#')) {
    return null;
  }
  
  // Convert relative URLs to absolute
  if (baseUrl && !url.startsWith('http')) {
    try {
      if (url.startsWith('/')) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.hostname}${url}`;
      }
    } catch (e) {
      return null;
    }
  }
  
  // Remove trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  return url;
}

/**
 * Extract profile-specific data from page
 */
function extractProfileData($, url, domain, nameData) {
  const data = {
    username: null,
    displayName: null,
    bio: null,
    followers: null,
    posts: null,
    location: null,
    verified: false,
    profileImage: null,
    url: url,
    domain: domain,
    likelyMatch: false,
    matchScore: 0
  };
  
  if (!nameData) return data;
  
  // Platform-specific extraction based on domain
  if (domain.includes('github.com')) {
    const pathParts = url.split('/').filter(p => p);
    data.username = pathParts[pathParts.length - 1];
    data.displayName = $('h1').first().text()?.trim() || null;
    data.bio = $('.user-profile-bio, .p-note').first().text()?.trim() || null;
    data.profileImage = $('img[src*="avatar"]').first().attr('src') || null;
    data.followers = $('[href*="/followers"], [aria-label*="follower"]').first().text()?.trim() || null;
    
  } else if (domain.includes('linkedin.com')) {
    data.displayName = $('h1').first().text()?.trim() || null;
    data.bio = $('[class*="summary"], [class*="about"]').first().text()?.trim() || null;
    data.location = $('[class*="location"]').first().text()?.trim() || null;
    
  } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
    data.username = url.split('/').pop();
    data.displayName = $('[data-testid="UserName"]').first().text()?.trim() || null;
    data.bio = $('[data-testid="UserDescription"]').first().text()?.trim() || null;
    data.verified = $('[data-testid="placementTracking"]').length > 0;
    
  } else if (domain.includes('instagram.com')) {
    data.username = url.split('/').pop();
    data.displayName = $('h2').first().text()?.trim() || null;
    data.bio = $('[class*="bio"]').first().text()?.trim() || null;
    
  } else {
    // Generic extraction for any site
    data.displayName = $('h1, .profile-name, .username, .full-name').first().text()?.trim() || null;
    data.bio = $('.bio, .description, .profile-bio, .about').first().text()?.trim() || null;
    data.username = $('[class*="username"], [class*="handle"]').first().text()?.trim() || null;
  }
  
  // Calculate match score based on name data
  if (nameData && data.displayName) {
    data.matchScore = calculateProfileMatchScore(data, nameData);
    data.likelyMatch = data.matchScore > 0.6;
  }
  
  return data;
}

/**
 * Calculate how well a profile matches the search criteria
 */
function calculateProfileMatchScore(profileData, nameData) {
  let score = 0;
  const maxScore = 100;
  
  const displayNameLower = (profileData.displayName || '').toLowerCase();
  const usernameLower = (profileData.username || '').toLowerCase();
  
  // Name matching in display name
  if (nameData.firstName && displayNameLower.includes(nameData.firstName.toLowerCase())) score += 20;
  if (nameData.lastName && displayNameLower.includes(nameData.lastName.toLowerCase())) score += 20;
  if (nameData.fullName && displayNameLower.includes(nameData.fullName.toLowerCase().replace(/ /g, ' '))) score += 30;
  
  // Username matching
  if (nameData.fullName && usernameLower.includes(nameData.fullName.toLowerCase().replace(/ /g, ''))) score += 25;
  if (nameData.firstName && usernameLower.includes(nameData.firstName.toLowerCase())) score += 15;
  if (nameData.lastName && usernameLower.includes(nameData.lastName.toLowerCase())) score += 15;
  
  return Math.min(score, maxScore) / 100;
}

/**
 * Extract relevant links from page
 */
function extractRelevantLinks(links, nameData, currentDomain) {
  const relevant = [];
  const maxLinks = SCRAPING_CONFIG.maxLinksPerPage;
  
  const searchTerms = [
    nameData.firstName,
    nameData.lastName,
    nameData.fullName,
    nameData.dotNotation,
    nameData.underscoreName
  ].filter(Boolean).map(s => s.toLowerCase());
  
  for (const link of links) {
    if (relevant.length >= maxLinks) break;
    
    const normalized = normalizeUrl(link);
    if (!normalized) continue;
    
    const linkLower = normalized.toLowerCase();
    const linkDomain = extractDomain(normalized);
    
    // Check if link contains relevant keywords
    const hasKeyword = searchTerms.some(term => linkLower.includes(term));
    
    // Check if it's a profile-related page
    const profilePatterns = /(profile|user|member|author|developer|portfolio|about)/i;
    const isProfilePage = profilePatterns.test(linkLower);
    
    // Check if it's on same domain
    const isSameDomain = linkDomain === currentDomain;
    
    if ((hasKeyword || isProfilePage) && isSameDomain) {
      relevant.push({
        url: normalized,
        domain: linkDomain,
        relevanceScore: hasKeyword ? 0.8 : 0.5,
        type: isProfilePage ? 'profile' : 'content',
        sameDomain: true
      });
    }
  }
  
  return relevant;
}

/**
 * Scrape a single URL
 */
async function scrapeUrl(url, nameData = null, depth = 1) {
  const domain = extractDomain(url);
  
  if (!domain) {
    return { success: false, error: 'Invalid URL', url };
  }
  
  // Rate limiting
  const lastRequest = requestTracker.get(domain) || 0;
  const elapsed = Date.now() - lastRequest;
  const waitTime = Math.max(0, SCRAPING_CONFIG.requestDelay - elapsed);
  
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  requestTracker.set(domain, Date.now());
  
  try {
    const response = await fetch(url, {
      timeout: SCRAPING_CONFIG.timeout,
      headers: {
        'User-Agent': SCRAPING_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        url,
        domain,
        statusCode: response.status
      };
    }
    
    const html = await response.text();
    
    // Basic HTML parsing (without cheerio)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const description = descriptionMatch ? descriptionMatch[1] : '';
    
    // Extract links
    const linkMatches = html.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
    const allLinks = linkMatches.map(match => {
      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      return hrefMatch ? hrefMatch[1] : '';
    }).filter(Boolean);
    
    // Extract text content (limited)
    const textContent = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000);
    
    // Extract profile data
    const profileData = extractProfileData({
      find: (selector) => {
        // Simplified selector matching
        if (selector.includes('h1')) return [{ text: () => title }];
        return [];
      },
      text: () => textContent
    }, url, domain, nameData);
    
    // Extract relevant links
    const relevantLinks = extractRelevantLinks(allLinks, nameData, domain);
    
    return {
      success: true,
      url,
      domain,
      title,
      description,
      hasContent: textContent.length > 50,
      textContent: textContent.substring(0, 500),
      links: relevantLinks.slice(0, SCRAPING_CONFIG.maxLinksPerPage),
      totalLinksFound: allLinks.length,
      profileData,
      depth,
      crawledAt: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url,
      domain,
      isTimeout: error.message.includes('timeout'),
      isBlocked: error.message.includes('403') || error.message.includes('429')
    };
  }
}

/**
 * Perform discovery scan with crawling
 */
async function performDiscoveryScan(querySet, nameData, options = {}) {
  const {
    maxDepth = SCRAPING_CONFIG.crawlDepth,
    maxLinksPerQuery = SCRAPING_CONFIG.maxLinksPerPage,
    concurrentLimit = 3
  } = options;
  
  const results = [];
  const errors = [];
  const crawledUrls = new Set();
  
  for (let i = 0; i < querySet.queries.length; i++) {
    const queryInfo = querySet.queries[i];
    
    // Build search URL (simulated - would use Google or direct platform search)
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(queryInfo.query)}`;
    
    if (crawledUrls.has(searchUrl)) continue;
    
    try {
      const scrapedData = await scrapeUrl(searchUrl, nameData, 1);
      
      if (scrapedData.success) {
        results.push({
          query: queryInfo.query,
          queryType: queryInfo.type,
          domain: queryInfo.domain || queryInfo.domainsTargeted[0],
          priority: queryInfo.priority,
          searchUrl: searchUrl,
          data: scrapedData,
          matchedProfiles: scrapedData.profileData ? [scrapedData.profileData] : [],
          metadata: {
            queryNumber: i + 1,
            totalQueries: querySet.queries.length
          }
        });
        
        crawledUrls.add(searchUrl);
      } else {
        errors.push({
          query: queryInfo.query,
          searchUrl: searchUrl,
          error: scrapedData.error,
          statusCode: scrapedData.statusCode
        });
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, SCRAPING_CONFIG.requestDelay));
      
    } catch (error) {
      errors.push({
        query: queryInfo.query,
        searchUrl: searchUrl,
        error: error.message
      });
    }
  }
  
  return {
    results,
    errors,
    summary: {
      totalQueries: querySet.queries.length,
      successfulQueries: results.length,
      failedQueries: errors.length,
      profilesFound: results.reduce((count, r) => count + r.matchedProfiles.length, 0),
      uniqueDomains: new Set(results.map(r => r.data?.domain).filter(Boolean)).size,
      urlsCrawled: crawledUrls.size,
      crawlDepth: maxDepth
    }
  };
}

/**
 * Build search URL for a query
 */
function buildSearchUrl(query, domain = '') {
  if (domain && !query.includes('site:')) {
    return `https://www.google.com/search?q=${encodeURIComponent(query + ' site:' + domain)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

module.exports = {
  scrapeUrl,
  performDiscoveryScan,
  extractDomain,
  normalizeUrl,
  calculateProfileMatchScore,
  SCRAPING_CONFIG,
  buildSearchUrl,
  extractRelevantLinks
};
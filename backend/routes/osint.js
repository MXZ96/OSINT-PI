const express = require('express');
const { analyzeTarget } = require('../services/osintAnalyzer');
const { discoverFullName } = require('../services/fullNameDiscovery');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Path to real OSINT tools
const REAL_TOOLS = path.join(__dirname, '../services/realOsintTools.py');
const projectRoot = path.resolve(__dirname, '../..');
const pythonExecutable = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

function isSafeTarget(value) {
  return typeof value === 'string' && value.length <= 200 && !/[\r\n;&|`$<>]/.test(value);
}

// Analyze target
router.post('/analyze', (req, res) => {
  try {
    const { email, username, phone, fullName, location, useRealTools } = req.body;

    // Validate input
    if (!email && !username && !phone && !fullName) {
      return res.status(400).json({
        error: 'At least one of email, username, phone, or fullName is required',
        timestamp: new Date().toISOString(),
      });
    }

    if ([email, username, phone, fullName, location].filter(Boolean).some(value => !isSafeTarget(value))) {
      return res.status(400).json({ error: 'Target values contain unsupported characters or are too long' });
    }

    // Use real tools if requested
    if (useRealTools && (username || email || phone)) {
      return runRealOsint(req, res, { email, username, phone });
    }

    // Perform analysis (mock)
    const results = analyzeTarget({ email, username, phone, fullName, location });

    res.json(results);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Run real OSINT tools
function runRealOsint(req, res, data) {
  const { email, username, phone } = data;
  const args = [];
  
  if (username) args.push('-u', username);
  if (email) args.push('-e', email);
  if (phone) args.push('-p', phone);
  
  console.log(`[Real OSINT] Starting:`, args);
  
  const python = spawn(pythonExecutable, [REAL_TOOLS, ...args], {
    timeout: 90000,
    cwd: projectRoot,
    shell: false,
  });
  
  let output = '';
  let errorOutput = '';
  let responseSent = false;

  const sendOnce = handler => {
    if (responseSent) return;
    responseSent = true;
    handler();
  };
  
  python.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  python.on('close', (code) => {
    sendOnce(() => {
      if (code !== 0) {
        console.error('[Real OSINT] Error:', errorOutput);
        return res.status(502).json({ success: false, error: 'OSINT tool failed' });
      }

      try {
        const results = JSON.parse(output);
        res.json(results);
      } catch (e) {
        console.error('[Real OSINT] Parse error:', e.message);
        res.status(502).json({ success: false, error: 'Invalid OSINT tool response' });
      }
    });
  });
  
  python.on('error', (err) => {
    sendOnce(() => {
      console.error('[Real OSINT] Spawn error:', err.message);
      res.status(502).json({ success: false, error: 'OSINT tool unavailable' });
    });
  });
}

// Get analysis history (mock)
router.get('/history', (req, res) => {
  res.json({
    history: [],
    message: 'No analysis history available',
    timestamp: new Date().toISOString(),
  });
});

// Full-Name Discovery System
router.post('/discover', (req, res) => {
  try {
    const {
      fullName,
      firstName,
      lastName,
      strategy = 'balanced',
      maxQueries = 30,
      maxDomains = 10,
      expandDomains = false,
      maxExpandedDomains = 50,
      enableCrawling = false,
      maxLinksPerQuery = 20,
      enableMonitoring = false
    } = req.body;

    // Validate input
    if (!fullName && !firstName && !lastName) {
      return res.status(400).json({
        error: 'At least one of fullName, firstName, or lastName is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate strategy
    const validStrategies = ['balanced', 'focused', 'comprehensive', 'professional'];
    if (!validStrategies.includes(strategy)) {
      return res.status(400).json({
        error: 'Invalid strategy. Use: balanced, focused, comprehensive, or professional',
        timestamp: new Date().toISOString(),
      });
    }

    // Perform discovery
    const results = discoverFullName({
      fullName,
      firstName,
      lastName,
      strategy,
      maxQueries,
      maxDomains,
      expandDomains: expandDomains || maxDomains > 10,
      maxExpandedDomains,
      enableCrawling,
      maxLinksPerQuery,
      enableMonitoring
    });

    res.json(results);
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({
      error: 'Discovery failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Path to Python wrapper
const PYTHON_SCRIPT = path.join(__dirname, '../services/realOsintTools.py');
const projectRoot = path.resolve(__dirname, '../..');
const pythonExecutable = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const toolsRoot = process.env.OSINT_TOOLS_PATH || path.join(projectRoot, 'TOOLS');
const blackbirdPath = process.env.BLACKBIRD_PATH || path.join(toolsRoot, 'blackbird');
const theHarvesterPath = process.env.THEHARVESTER_PATH || path.join(toolsRoot, 'theHarvester');

function isSafeTarget(value) {
  return typeof value === 'string' && value.length <= 200 && !/[\r\n;&|`$<>]/.test(value);
}

/**
 * POST /api/real-osint/analyze
 * Analyze target using real OSINT tools (Blackbird + theHarvester)
 */
router.post('/analyze', (req, res) => {
  try {
    const { email, username, phone } = req.body;

    // Validate input
    if (!email && !username && !phone) {
      return res.status(400).json({
        error: 'At least one of email, username, or phone is required',
        timestamp: new Date().toISOString(),
      });
    }

    if ([email, username, phone].filter(Boolean).some(value => !isSafeTarget(value))) {
      return res.status(400).json({ error: 'Target values contain unsupported characters or are too long' });
    }

    // Build arguments for Python script
    const args = [];
    
    if (username) {
      args.push('-u', username);
    }
    if (email) {
      args.push('-e', email);
    }
    if (phone) {
      args.push('-p', phone);
    }

    console.log(`[Real OSINT] Starting analysis for username="${username}" email="${email}"`);

    // Spawn Python process
    const python = spawn(pythonExecutable, [PYTHON_SCRIPT, ...args], {
      timeout: 120000,
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
      console.error(`[Real OSINT] Error output: ${data}`);
    });

    python.on('close', (code) => {
      sendOnce(() => {
        console.log(`[Real OSINT] Process exited with code ${code}`);

        if (code !== 0) {
          console.error(`[Real OSINT] Full error: ${errorOutput}`);
          return res.status(502).json({
          success: false,
          error: 'Analysis encountered issues',
          query: { email, username, phone },
          timestamp: new Date().toISOString(),
          });
        }

        try {
          const results = JSON.parse(output);
          console.log(`[Real OSINT] Found ${results.osintResults.length} result(s)`);
          res.json(results);
        } catch (parseError) {
          console.error(`[Real OSINT] Parse error: ${parseError.message}`);
          console.error(`[Real OSINT] Output could not be parsed (${output.length} bytes)`);
          res.status(502).json({
            success: false,
            error: 'Failed to parse OSINT results',
            timestamp: new Date().toISOString(),
          });
        }
      });
    });

    python.on('error', (error) => {
      sendOnce(() => {
        console.error(`[Real OSINT] Spawn error: ${error.message}`);
        res.status(502).json({
          success: false,
          error: 'Failed to start OSINT analysis',
          timestamp: new Date().toISOString(),
        });
      });
    });

  } catch (error) {
    console.error(`[Real OSINT] Route error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/real-osint/status
 * Check if tools are available
 */
router.get('/status', (req, res) => {
  const tools = {
    blackbird: {
      available: fs.existsSync(path.join(blackbirdPath, 'blackbird.py')),
      path: blackbirdPath,
    },
    theHarvester: {
      available: fs.existsSync(path.join(theHarvesterPath, 'bin', 'theHarvester')) ||
        fs.existsSync(path.join(theHarvesterPath, 'theHarvester', '__main__.py')),
      path: theHarvesterPath,
    },
  };

  res.json({
    tools,
    allAvailable: tools.blackbird.available && tools.theHarvester.available,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

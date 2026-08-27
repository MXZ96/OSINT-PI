const express = require('express');
const { osintDatabase } = require('../services/osintAnalyzer');
const router = express.Router();

// Get all available tools
router.get('/', (req, res) => {
  const tools = [
    {
      id: 'blackbird',
      name: 'Blackbird',
      description: 'Username search across social platforms',
      status: 'active',
      category: 'username-search',
      platforms: osintDatabase.socialPlatforms.map(p => p.name),
    },
    {
      id: 'analyst',
      name: 'Analyst Research Tools',
      description: 'Multi-platform intelligence gathering',
      status: 'active',
      category: 'multi-platform',
      platforms: osintDatabase.socialPlatforms.map(p => p.name),
    },
    {
      id: 'intelligence-x',
      name: 'Intelligence X',
      description: 'Leak detection & data exposure',
      status: 'simulated',
      category: 'leak-detection',
      databases: osintDatabase.leakDatabases,
    },
    {
      id: 'check-leaked',
      name: 'CheckLeaked',
      description: 'Phone & email exposure check',
      status: 'simulated',
      category: 'exposure-check',
      checkers: ['email', 'phone', 'username'],
    },
  ];

  res.json({
    tools,
    count: tools.length,
    timestamp: new Date().toISOString(),
  });
});

// Get tool details
router.get('/:toolId', (req, res) => {
  const toolId = req.params.toolId;

  const toolMap = {
    blackbird: {
      id: 'blackbird',
      name: 'Blackbird',
      description: 'Username search across social platforms',
      status: 'active',
      category: 'username-search',
      platforms: osintDatabase.socialPlatforms,
      documentation: 'Searches for a given username across all major social platforms and indexes.',
    },
    'intelligence-x': {
      id: 'intelligence-x',
      name: 'Intelligence X',
      description: 'Leak detection & data exposure',
      status: 'simulated',
      category: 'leak-detection',
      databases: osintDatabase.leakDatabases,
      documentation: 'Analyzes data breaches and public leaks to identify exposed information.',
    },
  };

  const tool = toolMap[toolId];

  if (!tool) {
    return res.status(404).json({
      error: 'Tool not found',
      toolId,
      timestamp: new Date().toISOString(),
    });
  }

  res.json(tool);
});

module.exports = router;

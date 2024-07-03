const express = require('express');
const neo4j = require('neo4j-driver');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 8080;

app.use(cors());
app.use(bodyParser.json());

const URI = 'neo4j+s://4317f220.databases.neo4j.io';
const USER = 'neo4j';
const PASSWORD = 'ieizSLiVB2yoMwHVIPpzzLhRK6YTPPzg92Bl6sPHYY0';

let driver;

// Middleware to establish Neo4j connection
app.use(async (req, res, next) => {
  if (!driver) {
    try {
      driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
      await driver.verifyConnectivity();
      console.log('Connected to Neo4j');
    } catch (err) {
      console.error('Neo4j connection error:', err);
      res.status(500).send('Neo4j connection error');
      return;
    }
  }
  next();
});

app.post('/api/query', async (req, res) => {
  let { domain, department } = req.body;
  if (!domain || !department) {
    res.status(400).send('Domain and department are required');
    return;
  }

  domain = domain.toLowerCase();

  const session = driver.session({ database: 'neo4j' });

  try {
    const query = `
      MATCH (p:Person { Department: $department })
      WHERE p.domain IS NOT NULL
        AND p.name IS NOT NULL 
        AND ANY(domain IN p.domain WHERE trim(domain) = $domain)
      RETURN p.name AS name, p.domain AS domains, toInteger(p.expertid) as expertId;
    `;
    const result = await session.run(query, { domain, department });

    const records = result.records.map(record => ({
      name: record.get('name'),
      expertId: record.get('expertId') ? record.get('expertId').toNumber() : null // Ensure expertId is parsed as integer
    }));

    const count = records.length; // Count number of records returned

    res.json({ records, count }); // Send records and count to frontend
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).send('Query error');
  } finally {
    await session.close();
  }
});

app.get('/api/graph', async (req, res) => {
  const { domain } = req.query; // Extract domain from query parameters
  const session = driver.session();
  
  try {
    let query = `
      MATCH (p:Person)-[w:EXPERT_IN]->(d:Domain)
      WHERE p.name IS NOT NULL AND p.name <> ''
      RETURN p, w, d;
    `;

    if (domain) {
      query = `
        MATCH (p:Person)-[w:EXPERT_IN]->(d:Domain{name : $domain})
        WHERE p.name IS NOT NULL AND p.name <> ''
        RETURN p, w, d;
      `;
    }

    const result = await session.run(query, { domain });
    const nodes = {};
    const edges = [];
    let count = 0; // Initialize count variable

    result.records.forEach(record => {
      const p = record.get('p');
      const d = record.get('d');
      const w = record.get('w');

      // Check if all three properties are present
      if (p && p.properties.name && d && d.properties.name && w) {
        // Add person node if it has a valid label
        const personNodeId = p.identity.toString();
        if (!nodes[personNodeId]) {
          nodes[personNodeId] = { id: personNodeId, label: p.properties.name, type: 'Person', properties: p.properties };
        }
        
        // Add domain node if it has a valid label
        const domainNodeId = d.identity.toString();
        if (!nodes[domainNodeId]) {
          nodes[domainNodeId] = { id: domainNodeId, label: d.properties.name, type: 'Domain', properties: d.properties };
        }
    
        // Add the edge only if both source and target nodes exist
        if (nodes[w.start.toString()] && nodes[w.end.toString()]) {
          const edgeId = `${w.start.toString()}-${w.end.toString()}`;
          if (!edges.find(edge => edge.id === edgeId)) {
            edges.push({ id: edgeId, source: w.start.toString(), target: w.end.toString(), label: w.type });
          }
        }
      }
    });

    const nodesArray = Object.values(nodes).filter(node => node.label.trim() !== '');
    
    res.json({ nodes: nodesArray, edges, count }); // Return count along with nodes and edges
  } catch (error) {
    console.error('Error fetching data from Neo4j:', error);
    res.status(500).json({ error: 'Failed to fetch data from Neo4j' });
  } finally {
    await session.close();
  }
});

app.get('/api/domain-count', async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    res.status(400).send('Domain parameter is required');
    return;
  }

  const session = driver.session();

  try {
    const query = `
      MATCH (p:Person)-[w:EXPERT_IN]->(d:Domain{name : $domain})
      WHERE p.name IS NOT NULL AND p.name <> ''
      RETURN count(p) as count;
    `;

    const result = await session.run(query, { domain });

    const count = result.records[0].get('count').toNumber();

    res.json({ count });
  } catch (error) {
    console.error('Error fetching count from Neo4j:', error);
    res.status(500).json({ error: 'Failed to fetch count from Neo4j' });
  } finally {
    await session.close();
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

process.on('exit', async () => {
  if (driver) {
    await driver.close();
  }
});

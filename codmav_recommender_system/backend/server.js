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

app.get('/api/graph', async (req, res) => {
  const { domain } = req.query;
  const session = driver.session();
  
  try {
    const queryDirect = `
      MATCH (p:Person)-[w:EXPERT_IN_DIRECT]->(d:Domain{name: $domain})
      RETURN p, w, d;
    `;

    const queryIndirect = `
      MATCH (p:Person)-[w:EXPERT_IN_INDIRECT]->(d:Domain{name: $domain})
      RETURN p, w, d;
    `;

    const resultDirect = await session.run(queryDirect, { domain });
    const resultIndirect = await session.run(queryIndirect, { domain });

    const nodes = {};
    const edges = [];
    
    resultDirect.records.forEach(record => {
      const p = record.get('p');
      const d = record.get('d');
      const w = record.get('w');

      if (p && p.properties.name && d && d.properties.name && w) {
        const personNodeId = p.identity.toString();
        if (!nodes[personNodeId]) {
          nodes[personNodeId] = { id: personNodeId, label: p.properties.name, type: 'Person', properties: p.properties };
        }
        
        const domainNodeId = d.identity.toString();
        if (!nodes[domainNodeId]) {
          nodes[domainNodeId] = { id: domainNodeId, label: d.properties.name, type: 'Domain', properties: d.properties };
        }
    
        if (w && nodes[w.start.toString()] && nodes[w.end.toString()]) {
          edges.push({ id: `${w.start.toString()}-${w.end.toString()}`, source: w.start.toString(), target: w.end.toString(), label: w.type });
        }
      }
    });

    resultIndirect.records.forEach(record => {
      const p = record.get('p');
      const d = record.get('d');
      const w = record.get('w');

      if (p && p.properties.name && d && d.properties.name && w) {
        const personNodeId = p.identity.toString();
        if (!nodes[personNodeId]) {
          nodes[personNodeId] = { id: personNodeId, label: p.properties.name, type: 'Person', properties: p.properties };
        }
        
        const domainNodeId = d.identity.toString();
        if (!nodes[domainNodeId]) {
          nodes[domainNodeId] = { id: domainNodeId, label: d.properties.name, type: 'Domain', properties: d.properties };
        }
    
        if (w && nodes[w.start.toString()] && nodes[w.end.toString()]) {
          edges.push({ id: `${w.start.toString()}-${w.end.toString()}`, source: w.start.toString(), target: w.end.toString(), label: w.type });
        }
      }
    });

    // Convert nodes object to array
    const nodesArray = Object.values(nodes);

    res.json({ nodes: nodesArray, edges });
  } catch (error) {
    console.error('Error fetching data from Neo4j:', error);
    res.status(500).json({ error: 'Failed to fetch data from Neo4j' });
  } finally {
    await session.close();
  }
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
    const directQuery = `
      MATCH (p:Person { Department: $department })
      WHERE p.domain IS NOT NULL
        AND p.name IS NOT NULL 
        AND ANY(domain IN p.domain WHERE trim(domain) = $domain)
      RETURN p.name AS name, p.domain AS domains, toInteger(p.expertid) AS expertId;
    `;
    
    const indirectQuery = `
      MATCH (p:Person { Department: $department })-[:EXPERT_IN_INDIRECT]->(:Domain { name: $domain })
      WHERE p.domain IS NOT NULL
        AND p.name IS NOT NULL
      RETURN p.name AS name, p.domain AS domains, toInteger(p.expertid) AS expertId;
    `;

    const directResult = await session.run(directQuery, { domain, department });
    const indirectResult = await session.run(indirectQuery, { domain, department });

    const directRecords = directResult.records.map(record => ({
      name: record.get('name'),
      expertId: record.get('expertId') ? record.get('expertId').toNumber() : null
    }));

    const indirectRecords = indirectResult.records.map(record => ({
      name: record.get('name'),
      expertId: record.get('expertId') ? record.get('expertId').toNumber() : null
    }));

    const directCount = directRecords.length;
    const indirectCount = indirectRecords.length;

    res.json({ directRecords, indirectRecords, directCount, indirectCount });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).send('Query error');
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

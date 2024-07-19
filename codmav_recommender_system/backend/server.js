const express = require('express');
const neo4j = require('neo4j-driver');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 8080;

const URI = 'neo4j+s://4317f220.databases.neo4j.io';
const USER = 'neo4j';
const PASSWORD = 'ieizSLiVB2yoMwHVIPpzzLhRK6YTPPzg92Bl6sPHYY0';

let driver;

app.use(cors());
app.use(bodyParser.json());

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

// Existing endpoint to get graph data for a selected department
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

// Existing endpoint to handle POST query
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

// New endpoint: Fetch collaborations for the given person
app.get('/api/collaborations/:personName', async (req, res) => {
    const personName = req.params.personName;
    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH (p1:Person {name: $personName})-[r:COLLABORATION]-(p2:Person)
            WHERE p2.name IS NOT NULL
            RETURN p1, r, p2, r.count AS count, id(r) AS edgeId
            ORDER BY r.count DESC
            LIMIT 10
            `,
            { personName }
        );

        const nodes = [];
        const edges = [];
        const collaborationData = [];

        result.records.forEach(record => {
            const person1 = record.get('p1');
            const person2 = record.get('p2');
            const relationship = record.get('r');
            const count = record.get('count').toInt();

            console.log(`Collaboration Count: ${count}`);

            if (!nodes.some(node => node.id === person1.identity.toString())) {
                nodes.push({
                    id: person1.identity.toString(),
                    label: person1.properties.name,
                    type: 'Person'
                });
            }

            if (!nodes.some(node => node.id === person2.identity.toString())) {
                nodes.push({
                    id: person2.identity.toString(),
                    label: person2.properties.name,
                    type: 'Person'
                });
            }

            edges.push({
                id: `collab_${person1.identity.toString()}_${person2.identity.toString()}`,
                source: person1.identity.toString(),
                target: person2.identity.toString(),
                label: 'COLLABORATION',
                collaborationId: relationship.identity.toString(),
                titles: relationship.properties.titles || [],
                count: count
            });

            if (relationship.properties.titles) {
                collaborationData.push({
                    id: relationship.identity.toString(),
                    titles: relationship.properties.titles.join(', ')
                });
            }
        });

        res.json({ nodes, edges, collaborationData });
    } catch (error) {
        console.error('Error fetching collaborations:', error);
        res.status(500).send('Error fetching collaborations');
    } finally {
        await session.close();
    }
});

// New endpoint: Fetch titles associated with a specific collaboration
app.get('/api/collaboration/:collaborationId/titles', async (req, res) => {
    const collaborationId = parseInt(req.params.collaborationId, 10);

    if (isNaN(collaborationId)) {
        return res.status(400).json({ error: 'Invalid collaboration ID' });
    }

    console.log(`Received request for collaboration ID: ${collaborationId}`);

    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH ()-[r:COLLABORATION]->()
            WHERE id(r) = $collaborationId
            RETURN r.titles AS titles`,
            { collaborationId }
        );

        if (result.records.length === 0) {
            return res.status(404).json({ error: 'Collaboration not found' });
        }

        const titles = result.records[0].get('titles') || [];
        console.log(`Fetched titles for collaboration ID ${collaborationId}:`, titles);

        res.json({ titles });
    } catch (error) {
        console.error('Error fetching titles for collaboration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await session.close();
    }
});

// New endpoint: Get graph data for a selected department
app.get('/api/graph/:department', async (req, res) => {
  const departmentName = req.params.department;
  const session = driver.session();
  try {
    const query = `
      MATCH (d:Department {Department: "Department of Computer Science Engineering"})-[:CONTAINS]->(dom:Domain)
      OPTIONAL MATCH (dom)-[:HAS_ARTICLE]->(t:Title)
      RETURN d, dom, count(t) as articleCount
    `;
    const result = await session.run(query, { departmentName });

    const nodes = [];
    const edges = [];
    const addedNodes = new Set();

    result.records.forEach(record => {
      const d = record.get('d');
      const dom = record.get('dom');
      const articleCount = record.get('articleCount').toInt();

      if (d && !addedNodes.has(d.identity.toString())) {
        nodes.push({ id: d.identity.toString(), label: d.properties.Department, type: 'Department' });
        addedNodes.add(d.identity.toString());
      }
      if (dom && !addedNodes.has(dom.identity.toString())) {
        nodes.push({ id: dom.identity.toString(), label: dom.properties.name, type: 'Domain', count: articleCount });
        addedNodes.add(dom.identity.toString());
      }

      if (d && dom) {
        edges.push({ id: `${d.identity}-${dom.identity}`, source: d.identity.toString(), target: dom.identity.toString(), label: 'CONTAINS' });
      }
    });

    res.json({ nodes, edges });
  } catch (error) {
    console.error('Error fetching data from Neo4j:', error);
    res.status(500).json({ error: 'Failed to fetch data from Neo4j' });
  } finally {
    await session.close();
  }
});

// New endpoint: Get titles for a specific domain
app.get('/api/titles/:domainId', async (req, res) => {
  const domainId = req.params.domainId;
  const session = driver.session();
  try {
    const query = `
      MATCH (d:Domain)-[:HAS_ARTICLE]->(t:Title)
      WHERE ID(d) = toInteger($domainId)
      RETURN t
    `;
    const result = await session.run(query, { domainId });

    const titles = result.records.map(record => {
      const title = record.get('t');
      return {
        id: title.identity.toString(),
        title: title.properties.title
      };
    });

    res.json({ titles });
  } catch (error) {
    console.error('Error fetching titles from Neo4j:', error);
    res.status(500).json({ error: 'Failed to fetch titles from Neo4j' });
  } finally {
    await session.close();
  }
});

// New endpoint: Get articles for a specific domain
app.get('/api/articles/:domainId', async (req, res) => {
  const domainId = req.params.domainId;
  const session = driver.session();
  try {
    const query = `
      MATCH (dom:Domain)-[r:HAS_ARTICLE]->(t:Title)
      WHERE id(dom) = $domainId
      RETURN t
    `;
    const result = await session.run(query, { domainId: neo4j.int(domainId) });

    const articles = result.records.map(record => {
      const title = record.get('t');
      return { id: title.identity.toString(), title: title.properties.Title_y };
    });

    res.json({ articles });
  } catch (error) {
    console.error('Error fetching articles from Neo4j:', error);
    res.status(500).json({ error: 'Failed to fetch articles from Neo4j' });
  } finally {
    await session.close();
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

process.on('exit', async () => {
  if (driver) {
    await driver.close();
  }
});
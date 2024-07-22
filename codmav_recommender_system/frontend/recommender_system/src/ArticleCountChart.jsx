import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import neo4j from 'neo4j-driver';
import { Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const ArticleCountChart = () => {
  const [data, setData] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState(['', '', '']);

  const navigate = useNavigate();

  // Neo4j connection details (replace with your actual credentials)
  const uri = 'neo4j+s://4317f220.databases.neo4j.io';
  const user = 'neo4j';
  const password = 'ieizSLiVB2yoMwHVIPpzzLhRK6YTPPzg92Bl6sPHYY0';

  useEffect(() => {
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    session
      .run('MATCH (d:Domain) RETURN d.name AS domain ORDER BY d.name')
      .then(result => {
        const domainList = result.records.map(record => record.get('domain'));
        setDomains(domainList);
        if (domainList.length > 0) {
          setSelectedDomains([domainList[0], domainList[1], domainList[2]]);
        }
      })
      .catch(error => {
        console.error("Error fetching domains:", error);
      })
      .finally(() => {
        session.close();
        driver.close();
      });
  }, []);

  const handleDomainChange = (index, value) => {
    const newSelectedDomains = [...selectedDomains];
    newSelectedDomains[index] = value;
    setSelectedDomains(newSelectedDomains);
  };

  const fetchData = async () => {
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
      const query = `
        MATCH (d:Domain)
        WHERE d.name IN $domains
        RETURN d.name AS domain, 
               REDUCE(acc = [], idx in range(0, size(d.counts) - 1) |
                 CASE
                   WHEN d.counts[idx] IS NOT NULL AND d.years[idx] IS NOT NULL
                   THEN acc + {year: d.years[idx], count: d.counts[idx]}
                   ELSE acc
                 END
               ) AS result
      `;

      const result = await session.run(query, { domains: selectedDomains.filter(Boolean) });
      const processedData = result.records.flatMap(record => {
        const domain = record.get('domain');
        return record.get('result').map(item => ({
          domain,
          year: item.year.toNumber(),
          count: item.count.toNumber()
        }));
      });

      setData(processedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      session.close();
      driver.close();
    }
  };

  useEffect(() => {
    if (selectedDomains.some(Boolean)) {
      fetchData();
    }
  }, [selectedDomains]);

  const updateChart = () => {
    let traces = [];
    
    selectedDomains.forEach(domain => {
      if (!domain) return;
      
      const domainData = data.filter(d => d.domain === domain);
      const years = Array.from(new Set(domainData.map(d => d.year))).sort((a, b) => a - b);
      const counts = years.map(year => {
        const yearData = domainData.find(d => d.year === year);
        return yearData ? yearData.count : 0;
      });

      traces.push({
        x: years,
        y: counts,
        mode: 'lines+markers',
        name: domain
      });
    });

    return traces;
  };

  const handlePrev = () => {
    navigate(-1);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Button
          backgroundColor="grey"
          onClick={handlePrev}
          style={{ marginLeft: '20px' }}
        >
          Prev
        </Button>
      </div>
      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '20px', color: '#333' }}>
        Article Count by Year and Domain
      </h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        {[0, 1, 2].map((index) => (
          <div key={index} style={{ marginRight: '20px' }}>
            <label htmlFor={`domain-select${index + 1}`} style={{ fontSize: '1rem', marginRight: '5px' }}>
              Select Domain {index + 1}:
            </label>
            <select
              id={`domain-select${index + 1}`}
              value={selectedDomains[index]}
              onChange={(e) => handleDomainChange(index, e.target.value)}
              style={{ fontSize: '1rem', padding: '5px', borderRadius: '5px' }}
            >
              <option value="">Select a domain</option>
              {domains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div style={{ width: '90%', height: '600px', margin: '0 auto' }}>
        <Plot
          data={updateChart()}
          layout={{
            xaxis: { title: 'Year', tickfont: { size: 14 } },
            yaxis: { title: 'Number of Articles', tickfont: { size: 14 } },
            legend: { title: { text: 'Domain', font: { size: 16 } } },
            autosize: true,
            margin: { l: 80, r: 80, t: 100, b: 80 },
            paper_bgcolor: '#f8f9fa',
            plot_bgcolor: '#f8f9fa',
          }}
        />
      </div>
    </div>
  );
};

export default ArticleCountChart;

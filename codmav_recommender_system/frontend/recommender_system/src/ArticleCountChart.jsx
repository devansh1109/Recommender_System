import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import neo4j from 'neo4j-driver';
import { Button, Select, Box, Heading, Flex, Text, Spinner } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';

const ArticleCountChart = () => {
  const [data, setData] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState(['', '', '']);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Neo4j connection details
  const uri = 'neo4j+s://4317f220.databases.neo4j.io';
  const user = 'neo4j';
  const password = 'ieizSLiVB2yoMwHVIPpzzLhRK6YTPPzg92Bl6sPHYY0';

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const department = searchParams.get('department');
    if (department) {
      setSelectedDepartment(department);
      fetchDomains(department);
    } else {
      setError('No department specified');
      setIsLoading(false);
    }
  }, [location]);

  const fetchDomains = async (department) => {
    setIsLoading(true);
    setError(null);
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
      const query = `
        MATCH (dept:Department {Department: $department})-[:CONTAINS]->(d:Domain)
        RETURN toUpper(d.name) AS domain
        ORDER BY d.name
      `;

      const result = await session.run(query, { department });
      const domainList = result.records.map(record => record.get('domain'));
      setDomains(domainList);
      if (domainList.length > 0) {
        setSelectedDomains([domainList[0], '', '']);
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
      setError("Failed to fetch domains. Please try again.");
    } finally {
      session.close();
      driver.close();
      setIsLoading(false);
    }
  };

  const handleDomainChange = (index, value) => {
    const newSelectedDomains = [...selectedDomains];
    newSelectedDomains[index] = value;
    setSelectedDomains(newSelectedDomains);
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
      const query = `
        MATCH (dept:Department {Department: $department})-[:CONTAINS]->(d:Domain)
        WHERE toUpper(d.name) IN $domains
        RETURN toUpper(d.name) AS domain, 
               REDUCE(acc = [], idx in range(0, size(d.counts) - 1) |
                 CASE
                   WHEN d.counts[idx] IS NOT NULL AND d.years[idx] IS NOT NULL
                   THEN acc + {year: d.years[idx], count: d.counts[idx]}
                   ELSE acc
                 END
               ) AS result
      `;

      const result = await session.run(query, { 
        department: selectedDepartment,
        domains: selectedDomains.filter(Boolean) 
      });
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
      setError("Failed to fetch chart data. Please try again.");
    } finally {
      session.close();
      driver.close();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDepartment && selectedDomains.some(Boolean)) {
      fetchData();
    }
  }, [selectedDepartment, selectedDomains]);

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
        name: domain,
        line: { shape: 'spline' },
        marker: { size: 8 }
      });
    });

    return traces;
  };

  const handlePrev = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" mt={10}>
        <Text color="red.500">{error}</Text>
        <Button mt={4} onClick={() => navigate('/')}>Go back to home</Button>
      </Box>
    );
  }

  return (
    <Box fontFamily="Arial, sans-serif" textAlign="center" p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Button
          backgroundColor="gray.200"
          onClick={handlePrev}
        >
          Back
        </Button>
        <Heading as="h1" size="xl" color="gray.700">
          Year-wise Publication Statistics
        </Heading>
       
        <Box width="100px" /> {/* Spacer to balance the layout */}
      </Flex>
      <Text color="rgb(144,144,144)" fontStyle="italic" fontSize="18px" fontWeight="bold">Select domain to view the year-wise comparison statistics</Text>
      <Flex justifyContent="center" mb={4} flexWrap="wrap">
        {[0, 1, 2].map((index) => (
          <Box key={index} mr={4} mb={4}>
            <Text as="label" htmlFor={`domain-select${index + 1}`} fontSize="sm" mr={2}>
              Select Domain {index + 1}:
            </Text>
            <Select
              id={`domain-select${index + 1}`}
              value={selectedDomains[index]}
              onChange={(e) => handleDomainChange(index, e.target.value)}
              size="sm"
            >
              <option value="">Select a domain</option>
              {domains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </Select>
          </Box>
        ))}
      </Flex>
      
      <Box width="100%" height="800px" margin="0 auto">
      <Plot
  data={updateChart().map((trace, index) => ({
    ...trace,
    marker: { size: 10, color: `rgba(${index * 50}, ${150 - index * 30}, ${200 + index * 20}, 0.8)` },
    line: { shape: 'spline', width: 3, color: `rgba(${index * 50}, ${150 - index * 30}, ${200 + index * 20}, 0.8)` }
  }))} 
  layout={{
    width: 1200,
    height: 600,
    xaxis: { 
      title: { text: 'Year', font: { size: 18, color: '#333' } }, 
      tickfont: { size: 14, color: '#555' },
      showgrid: true,
      gridcolor: '#ddd',  
      gridwidth: 1,
      linecolor: '#444',  
      linewidth: 2,  
      range: [2000, Math.max(...data.map(d => d.year))],  // Ensure min year starts at 2000
      tickformat: 'd',
    },
    yaxis: { 
      title: { text: 'Number of Articles', font: { size: 18, color: '#333' } }, 
      tickfont: { size: 14, color: '#555' },
      showgrid: true,  
      gridcolor: '#ddd',
      gridwidth: 1,  
      linecolor: '#444',  
      linewidth: 2,
    },
    legend: {
      title: { text: 'Domain', font: { size: 16, color: '#333' } },
      x: 1.05,
      xanchor: 'left',
      y: 1,
      bgcolor: '#f8f9fa',
      bordercolor: '#ccc',
      borderwidth: 1,
      font: { size: 14, color: '#333' },
    },
    hovermode: 'x unified',  // Show unified hover info for better readability
    hoverlabel: { bgcolor: '#fff', font: { size: 14, color: '#333' } },  // Improve hover label aesthetics
    paper_bgcolor: '#f4f4f4',
    plot_bgcolor: '#f4f4f4',
    margin: { l: 80, r: 200, t: 100, b: 80 },
    font: { size: 16, color: '#333' },
  }}
  config={{ responsive: true, displayModeBar: false }}
/>




      </Box>
    </Box>
  );
};

export default ArticleCountChart;
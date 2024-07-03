import React, { useEffect, useState } from 'react';
import GraphComponent from './GraphComponent';

const App = () => {
  const domains = {
    'Department of Computer Science Engineering': [
      'ML/AI',
      'Data Science',
      'IoT',
      'Networks',
      'Microprocessor',
      'Microcontrollers',
      'Deep Learning',
      'Computer Vision',
      'Cybersecurity',
      'Cloud Computing',
      'Web Development',
      'Big Data and Data Analytics',
      'Data Mining'
    ],
    'Department of Electronics and Communication Engineering': [],
    'Department of Mechanical Engineering': [],
    'Department of Electrical and Electronics Engineering': [],
    'Department of Biotechnology': [],
    'Department of Civil Engineering': [],
    'Department of Science and Humanities': [],
    'Faculty of Commerce and Management': [],
    'Faculty of Pharmaceutical Sciences': [],
    'Department of MCA': [],
    'Department of MBA': [],
    'Faculty of Law': [],
    'Department of Architecture': [],
    'Department of Neuroscience': [],
    'Department of Psychology': [],
    'Department of Human Genetics': [],
    'Department of Orthopaedics': [],
    'Library': []
  };

  const departments = Object.keys(domains);

  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(departments[0]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0); // State to store count

  useEffect(() => {
    if (selectedDomain) {
      fetchData();
    }
  }, [selectedDomain, selectedDepartment]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: selectedDomain, department: selectedDepartment }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const jsonData = await response.json();
      setResults(jsonData.records);
      setCount(jsonData.count); // Update count state with backend response
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    }
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
    setSelectedDomain(''); // Reset domain selection
  };

  const handleDomainChange = (event) => {
    setSelectedDomain(event.target.value.toLowerCase());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>DOMAINS</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <label style={{ paddingRight: '10px' }}>
          Department:
          <select value={selectedDepartment} onChange={handleDepartmentChange} style={{ marginLeft: '10px' }}>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </label>
        <label>
          Domain:
          <select value={selectedDomain} onChange={handleDomainChange} style={{ marginLeft: '10px' }} disabled={!domains[selectedDepartment].length}>
            {domains[selectedDepartment].length > 0 ? (
              domains[selectedDepartment].map((domain, index) => (
                <option key={index} value={domain.toLowerCase()}>
                  {domain}
                </option>
              ))
            ) : (
              <option value="">No domains available</option>
            )}
          </select>
        </label>
      </div>
      <div style={{ flex: 1, display: 'flex', borderBottom: '1px solid #ccc', width: '100%', height: '80vh' }}>
        <div style={{ width: '30%', height: '100%', overflowY: 'auto', paddingRight: '20px' }}>
          <h2 style={{ textAlign: 'center' }}>List of Faculty Members:</h2>
          <p style={{ textAlign: 'center' }}>Number of People: {count}</p> {/* Display count */}
          <ul style={{ paddingLeft: '20px', listStyleType: 'none' }}>
            {error ? (
              <li>Error: {error}</li>
            ) : results.length > 0 ? (
              results.map((record, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                  <strong>Name:</strong>{' '}
                  <a href={`https://pes.irins.org/profile/${record.expertId}`} target="_blank" rel="noopener noreferrer">
                    {record.name}
                  </a>
                </li>
              ))
            ) : (
              <li>No results found</li>
            )}
          </ul>
        </div>
        <div style={{ flex: 1, height: '100%', borderLeft: '1px solid #ccc' }}>
          <h2 style={{ textAlign: 'center' }}>Graph Visualization</h2>
          {!results.length ? (
            <p style={{ textAlign: 'center' }}>Loading graph data...</p>
          ) : (
            <GraphComponent domain={selectedDomain} results={results} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

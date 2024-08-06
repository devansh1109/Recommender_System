import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Button, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import GraphComponent1 from './GraphComponent1';





  const DomainVisualization = () => {
    const location = useLocation();
    const [elements, setElements] = useState([]);
    const [error, setError] = useState(null); // Add an error state for better debugging
  
    useEffect(() => {
      const fetchGraphData = async (department) => {
        try {
          const response = await fetch(`/api/graph/${encodeURIComponent(department)}`);
          const data = await response.json();
  
          if (response.ok) {
            const nodes = data.nodes.map(node => ({
              data: { id: node.id, label: node.label, type: node.type, count: node.count },
              classes: node.type.toLowerCase()
            }));
  
            const edges = data.edges.map(edge => ({
              data: { id: edge.id, source: edge.source, target: edge.target, label: edge.label }
            }));
  
            setElements([...nodes, ...edges]);
          } else {
            setError('Failed to fetch data');
            console.error('Failed to fetch data:', data);
          }
        } catch (error) {
          setError('Error fetching data');
          console.error('Error fetching data:', error);
        }
      };
  
      const params = new URLSearchParams(location.search);
      const department = params.get('department');
      
      if (department) {
        fetchGraphData(department);
      } else {
        setError('Department parameter is missing');
        console.error('Department parameter is missing');
      }
    }, [location.search]);

  const handleBackClick = () => {
    navigate('/');
  };

  const handlePrevClick = () => {
    navigate(-1);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" height="100vh" padding="20px">
      <Box position="absolute" top="19px" left="10px">
        <Button backgroundColor="grey" onClick={handlePrevClick}>
          Prev
        </Button>
      </Box>
      
      <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb="4">
        Domain Visualization
      </Text>

      {loading ? (
        <Spinner size="xl" />
      ) : error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : domainData ? (
        <Box width="100%" height="80vh">
          <GraphComponent1 department="Department of Computer Science Engineering" />
        </Box>
      ) : (
        <Text textAlign="center" color="red.500">
          No data available. Please try again later.
        </Text>
      )}

      <Button onClick={handleBackClick} mt="4">
        Back to Home
      </Button>
    </Box>
  );
};

export default DomainVisualization;
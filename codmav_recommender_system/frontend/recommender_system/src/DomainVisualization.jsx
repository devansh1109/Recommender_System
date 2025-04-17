import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Text, Button, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import GraphComponent1 from './GraphComponent1';

const DomainVisualization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [domainData, setDomainData] = useState(null);

  // Extract department from URL search params
  const query = new URLSearchParams(location.search);
  const department = query.get('department');

  useEffect(() => {
    fetchData();
  }, [department]);

  const fetchData = async () => {
    if (!department) {
      setError('Department not specified');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Use the department in the API URL
      const response = await fetch(`http://10.2.80.40:9000/api/graph/${encodeURIComponent(department)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setDomainData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const handlePrevClick = () => {
    navigate(-1);
  };

  return (
    
      
    
    <Box display="flex" flexDirection="column" alignItems="center" height="100vh" padding="20px">
      <Box position="absolute" top="19px" left="10px">
      
        
      </Box>

    

      {loading ? (
        <Spinner size="xl" />
      ) : error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : domainData ? (
        <Box width="100%" height="80vh">
          <GraphComponent1 department={department} />
        </Box>
        
      ) : (
        <Text textAlign="center" color="red.500">
          No data available. Please try again later.
        </Text>
        
      )}
    </Box>
  );
};

export default DomainVisualization;

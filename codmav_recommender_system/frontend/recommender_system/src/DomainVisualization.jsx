import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Button, Spinner } from '@chakra-ui/react';
import GraphComponent1 from './GraphComponent1';

const DomainVisualization = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [domainData, setDomainData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/domainData');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setDomainData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
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
    <Box display="flex" flexDirection="column" alignItems="center" height="100vh">
      <Box position="absolute" top="19px" left="10px">
        <Button backgroundColor="grey" onClick={handlePrevClick}>
          Prev
        </Button>
      </Box>
      {loading ? (
        <Spinner size="xl" />
      ) : (
        <Box width="80%" mt="20">
          <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="4">
            Domain Visualization
          </Text>
          {domainData ? (
            <GraphComponent1 domainData={domainData} />
          ) : (
            <Text textAlign="center" color="red.500">
              Failed to fetch domain data. Please try again later.
            </Text>
          )}
          <Button onClick={handleBackClick} mt="4">
            Back to Home
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DomainVisualization;

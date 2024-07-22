import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GraphComponent3 from './GraphComponent3';
import {
  ChakraProvider,
  Box,
  Heading,
  Text,
  Button,
  Input,
  VStack,
} from '@chakra-ui/react';

const CollaborationGraph = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const department = searchParams.get('department');
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery) {
      setShowGraph(true);
    }
  };

  const handlePrev = () => {
    navigate(-1);
  };

  return (
    <ChakraProvider>
      <Box p={5}>
        <Button
          backgroundColor="grey"
          onClick={handlePrev}
          style={{ marginBottom: '20px' }}
        >
          Prev
        </Button>
        <Heading mb={4}>Collaboration Network for {department}</Heading>
        <Text mb={4}>Enter a person's name to view their collaboration network:</Text>
        <form onSubmit={handleSearch}>
          <VStack spacing={4} align="stretch">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter person's name..."
            />
            <Button type="submit" colorScheme="blue">
              Search
            </Button>
          </VStack>
        </form>
        {showGraph && <GraphComponent3 initialSearchQuery={searchQuery} />}
      </Box>
    </ChakraProvider>
  );
};

export default CollaborationGraph;

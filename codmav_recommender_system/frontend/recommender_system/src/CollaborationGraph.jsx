import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GraphComponent3 from './GraphComponent3';
import {
  ChakraProvider,
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Select,
} from '@chakra-ui/react';

const CollaborationGraph = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const [names, setNames] = useState([]);
  const [filteredNames, setFilteredNames] = useState([]);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const department = searchParams.get('department');
  const navigate = useNavigate();

  const fetchNames = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/persons/${department}`);
      if (!response.ok) {
        throw new Error('Failed to fetch names');
      }
      const data = await response.json();
      setNames(data.personNames);
      setFilteredNames(data.personNames);
    } catch (error) {
      console.error('Error fetching names:', error);
    }
  };

  useEffect(() => {
    fetchNames();
  }, [department]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery) {
      setShowGraph(true);
    }
  };

  const handlePrev = () => {
    navigate(-1);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    setFilteredNames(names.filter(name => name.toLowerCase().includes(query.toLowerCase())));
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
            <Select
              placeholder="Select a person..."
              onChange={(e) => setSearchQuery(e.target.value)}
              value={searchQuery}
            >
              {filteredNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
            </Select>
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

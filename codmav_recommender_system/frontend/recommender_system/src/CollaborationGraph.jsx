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
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
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
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchNames = async () => {
    try {
      const response = await fetch(`http://10.2.80.90:9000/api/persons/${department}`);
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

  return (
    <ChakraProvider>
      <Box p={5}>
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Button backgroundColor="grey" onClick={handlePrev}>
            Back
          </Button>
          <Button onClick={onOpen} backgroundColor="rgb(0, 158, 96)" color="white">
            Guide
          </Button>
        </Flex>
        <Heading mb={4}>Collaboration Network for {department}</Heading>
        <Flex justifyContent="center" alignItems="center" mb={4} flexDirection="column">
          <Text mb={4}>
            Select a faculty name to view their existing collaboration network
          </Text>
          <Flex align="center">
            <Select
              placeholder="Select a faculty name..."
              onChange={(e) => setSearchQuery(e.target.value)}
              value={searchQuery}
              maxWidth="250px"
              mr={4}
            >
              {filteredNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Button type="submit" colorScheme="blue" onClick={handleSearch} maxWidth="150px">
              Search
            </Button>
          </Flex>
        </Flex>
        {showGraph && <GraphComponent3 initialSearchQuery={searchQuery} />}

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Guide</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                Here are some instructions or guidance on how to use this collaboration tool.
              </Text>
              <Text mt={4}>
                1. Use the dropdown to select a person.
              </Text>
              <Text>
                2. The graph will update to show collaborators and their articles.
              </Text>
              <Text>
                3. Click on an edge to see the titles of articles for that collaboration.
              </Text>
              <Text>
                4. Hover over the color range bar to see the strength of collaboration associated with each color.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </ChakraProvider>
  );
};

export default CollaborationGraph;
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Text,
  Link,
  Divider,
  List,
  ListItem,
  Flex,
} from '@chakra-ui/react';
import GraphComponent from './GraphComponent';

const ResultPage = () => {
  const location = useLocation();
  const department = new URLSearchParams(location.search).get('department');
  const domain = new URLSearchParams(location.search).get('domain');
  const [directRecords, setDirectRecords] = useState([]);
  const [indirectRecords, setIndirectRecords] = useState([]);
  const [directCount, setDirectCount] = useState(0);
  const [indirectCount, setIndirectCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [domain, department]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, department }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const jsonData = await response.json();
      const { directRecords, indirectRecords } = jsonData; // Destructure records directly
  
      setDirectRecords(directRecords);
      setIndirectRecords(indirectRecords);
      setDirectCount(directRecords.length); // Set the length of directRecords
      setIndirectCount(indirectRecords.length); // Set the length of indirectRecords
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Box
      display="flex"
      height="100vh"
      width="100vw"
      padding="20px"
    >
      {/* Index for Color Codes */}
      <Box position="absolute" top="20px" right="20px" zIndex="999">
        <Text fontWeight="bold" color="green.500" mb="10px">
          Faculty Domain Expert
        </Text>
        <Text fontWeight="bold" color="red.500">
          Similar Faculty
        </Text>
      </Box>

      {/* List of Direct and Indirect Faculty Members */}
      <Box width="30%" marginRight="20px">
        {/* Direct Faculty Members */}
        <Box mb="20px">
          <Text fontSize="xl" fontWeight="bold" textAlign="center">
            FACULTY MEMBER EXPERT IN THE DOMAIN:
          </Text>
          <Text fontSize="md" textAlign="center" mb="10px">
            Number of Faculty Members: {directCount}
          </Text>
          <Divider mb="10px" />
          <Box maxHeight="70vh" overflowY="auto">
            <List spacing={3} paddingLeft="20px">
              {directRecords.length > 0 ? (
                directRecords.map((record, index) => (
                  <ListItem key={index}>
                    <Text>
                      <strong>Name:</strong>{" "}
                      <Link
                        href={`https://pes.irins.org/profile/${record.expertId}`}
                        isExternal
                        color="blue.500"
                      >
                        {record.name}
                      </Link>
                      {record.similarFaculty ? (
                        <Text color="red.500" ml="5px">
                          (Similar Faculty)
                        </Text>
                      ) : null}
                    </Text>
                  </ListItem>
                ))
              ) : (
                <ListItem>No direct results found</ListItem>
              )}
            </List>
          </Box>
        </Box>

        {/* Indirect Faculty Members */}
        <Box mb="20px">
          <Text fontSize="xl" fontWeight="bold" textAlign="center">
            SIMILAR FACULTY MEMBERS:
          </Text>
          <Text fontSize="md" textAlign="center" mb="10px">
            Number of Faculty Members: {indirectCount}
          </Text>
          <Divider mb="10px" />
          <Box maxHeight="70vh" overflowY="auto">
            <List spacing={3} paddingLeft="20px">
              {indirectRecords.length > 0 ? (
                indirectRecords.map((record, index) => (
                  <ListItem key={index}>
                    <Text>
                      <strong>Name:</strong>{" "}
                      <Link
                        href={`https://pes.irins.org/profile/${record.expertId}`}
                        isExternal
                        color="blue.500"
                      >
                        {record.name}
                      </Link>
                      {record.expertInDomain ? (
                        <Text color="green.500" ml="5px">
                          (Faculty Domain Expert)
                        </Text>
                      ) : null}
                    </Text>
                  </ListItem>
                ))
              ) : (
                <ListItem>No indirect results found</ListItem>
              )}
            </List>
          </Box>
        </Box>
      </Box>

      {/* Graph Component */}
      <Box width="70%" border="1px solid #ccc">
        <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="10px">
          FACULTY DOMAIN MAPPING
        </Text>
        <GraphComponent domain={domain} />
      </Box>
    </Box>
  );
};

export default ResultPage;

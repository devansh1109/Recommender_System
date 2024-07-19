import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate instead of useHistory
import {
  Box,
  Text,
  Link,
  Divider,
  List,
  ListItem,
  Flex,
  Button,
  ChakraProvider,
  extendTheme
} from '@chakra-ui/react';
import GraphComponent from './GraphComponent';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Use useNavigate for navigation
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
      const { directRecords, indirectRecords } = jsonData;

      setDirectRecords(directRecords);
      setIndirectRecords(indirectRecords);
      setDirectCount(directRecords.length);
      setIndirectCount(indirectRecords.length);
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSearchByDomain = () => {
    navigate(`/LandingPage?searchType=domain&department=${department}&domain=${domain}`);
  };

  const handleSearchByKeyword = () => {
    navigate(`/LandingPage?searchType=keyword&department=${department}&domain=${domain}`);
  };

  const handleGraphVisualisation = () => {
    navigate(`/LandingPage?searchType=graph&department=${department}&domain=${domain}`);
  };

  return (
    <ChakraProvider theme={extendTheme({})}>
      <Box display="flex" height="100vh" width="100vw" padding="20px">
        {/* Sidebar */}
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          
        ></Box>
        <Flex
          position="absolute"
          top="20px"
          left="20px"
          direction="column"
          alignItems="center"
          justifyContent="center"
          background="rgba(255, 255, 255, 0.5)"
          borderRadius="20px"
          padding="20px"
          height="calc(100vh - 40px)"
          width="300px"
          zIndex="1"
        >
          <Button colorScheme="blue" variant="outline" mb="10px" onClick={handleSearchByDomain}>
            Search By Domain
          </Button>
          <Button colorScheme="blue" variant="outline" mb="10px" onClick={handleSearchByKeyword}>
            Search By Keyword
          </Button>
          <Button colorScheme="blue" variant="outline" onClick={handleGraphVisualisation}>
            Existing Collaboration & Trends
          </Button>
        </Flex>

        {/* Main Content */}
        <Box ml="320px" width="calc(100% - 320px)">
          <Box width="100%" border="1px solid #ccc" marginBottom="20px">
            <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="10px">
              FACULTY DOMAIN MAPPING
            </Text>
            <GraphComponent domain={domain} />
          </Box>

          <Flex justifyContent="space-between" marginBottom="20px">
            <Box width="48%" border="1px solid #ccc">
              <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="10px">
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

            <Box width="48%" border="1px solid #ccc">
              <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="10px">
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
          </Flex>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default ResultPage;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Text, Link, Divider, List, ListItem, Flex, Button, ChakraProvider, extendTheme } from '@chakra-ui/react';
import GraphComponent from './GraphComponent';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const departmentParam = params.get('department');
  const domainParam = params.get('domain');

  const [directRecords, setDirectRecords] = useState([]);
  const [indirectRecords, setIndirectRecords] = useState([]);
  const [directCount, setDirectCount] = useState(0);
  const [indirectCount, setIndirectCount] = useState(0);
  const [error, setError] = useState(null);

  // Use parameters from URL directly
  const selectedDepartment = departmentParam || '';
  const selectedDomain = domainParam || '';

  useEffect(() => {
    // Fetch data when department or domain changes
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: selectedDomain, department: selectedDepartment }),
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const jsonData = await response.json();
        setDirectRecords(jsonData.directRecords);
        setIndirectRecords(jsonData.indirectRecords);
        setDirectCount(jsonData.directRecords.length);
        setIndirectCount(jsonData.indirectRecords.length);
        setError(null);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();
  }, [selectedDomain, selectedDepartment]);

  const handlePrev = () => {
    navigate(-1);
  };

  return (
    <ChakraProvider theme={extendTheme({})}>
      <Box p="20px">
        <Button
          position="absolute"
          top="20px"
          left="20px"
          backgroundColor="grey"
          marginTop="137px"
          marginRight="300px"
          onClick={handlePrev}
        >
          Prev
        </Button>

        <Flex direction="column" alignItems="center" mb="20px">
          <Text fontSize="2xl" fontWeight="bold" mb="10px">
            Faculty Members Working in {selectedDepartment} Under {selectedDomain}
          </Text>
        </Flex>

        <Flex width="100%" height="100%" direction="row">
          <Box width="30%" height="100%" display="flex" flexDirection="column" padding="20px">
            <Box
              width="100%"
              height="50%"
              border="1px solid #ccc"
              mb="20px"
              overflow="hidden"
              display="flex"
              flexDirection="column"
              boxSizing="border-box"
            >
              <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="10px">
                FACULTY MEMBER EXPERT IN THE DOMAIN:
              </Text>
              <Text fontSize="md" textAlign="center" mb="10px">
                Number of Faculty Members: {directCount}
              </Text>
              <Divider mb="10px" />
              <Box maxHeight="calc(50vh - 80px)" overflowY="auto" padding="10px">
                <List spacing={3}>
                  {directRecords.length > 0 ? (
                    directRecords.map((record, index) => (
                      <ListItem key={index} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
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

            <Box
              width="100%"
              height="50%"
              border="1px solid #ccc"
              overflow="hidden"
              display="flex"
              flexDirection="column"
              boxSizing="border-box"
            >
              <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="10px">
                SIMILAR FACULTY MEMBERS:
              </Text>
              <Text fontSize="md" textAlign="center" mb="10px">
                Number of Faculty Members: {indirectCount}
              </Text>
              <Divider mb="10px" />
              <Box maxHeight="calc(50vh - 80px)" overflowY="auto" padding="10px">
                <List spacing={3}>
                  {indirectRecords.length > 0 ? (
                    indirectRecords.map((record, index) => (
                      <ListItem key={index} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
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

          <Box width="70%" height="100%" padding="20px">
            <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="10px">
              FACULTY DOMAIN MAPPING
            </Text>
            <GraphComponent domain={selectedDomain} />
          </Box>
        </Flex>
      </Box>
    </ChakraProvider>
  );
};

export default ResultPage;
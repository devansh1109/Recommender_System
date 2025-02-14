import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Text, Link, Divider, List, ListItem, Flex, Button, Input, ChakraProvider, extendTheme, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import GraphComponent from './GraphComponent';
import { ArrowBackIcon, QuestionIcon } from '@chakra-ui/icons';
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
  const [collaborationCounts, setCollaborationCounts] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [Token, setToken] = useState('');
  // const [professorDetail,setprofessorDetail]=useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const selectedDepartment = departmentParam || '';
  const selectedDomain = domainParam || '';
  const [professorDetail, setProfessorDetail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);


  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const tokenFromCookie = getCookieValue('auth');
  //       if (tokenFromCookie) {
  //         const TokenResponse = await fetch("http://10.2.80.90:9000/api/decode", {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({ jwt: tokenFromCookie }), 
  //         });

  //         const TokenData = await TokenResponse.json();
  //         setSearchName(TokenData.name);
  //         professorDetail=TokenData.name 
  //         professorDetail = professorDetail.replace(/^(Dr\. |Prof\. )\s*/, '');
  //         console.log(professorDetail);
  //       }

  //       const response = await fetch('http://10.2.80.90:9000/api/query', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ domain: selectedDomain, department: selectedDepartment }),
  //       });

  //       if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  //       const jsonData = await response.json();
  //       setDirectRecords(jsonData.directRecords);
  //       setIndirectRecords(jsonData.indirectRecords);
  //       setDirectCount(jsonData.directRecords.length);
  //       setIndirectCount(jsonData.indirectRecords.length);
  //       setError(null);
  //     } catch (error) {
  //       setError(error.message);
  //     }
  //   };

  //   fetchData();


  //   // // Check if it's the first visit after the updated code
  //   // const hasVisitedResultPageAfterUpdate = Cookies.get('hasVisitedResultPageAfterUpdate');
  //   // if (!hasVisitedResultPageAfterUpdate) {
  //   //   onOpen(); // Open the guide modal
  //   //   Cookies.set('hasVisitedResultPageAfterUpdate', 'true', { expires: 365 }); // Set cookie to expire in 1 year
  //   // }
  // }, [selectedDomain, selectedDepartment, onOpen, Token]);

  useEffect(() => {
    const fetchData = async () => {
      // try {
      //   // const tokenFromCookie = getCookieValue('auth');
      //   let professorDetail = '';

      // if (tokenFromCookie) {
      //   const TokenResponse = await fetch("http://10.2.80.90:9000/api/decode", {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({ jwt: tokenFromCookie }), 
      //   });

      //   const TokenData = await TokenResponse.json();
      //   professorDetail = TokenData.name;
      //   professorDetail = professorDetail.replace(/^(Dr\. |Prof\. )\s*/, '');
      //   setSearchName(professorDetail);
      //   setprofessorDetail(professorDetail);
      //   console.log(professorDetail);
      // }

      try {
        // console.log("hello")
        const Response = await fetch(`http://localhost:8081/api/v1/auth/verifyToken`, {
          credentials: "include",
        });
        if (!Response.ok) {
          throw new Error(`HTTP error! status: ${Response.status}`);
        }
        const professorData = await Response.json();
        // console.log(professorData.user)
        setProfessorDetail(professorData.user.name);
      } catch (err) {
        console.log(err.message);
      }
      ;


      const response = await fetch('http://localhost:9000/api/query', {
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

      // Fetch top collaborators if domain and faculty name are available
      if (selectedDomain && professorDetail) {
        const collaboratorsResponse = await fetch(`http://localhost:9000/api/top-collaborators?domainName=${encodeURIComponent(selectedDomain)}&personName=${professorDetail}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!collaboratorsResponse.ok) throw new Error(`HTTP error! Status: ${collaboratorsResponse.status}`);
        const collaboratorsData = await collaboratorsResponse.json();

        if (collaboratorsData.length === 0) {
          setError(`No collaborator found for ${professorDetail}`);
        } else {
          setCollaborationCounts(collaboratorsData);
          setSearchTriggered(true);
          setError(null);
        }
      }
    }

    fetchData();
    fetchTopCollaborators();
    // Optional: Check if it's the first visit after the updated code
    // const hasVisitedResultPageAfterUpdate = Cookies.get('hasVisitedResultPageAfterUpdate');
    // if (!hasVisitedResultPageAfterUpdate) {
    //   onOpen(); // Open the guide modal
    //   Cookies.set('hasVisitedResultPageAfterUpdate', 'true', { expires: 365 }); // Set cookie to expire in 1 year
    // }
  }, [selectedDomain, selectedDepartment, onOpen,professorDetail]);


  const handleSearch = async () => {
    if (!searchQuery || !selectedDomain) return;
    
    try {
      const response = await fetch(
        `http://localhost:9000/api/top-collaborators?domainName=${encodeURIComponent(selectedDomain)}&personName=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
  
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const jsonData = await response.json();
  
      if (jsonData.length === 0) {
        setError(`No collaborator found for ${searchQuery}`);
        setSearchResults([]);
      } else {
        setSearchResults(jsonData);
        setError(null);
      }
    } catch (error) {
      console.error('Error searching collaborators:', error);
      setError(error.message);
    }
  };

  const fetchTopCollaborators = async () => {
    try {
      if (selectedDomain && professorDetail) {
      console.log("faculty name", professorDetail)
      const response = await fetch(`http://localhost:9000/api/top-collaborators?domainName=${encodeURIComponent(selectedDomain)}&personName=${professorDetail}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const jsonData = await response.json();

      if (jsonData.length === 0) {
        setError(`No collaborator found for ${professorDetail}`);
      } else {
        setCollaborationCounts(jsonData);
        setSearchTriggered(true);
        setError(null);
      }
    }
    } catch (error) {
      console.error('Error fetching top collaborators:', error);
      setError(error.message);
    }
  };

  const handlePrev = () => {
    navigate(-1);
  };

  // // Function to get the value of a cookie by name
  function getCookieValue(cookieName) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${cookieName}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop().split(';').shift();
      // console.log(cooprofessorDetailkieValue)
      setToken(cookieValue);
      // console.log("cookie value : ",Token)
      return cookieValue;
    }
    return null;
  }

  function loadprofessorDetail() {
    if (professorDetail) {
      return professorDetail
    }
    return ""
  }

  return (
    <ChakraProvider theme={extendTheme({})}>
      <Box p={6} bg="gray.50" minH="100vh">
        {/* Header Section */}
        <Flex direction="column" mb={6}>
          <Flex justifyContent="space-between" mb={4}>
            <Button
              onClick={handlePrev}
              colorScheme="gray"
              leftIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            <Button
              onClick={onOpen}
              colorScheme="teal"
              rightIcon={<QuestionIcon />}
            >
              Help
            </Button>
          </Flex>
  
          <Flex direction="column" alignItems="center" mb={4}>
            <Text fontSize="2xl" fontWeight="bold" textAlign="center" color="gray.800">
              Faculty Members Working in <Text as="span" fontStyle="italic">{selectedDomain.toUpperCase()}</Text>
            </Text>
            <Text fontSize="xl" color="gray.600" mb={2}>
              Department: <Text as="span" fontStyle="italic">{selectedDepartment.toUpperCase()}</Text>
            </Text>
            <Text fontSize="md" color="gray.500" fontStyle="italic">
              Click on a node or Expert ID to access the faculty profile
            </Text>
          </Flex>
        </Flex>
  
        {/* Main Content Grid */}
        <Flex gap={4}>
          {/* Left Column */}
          <Box width="25%" display="flex" flexDirection="column" gap={4}>
            {/* Top 5 Collaborators */}
            <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
              <Text fontSize="lg" fontWeight="bold" color="teal.600" mb={2}>
                Top 5 Suggested Collaborators
              </Text>
              {professorDetail && (
                <Text fontSize="sm" color="gray.600" mb={2}>
                  For: {professorDetail}
                </Text>
              )}
              <Divider mb={3} />
              <Box maxH="300px" overflowY="auto">
                <List spacing={2}>
                  {searchTriggered ? (
                    collaborationCounts.length > 0 ? (
                      collaborationCounts.map((collab, index) => (
                        <ListItem 
                          key={index} 
                          p={2} 
                          _hover={{ bg: "gray.50" }}
                          borderRadius="md"
                        >
                          <Text>{collab.collaboratorName}</Text>
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>No top collaborators found</ListItem>
                    )
                  ) : (
                    <ListItem>Loading...</ListItem>
                  )}
                </List>
              </Box>
            </Box>
  
            {/* Domain Experts */}
            <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
              <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={2}>
                Domain Experts ({directCount})
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Faculty with primary expertise in this domain
              </Text>
              <Divider mb={3} />
              <Box maxH="300px" overflowY="auto">
                <List spacing={2}>
                  {directRecords.length > 0 ? (
                    directRecords.map((record, index) => (
                      <ListItem 
                        key={index} 
                        p={2} 
                        _hover={{ bg: "gray.50" }}
                        borderRadius="md"
                      >
                        <Flex justify="space-between" align="center">
                          <Text>{record.name}</Text>
                          <Link
                            href={`https://pes.irins.org/profile/${record.expertId}`}
                            isExternal
                            color="blue.500"
                            fontSize="sm"
                          >
                            {record.expertId}
                          </Link>
                        </Flex>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>No faculty results found</ListItem>
                  )}
                </List>
              </Box>
            </Box>
          </Box>
  
          {/* Center - Graph */}
          <Box width="50%" bg="white" borderRadius="xl" boxShadow="sm" p={4}>
            <GraphComponent
              department={selectedDepartment}
              domain={selectedDomain}
              directRecords={directRecords}
              indirectRecords={indirectRecords}
              setDirectRecords={setDirectRecords}
              setIndirectRecords={setIndirectRecords}
              setDirectCount={setDirectCount}
              setIndirectCount={setIndirectCount}
            />
          </Box>
  
          {/* Right Column */}
          <Box width="25%" display="flex" flexDirection="column" gap={4}>
            {/* Search Faculty */}
            <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
              <Text fontSize="lg" fontWeight="bold" color="purple.600" mb={2}>
                Search Faculty Collaborators
              </Text>
              <Divider mb={3} />
              <Flex mb={3}>
                <Input
                  placeholder="Enter faculty name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  mr={2}
                />
                <Button
                  onClick={handleSearch}
                  colorScheme="purple"
                >
                  Search
                </Button>
              </Flex>
              {error && (
                <Text color="red.500" mb={2} fontSize="sm">
                  {error}
                </Text>
              )}
              <Box maxH="250px" overflowY="auto">
                <List spacing={2}>
                  {searchResults.map((collab, index) => (
                    <ListItem 
                      key={index} 
                      p={2} 
                      _hover={{ bg: "gray.50" }}
                      borderRadius="md"
                    >
                      <Text>{collab.collaboratorName}</Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
  
            {/* Contributors */}
            <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
              <Text fontSize="lg" fontWeight="bold" color="orange.600" mb={2}>
                Contributors ({indirectCount})
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Faculty with related work in this domain
              </Text>
              <Divider mb={3} />
              <Box maxH="300px" overflowY="auto">
                <List spacing={2}>
                  {indirectRecords.length > 0 ? (
                    indirectRecords.map((record, index) => (
                      <ListItem 
                        key={index} 
                        p={2} 
                        _hover={{ bg: "gray.50" }}
                        borderRadius="md"
                      >
                        <Flex justify="space-between" align="center">
                          <Text>{record.name}</Text>
                          <Link
                            href={`https://pes.irins.org/profile/${record.expertId}`}
                            isExternal
                            color="orange.500"
                            fontSize="sm"
                          >
                            {record.expertId}
                          </Link>
                        </Flex>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>No contributors found</ListItem>
                  )}
                </List>
              </Box>
            </Box>
          </Box>
        </Flex>
  
        {/* Guide Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Help</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <List spacing={3}>
                <ListItem>1. Click on a faculty node or their expert id to view their profile.</ListItem>
                <ListItem>2. Select a name from the dropdown to view top 5 collaborators.</ListItem>
                <ListItem>3. Domain Experts are Faculty Members explicitly associated with this field.</ListItem>
                <ListItem>4. Contributors are Faculty Members with experience and publications in this field.</ListItem>
                <ListItem>5. Use the 'Back' button to return to the previous page.</ListItem>
              </List>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </ChakraProvider>
  );
}

export default ResultPage;
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Text, Link, Divider, List, ListItem, Flex, Button, Input, ChakraProvider, extendTheme, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
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
  const [collaborationCounts, setCollaborationCounts] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [Token, setToken] = useState(''); 
  const [facultyName,setFacultyName]=useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const selectedDepartment = departmentParam || '';
  const selectedDomain = domainParam || '';

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const tokenFromCookie = getCookieValue('auth');
  //       if (tokenFromCookie) {
  //         const TokenResponse = await fetch("http://localhost:8080/api/decode", {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({ jwt: tokenFromCookie }), 
  //         });

  //         const TokenData = await TokenResponse.json();
  //         setSearchName(TokenData.name);
  //         facultyName=TokenData.name 
  //         facultyName = facultyName.replace(/^(Dr\. |Prof\. )\s*/, '');
  //         console.log(facultyName);
  //       }

  //       const response = await fetch('http://localhost:8080/api/query', {
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
  //   fetchTopCollaborators();

  //   // // Check if it's the first visit after the updated code
  //   // const hasVisitedResultPageAfterUpdate = Cookies.get('hasVisitedResultPageAfterUpdate');
  //   // if (!hasVisitedResultPageAfterUpdate) {
  //   //   onOpen(); // Open the guide modal
  //   //   Cookies.set('hasVisitedResultPageAfterUpdate', 'true', { expires: 365 }); // Set cookie to expire in 1 year
  //   // }
  // }, [selectedDomain, selectedDepartment, onOpen, Token]);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const tokenFromCookie = getCookieValue('auth');
      let facultyName = '';

      if (tokenFromCookie) {
        const TokenResponse = await fetch("http://localhost:8080/api/decode", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jwt: tokenFromCookie }), 
        });

        const TokenData = await TokenResponse.json();
        facultyName = TokenData.name;
        facultyName = facultyName.replace(/^(Dr\. |Prof\. )\s*/, '');
        setSearchName(facultyName);
        setFacultyName(facultyName);
        console.log(facultyName);
      }

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

      // Fetch top collaborators if domain and faculty name are available
      if (selectedDomain && facultyName) {
        const collaboratorsResponse = await fetch(`http://localhost:8080/api/top-collaborators?domainName=${encodeURIComponent(selectedDomain)}&personName=${facultyName}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!collaboratorsResponse.ok) throw new Error(`HTTP error! Status: ${collaboratorsResponse.status}`);
        const collaboratorsData = await collaboratorsResponse.json();

        if (collaboratorsData.length === 0) {
          setError(`No collaborator found for ${facultyName}`);
        } else {
          setCollaborationCounts(collaboratorsData);
          setSearchTriggered(true);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    }
  };

  fetchData();

  // Optional: Check if it's the first visit after the updated code
  // const hasVisitedResultPageAfterUpdate = Cookies.get('hasVisitedResultPageAfterUpdate');
  // if (!hasVisitedResultPageAfterUpdate) {
  //   onOpen(); // Open the guide modal
  //   Cookies.set('hasVisitedResultPageAfterUpdate', 'true', { expires: 365 }); // Set cookie to expire in 1 year
  // }
}, [selectedDomain, selectedDepartment, onOpen, Token]);


  const fetchTopCollaborators = async () => {
    try {
      if (!selectedDomain || !facultyName) return;
      console.log("faculty name",facultyName)
      const response = await fetch(`http://localhost:8080/api/top-collaborators?domainName=${encodeURIComponent(selectedDomain)}&personName=${facultyName}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const jsonData = await response.json();

      if (jsonData.length === 0) {
        setError(`No collaborator found for ${facultyName}`);
      } else {
        setCollaborationCounts(jsonData);
        setSearchTriggered(true);
        setError(null);
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
      // console.log(cookieValue)
      setToken(cookieValue); 
      // console.log("cookie value : ",Token)
      return cookieValue;  
    }
    return null;
  }

  function loadfacultyName(){
    if(facultyName){
      return facultyName
    }
    return ""
  }

  return (
    <ChakraProvider theme={extendTheme({})}>
      <Box p="20px">
        {/* Top Button Container */}
        <Flex
          direction="row"
          justifyContent="space-between"
          position="relative"
          mb="20px"
        >
          {/* Back Button */}
          <Button
            backgroundColor="gray.500"
            color="#fff"
            padding="10px 20px"
            fontSize="16px"
            border="none"
            borderRadius="5px"
            cursor="pointer"
            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
            onClick={handlePrev}
          >
            Back
          </Button>

          {/* Guide Button */}
          <Button
            backgroundColor="rgb(0, 158, 96)"
            color="#fff"
            padding="10px 20px"
            fontSize="16px"
            border="none"
            borderRadius="5px"
            cursor="pointer"
            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
            onClick={onOpen}
          >
            Guide
          </Button>
        </Flex>

        {/* Guide Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Guide</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <p>Here's how to view domain better:</p>
              <ol>
                <li>Click on a faculty node or their expert id provided to view their profile.</li>
                <li>Select a name from the dropdown to view top 5 collaborators.</li>
                <li>Domain Experts are Faculty Members Explicitly Associated with This Field.</li>
                <li>Contributors are the Faculty Members with Experience and Publications in This Field</li>
                <li>Use the 'Back' button to return to the previous page.</li>
              </ol>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme='blue' mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Main Title */}
        <Flex direction="column" alignItems="center" mb="20px">
          <Text fontSize="2xl" fontWeight="bold" mb="10px">
            Faculty Members Working in <i>{selectedDepartment.toUpperCase()}</i> Under <i>{selectedDomain.toUpperCase()}</i>
          </Text>
          <Text fontSize="20px" fontWeight="bold" fontStyle="italic" color="gray">
            Click on a node or Expert ID to access the faculty profile.
          </Text>
        </Flex>

        {/* Main Content */}
        <Flex width="100%" height="100%" direction="row">
          <Box width="30%" height="100%" display="flex" flexDirection="column" padding="20px">
          <Box
  width="100%"
  height="40%"
  border="1px solid #ccc"
  overflow="hidden"
  display="flex"
  flexDirection="column"
  boxSizing="border-box"
>
  <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="10px">
    Top 5 Suggested Collaborators 
    for {facultyName}
  </Text>
  <Divider mb="10px" />
  <Box padding="10px">
    {error && (
      <Text color="red.500" mb="10px">
        {error}
      </Text>
    )}
    <Box maxHeight="calc(40vh - 80px)" overflowY="auto">
      <List spacing={3}>
        {searchTriggered ? (
          collaborationCounts.length > 0 ? (
            collaborationCounts.map((collab, index) => (
              <ListItem key={index} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                <Text>
                  {collab.collaboratorName}
                </Text>
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
</Box>



            <Box
              width="100%"
              height="30%"
              border="1px solid #ccc"
              mb="20px"
              overflow="hidden"
              display="flex"
              flexDirection="column"
              boxSizing="border-box"
            >
              <Text fontSize="21px" fontWeight="bold" textAlign="center" mb="10px">
                {selectedDomain.toUpperCase()} Domain Expert
              </Text>
              <Text fontSize="15px" fontStyle="italic" color="grey" fontWeight="bold" align="center">Faculty with primary expertise and significant work in this domain</Text>
              <Text fontSize="md" textAlign="center" mb="9px" fontWeight="bold" fontStyle="italic">
                Number of Faculty Members {directCount}
              </Text>
              <Divider mb="10px" />
              <Box maxHeight="calc(30vh - 80px)" overflowY="auto" padding="10px">
                <List spacing={3}>
                  {directRecords.length > 0 ? (
                    directRecords.map((record, index) => (
                      <ListItem key={index} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        <Text>
                          {record.name} - 
                          <Link
                            href={`https://pes.irins.org/profile/${record.expertId}`}
                            isExternal
                            color="blue.500"
                          >
                            {record.expertId}
                          </Link>
                        </Text>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>No faculty results found</ListItem>
                  )}
                </List>
              </Box>
            </Box>

            <Box
              width="100%"
              height="30%"
              border="1px solid #ccc"
              overflow="hidden"
              display="flex"
              flexDirection="column"
              boxSizing="border-box"
            >
              <Text fontSize="21px" fontWeight="bold" textAlign="center" mb="10px">
                {selectedDomain.toUpperCase()} Contributors
              </Text>
              <Text fontSize="15px" fontStyle="italic" color="grey" fontWeight="bold" align="center"> Faculty who have worked or published in this domain, though it is not their primary area of expertise.</Text>
              <Text fontSize="md" textAlign="center" mb="10px" fontWeight="bold" fontStyle="italic">
                Number of Similar Faculty Members {indirectCount}
              </Text>
              <Divider mb="10px" />
              <Box maxHeight="calc(30vh - 80px)" overflowY="auto" padding="10px">
                <List spacing={3}>
                  {indirectRecords.length > 0 ? (
                    indirectRecords.map((record, index) => (
                      <ListItem key={index} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        <Text>
                          {record.name} - 
                          <Link
                            href={`https://pes.irins.org/profile/${record.expertId}`}
                            isExternal
                            color="blue.500"
                          >
                            {record.expertId}
                          </Link>
                        </Text>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>No similar faculty results found</ListItem>
                  )}
                </List>
              </Box>
            </Box>
          </Box>

          <Box width="70%" height="100%" p="20px">
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
        </Flex>
      </Box>
    </ChakraProvider>
  );
};

export default ResultPage;
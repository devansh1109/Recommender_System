import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChakraProvider,
  Box,
  Flex,
  Button,
  Select,
  Input,
  Text,
} from '@chakra-ui/react';

import globeImage from './globe.jpeg';
import './styles.css';

const LandingPage = () => {
  const domains = {
    'Department of Computer Science Engineering': [
      'ML/AI',
      'DATA SCIENCE',
      'IOT',
      'NETWORKS',
      'MICROPROCESSORS',
      'MICROCONTROLLERS',
      'DEEP LEARNING',
      'COMPUTER VISION',
      'CYBERSECURITY',
      'CLOUD COMPUTING',
      'WEB DEVELOPMENT',
      'BIG DATA AND DATA ANALYTICS',
      'DATA MINING',
    ],
    'Department of Electronics and Communication Engineering': [],
    'Department of Mechanical Engineering': [],
    'Department of Electrical and Electronics Engineering': [],
    'Department of Biotechnology': [],
    'Department of Civil Engineering': [],
    'Department of Science and Humanities': ['Advanced Materials',
      'FLUID DYNAMICS',
      'GEOMETRIC FUNCTION THEORY',
      'GRAPH THEORY',
      'OPERATIONS RESEARCH',
      'QUANTUM AND NANO DEVICES/ QUANTUM COMPUTING',
      'MATERIALS AND MANUFACTURING'],
    'Faculty of Commerce and Management': [],
    'Faculty of Pharmaceutical Sciences': ['PHARMACEUTICAL CHEMISTRY', 
      'PHARMACEUTICS',	
      'PHARMACOLOGY',	
      'PHARMACOGNOSY', 	
      'PHARMACEUTICAL ANALYSIS',
      'PHARMACY PRACTICE'],
    'Department of MCA': [],
    'Department of MBA': [],
    'Faculty of Law': [],
    'Department of Architecture': [],
    'Department of Psychology': [],
    'Library': [],
  };

  const departments = Object.keys(domains);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [showDropdowns, setShowDropdowns] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showVisualizations, setShowVisualizations] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [showGraphButtons, setShowGraphButtons] = useState(false);
  const [visualizationDepartment, setVisualizationDepartment] = useState('');

  const navigate = useNavigate();

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
    setSelectedDomain('');
  };

  const handleDomainChange = (event) => {
    setSelectedDomain(event.target.value);
  };

  const handleKeywordChange = (event) => {
    setKeyword(event.target.value);
  };

  const handleNextClick = () => {
    if (showDropdowns) {
      if (selectedDepartment) {
        if (domains[selectedDepartment].length > 0 && !selectedDomain) {
          alert('Please select a domain.');
        } else {
          // Navigate to results page with department and domain
          navigate(`/results?department=${encodeURIComponent(selectedDepartment)}${selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : ''}`);
        }
      } else {
        alert('Please select a department.');
      }
    } else if (showSearch) {
      if (keyword) {
        navigate(`/KeywordSearch?keyword=${encodeURIComponent(keyword)}`);
      } else {
        alert('Please enter a keyword.');
      }
    }
  };

  const handleShowSearch = () => {
    setShowDropdowns(false);
    setShowVisualizations(false);
    setShowSearch(true);
    setShowGraphButtons(false);
  };

  const handleShowDropdowns = () => {
    setShowDropdowns(true);
    setShowSearch(false);
    setShowVisualizations(false);
    setShowGraphButtons(false);
  };

  const handleShowVisualizations = () => {
    setShowDropdowns(false);
    setShowSearch(false);
    setShowVisualizations(true);
    setShowGraphButtons(false);
  };

  const handleNavigateToGraphButtons = () => {
    if (visualizationDepartment) {
      setShowGraphButtons(true);
    } else {
      alert('Please select a department.');
    }
  };

  const handleNavigateToDomainVisualization = () => {
    navigate(`/DomainVisualization?department=${encodeURIComponent(visualizationDepartment)}`);
  };

  const handleNavigateToCollaborations = () => {
    navigate(`/collaborations?department=${encodeURIComponent(visualizationDepartment)}`);
  };

  const handleNavigateToHistoryOfArticles = () => {
    navigate(`/chart?department=${encodeURIComponent(visualizationDepartment)}`);
  };

  const handleVisualizationDepartmentChange = (event) => {
    setVisualizationDepartment(event.target.value);
    setShowGraphButtons(domains[event.target.value].length > 0);
  };

   const navigateToResearchPortal = ()=>{
    window.location.href = "http://localhost:3000";
  }
  

  return (
    <ChakraProvider>
      <Box
        minHeight="100vh"
        width="100vw"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          backgroundImage={`url(${globeImage})`}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          zIndex="0"
        />
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          backgroundColor="rgba(0, 0, 0, 0.5)"
          zIndex="0"
        />

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
          overflowY="auto"
        >
          <Button onClick={navigateToResearchPortal}>Home</Button>
          <Text fontSize="2xl" fontWeight="bold" mb="20px">
            EXPLORE COLLABORATORS
          </Text>
          <Button onClick={handleShowDropdowns} colorScheme="blue" variant="filled" backgroundColor="white" mb="10px">
            Search By Domain
          </Button>
          <Button onClick={handleShowSearch} colorScheme="blue" variant="filled" backgroundColor="white" mb="10px">
            Search By Keyword
          </Button>
          <Button onClick={handleShowVisualizations} colorScheme="blue" variant="filled" backgroundColor="white">
            Statistics
          </Button>
        </Flex>

        <Box mb="30px" zIndex="1">
          <Text fontSize="4xl" fontWeight="bold" color="white">
            PESU RESEARCH COLLABORATION TOOL
          </Text>
          
        </Box>

        {(showDropdowns || showSearch || showVisualizations) && (
          <Box mb="40px" zIndex="1">

            <Flex direction="column" alignItems="center">
              {showDropdowns && (
                <>
                  <Box mb="20px">
                  <Text color="	rgb(224,224,224)" fontStyle="italic" fontSize="17px">Select the department and domain in which you are seeking collaboration</Text>

                    <Select
                      value={selectedDepartment}
                      onChange={handleDepartmentChange}
                      placeholder="Select Department"
                      variant="filled"
                      className="custom-select"
                    >
                      {departments.map((dept, index) => (
                        <option key={index} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </Select>
                  </Box>
                  {selectedDepartment && (
                    <Box mb="20px">
                      <Select
                        value={selectedDomain}
                        onChange={handleDomainChange}
                        placeholder="Select Domain"
                        variant="filled"
                        className="custom-select"
                        isDisabled={domains[selectedDepartment].length === 0}
                      >
                        {domains[selectedDepartment].length > 0 ? (
                          domains[selectedDepartment].map((domain, index) => (
                            <option key={index} value={domain.toLowerCase()}>
                              {domain}
                            </option>
                          ))
                        ) : (
                          <option value="">No domains available</option>
                        )}
                      </Select>
                    </Box>
                  )}
                </>
              )}
              {showSearch && (
                <Box mb="20px">
                  <Text color="	rgb(224,224,224)" fontStyle="italic" fontSize="17px">Enter a keyword to view related articles</Text>
                  <Input
                    type="text"
                    placeholder="Enter a Keyword"
                    value={keyword}
                    onChange={handleKeywordChange}
                    variant="filled"
                    color="white" // Change the input text color to white
                  />
                </Box>
              )}
              {(showDropdowns || showSearch) && (
                <Button onClick={handleNextClick} mt="10px">
                  Next
                </Button>
              )}
              {showVisualizations && (
                <Box mb="20px">
                                    <Text color="	rgb(224,224,224)" fontStyle="italic" fontSize="17px">Select the department in which you are seeking collaboration</Text>

                  <Select
                    value={visualizationDepartment}
                    onChange={handleVisualizationDepartmentChange}
                    placeholder="Select Department"
                    variant="filled"
                    className="custom-select"
                    color="black"
                  >
                    {departments.map((dept, index) => (
                      <option key={index} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </Select>
                </Box>
              )}
            </Flex>
          </Box>
        )}

        {showGraphButtons && (
          <Flex mt="10px" zIndex="1" justifyContent="center" gap="10px">
            <Button onClick={handleNavigateToDomainVisualization} variant="filled" backgroundColor="white">
              Domain Statistics
            </Button>
            <Button onClick={handleNavigateToCollaborations} variant="filled" backgroundColor="white">
              Explore Existing Collaborations
            </Button>
            <Button onClick={handleNavigateToHistoryOfArticles} variant="filled" backgroundColor="white">
              Year-wise Publication Statistics
            </Button>
          </Flex>
        )}
      </Box>
    </ChakraProvider>
  );
};

export default LandingPage;


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
  Container,
  VStack,
  Center,
  Icon
} from '@chakra-ui/react';
import { HamburgerIcon, SearchIcon, ViewIcon, TimeIcon } from '@chakra-ui/icons';

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
    'Department of Science and Humanities': [
      'Advanced Materials',
      'FLUID DYNAMICS',
      'GEOMETRIC FUNCTION THEORY',
      'GRAPH THEORY',
      'OPERATIONS RESEARCH',
      'QUANTUM AND NANO DEVICES/ QUANTUM COMPUTING',
      'MATERIALS AND MANUFACTURING'
    ],
    'Faculty of Commerce and Management': [],
    'Faculty of Pharmaceutical Sciences': [
      'PHARMACEUTICAL CHEMISTRY',
      'PHARMACEUTICS',
      'PHARMACOLOGY',
      'PHARMACOGNOSY',
      'PHARMACEUTICAL ANALYSIS',
      'PHARMACY PRACTICE'
    ],
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
  const [activeSection, setActiveSection] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showGraphButtons, setShowGraphButtons] = useState(false);
  const [visualizationDepartment, setVisualizationDepartment] = useState('');
  const [showIntro, setShowIntro] = useState(true);

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
    setShowIntro(false);
    
    if (activeSection === 'dropdowns') {
      if (selectedDepartment) {
        if (domains[selectedDepartment].length > 0 && !selectedDomain) {
          alert('Please select a domain.');
        } else {
          navigate(`/results?department=${encodeURIComponent(selectedDepartment)}${selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : ''}`);
        }
      } else {
        alert('Please select a department.');
      }
    } else if (activeSection === 'search') {
      if (keyword) {
        navigate(`/KeywordSearch?keyword=${encodeURIComponent(keyword)}`);
      } else {
        alert('Please enter a keyword.');
      }
    }
  };

  const handleShowSearch = () => {
    setShowIntro(false);
    setActiveSection('search');
    setSelectedDepartment('');
    setSelectedDomain('');
    setVisualizationDepartment('');
    setKeyword('');
    setShowGraphButtons(false);
  };

  const handleShowDropdowns = () => {
    setShowIntro(false);
    setActiveSection('dropdowns');
    setKeyword('');
    setVisualizationDepartment('');
    setSelectedDepartment('');
    setSelectedDomain('');
    setShowGraphButtons(false);
  };

  const handleShowVisualizations = () => {
    setShowIntro(false);
    setActiveSection('visualizations');
    setSelectedDepartment('');
    setSelectedDomain('');
    setKeyword('');
    setShowGraphButtons(false);
    setVisualizationDepartment('');
  };

  const handleVisualizationDepartmentChange = (event) => {
    setVisualizationDepartment(event.target.value);
    setShowGraphButtons(true);
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

  const navigateToResearchPortal = () => {
    window.location.href = "http://localhost:3000";
  };

  return (
    <ChakraProvider>
      <Box
        minHeight="100vh"
        width="100vw"
        display="flex"
        flexDirection="column"
        alignItems="center"
        position="static"
        overflow="hidden"
      >
        {/* Background Image */}
        <Box
          position="fixed"
          top="0"
          left="0"
          width="100%"
          height="100%"
          backgroundImage={`url(${globeImage})`}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          backgroundAttachment="fixed"
          zIndex="0"
        />

        {/* Overlay */}
        <Box
          position="absolute"
          top="0"
          left="0"
          bottom="0"
          right="0"
          width="100%"
          height="100%"
          backgroundColor="rgba(0, 0, 0, 0.45)"
          zIndex="0"
        />

        {/* Left Side Menu */}
        <Flex
          position="absolute"
          top="20px"
          left="20px"
          direction="column"
          alignItems="center"
          justifyContent="flex-start"
          background="rgba(255, 255, 255, 0.65)"
          borderRadius="20px"
          padding="30px"
          height="calc(100vh - 40px)"
          width="300px"
          zIndex="1"
          overflowY="auto"
          backdropFilter="blur(10px)"
          boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.37)"
          border="1px solid rgba(255, 255, 255, 0.18)"
        >
          <Button 
            onClick={navigateToResearchPortal}
            leftIcon={<Icon as={HamburgerIcon} boxSize={5} />}
            width="100%"
            mb="100px"
            colorScheme='green'
            variant="solid"
            size="lg"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            Home
          </Button>
          
          <Text 
            fontSize="2xl" 
            fontWeight="bold" 
            mb="30px"
            textAlign="center"
            color="gray.800"
          >
            EXPLORE COLLABORATORS
          </Text>

          <VStack spacing={4} width="100%">
            <Button
              onClick={handleShowDropdowns}
              leftIcon={<Icon as={SearchIcon} boxSize={4} />}
              width="100%"
              colorScheme="blue"
              variant={activeSection === 'dropdowns' ? "solid" : "outline"}
              _hover={{ bg: 'blue.50' }}
              height="50px"
            >
              Search By Domain
            </Button>

            <Button
              onClick={handleShowSearch}
              leftIcon={<Icon as={ViewIcon} boxSize={4} />}
              width="100%"
              colorScheme="blue"
              variant={activeSection === 'search' ? "solid" : "outline"}
              _hover={{ bg: 'blue.50' }}
              height="50px"
            >
              Search By Keyword
            </Button>

            <Button
              onClick={handleShowVisualizations}
              leftIcon={<Icon as={TimeIcon} boxSize={4} />}
              width="100%"
              colorScheme="blue"
              variant={activeSection === 'visualizations' ? "solid" : "outline"}
              _hover={{ bg: 'blue.50' }}
              height="50px"
            >
              Statistics
            </Button>
          </VStack>
        </Flex>

        {/* Main Content */}
        <Center 
          position="absolute" 
          left="50%" 
          top="50%" 
          transform="translate(-50%, -50%)" 
          zIndex="1" 
          width="100%"
          maxW="container.xl"
          px={4}
        >
          <VStack spacing={8} align="center" justify="center">
            {/* Title */}
            <Text 
              fontSize="5xl" 
              fontWeight="bold" 
              color="white"
              textAlign="center"
              mb={4}
            >
              MILAAP: PESU COLLABORATION TOOL
            </Text>

            {/* Introduction Text - Only show when showIntro is true */}
            {showIntro && (
              <Box 
                maxW="800px" 
                bg="rgba(255, 255, 255, 0.1)" 
                p={8} 
                borderRadius="xl"
                backdropFilter="blur(10px)"
              >
                <VStack spacing={4}>
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    mb={4}
                  >
                    Welcome to MILAAP: Your Intelligent Research Partner Finder
                  </Text>
                  <Text 
                    color="white" 
                    fontSize="lg" 
                    textAlign="justify" 
                    lineHeight="tall"
                  >
                    In a world where innovation thrives on collaboration, MILAAP is here to revolutionize how researchers connect across disciplines. Designed for universities, MILAAP leverages advanced recommendation algorithms to match researchers based on expertise, interests, and project needs, fostering seamless partnerships that drive impactful research.
                  </Text>
                  <Text 
                    color="white" 
                    fontSize="lg" 
                    textAlign="justify" 
                    lineHeight="tall"
                  >
                    Whether you're looking to discover hidden connections, explore interdisciplinary opportunities, or optimize resource sharing, MILAAP simplifies the process, saving time and amplifying your research potential. With a focus on efficiency, innovation, and user-friendly design, MILAAP is your gateway to building stronger research networks and accelerating scientific breakthroughs.
                  </Text>
                  <Text 
                    color="white" 
                    fontSize="xl" 
                    fontWeight="bold" 
                    textAlign="justify"
                    mt={4}
                  >
                    Join MILAAP today and unlock the power of connection!
                  </Text>
                </VStack>
              </Box>
            )}

            {/* Search and Filter Options */}
            {(activeSection === 'dropdowns' || activeSection === 'search' || activeSection === 'visualizations') && (
              <Box mb="40px">
                <Flex direction="column" alignItems="center">
                  {activeSection === 'dropdowns' && (
                    <>
                      <Box mb="20px">
                        <Text color="rgb(224,224,224)" fontStyle="italic" fontSize="17px">
                          Select the department and domain in which you are seeking collaboration
                        </Text>
                        <Select
                          value={selectedDepartment}
                          onChange={handleDepartmentChange}
                          placeholder="Select Department"
                          colorScheme='white'
                          backgroundColor="white"
                          color="black"
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
                            backgroundColor="white"
                            color="black"
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

                  {activeSection === 'search' && (
                    <Box mb="20px">
                      <Text color="rgb(224,224,224)" fontStyle="italic" fontSize="17px">
                        Enter a keyword to view related articles
                      </Text>
                      <Input
                        type="text"
                        placeholder="Enter a Keyword"
                        value={keyword}
                        onChange={handleKeywordChange}
                        backgroundColor="white"
                        color="black"
                      />
                    </Box>
                  )}

                  {activeSection === 'visualizations' && (
                    <Box mb="20px">
                      <Text color="rgb(224,224,224)" fontStyle="italic" fontSize="17px">
                        Select the department in which you are seeking collaboration
                      </Text>
                      <Select
                        value={visualizationDepartment}
                        onChange={handleVisualizationDepartmentChange}
                        placeholder="Select Department"
                        backgroundColor="white"
                        color="black"
                        className="custom-select"
                      >
                        {departments.map((dept, index) => (
                          <option key={index} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </Select>
                    </Box>
                  )}

                  {(activeSection === 'dropdowns' || activeSection === 'search') && (
                    <Button onClick={handleNextClick} mt="10px">
                      Next
                    </Button>
                  )}
                </Flex>
              </Box>
            )}

            {/* Graph Buttons */}
            {showGraphButtons && (
              <Flex mt="10px" justifyContent="center" gap="10px">
                <Button onClick={handleNavigateToCollaborations} variant="filled" backgroundColor="white">
                  Explore Existing Collaborations
                </Button>
                <Button onClick={handleNavigateToHistoryOfArticles} variant="filled" backgroundColor="white">
                  Year-wise Publication Statistics
                </Button>
              </Flex>
            )}
          </VStack>
        </Center>
      </Box>
    </ChakraProvider>
  );
};

export default LandingPage;

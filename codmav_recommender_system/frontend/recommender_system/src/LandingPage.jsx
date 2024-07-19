import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChakraProvider,
  extendTheme,
  Box,
  Flex,
  Button,
  Select,
  Input,
  Text,
  Image,
} from '@chakra-ui/react';
import logoImage from './logo.png';
import globeImage from './globe.jpeg';

const theme = extendTheme({
  colors: {
    brand: {
      900: '#1a365d',
      800: '#153e75',
      700: '#2a69ac',
    },
    placeholderGray: '#A0AEC0',
    buttonLight: '#CBD5E0',
    brightWhite: '#FFFFFF', // Bright white color
  },
  components: {
    Select: {
      baseStyle: {
        field: {
          _placeholder: { color: 'white' },
          color: 'white', // Set dropdown text color to white
          bg: 'white',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          _placeholder: { color: 'white' },
          color: 'white',
        },
      },
    },
    FormLabel: {
      baseStyle: {
        color: 'white',
      },
    },
  },
});

const LandingPage = () => {
  const domains = {
    'Department of Computer Science Engineering': [
      'ML/AI',
      'Data Science',
      'IoT',
      'Networks',
      'Microprocessor',
      'Microcontrollers',
      'Deep Learning',
      'Computer Vision',
      'Cybersecurity',
      'Cloud Computing',
      'Web Development',
      'Big Data and Data Analytics',
      'Data Mining',
    ],
    'Department of Electronics and Communication Engineering': [],
    'Department of Mechanical Engineering': [],
    'Department of Electrical and Electronics Engineering': [],
    'Department of Biotechnology': [],
    'Department of Civil Engineering': [],
    'Department of Science and Humanities': [],
    'Faculty of Commerce and Management': [],
    'Faculty of Pharmaceutical Sciences': [],
    'Department of MCA': [],
    'Department of MBA': [],
    'Faculty of Law': [],
    'Department of Architecture': [],
    'Department of Neuroscience': [],
    'Department of Psychology': [],
    'Department of Human Genetics': [],
    'Department of Orthopaedics': [],
    Library: [],
  };

  const departments = Object.keys(domains);
  const [selectedDepartment, setSelectedDepartment] = useState(departments[0]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [showDropdowns, setShowDropdowns] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showVisualizations, setShowVisualizations] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [showGraphButtons, setShowGraphButtons] = useState(false);

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
      if (selectedDomain && selectedDepartment) {
        navigate(`/results?department=${encodeURIComponent(selectedDepartment)}&domain=${encodeURIComponent(selectedDomain)}`);
      } else {
        alert('Please select both department and domain.');
      }
    } else if (showSearch) {
      if (keyword && selectedDepartment) {
        navigate(`/results?department=${encodeURIComponent(selectedDepartment)}&keyword=${encodeURIComponent(keyword)}`);
      } else {
        alert('Please enter a keyword and select a department.');
      }
    }
  };

  const handleShowSearch = () => {
    setShowDropdowns(false);
    setShowVisualizations(false);
    setShowSearch(true);
  };

  const handleShowDropdowns = () => {
    setShowDropdowns(true);
    setShowSearch(false);
    setShowVisualizations(false);
  };

  const handleShowVisualizations = () => {
    setShowDropdowns(false);
    setShowSearch(false);
    setShowVisualizations(true);
    setShowGraphButtons(false);
  };

  const handleNavigateToGraphButtons = () => {
    if (selectedDepartment) {
      setShowGraphButtons(true);
    } else {
      alert('Please select a department.');
    }
  };

  const handleNavigateToDomainVisualization = () => {
    navigate(`/DomainVisualization/${encodeURIComponent(selectedDepartment)}`);
  };

  const handleNavigateToCollaborations = () => {
    navigate(`/collaborations?department=${encodeURIComponent(selectedDepartment)}`);
  };

  const handleNavigateToHistoryOfArticles = () => {
    navigate(`/chart?department=${encodeURIComponent(selectedDepartment)}`);
  };

  return (
    <ChakraProvider theme={theme}>
      <Box
        minHeight="100vh"
        width="100vw"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        position="relative"
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
        ></Box>
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          backgroundColor="rgba(0, 0, 0, 0.5)" // Adjust the opacity as needed
          zIndex="0"
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
          width="300px" // Adjust the width as needed
          zIndex="1"
        >
          <h3>Search collaborations</h3>
          <Image src={logoImage} alt="Logo" boxSize="100px" mb="20px" />
          <Button onClick={handleShowDropdowns} colorScheme="blue" variant="outline" mb="10px" bg="buttonLight">
            Search By Domain
          </Button>
          <Button onClick={handleShowSearch} colorScheme="blue" variant="outline" mb="10px" bg="buttonLight">
            Search By Keyword
          </Button>
          <Button onClick={handleShowVisualizations} colorScheme="blue" variant="outline" bg="buttonLight">
            Existing Collaboration & Trends
          </Button>
        </Flex>

        <Box mb="30px" zIndex="1">
          <Text fontSize="4xl" fontWeight="bold" color="white">
            MILAAP
          </Text>
          <Text fontSize="2xl" color="white">
            One Stop Destination for Like-Minded Researchers
          </Text>
        </Box>

        {(showDropdowns || showSearch || showVisualizations) && (
          <Box mb="40px" zIndex="1">
            <Flex direction="column" alignItems="center">
              <Box mb="20px">
                <Select
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  mr="10px"
                  placeholder="Select Department"
                  sx={{ color: 'white' }} // Set dropdown text color to white
                >
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Select>
              </Box>
              {showDropdowns && (
                <Box>
                  <Select
                    value={selectedDomain}
                    onChange={handleDomainChange}
                    disabled={!domains[selectedDepartment].length}
                    placeholder="Select Domain"
                    sx={{ color: 'white' }} // Set dropdown text color to white
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
              {showSearch && (
                <Box>
                  <Input
                    type="text"
                    placeholder="Enter Keywords"
                    value={keyword}
                    onChange={handleKeywordChange}
                    sx={{ '::placeholder': { color: 'white' } }}
                  />
                </Box>
              )}
              {(showDropdowns || showSearch) && (
                <Button onClick={handleNextClick} mt="10px">
                  Next
                </Button>
              )}
            </Flex>
          </Box>
        )}

        {showVisualizations && (
          <Box width="100%" zIndex="1">
            <Flex flexDirection="column" alignItems="center">
              {showGraphButtons ? (
                <Flex>
                  <Button onClick={handleNavigateToDomainVisualization} colorScheme="blue" variant="outline" mb="10px" mr="10px" bg="buttonLight">
                    Domain Visualization
                  </Button>
                  <Button onClick={handleNavigateToCollaborations} colorScheme="blue" variant="outline" mb="10px" mr="10px" bg="buttonLight">
                    Collaborations
                  </Button>
                  <Button onClick={handleNavigateToHistoryOfArticles} colorScheme="blue" variant="outline" bg="buttonLight">
                    History of Articles
                  </Button>
                </Flex>
              ) : (
                <Button onClick={handleNavigateToGraphButtons} colorScheme="blue" variant="outline" bg="buttonLight">
                  Show Graph Buttons
                </Button>
              )}
            </Flex>
          </Box>
        )}
      </Box>
    </ChakraProvider>
  );
};

export default LandingPage;

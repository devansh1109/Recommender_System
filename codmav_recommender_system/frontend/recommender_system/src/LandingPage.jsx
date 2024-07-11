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
import pesImage from './IMAGE2.jpg'; // Import the background image
import logoImage from './logo.png'; // Import the logo image

// Define your custom theme
const theme = extendTheme({
  colors: {
    brand: {
      900: '#1a365d',
      800: '#153e75',
      700: '#2a69ac',
    },
    placeholderGray: '#A0AEC0', // Define a custom color for the placeholder
    buttonLight: '#CBD5E0', // Define a custom color for the light buttons
  },
  components: {
    Select: {
      baseStyle: {
        field: {
          _placeholder: { color: 'white' }, // Set placeholder color for Select to black
          color: 'black', // Set selected option color to black
          bg: 'white', // Set background color of Select to white
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          _placeholder: { color: 'white' }, // Set placeholder color for Input to white
          color: 'white', // Set input text color to white
        },
      },
    },
    FormLabel: {
      baseStyle: {
        color: 'white', // Set label text color to white
      },
    },
  },
});

const LandingPage = () => {
  // Define domains and departments
  const domains = {
    'Department of Computer Science Engineering': [
      'ml/ai',
      'data science',
      'iot',
      'networks',
      'microprocessor',
      'microcontrollers',
      'deep learning',
      'computer vision',
      'cybersecurity',
      'cloud computing',
      'web development',
      'big data and data analytics', // Fixed typo here
      'data mining'
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
  const [showVisualizations, setShowVisualizations] = useState(false); // State for Visualizations
  const [keyword, setKeyword] = useState(''); // Add state for the search keyword

  const navigate = useNavigate();

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
    setSelectedDomain(''); // Reset domain selection
  };

  const handleDomainChange = (event) => {
    setSelectedDomain(event.target.value);
  };

  const handleKeywordChange = (event) => {
    setKeyword(event.target.value); // Update the keyword state
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
    setShowDropdowns(false); // Hide dropdowns
    setShowVisualizations(false); // Hide visualizations
    setShowSearch(true); // Show search
  };

  const handleShowDropdowns = () => {
    setShowDropdowns(true); // Show dropdowns
    setShowSearch(false); // Hide search
    setShowVisualizations(false); // Hide visualizations
  };

  const handleShowVisualizations = () => {
    setShowDropdowns(false); // Hide dropdowns
    setShowSearch(false); // Hide search
    setShowVisualizations(true); // Show visualizations
  };

  return (
    <ChakraProvider theme={theme}>
      <Box
        minHeight="100vh"
        width="100vw"
        padding="20px"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        backgroundImage={`url(${pesImage})`} // Corrected background image syntax
        backgroundSize="cover" // Make sure the image covers the entire background
        backgroundPosition="center" // Center the background image
        backgroundRepeat="no-repeat" // Prevent the image from repeating
      >
        <Image
          src={logoImage}
          alt="Logo"
          position="absolute"
          top="10px"
          right="10px"
          boxSize="110px" // Adjust the size of the logo
          objectFit="contain"
        />
        <Box mb="30px"> {/* Increase margin-bottom to move the heading further from the top */}
          <Text fontSize="2xl" fontWeight="bold" color="white">
            MILAAP
          </Text>
          <Text fontSize="2xl" color="white">
            One Stop Destination for Like-Minded Researchers
          </Text>
        </Box>
        <Box mb="40px"> {/* Increase margin-bottom to move the buttons further down */}
          <Flex alignItems="center">
            <Button
              onClick={handleShowDropdowns}
              colorScheme="blue"
              variant="outline"
              mr="10px"
              bg="buttonLight"
            >
              Search By Domain
            </Button>
            <Button
              onClick={handleShowSearch}
              colorScheme="blue"
              variant="outline"
              mr="10px"
              bg="buttonLight"
            >
              Search By Keyword
            </Button>
            <Button
              onClick={handleShowVisualizations}
              colorScheme="blue"
              variant="outline"
              bg="buttonLight"
            >
              Graph Visualizations
            </Button>
          </Flex>
        </Box>
        {showDropdowns && (
          <Box mb="20px">
            <Flex alignItems="center">
              <Box>
                <Select
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  mr="10px"
                  placeholder="Select Department"
                >
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Select
                  value={selectedDomain}
                  onChange={handleDomainChange}
                  disabled={!domains[selectedDepartment].length}
                  mr="10px"
                  placeholder="Select Domain"
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
              <Button onClick={handleNextClick} ml="10px">
                Next
              </Button>
            </Flex>
          </Box>
        )}
        {showSearch && (
          <Box mb="20px">
            <Flex alignItems="center">
              <Box>
                <Select
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  mr="10px"
                  placeholder="Select Department"
                >
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Input
                  type="text"
                  placeholder="Enter Keywords"
                  ml="10px"
                  value={keyword}
                  onChange={handleKeywordChange} // Update keyword on change
                  sx={{ '::placeholder': { color: 'white' } }} // Set placeholder color for Input
                />
              </Box>
              <Button onClick={handleNextClick} ml="10px">
                Search
              </Button>
            </Flex>
          </Box>
        )}
        {showVisualizations && (
          <Box width="100%">
            <Flex flexDirection="column" alignItems="center">
              <Box mb="10px">
                <Select
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  placeholder="Select Department"
                >
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Select>
              </Box>
              <Button onClick={() => navigate(`/visualization/${encodeURIComponent(selectedDepartment)}`)}>
                Show Visualization
              </Button>
            </Flex>
          </Box>
        )}
      </Box>
    </ChakraProvider>
  );
};

export default LandingPage;

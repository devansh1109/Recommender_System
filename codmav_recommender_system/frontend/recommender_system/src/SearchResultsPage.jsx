import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Text,
  Spinner,
  VStack,
} from '@chakra-ui/react';

const SearchResultsPage = () => {
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const keyword = queryParams.get('keyword');
  const department = queryParams.get('department');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/search?keyword=${keyword}&department=${department}`);
        const data = await response.json();
        setResults(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setLoading(false);
      }
    };

    fetchResults();
  }, [keyword, department]);

  if (loading) {
    return (
      <Box textAlign="center" mt="20px">
        <Spinner />
      </Box>
    );
  }

  return (
    <Box p="20px">
      <Text fontSize="2xl" mb="20px">Search Results for "{keyword}"</Text>
      <VStack spacing="10px">
        {results.length > 0 ? (
          results.map((result, index) => (
            <Box key={index} p="10px" borderWidth="1px" borderRadius="md" width="100%">
              <Text fontSize="lg" fontWeight="bold">{result.title}</Text>
              <Text>{result.author}</Text>
            </Box>
          ))
        ) : (
          <Text>No results found</Text>
        )}
      </VStack>
    </Box>
  );
};

export default SearchResultsPage;

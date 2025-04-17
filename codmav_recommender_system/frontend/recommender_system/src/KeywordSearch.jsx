import React, { useState, useEffect } from 'react';
import {
  ChakraProvider, Box, Input, Button, VStack, HStack, Text, Container, Collapse,
  IconButton, Spinner, Center, Alert, AlertIcon, Tooltip
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useLocation, useNavigate } from 'react-router-dom';

// Component to display a single search result and fetch similar articles
const SearchResult = ({ result, excludeIds }) => {
  const [showSimilar, setShowSimilar] = useState(false);
  const [similarResults, setSimilarResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noSimilarFound, setNoSimilarFound] = useState(false);

  const handleShowSimilar = async () => {
    if (!showSimilar && similarResults.length === 0) {
      setLoading(true);
      setNoSimilarFound(false);
      try {
        const response = await fetch(`http://10.2.80.40:5000/api/flask/similar?id=${result.id}&exclude=${excludeIds.join(',')}`);
        if (response.status === 404) {
          setNoSimilarFound(true);
        } else if (!response.ok) {
          throw new Error('Similar results request failed');
        } else {
          const data = await response.json();
          setSimilarResults(data);
        }
      } catch (error) {
        console.error('Error fetching similar results:', error);
      } finally {
        setLoading(false);
      }
    }
    setShowSimilar(!showSimilar);
  };

  const authorsList = [result.author, ...(result.co_authors ? result.co_authors.split(', ') : [])].filter(Boolean);

  return (
    <Box borderWidth="1px" borderRadius="lg" p="4" width="100%">
      <VStack align="stretch" spacing={2}>
        <Text fontSize="xl" fontWeight="bold">{result.title}</Text>
        <HStack justify="space-between" align="start">
          <Text fontSize="md" color="gray.700" fontWeight="semibold" flex="1">
            Authors List:
            <br />
            {authorsList.join(', ')}
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="right">
            {result.year}
          </Text>
        </HStack>
        {result.doi === 'N/A' ? (
  <Text fontSize="sm" color="gray.500">DOI: N/A</Text>
) : (
  <Text fontSize="sm" color="blue.500">
    DOI: <a href={`https://doi.org/${result.doi}`} target="_blank" rel="noopener noreferrer">{result.doi}</a>
  </Text>
)}
      </VStack>
      <HStack justify="space-between" mt="2">
        <Box></Box>
        <HStack>
          <Text fontSize="sm" color="blue.500">Similar Articles</Text>
          <IconButton
            icon={showSimilar ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={handleShowSimilar}
            aria-label={showSimilar ? "Hide similar results" : "Show similar results"}
            size="sm"
          />
        </HStack>
      </HStack>
      <Collapse in={showSimilar} animateOpacity>
        <VStack mt="4" spacing="2" align="stretch">
          {loading ? (
            <Spinner />
          ) : noSimilarFound ? (
            <Alert status="info">
              <AlertIcon />
              No similar papers found.
            </Alert>
          ) : (
            similarResults.map((similar) => (
              <Box key={similar.id} p="2" bg="gray.50" borderRadius="md">
                <Text fontSize="sm" fontWeight="medium">{similar.title}</Text>
                <HStack justify="space-between" align="start">
                  <Text fontSize="xs" color="gray.700" fontWeight="semibold" flex="1">
                    Authors: {[similar.author, ...(similar.co_authors ? similar.co_authors.split(', ') : [])].filter(Boolean).join(', ')}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {similar.year}
                  </Text>
                </HStack>
                {similar.doi !== 'N/A' && (
  <Text fontSize="xs" color="blue.500">
    DOI: <a href={`https://doi.org/${similar.doi}`} target="_blank" rel="noopener noreferrer">{similar.doi}</a>
  </Text>
)}
              </Box>
            ))
          )}
        </VStack>
      </Collapse>
    </Box>
  );
};

const KeywordSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialKeyword = params.get('keyword');
    if (initialKeyword) {
      setQuery(initialKeyword);
      fetchResults(false, initialKeyword);
    }
  }, [location]);

  const fetchResults = async (isLoadMore = false, searchQuery = query) => {
    setLoading(true);
    try {
      const response = await fetch(`http://10.2.80.40:5000/api/flask/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=20`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = await response.json();
      if (isLoadMore) {
        setResults(prevResults => [...prevResults, ...data]);
      } else {
        setResults(data);
      }
      setHasMore(data.length === 20);
      setPage(prevPage => prevPage + 1);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setHasMore(true);
    fetchResults();
  };

  const handleLoadMore = () => {
    fetchResults(true);
  };

  const handlePrev = () => {
    navigate(-1);
  };

  return (
    <ChakraProvider>
      <Box>
        <Container maxW="container.lg" py="4">
          <Box mb="4">
            {/* Add your Navbar component here */}
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb="4">
            <Button
              backgroundColor="gray.300"
              onClick={handlePrev}
              size="sm"
              width="auto"
            >
              Back
            </Button>
            <Text fontSize="20px" color="Gray" fontStyle="italic" fontWeight="bold" align="center" marginRight="30%">
              Enter a keyword to view related articles.
            </Text>
          </Box>
          <VStack spacing="4" align="stretch">
            <VStack spacing="4">
              <Input
                placeholder="Enter a keyword"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button colorScheme="blue" onClick={handleSearch} isLoading={loading && page === 1}>
                Search
              </Button>
            </VStack>
            <VStack spacing="4" mt="8" width="100%">
              {results.map((result) => (
                <SearchResult key={result.id} result={result} excludeIds={results.map(r => r.id)} />
              ))}
            </VStack>
            {results.length > 0 && hasMore && (
              <Center mt="4">
                <Button onClick={handleLoadMore} isLoading={loading && page > 1}>
                  Load More
                </Button>
              </Center>
            )}
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  );
};

export default KeywordSearch;

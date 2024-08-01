import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent'; // Import the Cytoscape cose-bilkent layout extension
import { Box, IconButton, VStack, Text, HStack } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

// Register cose-bilkent layout extension
cytoscape.use(coseBilkent);

const GraphComponent = ({ domain }) => {
  const [elements, setElements] = useState([]);
  const cyRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    containerRef.current = document.getElementById('cy');
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`http://localhost:8080/api/graph?domain=${domain}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: HTTP error! Status: ${response.status}`);
        }
        const { nodes, edges } = await response.json();

        const validNodes = nodes.filter(node => node.label); // Filter out nodes without labels

        const cyElements = validNodes.map(node => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            properties: node.properties // Assuming 'properties' contains various properties including 'expertid'
          }
        }));

        edges.forEach(edge => {
          cyElements.push({
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              label: edge.label // Set edge label to indicate direct or indirect
            }
          });
        });

        setElements(cyElements);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, [domain]);

  useEffect(() => {
    if (elements.length > 0 && containerRef.current) {
      if (cyRef.current) {
        cyRef.current.destroy();
      }

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: elements,
        style: [
          {
            selector: 'node[type="Person"]',
            style: {
              'label': 'data(label)',
              'width': 100,
              'height': 100,
              'background-color': 'gold',
              'color': 'black',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': 20,
              'text-wrap': 'wrap',
              'text-max-width': 100,
              'padding': '30px'
            }
          },
          {
            selector: 'node[type="Domain"]',
            style: {
              'label': 'data(label)',
              'width': 250,
              'height': 250,
              'background-color': 'gray',
              'color': '#fff',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': 42,
              'text-wrap': 'wrap',
              'text-max-width': 100,
              'padding': '10px',
              'border': '2px solid white',
              'text-transform': 'uppercase' // Ensure text is in capital letters
            }
          },
          {
            selector: 'edge[label="EXPERT_IN_DIRECT"]',
            style: {
              'width': 3,
              'line-color': '#7DFF33',
              'target-arrow-color': '#00f',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'control-point-step-size': 80
            }
          },
          {
            selector: 'edge[label="EXPERT_IN_INDIRECT"]',
            style: {
              'width': 3,
              'line-color': '#f00',
              'target-arrow-color': '#f00',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'control-point-step-size': 80
            }
          }
        ],
        layout: {
          name: 'cose-bilkent', // Use cose-bilkent layout
          animate: true,
          randomize: true, // Randomize initial positions
          nodeDimensionsIncludeLabels: true,
          spacingFactor: 1.2, // Adjust the spacing between nodes
          idealEdgeLength: 200, // Adjust the ideal edge length for edge distribution
          fit: true, // Fit the graph to the container
          padding: 30 // Padding around the graph
        }
      });

      // Add click event listener to navigate to the profile page
      cyRef.current.on('tap', 'node[type="Person"]', function (evt) {
        const node = evt.target;
        const expertId = node.data('properties').expertid;
        if (expertId) {
          window.open(`https://pes.irins.org/profile/${expertId}`, '_blank');
        }
      });
    }
  }, [elements]);

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  return (
    <Box position="relative">
      <Box ref={containerRef} id="cy" style={{ height: '600px' }}></Box>
      <Box position="absolute" top="10px" right="10px" bg="white" p="4" borderRadius="md" boxShadow="md">
        <VStack align="start">
          <HStack>
            <Box width="20px" height="20px" bg="#7DFF33" borderRadius="sm" />
            <Text>DOMAIN EXPERT</Text>
          </HStack>
          <HStack>
            <Box width="20px" height="20px" bg="#f00" borderRadius="sm" />
            <Text>DOMAIN CONTRIBUTORS</Text>
          </HStack>
        </VStack>
      </Box>
      <Box position="absolute" bottom="10px" right="10px">
        <VStack>
          <IconButton
            icon={<AddIcon />}
            onClick={handleZoomIn}
            aria-label="Zoom In"
            mb="2"
          />
          <IconButton
            icon={<MinusIcon />}
            onClick={handleZoomOut}
            aria-label="Zoom Out"
          />
        </VStack>
      </Box>
    </Box>
  );
};

export default GraphComponent;

import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { Box, IconButton, VStack, Text, HStack } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

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

        const validNodes = nodes.filter(node => node.label);

        const cyElements = validNodes.map(node => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            properties: node.properties
          }
        }));

        edges.forEach(edge => {
          cyElements.push({
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              label: edge.label
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
              'width': 400,
              'height': 400,
              'color': 'black',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': 70,
              'text-wrap': 'wrap',
              'text-max-width': 100,
              'padding': '65px',
              'background-color': '#FFA500' // Default color for Person nodes
            }
          },
          {
            selector: 'node[type="Domain"]',
            style: {
              'label': 'data(label)',
              'width': 600,
              'height': 600,
              'background-color': '		rgb(112,112,112)',
              'color': '#fff',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': 70,
              'text-wrap': 'wrap',
              'text-max-width': 100,
              'padding': '60px',
              'border': '2px solid black',
              'text-transform': 'uppercase'
            }
          },
          {
            selector: 'edge[label="EXPERT_IN_DIRECT"]',
            style: {
              'width': 7,
              'line-color': 'black',
              'target-arrow-color': 'black',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'control-point-step-size': 80
            }
          },
          {
            selector: 'edge[label="EXPERT_IN_INDIRECT"]',
            style: {
              'width': 7,
              'line-color': 'black',
              'target-arrow-color': 'black',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'control-point-step-size': 80
            }
          }
        ],
        layout: {
          name: 'cose-bilkent',
          animate: true,
          randomize: true,
          nodeDimensionsIncludeLabels: true,
          spacingFactor: 1.2,
          idealEdgeLength: 200,
          fit: true,
          padding: 30
        }
      });

      // Color nodes based on their connections
      cyRef.current.ready(() => {
        cyRef.current.nodes().forEach(node => {
          if (node.data('type') === 'Person') {
            const directEdges = node.connectedEdges('[label="EXPERT_IN_DIRECT"]');
            const indirectEdges = node.connectedEdges('[label="EXPERT_IN_INDIRECT"]');
            
            if (directEdges.length > 0) {
              node.style('background-color', '#66CCFF'); // Green for direct experts
            } else if (indirectEdges.length > 0) {
              node.style('background-color', '#FF9933'); // Red for indirect contributors
            }
          }
        });
      });

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
            <Box width="20px" height="20px" bg="#66CCFF" borderRadius="sm" />
            <Text>Domain Expert</Text>
          </HStack>
          <HStack>
            <Box width="20px" height="20px" bg="#FF9933" borderRadius="sm" />
            <Text>Domain Contributors</Text>
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
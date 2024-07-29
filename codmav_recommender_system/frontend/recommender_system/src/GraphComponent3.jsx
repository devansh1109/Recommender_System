import React, { useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { Input, Select, Box, VStack, Text, Button, List, ListItem, Divider } from '@chakra-ui/react';
import Fuse from 'fuse.js';

cytoscape.use(coseBilkent);

const GraphComponent3 = ({ initialSearchQuery }) => {
    const [elements, setElements] = useState([]);
    const [cy, setCy] = useState(null);
    const [titles, setTitles] = useState([]);
    const [selectedCollaboration, setSelectedCollaboration] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [names, setNames] = useState([]);
    const [filteredNames, setFilteredNames] = useState([]);
    const [collaboratorCount, setCollaboratorCount] = useState(0);
    const [fuse, setFuse] = useState(null);

    const fetchNames = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/persons');
            if (!response.ok) {
                throw new Error('Failed to fetch names');
            }
            const data = await response.json();
            const personNames = data.personNames || [];
            setNames(personNames);
            setFilteredNames(personNames);

            // Initialize Fuse.js
            const fuseInstance = new Fuse(personNames, {
                includeScore: true,
                threshold: 0.3,
            });
            setFuse(fuseInstance);
        } catch (error) {
            console.error('Error fetching names:', error);
        }
    };

    useEffect(() => {
        fetchNames();
    }, []);

    useEffect(() => {
        if (fuse && searchQuery) {
            const result = fuse.search(searchQuery);
            setFilteredNames(result.map(({ item }) => item));
        } else {
            setFilteredNames(names);
        }
    }, [searchQuery, fuse, names]);

    const fetchData = async (name) => {
        try {
            // Clear previous data
            setTitles([]);
            setSelectedCollaboration('');

            const response = await fetch(`http://localhost:8080/api/collaborations/${name}`);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const { nodes, edges, collaborationData } = await response.json();

            const cyElements = [];
            nodes.forEach(node => {
                cyElements.push({
                    data: {
                        id: node.id,
                        label: node.label,
                        type: node.type
                    }
                });
            });

            edges.forEach(edge => {
                cyElements.push({
                    data: {
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        label: 'COLLABORATIONS',
                        count: Number(edge.count) || 0,
                        titles: edge.titles || [],
                        collaborationId: edge.collaborationId
                    }
                });
            });

            setElements(cyElements);

            // Calculate the number of unique collaborators
            const uniqueCollaborators = new Set(edges.map(edge => edge.target));
            setCollaboratorCount(uniqueCollaborators.size);

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        if (initialSearchQuery) {
            setSearchQuery(initialSearchQuery);
            fetchData(initialSearchQuery);
        }
    }, [initialSearchQuery]);

    const handleSelect = (event) => {
        const name = event.target.value;
        setSearchQuery(name);
        fetchData(name);
    };

    const handleEdgeClick = async (event) => {
        const edge = event.target;
        const collaborationId = edge.data('collaborationId');

        try {
            const response = await fetch(`http://localhost:8080/api/collaboration/${collaborationId}/titles`);
            if (!response.ok) {
                throw new Error('Failed to fetch titles');
            }
            const { titles } = await response.json();
            setTitles(titles);
            setSelectedCollaboration(`Collaboration between ${edge.source().data('label')} and ${edge.target().data('label')}`);
        } catch (error) {
            console.error('Error fetching titles for collaboration:', error);
        }
    };

    const handleEdgeMouseover = (event) => {
        const edge = event.target;
        edge.style({
            'line-color': 'rgb(255, 95, 21)', // Outline color
            'target-arrow-color': 'rgb(255, 95, 21)',
            'width': 6 // Thicker width for the outline
        });

        let tooltip = document.getElementById('tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.background = '#000';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '5px';
            tooltip.style.borderRadius = '3px';
            document.body.appendChild(tooltip);
        }

        tooltip.innerText = 'Click to view articles'; // Updated tooltip text
        tooltip.style.left = `${event.originalEvent.clientX + 5}px`;
        tooltip.style.top = `${event.originalEvent.clientY + 5}px`;
    };

    const handleEdgeMouseout = (event) => {
        const edge = event.target;
        edge.style({
            'line-color': '#999',
            'target-arrow-color': '#999',
            'width': 2 // Default width
        });

        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            document.body.removeChild(tooltip);
        }
    };

    const calculateColor = (count) => {
        const maxCount = 20;
        const minColor = [255, 240, 26];
        const maxColor = [205, 0, 0];

        const ratio = Math.min(count / maxCount, 1);
        const color = minColor.map((min, index) => {
            const max = maxColor[index];
            return Math.round(min + ratio * (max - min));
        });

        return `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
    };

    const updateNodeColors = (cyInstance) => {
        cyInstance.edges().forEach(edge => {
            const targetNode = edge.target();
            const count = edge.data('count');
            const color = calculateColor(count);
            targetNode.style('background-color', color);
        });
    };

    const renderCytoscape = (elements) => {
        const cyInstance = cytoscape({
            container: document.getElementById('cy'),
            elements: elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'width': 100,
                        'height': 100,
                        'background-color': '#1f77b4',
                        'color': 'black',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': 10,
                        'text-wrap': 'wrap',
                        'text-max-width': 80,
                        'padding': 5
                    }
                },
                {
                    selector: 'node[type="Person"]',
                    style: {
                        'background-color': 'grey',
                        'width': 40,
                        'height': 40,
                        'font-size': 5.3,
                        'color': 'peach',
                        'text-max-width': 120,
                        'padding': 10
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 'mapData(count, 0, 10, 1, 10)',
                        'line-color': '#999',
                        'target-arrow-color': '#999',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'text-rotation': 'autorotate',
                        'label': 'data(count)'
                    }
                }
            ],
            layout: {
                name: 'cose-bilkent',
                padding: 20,
                animate: true,
                animationDuration: 1000,
                nodeDimensionsIncludeLabels: true
            }
        });

        cyInstance.fit(cyInstance.nodes(), 10);

        cyInstance.on('tap', 'edge', handleEdgeClick);
        cyInstance.on('mouseover', 'edge', handleEdgeMouseover);
        cyInstance.on('mouseout', 'edge', handleEdgeMouseout);

        updateNodeColors(cyInstance);

        setCy(cyInstance);
    };

    useEffect(() => {
        if (elements.length > 0) {
            renderCytoscape(elements);
        }
    }, [elements]);

    return (
        <Box
            display="flex"
            flexDirection="column"
            height="100vh"
            width="100vw"
            backgroundColor="#f0f4f8"
            p={4}
        >
            <Box display="flex" flex="1" overflow="hidden">
                <Box
                    id="cy"
                    flex="3"
                    border="1px solid #ccc"
                    borderRadius="md"
                    backgroundColor="rgb(220,220,220)"
                    position="relative"
                ></Box>
                <Box flex="1" p={4}>
                    <VStack spacing={4} align="stretch">
                        
                        <Text fontSize="lg" fontWeight="bold" color="#2D3748">
                            {selectedCollaboration && `Selected Collaboration: ${selectedCollaboration}`}
                        </Text>
                        <Divider />
                        <Text fontSize="15px" fontStyle="italic" fontWeight='bold' mb={2}>Number of Collaborators: {collaboratorCount}</Text>
                        <Box
                            overflowY="auto"
                            maxHeight="400px"
                            border="1px solid #e2e8f0"
                            borderRadius="md"
                            backgroundColor="rgb(224,224,224)"
                        >
                            <List spacing={3} p={4}>
                                {titles.map((title, index) => (
                                    <ListItem key={index} p={3} borderWidth="1px" borderRadius="md" borderColor="#e2e8f0" backgroundColor="#edf2f7">
                                        <Text fontSize="md" color="#2D3748">{title}</Text>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </VStack>
                </Box>
            </Box>
        </Box>
    );
};

export default GraphComponent3;

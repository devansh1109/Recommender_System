import React, { useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { Input, Select, Box, VStack, Text, Button } from '@chakra-ui/react';

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

    const fetchNames = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/persons');
            if (!response.ok) {
                throw new Error('Failed to fetch names');
            }
            const data = await response.json();
            setNames(data.personNames || []);
            setFilteredNames(data.personNames || []);
        } catch (error) {
            console.error('Error fetching names:', error);
        }
    };

    useEffect(() => {
        fetchNames();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setFilteredNames(names.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase())));
        } else {
            setFilteredNames(names);
        }
    }, [searchQuery, names]);

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
        const count = edge.data('count');
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

        tooltip.innerText = `Count: ${count}`;
        tooltip.style.left = `${event.originalEvent.clientX + 5}px`;
        tooltip.style.top = `${event.originalEvent.clientY + 5}px`;
    };

    const handleEdgeMouseout = () => {
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
                    backgroundColor="#ffffff"
                    borderRadius="8px"
                    boxShadow="md"
                    height="100%"
                    marginRight="16px"
                />
                <Box flex="1" p={4} borderRadius="8px" boxShadow="md" backgroundColor="#ffffff">
                    <Box>
                        <VStack spacing={4} align="start">
                        <Text fontSize="20px" color="Gray" fontStyle="italic" fontWeight="bold">
                            Click on any edge to view the corresponding collaborative articles.
                        </Text>
                            {selectedCollaboration && (
                                <Box>
                                    <Text fontWeight="bold">{selectedCollaboration}</Text>
                                    <ul>
                                        {titles.map(title => (
                                            <li key={title}>{title}</li>
                                        ))}
                                    </ul>
                                </Box>
                            )}
                            <Text>Number of unique collaborators: {collaboratorCount}</Text>
                        </VStack>
                    </Box>
                </Box>
            </Box>

        </Box>
    );
};

export default GraphComponent3;

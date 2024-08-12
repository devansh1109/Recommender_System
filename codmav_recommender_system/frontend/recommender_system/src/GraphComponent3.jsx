import React, { useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { Input, Select, Box, VStack, Text, Button, List, ListItem, Divider, Heading } from '@chakra-ui/react';
import Fuse from 'fuse.js';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
} from '@chakra-ui/react';
 
cytoscape.use(coseBilkent);
// const setCookie = (name, value, days) => {
//     const d = new Date();
//     d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
//     const expires = "expires=" + d.toUTCString();
//     document.cookie = name + "=" + value + ";" + expires + ";path=/";
// };

// const getCookie = (name) => {
//     const nameEQ = name + "=";
//     const ca = document.cookie.split(';');
//     for (let i = 0; i < ca.length; i++) {
//         let c = ca[i];
//         while (c.charAt(0) === ' ') c = c.substring(1, c.length);
//         if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
//     }
//     return null;
// };

 
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
    const { isOpen, onOpen, onClose } = useDisclosure();

    // useEffect(() => {
    //     const hasVisited = getCookie('hasVisited');
    //     if (!hasVisited) {
    //         onGuideOpen();
    //         setCookie('hasVisited', 'true', 365);
    //     }
    // }, []);

 
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
            onOpen();
        } catch (error) {
            console.error('Error fetching titles for collaboration:', error);
        }
    };
 
    const handleEdgeMouseover = (event) => {
        const edge = event.target;
        edge.style({
            'line-color': 'rgb(255, 95, 21)',
            'target-arrow-color': 'rgb(255, 95, 21)'
            
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
 
        tooltip.innerText = 'Click to view articles';
        tooltip.style.left = `${event.originalEvent.clientX + 5}px`;
        tooltip.style.top = `${event.originalEvent.clientY + 5}px`;
    };
 
    const handleEdgeMouseout = (event) => {
        const edge = event.target;
        edge.style({
            'line-color': '#999',
            'target-arrow-color': '#999'
            
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
 
    const updateColorRangeBar = (edges) => {
        const minCount = Math.min(...edges.map(edge => edge.data('count')));
        const maxCount = Math.max(...edges.map(edge => edge.data('count')));
 
        const colorRangeBar = document.getElementById('color-range-bar');
        if (colorRangeBar) {
            colorRangeBar.innerHTML = '';
 
            for (let i = minCount; i <= maxCount; i++) {
                const color = calculateColor(i);
                const colorBlock = document.createElement('div');
                colorBlock.style.width = '20px';
                colorBlock.style.height = '20px';
                colorBlock.style.backgroundColor = color;
                colorBlock.title = i;
                colorRangeBar.appendChild(colorBlock);
            }
        }
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
                        'width': 150,
                        'height': 150,
                        'background-color': '#1f77b4',
                        'color': 'black',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': 50,
                        'text-wrap': 'wrap',
                        'text-max-width': 80,
                        'padding': 5
                    }
                },
                {
                    selector: 'node[type="Person"]',
                    style: {
                        'background-color': 'grey',
                        'width': 100,
                        'height': 100,
                        'font-size': 15,
                        'color': 'peach',
                        'text-max-width': 120,
                        'padding': 5
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 'mapData(count, 0, 10, 2, 20)',
                        'line-color': '#999',
                        'target-arrow-color': '#999',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'text-rotation': 'autorotate',
                    }
                }
            ],
            layout: {
                name: 'cose-bilkent',
                animate: false,
                nodeRepulsion: 10000,
                idealEdgeLength: 100
            }
        });
 
        cyInstance.on('tap', 'edge', handleEdgeClick);
        cyInstance.on('mouseover', 'edge', handleEdgeMouseover);
        cyInstance.on('mouseout', 'edge', handleEdgeMouseout);
 
        setCy(cyInstance);
        updateNodeColors(cyInstance);
        updateColorRangeBar(cyInstance.edges());

        // Adjust zoom level based on the number of elements
        const totalElements = elements.length;

        if (totalElements > 10) {
            cyInstance.fit();
        } else {
            // Calculate a more aggressive zoom level for small graphs
            const zoomLevel = Math.max(0.1, Math.min(1, 1 / Math.log(totalElements + 2)));

            cyInstance.zoom({
                level: zoomLevel,
                position: { x: cyInstance.width() / 2, y: cyInstance.height() / 2 }
            });

            // Use larger padding for small graphs to push elements towards the center
            const padding = Math.max(100, 300 - 20 * totalElements);

            cyInstance.fit(elements, padding);
        }
    };
    
 
    useEffect(() => {
        renderCytoscape(elements);
    }, [elements]);
 
    const handleZoomIn = () => {
        if (cy) {
            cy.zoom(cy.zoom() * 1.2);
            cy.center();
        }
    };
 
    const handleZoomOut = () => {
        if (cy) {
            cy.zoom(cy.zoom() * 0.8);
            cy.center();
        }
    };
 
    return (
        <VStack spacing={4} align="stretch" p={4}>
            <datalist id="names-list">
                {filteredNames.map((name, index) => (
                    <option key={index} value={name} />
                ))}
            </datalist>
 
            <Box height="600px" position="relative">
                <Box id="cy" height="100%" width="100%" border="1px solid gray" borderRadius="md" display="block" />
 
                <Box position="absolute" top="4" right="4" display="flex" flexDirection="column" alignItems="flex-end">
                    <Box display="flex" flexDirection="column" alignItems="flex-end" mb={4}>
                        <Button backgroundColor="rgb(208,208,208)" color="black" size="sm" mb={2} onClick={handleZoomIn}>+</Button>
                        <Button backgroundColor="rgb(208,208,208)" color="black" size="sm" onClick={handleZoomOut}>-</Button>
                    </Box>
                    <Box backgroundColor="rgba(255, 255, 255, 0.8)" p={2} borderRadius="md">
 
                        <Box id="color-range-bar" display="flex" flexDirection="column" height="300px" width="20px" />
                    </Box>
                </Box>
            </Box>
 
            <Box>
            <Text fontSize="lg" fontWeight="bold">Number of Collaborators: {collaboratorCount}</Text>
                
            </Box>
 
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
                        <ModalContent borderRadius="lg" boxShadow="xl">
                            <ModalHeader 
                                bg="blue.500" 
                                color="white" 
                                borderTopRadius="lg" 
                                p={4}
                            >
                                {selectedCollaboration}
                            </ModalHeader>
                            <ModalCloseButton color="white" />
                            <ModalBody p={6}>
                                <Heading size="md" mb={4}>Articles:</Heading>
                                <List spacing={3}>
                                    {titles.map((title, index) => (
                                        <ListItem 
                                            key={index} 
                                            p={3} 
                                            bg="gray.50" 
                                            borderRadius="md"
                                            _hover={{ bg: "gray.100" }}
                                            transition="background-color 0.2s"
                                        >
                                            <Text fontSize="md" fontWeight="medium">{title}</Text>
                                        </ListItem>
                                    ))}
                                </List>
                            </ModalBody>
                            <ModalFooter>
                                <Button colorScheme="blue" onClick={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                
        </VStack>
    );
};
 
export default GraphComponent3;
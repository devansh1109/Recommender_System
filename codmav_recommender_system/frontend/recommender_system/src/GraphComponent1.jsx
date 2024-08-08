import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    useDisclosure,
} from '@chakra-ui/react';

cytoscape.use(coseBilkent);

const setCookie = (name, value, days) => {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
};

const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

const GraphComponent1 = ({ department }) => {
    const navigate = useNavigate();
    const [elements, setElements] = useState([]);
    const [cy, setCy] = useState(null);
    const [titles, setTitles] = useState([]);
    const [selectedDomainName, setSelectedDomainName] = useState('');
    const [initialDomainArticles, setInitialDomainArticles] = useState([]);
    const [tooltipContent, setTooltipContent] = useState('');
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`http://localhost:8080/api/graph/${department}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const { nodes, edges } = await response.json();

                const cyElements = [];
                nodes.forEach(node => {
                    cyElements.push({
                        data: {
                            id: node.id,
                            label: node.label,
                            type: node.type,
                            count: node.count || 0
                        }
                    });
                });

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
                setInitialDomainArticles(nodes.filter(node => node.type === 'Domain').map(domain => ({
                    name: domain.label,
                    count: domain.count || 0
                })));
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }

        // Check if it's the first visit after the updated code
        const hasVisitedGraphPageAfterUpdate = getCookie('hasVisitedGraphPageAfterUpdate');
        if (!hasVisitedGraphPageAfterUpdate) {
            onOpen();
            setCookie('hasVisitedGraphPageAfterUpdate', 'true', 365); // Set cookie for 1 year
        }

        fetchData();
    }, [department, onOpen]);

    useEffect(() => {
        if (elements.length > 0) {
            const cyInstance = renderCytoscape(elements);
            setCy(cyInstance);
        }
    }, [elements]);

    async function fetchTitles(domainId, domainName) {
        try {
            const response = await fetch(`http://localhost:8080/api/titles/${domainId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch titles');
            }
            const { titles } = await response.json();
            setTitles(titles);
            setSelectedDomainName(domainName);

            if (cy) {
                cy.fit(cy.nodes(), 10);
            }
        } catch (error) {
            console.error('Error fetching titles:', error);
        }
    }

    function renderCytoscape(elements) {
        const cyInstance = cytoscape({
            container: document.getElementById('cy'),
            elements: elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'width': 'mapData(count, 0, 1000, 50, 200)',
                        'height': 'mapData(count, 0, 1000, 50, 200)',
                        'background-color': 'skyblue',
                        'color': 'black',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': 13.5,
                        'text-wrap': 'wrap',
                        'text-max-width': 80,
                        'padding': 40
                    }
                },
                {
                    selector: 'node[type="Department"]',
                    style: {
                        'background-color': 'rgb(25, 25, 112)',
                        'width': 70,
                        'height': 70,
                        'font-size': 18,
                        'color': '#fff',
                        'text-max-width': 120,
                        'padding': 30
                    }
                },
                {
                    selector: 'node[type="Domain"]',
                    style: {
                        'background-color': 'skyblue',
                        'text-transform': 'uppercase',
                        'text-max-width': 80,
                        'cursor': 'pointer'
                    }
                },
                {
                    selector: 'node[type="Domain"].hover',
                    style: {
                        'background-color': 'rgb(70, 130, 180)',
                        'border-width': 2,
                        'border-color': 'rgb(70, 130, 180)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': 'black',
                        'target-arrow-color': 'black',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
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

        cyInstance.on('tap', 'node', (event) => {
            const node = event.target;
            if (node.data('type') === 'Domain') {
                const domainId = node.id();
                const domainName = node.data('label');
                setInitialDomainArticles([]);
                fetchTitles(domainId, domainName);
            }
        });

        cyInstance.on('mouseover', 'node[type="Domain"]', (event) => {
            const node = event.target;
            node.addClass('hover');

            setTooltipContent('Click to view articles');
            const { x, y } = node.renderedPosition();
            const container = document.getElementById('cy');
            const containerRect = container.getBoundingClientRect();
            const nodeX = x + containerRect.left;
            const nodeY = y + containerRect.top;

            setTooltipPosition({
                x: nodeX + 20,
                y: nodeY - 20
            });
        });

        cyInstance.on('mouseout', 'node[type="Domain"]', (event) => {
            const node = event.target;
            node.removeClass('hover');

            setTooltipContent('');
        });

        return cyInstance;
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f0f4f8',
            padding: '20px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1500px',
                backgroundColor: '#fff',
                borderRadius: '10px',
                boxShadow: '0 4px 6px grey',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: 'calc(100% - 20px)',
                }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            color: '#fff',
                            backgroundColor: 'grey',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        Back
                    </button>
                    <button 
                        onClick={onOpen}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            color: '#fff',
                            backgroundColor: 'rgb(0, 158, 96)',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        Guide
                    </button>
                </div>
                <h1 style={{
                    color: '#333',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    margin: '20px 0',
                    textAlign: 'center',
                    borderBottom: '2px solid #ddd',
                    paddingBottom: '10px',
                }}>
                    Domain-wise Statistics
                </h1>
                <h4 style={{
                    color: 'grey',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    margin: '20px 0',
                    textAlign: 'center',
                    borderBottom: '2px solid #ddd',
                    paddingBottom: '10px',
                    fontStyle:"italic"
                }}>
                    The graph below shows the number of articles that has been published in each of these domains
                </h4>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    height: '600px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                }}>
                    <div id="cy" style={{
                        flex: 2,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                    }}></div>
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px',
                        borderLeft: '2px solid #ddd',
                        backgroundColor: '#fff',
                        borderRadius: '10px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        <h3 style={{
                            color: '#333',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginBottom: '10px',
                            fontSize: '20px',
                            textTransform: 'uppercase'
                        }}>
                            {selectedDomainName ? `Articles of ${selectedDomainName.toUpperCase()}` : 'Total Articles per Domain'}
                        </h3>
                        {selectedDomainName ? (
                            <>
                                <p style={{
                                    color: '#666',
                                    margin: '10px 0',
                                }}>
                                    Total articles: {titles.length}
                                </p>
                                <ol style={{
                                    paddingLeft: '20px',
                                    marginTop: '10px',
                                    listStyleType: 'decimal',
                                    width: '100%',
                                }}>
                                    {titles.map((title, index) => (
                                        <li key={index} style={{
                                            color: '#333',
                                            marginBottom: '10px',
                                        }}>
                                            {title.title}
                                        </li>
                                    ))}
                                </ol>
                            </>
                        ) : (
                            <ol style={{
                                paddingLeft: '20px',
                                marginTop: '10px',
                                listStyleType: 'decimal',
                                width: '100%',
                            }}>
                                {initialDomainArticles.map((domain, index) => (
                                    <li key={index} style={{
                                        color: '#333',
                                        marginBottom: '10px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {domain.name}: {domain.count} articles
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>
                {tooltipContent && (
                    <div
                        style={{
                            position: 'absolute',
                            left: tooltipPosition.x,
                            top: tooltipPosition.y,
                            padding: '5px 10px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            borderRadius: '5px',
                            pointerEvents: 'none',
                            fontSize: '12px',
                            zIndex: 10,
                        }}
                    >
                        {tooltipContent}
                    </div>
                )}
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Guide</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <p>Here's how to use the domain visualization tool:</p>
                            <ol>
                                <li>Click on a domain node in the graph to view related articles.</li>
                                <li>Hover over nodes to see additional information.</li>
                                <li>Use the 'Back' button to return to the previous page.</li>
                            </ol>
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="blue" onClick={onClose}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </div>
    );
};

export default GraphComponent1;
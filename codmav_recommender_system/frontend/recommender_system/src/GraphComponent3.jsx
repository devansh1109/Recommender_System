import React, { useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

cytoscape.use(coseBilkent);

const GraphComponent3 = ({ initialSearchQuery }) => {
    const [elements, setElements] = useState([]);
    const [cy, setCy] = useState(null);
    const [titles, setTitles] = useState([]);
    const [selectedCollaboration, setSelectedCollaboration] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch data from the backend
    const fetchData = async (name) => {
        try {
            const response = await fetch(`http://localhost:8080/api/collaborations/${name}`);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const { nodes, edges, collaborationData } = await response.json();

            // Process nodes and edges to form Cytoscape elements
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
                        count: Number(edge.count) || 0,  // Convert count to a number
                        titles: edge.titles || [],  // Default to empty array if no titles property
                        collaborationId: edge.collaborationId  // Ensure this is included
                    }
                });
            });

            setElements(cyElements);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Handle form submission and fetch data
    const handleSearch = (event) => {
        event.preventDefault();
        fetchData(searchQuery);
    };

    useEffect(() => {
        if (initialSearchQuery) {
          fetchData(initialSearchQuery);
        }
      }, [initialSearchQuery]);
    

    // Handle edge click event to fetch and display titles
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

    // Handle edge mouseover event to show count tooltip
    const handleEdgeMouseover = (event) => {
        const edge = event.target;
        const count = edge.data('count');
        let tooltip = document.getElementById('tooltip');

        // Create a new tooltip if it doesn't exist
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

    // Handle edge mouseout event to hide count tooltip
    const handleEdgeMouseout = () => {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            document.body.removeChild(tooltip);
        }
    };

    // Render the Cytoscape instance
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
                        'color': '#fff',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': 1,
                        'text-wrap': 'wrap',
                        'text-max-width': 80,
                        'padding': 5
                    }
                },
                {
                    selector: 'node[type="Person"]',
                    style: {
                        'background-color': 'gold',
                        'width': 40,
                        'height': 40,
                        'font-size': 5.3,
                        'color': 'black',
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

        // Center and zoom out to fit the graph on page load
        cyInstance.fit(cyInstance.nodes(), 10);

        // Handle edge click event to fetch and display titles
        cyInstance.on('tap', 'edge', handleEdgeClick);

        // Handle edge mouseover and mouseout events
        cyInstance.on('mouseover', 'edge', handleEdgeMouseover);
        cyInstance.on('mouseout', 'edge', handleEdgeMouseout);

        // Update the cy state
        setCy(cyInstance);
    };

    useEffect(() => {
        if (elements.length > 0) {
            renderCytoscape(elements);
        }
    }, [elements]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#f0f4f8',
        }}>
            <div style={{
                padding: '20px',
                backgroundColor: '#fff',
                borderBottom: '1px solid #ddd',
            }}>
               
                <form onSubmit={handleSearch} style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                  
                    
                </form>
            </div>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div id="cy" style={{ flex: 1, height: '100%', backgroundColor: 'rgb(224,224,224)', borderRight: '1px solid #ddd' }}></div>
                <div style={{
                    flex: 1,
                    color: '#333',
                    padding: '20px',
                    backgroundColor: '#fff',
                    overflowY: 'auto',
                    height: '100%',
                }}>
                    {selectedCollaboration ? (
                        <>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{selectedCollaboration}</h2>
                            <ul style={{ listStyleType: 'none', padding: '0' }}>
                                {titles.map((title, index) => (
                                    <li key={index} style={{
                                        padding: '10px 0',
                                        borderBottom: '1px solid rgb(152,152,152)'
                                    }}>{title}</li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p>Select a collaboration to view titles</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GraphComponent3;

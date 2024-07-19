// App.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Navbar from './Navbar'; // Import the Navbar component
import LandingPage from './LandingPage';
import ResultPage from './ResultPage';
import ArticleCountChart from './ArticleCountChart';
import GraphComponent1 from './GraphComponent1';
import CollaborationGraph from './CollaborationGraph';
import SearchComponent from './SearchComponent';
import SearchResultsPage from './SearchResultsPage';

// Extend the theme to include custom colors, fonts, etc.
const theme = extendTheme({
  colors: {
    brand: {
      900: '#1a365d',
      800: '#153e75',
      700: '#2a69ac',
    },
  },
  // Add any other theme customizations here
});

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        {/* Include the Navbar */}
        <Navbar />
        {/* Main Content */}
        <div style={{ flex: 1, padding: '20px' }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/LandingPage" element={<LandingPage />} />
            <Route path="/results" element={<ResultPage />} />
            <Route path="/chart" element={<ArticleCountChart />} />
            <Route path="/DomainVisualization/:department" element={<GraphComponent1 />} />
            <Route path="/collaborations" element={<CollaborationGraph />} />
            <Route path="/searchComponent" element={<SearchComponent />} />
            <Route path="/search-results" element={<SearchResultsPage />} />
            {/* Define other routes as needed */}
          </Routes>
        </div>
      </Router>
    </ChakraProvider>
  );
};

// Render your application
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
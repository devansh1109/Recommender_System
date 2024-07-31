import React from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';

const ColorRangeBar = () => {
    const colors = [
        { color: 'rgba(255, 240, 26, 1)', count: '1' },
        { color: 'rgba(255, 190, 20, 1)', count: '5' },
        { color: 'rgba(255, 140, 15, 1)', count: '10' },
        { color: 'rgba(255, 90, 10, 1)', count: '15' },
        { color: 'rgba(205, 0, 0, 1)', count: '20+' }
    ];

    return (
        <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
            <Text fontSize="md" mb={2}>Collaboration Intensity</Text>
            <HStack spacing={4}>
                {colors.map((colorInfo, index) => (
                    <Box key={index} textAlign="center">
                        <Box 
                            width="30px" 
                            height="20px" 
                            backgroundColor={colorInfo.color} 
                            border="1px solid #ccc" 
                            mb={1}
                        />
                        <Text fontSize="sm">{colorInfo.count}</Text>
                    </Box>
                ))}
            </HStack>
        </Box>
    );
};

export default ColorRangeBar;

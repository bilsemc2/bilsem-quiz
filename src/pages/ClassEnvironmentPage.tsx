import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ClassEnvironment from '../components/ClassEnvironment';

const ClassEnvironmentPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sınıf Ortamı
        </Typography>
        <ClassEnvironment />
      </Box>
    </Container>
  );
};

export default ClassEnvironmentPage;

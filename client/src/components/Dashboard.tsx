import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid as MuiGrid, Paper, Box } from '@mui/material';
import { claimsApi } from '../services/api';

interface ClaimData {
  status: string;
  // Add other properties as needed
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await claimsApi.getAllClaims();
        const claims: ClaimData[] = response.data.data || [];
        
        // Calculate statistics
        setStats({
          totalClaims: claims.length,
          pendingClaims: claims.filter((c: ClaimData) => c.status === 'pending').length,
          approvedClaims: claims.filter((c: ClaimData) => c.status === 'approved').length,
          rejectedClaims: claims.filter((c: ClaimData) => c.status === 'rejected').length
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <MuiGrid container spacing={3}>
        <MuiGrid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="p" variant="h6">
              Total Claims
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalClaims}
            </Typography>
          </Paper>
        </MuiGrid>
        
        <MuiGrid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#FFF9C4' }}>
            <Typography component="p" variant="h6">
              Pending
            </Typography>
            <Typography component="p" variant="h4">
              {stats.pendingClaims}
            </Typography>
          </Paper>
        </MuiGrid>
        
        <MuiGrid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#C8E6C9' }}>
            <Typography component="p" variant="h6">
              Approved
            </Typography>
            <Typography component="p" variant="h4">
              {stats.approvedClaims}
            </Typography>
          </Paper>
        </MuiGrid>
        
        <MuiGrid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#FFCDD2' }}>
            <Typography component="p" variant="h6">
              Rejected
            </Typography>
            <Typography component="p" variant="h4">
              {stats.rejectedClaims}
            </Typography>
          </Paper>
        </MuiGrid>
      </MuiGrid>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Links
        </Typography>
        <MuiGrid container spacing={3}>
          <MuiGrid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                height: 140,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
              onClick={() => window.location.href = '/voice'}
            >
              <Typography variant="h6">Voice Processing</Typography>
              <Typography variant="body2" color="text.secondary">
                Process audio files to extract claim information
              </Typography>
            </Paper>
          </MuiGrid>
          
          <MuiGrid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                height: 140,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
              onClick={() => window.location.href = '/ocr'}
            >
              <Typography variant="h6">Document OCR</Typography>
              <Typography variant="body2" color="text.secondary">
                Process documents to extract structured data
              </Typography>
            </Paper>
          </MuiGrid>
          
          <MuiGrid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                height: 140,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
              onClick={() => window.location.href = '/claims'}
            >
              <Typography variant="h6">Claims Management</Typography>
              <Typography variant="body2" color="text.secondary">
                View and manage insurance claims
              </Typography>
            </Paper>
          </MuiGrid>
        </MuiGrid>
      </Box>
    </Container>
  );
};

export default Dashboard;
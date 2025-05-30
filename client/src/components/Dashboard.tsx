import React, { useEffect, useState } from 'react';
import {
  Box,
  // Container, // Remove Container
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Icon,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import { claimsApi } from '../services/api';
import BarChartIcon from '@mui/icons-material/BarChart';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';

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
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Simulate API delay for loading state if needed
        // await new Promise(resolve => setTimeout(resolve, 1000)); 
        const response = await claimsApi.getAllClaims();
        const claims: ClaimData[] = response.data.data || []; // Assuming data is nested under a 'data' property

        const pending = claims.filter((claim: ClaimData) => claim.status === 'pending').length;
        const approved = claims.filter((claim: ClaimData) => claim.status === 'approved').length;
        const rejected = claims.filter((claim: ClaimData) => claim.status === 'rejected').length;

        setStats({
          totalClaims: claims.length,
          pendingClaims: pending,
          approvedClaims: approved,
          rejectedClaims: rejected
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Optionally set an error state here to display to the user
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    { title: 'Total Claims', value: stats.totalClaims, color: theme.palette.info.main, icon: <BarChartIcon fontSize="large" /> },
    { title: 'Pending', value: stats.pendingClaims, color: theme.palette.warning.main, icon: <PendingActionsIcon fontSize="large" /> },
    { title: 'Approved', value: stats.approvedClaims, color: theme.palette.success.main, icon: <CheckCircleOutlineIcon fontSize="large" /> },
    { title: 'Rejected', value: stats.rejectedClaims, color: theme.palette.error.main, icon: <HighlightOffIcon fontSize="large" /> },
  ];

  const quickLinks = [
    { title: 'Voice Processing', description: 'Process audio files to extract claim information', path: '/voice', icon: <RecordVoiceOverIcon sx={{ fontSize: 40, mb: 1, color: theme.palette.primary.main }} /> },
    { title: 'Document OCR', description: 'Process documents to extract structured data', path: '/ocr', icon: <DescriptionIcon sx={{ fontSize: 40, mb: 1, color: theme.palette.primary.main }} /> },
    { title: 'Claims Management', description: 'View and manage insurance claims', path: '/claims', icon: <AssignmentIcon sx={{ fontSize: 40, mb: 1, color: theme.palette.primary.main }} /> },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}> {/* Removed Container to let Layout handle it */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', backgroundColor: item.color, color: theme.palette.getContrastText(item.color) }}>
              <Box sx={{ mb: 1 }}>{item.icon}</Box>
              <Typography component="p" variant="h6" sx={{ fontWeight: 'medium' }}>
                {item.title}
              </Typography>
              <Typography component="p" variant="h3" sx={{ fontWeight: 'bold' }}>
                {item.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {quickLinks.map((link) => (
            <Grid item xs={12} md={4} key={link.title}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea onClick={() => navigate(link.path)} sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  {link.icon}
                  <CardContent sx={{pt: 0}}>
                    <Typography gutterBottom variant="h6" component="div">
                      {link.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {link.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, Paper, CircularProgress, Alert, List, ListItem, ListItemText, Chip } from '@mui/material';
import { voiceApi } from '../services/api';

const VoiceProcessing: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Fetch supported languages
    const fetchLanguages = async () => {
      try {
        const response = await voiceApi.getSupportedLanguages();
        setLanguages(response.data.data.languages || []);
      } catch (err) {
        console.error('Error fetching supported languages:', err);
      }
    };

    fetchLanguages();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select an audio file to process');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await voiceApi.processVoice(file);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error processing audio file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Voice Processing
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Audio File
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <input
            accept="audio/*"
            style={{ display: 'none' }}
            id="voice-file-upload"
            type="file"
            onChange={handleFileChange}
            data-cy="voice-upload"
          />
          <label htmlFor="voice-file-upload">
            <Button variant="contained" component="span">
              Select Audio File
            </Button>
          </label>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected file: {file.name}
            </Typography>
          )}
        </Box>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleProcess}
          disabled={!file || loading}
          data-cy="process-audio"
        >
          {loading ? <CircularProgress size={24} /> : 'Process Audio'}
        </Button>
        
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      
      {result && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Transcript:</Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5' }} data-cy="transcript-result">
              {result.transcript}
            </Paper>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Confidence:</Typography>
            <Chip 
              label={`${Math.round((result.confidence || 0) * 100)}%`}
              color={(result.confidence || 0) > 0.8 ? "success" : (result.confidence || 0) > 0.6 ? "warning" : "error"}
              data-cy="confidence-score"
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Language:</Typography>
            <Chip 
              label={languages.find(l => l.code === result.language)?.name || result.language}
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Claim Type:</Typography>
            <Chip 
              label={result.claimType || 'Unknown'}
              color="primary"
              data-cy="claim-type"
            />
          </Box>
          
          <Box sx={{ mb: 2 }} data-cy="entities-section">
            <Typography variant="subtitle1">Extracted Entities:</Typography>
            {result.entities && Object.keys(result.entities).length > 0 ? (
              <List dense>
                {Object.entries(result.entities).map(([key, value]) => (
                  <ListItem key={key} disablePadding>
                    <ListItemText 
                      primary={`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`} 
                      secondary={value !== null && value !== undefined ? value.toString() : 'Not detected'} 
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No entities detected
              </Typography>
            )}
          </Box>
          
          {result.keywords && result.keywords.length > 0 && (
            <Box>
              <Typography variant="subtitle1">Keywords:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {result.keywords.map((keyword: string) => (
                  <Chip key={keyword} label={keyword} size="small" />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default VoiceProcessing;
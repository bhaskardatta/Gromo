import React, { useState, useEffect } from 'react';
import { voiceApi } from '../services/api';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider, // Added Divider
  TextField // Added TextField for file input styling
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
// import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // Remove ErrorOutlineIcon
import MicIcon from '@mui/icons-material/Mic';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import CategoryIcon from '@mui/icons-material/Category';
import LabelIcon from '@mui/icons-material/Label';
import { useTheme } from '@mui/material/styles'; // Added useTheme

interface VoiceResult {
  transcript: string;
  confidence: number;
  language: string;
  entities: Array<{ type: string; value: string }>;
  keywords: string[];
  claimType?: string;
}

const VoiceProcessing: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('en-IN'); // Default to English (India)
  const [supportedLanguages, setSupportedLanguages] = useState<Array<{ code: string; name: string }>>([]);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme(); // Initialize theme

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await voiceApi.getSupportedLanguages();
        setSupportedLanguages(response.data.languages || []);
      } catch (err) {
        console.error('Error fetching supported languages:', err);
        setError('Failed to load supported languages.');
      }
    };
    fetchLanguages();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setResult(null); // Clear previous results
      setError(null); // Clear previous errors
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select an audio file first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    // const formData = new FormData();
    // formData.append('audio', file);
    // formData.append('language', language);

    try {
      // Pass the file object directly, and handle language if necessary in the API service
      const response = await voiceApi.processVoice(file, language);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error processing voice file.');
      console.error('Error processing voice file:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <MicIcon sx={{ mr: 1, fontSize: '2rem', color: theme.palette.primary.main }} /> Voice Analysis & Transcription
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              value={language}
              label="Language"
              onChange={(e) => setLanguage(e.target.value as string)}
            >
              {supportedLanguages.length > 0 ? (
                supportedLanguages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="en-IN" disabled>Loading languages...</MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Button
            variant="contained"
            component="label"
            fullWidth
            startIcon={<CloudUploadIcon />}
            sx={{ py: 1.8, mt: { xs: 1, md: 2 } }} // Adjusted margin for consistency
          >
            {file ? file.name : 'Choose Audio File'}
            <input type="file" hidden onChange={handleFileChange} accept="audio/*" />
          </Button>
        </Grid>
      </Grid>

      <Button
        variant="contained"
        color="primary"
        onClick={handleProcess}
        disabled={!file || loading}
        fullWidth
        size="large"
        sx={{ mb: 3, py: 1.5 }}
        startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <CheckCircleOutlineIcon />}
      >
        {loading ? 'Processing...' : 'Process Audio'}
      </Button>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {result && (
        <Paper elevation={2} sx={{ p: 3, mt: 3, backgroundColor: theme.palette.background.default }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <SpeakerNotesIcon sx={{ mr: 1, color: theme.palette.secondary.main }} /> Processing Results
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Transcript:</Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflowY: 'auto', backgroundColor: theme.palette.grey[100] }}>
                <Typography variant="body1">{result.transcript}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle1"><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle1"><strong>Language:</strong> {supportedLanguages.find(l => l.code === result.language)?.name || result.language}</Typography>
            </Grid>
            {result.claimType && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle1"><strong>Claim Type:</strong> {result.claimType}</Typography>
              </Grid>
            )}

            {result.entities && result.entities.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <CategoryIcon sx={{ mr: 1 }} /> Extracted Entities:
                </Typography>
                <List dense sx={{ width: '100%' }}>
                  {result.entities.map((entity, index) => (
                    <ListItem key={index} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <ListItemIcon><Chip label={entity.type} color="secondary" size="small" /></ListItemIcon>
                      <ListItemText primary={entity.value} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            {result.keywords && result.keywords.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <LabelIcon sx={{ mr: 1 }} /> Keywords:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: '100%' }}>
                  {result.keywords.map((keyword, index) => (
                    <Chip key={index} label={keyword} variant="outlined" color="primary" />
                  ))}
                </Box>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Raw Extracted Text:</Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflowY: 'auto', backgroundColor: theme.palette.grey[100], whiteSpace: 'pre-wrap' }}>
                <Typography variant="body2">{result.transcript}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Paper>
  );
};

export default VoiceProcessing;
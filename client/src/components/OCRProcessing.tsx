import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, Paper, CircularProgress, 
  Alert, List, ListItem, ListItemText, Divider, Chip, Grid
} from '@mui/material';
import { ocrApi } from '../services/api';

interface DocumentType {
  type: string;
  name: string;
  expectedFields: string[];
}

interface OCRResult {
  documentType: string;
  confidence: number;
  extractedFields: Record<string, any>;
  rawText: string;
}

const OCRProcessing: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [typesLoading, setTypesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<OCRResult | null>(null);
  
  useEffect(() => {
    fetchDocumentTypes();
  }, []);
  
  const fetchDocumentTypes = async () => {
    try {
      const response = await ocrApi.getSupportedDocumentTypes();
      setDocumentTypes(response.data.data.documentTypes || []);
    } catch (err) {
      console.error('Error fetching document types:', err);
      setError('Failed to load supported document types');
    } finally {
      setTypesLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };
  
  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Please select a document to process');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await ocrApi.processDocument(selectedFile);
      setResult(response.data.data);
    } catch (err: any) {
      console.error('Error processing document:', err);
      setError(err.response?.data?.message || 'Error processing document');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        OCR Document Processing
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Supported Document Types
            </Typography>
            
            {typesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List dense>
                {documentTypes.map((docType) => (
                  <React.Fragment key={docType.type}>
                    <ListItem>
                      <ListItemText
                        primary={docType.name}
                        secondary={`Expected fields: ${docType.expectedFields.join(', ')}`}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Document
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <input
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                id="document-file-upload"
                type="file"
                onChange={handleFileChange}
                data-cy="document-upload"
              />
              <label htmlFor="document-file-upload">
                <Button variant="contained" component="span">
                  Select Document
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {selectedFile.name}
                </Typography>
              )}
            </Box>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleProcess}
              disabled={!selectedFile || loading}
              data-cy="process-document"
            >
              {loading ? <CircularProgress size={24} /> : 'Process Document'}
            </Button>
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            
            {result && (
              <Box sx={{ mt: 3 }} data-cy="ocr-results">
                <Typography variant="h6" gutterBottom>
                  Results
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">Document Type:</Typography>
                  <Chip 
                    label={documentTypes.find(dt => dt.type === result.documentType)?.name || result.documentType} 
                    color="primary"
                    data-cy="detected-document-type"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">Confidence:</Typography>
                  <Chip 
                    label={`${Math.round(result.confidence * 100)}%`}
                    color={result.confidence > 0.8 ? "success" : result.confidence > 0.6 ? "warning" : "error"}
                    data-cy="ocr-confidence"
                  />
                </Box>
                
                <Typography variant="subtitle1" gutterBottom>
                  Extracted Fields:
                </Typography>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }} data-cy="extracted-fields">
                  <List dense>
                    {Object.entries(result.extractedFields).map(([key, value]) => (
                      <ListItem key={key}>
                        <ListItemText
                          primary={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                          secondary={value?.toString() || 'Not detected'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
                
                <Typography variant="subtitle1" gutterBottom>
                  Raw Text:
                </Typography>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: 200, overflow: 'auto' }} data-cy="raw-text">
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {result.rawText}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OCRProcessing;
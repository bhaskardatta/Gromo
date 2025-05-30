import React, { useState, useEffect } from 'react';
import { ocrApi } from '../services/api';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  useTheme
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import DescriptionIcon from '@mui/icons-material/Description';
import DataObjectIcon from '@mui/icons-material/DataObject';

interface OCRResult {
  extractedText: string;
  confidence: number;
  fields: Array<{ fieldName: string; value: string; confidence: number }>;
  documentType: string;
}

interface DocumentType {
  type: string;
  name: string;
  expectedFields: string[];
}

const OCRProcessing: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [supportedDocTypes, setSupportedDocTypes] = useState<DocumentType[]>([]);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchDocTypes = async () => {
      try {
        const response = await ocrApi.getSupportedDocumentTypes();
        setSupportedDocTypes(response.data.documentTypes || []);
        if (response.data.documentTypes && response.data.documentTypes.length > 0) {
          setDocumentType(response.data.documentTypes[0].type); // Default to first type
        }
      } catch (err) {
        console.error('Error fetching supported document types:', err);
        setError('Failed to load supported document types.');
      }
    };
    fetchDocTypes();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a document file first.');
      return;
    }
    if (!documentType) {
      setError('Please select a document type.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    try {
      const response = await ocrApi.processDocument(formData);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error processing document.');
      console.error('Error processing document:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDocTypeDetails = supportedDocTypes.find(dt => dt.type === documentType);

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <FindInPageIcon sx={{ mr: 1, fontSize: '2rem', color: theme.palette.primary.main }} /> Document Analysis (OCR)
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { md: 'center' }, mb: 3 }}>
        <Box sx={{ flex: { md: '0 0 33%' } }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="doctype-select-label">Document Type</InputLabel>
            <Select
              labelId="doctype-select-label"
              value={documentType}
              label="Document Type"
              onChange={(e) => setDocumentType(e.target.value as string)}
            >
              {supportedDocTypes.length > 0 ? (
                supportedDocTypes.map((doc) => (
                  <MenuItem key={doc.type} value={doc.type}>
                    {doc.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>Loading document types...</MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ flex: { md: '1' } }}>
          <Button
            variant="contained"
            component="label"
            fullWidth
            startIcon={<CloudUploadIcon />}
            sx={{ py: 1.8, mt: { xs: 1, md: 2 } }}
          >
            {file ? file.name : 'Choose Document File'}
            <input type="file" hidden onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.tiff" />
          </Button>
        </Box>
        <Box sx={{ flex: { md: '0 0 25%' } }}>
            <Button
                variant="contained"
                color="primary"
                onClick={handleProcess}
                disabled={!file || !documentType || loading}
                fullWidth
                size="large"
                sx={{ py: 1.5, mt: { xs: 1, md: 2 } }}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <CheckCircleOutlineIcon />}
            >
                {loading ? 'Processing...' : 'Process Document'}
            </Button>
        </Box>
      </Box>

      {selectedDocTypeDetails && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderColor: theme.palette.primary.light }}>
          <Typography variant="subtitle1" gutterBottom>Expected fields for <strong>{selectedDocTypeDetails.name}</strong>:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedDocTypeDetails.expectedFields.map(field => (
              <Chip key={field} label={field} size="small" variant="outlined" />
            ))}
          </Box>
        </Paper>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {result && (
        <Paper elevation={2} sx={{ p: 3, mt: 3, backgroundColor: theme.palette.background.default }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <DescriptionIcon sx={{ mr: 1, color: theme.palette.secondary.main }} /> OCR Results
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1"><strong>Document Type:</strong> {result.documentType}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1"><strong>Overall Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</Typography>
            </Box>
          </Box>

            {result.fields && result.fields.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <DataObjectIcon sx={{ mr: 1 }} /> Extracted Fields:
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: theme.palette.grey[200]}}>
                      <TableRow>
                        <TableCell>Field Name</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell align="right">Confidence</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.fields.map((field, index) => (
                        <TableRow key={index}>
                          <TableCell>{field.fieldName}</TableCell>
                          <TableCell>{field.value}</TableCell>
                          <TableCell align="right">{(field.confidence * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Raw Extracted Text:</Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflowY: 'auto', backgroundColor: theme.palette.grey[100], whiteSpace: 'pre-wrap' }}>
                <Typography variant="body2">{result.extractedText}</Typography>
              </Paper>
            </Box>
        </Paper>
      )}
    </Paper>
  );
};

export default OCRProcessing;
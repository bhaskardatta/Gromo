import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Select, MenuItem, FormControl, 
  InputLabel, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormHelperText, CircularProgress, Alert
} from '@mui/material';
import { claimsApi } from '../services/api';

interface Claim {
  _id: string;
  claimNumber: string;
  policyNumber: string;
  claimType: string;
  description: string;
  amount: number;
  status: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

const ClaimsManagement: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // New claim form state
  const [openNewClaimDialog, setOpenNewClaimDialog] = useState<boolean>(false);
  const [newClaim, setNewClaim] = useState({
    claimType: '',
    policyNumber: '',
    description: '',
    amount: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  
  // Claim detail state
  const [openClaimDetail, setOpenClaimDetail] = useState<boolean>(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>('');
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  useEffect(() => {
    fetchClaims();
  }, []);
  
  const fetchClaims = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await claimsApi.getAllClaims();
      setClaims(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching claims');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as string);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const filteredClaims = claims
    .filter(claim => statusFilter ? claim.status === statusFilter : true)
    .filter(claim => 
      searchTerm ? 
        claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        claim.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) : 
        true
    );
  
  const handleNewClaimOpen = () => {
    setOpenNewClaimDialog(true);
  };
  
  const handleNewClaimClose = () => {
    setOpenNewClaimDialog(false);
    setNewClaim({
      claimType: '',
      policyNumber: '',
      description: '',
      amount: 0,
    });
    setFormErrors({});
  };
  
  const handleNewClaimChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setNewClaim({
      ...newClaim,
      [name as string]: value
    });
  };
  
  const validateClaimForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newClaim.claimType) {
      errors.claimType = 'Claim type is required';
    }
    
    if (!newClaim.policyNumber) {
      errors.policyNumber = 'Policy number is required';
    }
    
    if (!newClaim.description) {
      errors.description = 'Description is required';
    }
    
    if (!newClaim.amount || newClaim.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    return errors;
  };
  
  const handleNewClaimSubmit = async () => {
    const errors = validateClaimForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormSubmitting(true);
    setFormErrors({});
    
    try {
      await claimsApi.createClaim(newClaim);
      handleNewClaimClose();
      fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating claim');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const handleViewClaim = (claim: Claim) => {
    setSelectedClaim(claim);
    setStatusUpdate(claim.status);
    setOpenClaimDetail(true);
  };
  
  const handleClaimDetailClose = () => {
    setOpenClaimDetail(false);
    setSelectedClaim(null);
    setStatusUpdate('');
    setSettlementAmount(0);
    setRejectionReason('');
  };
  
  const handleStatusUpdateChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusUpdate(event.target.value as string);
  };
  
  const handleUpdateStatus = async () => {
    if (!selectedClaim) return;
    
    try {
      const updateData: any = { status: statusUpdate };
      
      if (statusUpdate === 'approved' && settlementAmount > 0) {
        updateData.settlementAmount = settlementAmount;
      }
      
      if (statusUpdate === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      await claimsApi.updateClaim(selectedClaim._id, updateData);
      handleClaimDetailClose();
      fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating claim');
    }
  };
  
  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} data-cy="claims-dashboard">
      <Typography variant="h4" gutterBottom>
        Claims Management
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField 
            label="Search Claims" 
            variant="outlined" 
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            data-cy="claim-search"
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={handleStatusFilterChange as any}
              label="Status"
              data-cy="status-filter"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleNewClaimOpen}
          data-cy="new-claim-button"
        >
          New Claim
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table aria-label="claims table" data-cy="claims-table">
              <TableHead>
                <TableRow>
                  <TableCell>Claim #</TableCell>
                  <TableCell>Policy #</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClaims.length > 0 ? (
                  filteredClaims.map((claim) => (
                    <TableRow key={claim._id} data-cy="claim-row">
                      <TableCell>{claim.claimNumber}</TableCell>
                      <TableCell>{claim.policyNumber}</TableCell>
                      <TableCell>{claim.claimType}</TableCell>
                      <TableCell>${claim.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={claim.status} 
                          color={getStatusChipColor(claim.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(claim.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          onClick={() => handleViewClaim(claim)}
                          data-cy="view-claim"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No claims found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>
      
      {/* New Claim Dialog */}
      <Dialog 
        open={openNewClaimDialog} 
        onClose={handleNewClaimClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create New Claim</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }} data-cy="claim-form">
            <FormControl 
              fullWidth 
              margin="normal"
              error={!!formErrors.claimType}
            >
              <InputLabel id="claim-type-label">Claim Type</InputLabel>
              <Select
                labelId="claim-type-label"
                name="claimType"
                value={newClaim.claimType}
                onChange={handleNewClaimChange as any}
                label="Claim Type"
                data-cy="claim-type-input"
              >
                <MenuItem value="medical">Medical</MenuItem>
                <MenuItem value="vehicle">Vehicle</MenuItem>
                <MenuItem value="property">Property</MenuItem>
                <MenuItem value="life">Life</MenuItem>
                <MenuItem value="travel">Travel</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
              {formErrors.claimType && (
                <FormHelperText>{formErrors.claimType}</FormHelperText>
              )}
            </FormControl>
            
            <TextField
              margin="normal"
              fullWidth
              name="policyNumber"
              label="Policy Number"
              value={newClaim.policyNumber}
              onChange={handleNewClaimChange}
              error={!!formErrors.policyNumber}
              helperText={formErrors.policyNumber}
              data-cy="policy-number-input"
            />
            
            <TextField
              margin="normal"
              fullWidth
              name="description"
              label="Description"
              multiline
              rows={4}
              value={newClaim.description}
              onChange={handleNewClaimChange}
              error={!!formErrors.description}
              helperText={formErrors.description}
              data-cy="claim-description-input"
            />
            
            <TextField
              margin="normal"
              fullWidth
              name="amount"
              label="Amount"
              type="number"
              value={newClaim.amount}
              onChange={handleNewClaimChange}
              error={!!formErrors.amount}
              helperText={formErrors.amount}
              data-cy="claim-amount-input"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewClaimClose}>Cancel</Button>
          <Button 
            onClick={handleNewClaimSubmit}
            disabled={formSubmitting}
            data-cy="submit-claim"
          >
            {formSubmitting ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Claim Detail Dialog */}
      <Dialog
        open={openClaimDetail}
        onClose={handleClaimDetailClose}
        fullWidth
        maxWidth="sm"
      >
        {selectedClaim && (
          <>
            <DialogTitle>
              Claim Details: <span data-cy="claim-number">{selectedClaim.claimNumber}</span>
            </DialogTitle>
            <DialogContent dividers data-cy="claim-details">
              <Typography variant="subtitle1" gutterBottom>
                Policy: {selectedClaim.policyNumber}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Type: {selectedClaim.claimType}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Amount: ${selectedClaim.amount.toLocaleString()}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Status: <Chip 
                  label={selectedClaim.status}
                  color={getStatusChipColor(selectedClaim.status) as any}
                  data-cy="claim-status"
                />
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Date: {new Date(selectedClaim.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Description: {selectedClaim.description}
              </Typography>
              
              <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
                <Typography variant="h6" gutterBottom>
                  Update Status
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-update-label">Status</InputLabel>
                  <Select
                    labelId="status-update-label"
                    value={statusUpdate}
                    onChange={handleStatusUpdateChange as any}
                    label="Status"
                    data-cy="status-update"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
                
                {statusUpdate === 'approved' && (
                  <Box sx={{ mt: 2 }} data-cy="approval-section">
                    <TextField
                      fullWidth
                      label="Settlement Amount"
                      type="number"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(Number(e.target.value))}
                      data-cy="settlement-amount"
                    />
                  </Box>
                )}
                
                {statusUpdate === 'rejected' && (
                  <Box sx={{ mt: 2 }} data-cy="rejection-section">
                    <TextField
                      fullWidth
                      label="Rejection Reason"
                      multiline
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      data-cy="rejection-reason"
                    />
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClaimDetailClose}>Cancel</Button>
              <Button 
                onClick={handleUpdateStatus} 
                variant="contained"
                data-cy="update-status-button"
              >
                Update
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default ClaimsManagement;
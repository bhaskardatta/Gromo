import React, { useState, useEffect, useMemo } from 'react';
import { claimsApi } from '../services/api';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Grid,
  Chip,
  Tooltip, // Added Tooltip
  Stack, // Added Stack for filter layout
  List, // Added List
  ListItem, // Added ListItem
  ListItemText // Added ListItemText
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme } from '@mui/material/styles';

interface Claim {
  _id: string;
  claimNumber: string;
  policyNumber: string;
  type: string;
  amount: number;
  status: string;
  dateFiled: string;
  description?: string;
  evidence?: string[]; // Array of file URLs or identifiers
}

const claimStatuses = ['pending', 'approved', 'rejected', 'investigating', 'closed'];
const claimTypes = ['auto', 'home', 'health', 'life', 'travel', 'other'];

type Order = 'asc' | 'desc';

const ClaimsManagement: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [openNewDialog, setOpenNewDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openViewDialog, setOpenViewDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  const [currentClaim, setCurrentClaim] = useState<Partial<Claim> | null>(null);
  const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const [orderBy, setOrderBy] = useState<keyof Claim>('dateFiled');
  const [order, setOrder] = useState<Order>('desc');

  const theme = useTheme();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const response = await claimsApi.getAllClaims();
      setClaims(response.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch claims.');
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (property: keyof Claim) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredClaims = useMemo(() => {
    let sortedClaims = [...claims].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === 'asc' ? -1 : 1;
      if (bVal == null) return order === 'asc' ? 1 : -1;
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });

    if (searchTerm) {
      sortedClaims = sortedClaims.filter(claim =>
        (claim.claimNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (claim.policyNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      sortedClaims = sortedClaims.filter(claim => claim.status === statusFilter);
    }
    if (typeFilter) {
      sortedClaims = sortedClaims.filter(claim => claim.type === typeFilter);
    }
    return sortedClaims;
  }, [claims, searchTerm, statusFilter, typeFilter, orderBy, order]);

  const handleOpenNewDialog = () => {
    setCurrentClaim({ status: 'pending', type: 'auto', dateFiled: new Date().toISOString().split('T')[0] });
    setOpenNewDialog(true);
  };

  const handleOpenEditDialog = (claim: Claim) => {
    setCurrentClaim({ ...claim, dateFiled: new Date(claim.dateFiled).toISOString().split('T')[0] });
    setOpenEditDialog(true);
  };

  const handleOpenViewDialog = (claim: Claim) => {
    setCurrentClaim(claim);
    setOpenViewDialog(true);
  };

  const handleOpenDeleteDialog = (claim: Claim) => {
    setClaimToDelete(claim);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialogs = () => {
    setOpenNewDialog(false);
    setOpenEditDialog(false);
    setOpenViewDialog(false);
    setOpenDeleteDialog(false);
    setCurrentClaim(null);
    setClaimToDelete(null);
  };

  const handleSaveClaim = async () => {
    if (!currentClaim) return;
    setLoading(true);
    try {
      if (currentClaim._id) {
        await claimsApi.updateClaim(currentClaim._id, currentClaim as Claim);
      } else {
        await claimsApi.createClaim(currentClaim as Omit<Claim, '_id'>);
      }
      fetchClaims();
      handleCloseDialogs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save claim.');
      console.error('Error saving claim:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClaim = async () => {
    if (!claimToDelete) return;
    setLoading(true);
    try {
      await claimsApi.deleteClaim(claimToDelete._id);
      fetchClaims();
      handleCloseDialogs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete claim.');
      console.error('Error deleting claim:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (currentClaim && name) {
      setCurrentClaim({ ...currentClaim, [name]: value });
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'investigating': return 'info';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const headCells: { id: keyof Claim; label: string; numeric: boolean }[] = [
    { id: 'claimNumber', label: 'Claim #', numeric: false },
    { id: 'policyNumber', label: 'Policy #', numeric: false },
    { id: 'type', label: 'Type', numeric: false },
    { id: 'amount', label: 'Amount', numeric: true },
    { id: 'status', label: 'Status', numeric: false },
    { id: 'dateFiled', label: 'Date Filed', numeric: false },
    // { id: 'description', label: 'Description', numeric: false }, // Too long for table view
  ];

  const renderClaimDialogFields = () => (
    <Grid container spacing={2} sx={{pt: 1}}>
      <Grid item xs={12} sm={6}>
        <TextField
          margin="dense"
          name="claimNumber"
          label="Claim Number"
          type="text"
          fullWidth
          variant="outlined"
          value={currentClaim?.claimNumber || ''}
          onChange={handleInputChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          margin="dense"
          name="policyNumber"
          label="Policy Number"
          type="text"
          fullWidth
          variant="outlined"
          value={currentClaim?.policyNumber || ''}
          onChange={handleInputChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth margin="dense" variant="outlined" required>
          <InputLabel>Type</InputLabel>
          <Select
            name="type"
            value={currentClaim?.type || ''}
            onChange={handleInputChange as any} // MUI Select onChange type issue
            label="Type"
          >
            {claimTypes.map(type => <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          margin="dense"
          name="amount"
          label="Amount"
          type="number"
          fullWidth
          variant="outlined"
          value={currentClaim?.amount || ''}
          onChange={handleInputChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth margin="dense" variant="outlined" required>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={currentClaim?.status || ''}
            onChange={handleInputChange as any}
            label="Status"
          >
            {claimStatuses.map(status => <MenuItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          margin="dense"
          name="dateFiled"
          label="Date Filed"
          type="date"
          fullWidth
          variant="outlined"
          value={currentClaim?.dateFiled || ''}
          onChange={handleInputChange}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          margin="dense"
          name="description"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={currentClaim?.description || ''}
          onChange={handleInputChange}
        />
      </Grid>
      {/* TODO: Add evidence file upload functionality */}
    </Grid>
  );

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', mb:0 }}>
          <FilterListIcon sx={{ mr: 1, fontSize: '2rem', color: theme.palette.primary.main }} /> Claims Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenNewDialog}
        >
          New Claim
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[50] }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Claims (Claim #, Policy #)"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as string)}
                label="Status"
              >
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                {claimStatuses.map(status => <MenuItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as string)}
                label="Type"
              >
                <MenuItem value=""><em>All Types</em></MenuItem>
                {claimTypes.map(type => <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
           <Grid item xs={12} md={2} sx={{textAlign: {xs: 'left', md: 'right'}}}>
            <Button variant="outlined" onClick={() => { setSearchTerm(''); setStatusFilter(''); setTypeFilter(''); }} fullWidth>
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && !claims.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
            <TableHead sx={{ backgroundColor: theme.palette.grey[200]}}>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleSort(headCell.id)}
                    >
                      {headCell.label}
                      {orderBy === headCell.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow hover key={claim._id}>
                  <TableCell>{claim.claimNumber}</TableCell>
                  <TableCell>{claim.policyNumber}</TableCell>
                  <TableCell>{claim.type.charAt(0).toUpperCase() + claim.type.slice(1)}</TableCell>
                  <TableCell align="right">${claim.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={claim.status.charAt(0).toUpperCase() + claim.status.slice(1)} color={getStatusChipColor(claim.status)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(claim.dateFiled).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Claim">
                      <IconButton size="small" onClick={() => handleOpenViewDialog(claim)} color="info"><VisibilityIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Claim">
                      <IconButton size="small" onClick={() => handleOpenEditDialog(claim)} color="primary"><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Claim">
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(claim)} color="error"><DeleteIcon /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClaims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center">
                    No claims found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* New/Edit Claim Dialog */}
      <Dialog open={openNewDialog || openEditDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
        <DialogTitle>{currentClaim?._id ? 'Edit Claim' : 'Create New Claim'}</DialogTitle>
        <DialogContent>
          {/* <DialogContentText sx={{mb:1}}>Please fill in the claim details below.</DialogContentText> */}
          {renderClaimDialogFields()}
        </DialogContent>
        <DialogActions sx={{p: '16px 24px'}}>
          <Button onClick={handleCloseDialogs} color="inherit">Cancel</Button>
          <Button onClick={handleSaveClaim} variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (currentClaim?._id ? 'Save Changes' : 'Create Claim')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Claim Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Claim Details - {currentClaim?.claimNumber}</DialogTitle>
        <DialogContent dividers>
          {currentClaim && (
            <List dense>
              <ListItem><ListItemText primary="Claim Number:" secondary={currentClaim.claimNumber} /></ListItem>
              <ListItem><ListItemText primary="Policy Number:" secondary={currentClaim.policyNumber} /></ListItem>
              <ListItem><ListItemText primary="Type:" secondary={currentClaim.type ? currentClaim.type.charAt(0).toUpperCase() + currentClaim.type.slice(1) : 'N/A'} /></ListItem>
              <ListItem><ListItemText primary="Amount:" secondary={`$${currentClaim.amount?.toFixed(2)}`} /></ListItem>
              <ListItem><ListItemText primary="Status:" secondary={<Chip label={currentClaim.status ? currentClaim.status.charAt(0).toUpperCase() + currentClaim.status.slice(1) : 'N/A'} color={getStatusChipColor(currentClaim.status || '')} size="small" />} /></ListItem>
              <ListItem><ListItemText primary="Date Filed:" secondary={new Date(currentClaim.dateFiled || '').toLocaleDateString()} /></ListItem>
              <ListItem><ListItemText primary="Description:" secondary={currentClaim.description || 'N/A'} sx={{ '& .MuiListItemText-secondary': { whiteSpace: 'pre-wrap'}}} /></ListItem>
              {/* TODO: Display evidence files */}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{p: '16px 24px'}}>
          <Button onClick={handleCloseDialogs} color="primary" variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Claim Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialogs} maxWidth="xs">
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete claim <strong>{claimToDelete?.claimNumber}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{p: '16px 24px'}}>
          <Button onClick={handleCloseDialogs} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteClaim} variant="contained" color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// Helper for TableSortLabel accessibility
const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  top: 20,
  width: 1,
};

export default ClaimsManagement;
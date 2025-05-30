import React, { useState } from 'react';
import { authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
  Avatar,
  CssBaseline,
  Grid
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTheme } from '@mui/material/styles';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authApi.login(email, password);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        navigate('/dashboard');
      } else {
        setError('Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <CssBaseline />
      <Paper elevation={3} sx={{ padding: theme.spacing(4), display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: theme.shape.borderRadius * 2 }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Sign in to Gromo
        </Typography>

        {error && <Alert severity="error" sx={{ width: '100%', mt: 1, mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-cy="login-email"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-cy="login-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            data-cy="login-submit"
          >
            Sign In
          </Button>
        </Box>
      </Paper>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 5 }}>
        {'© '}
        Gromo {new Date().getFullYear()}.
      </Typography>
    </Container>
  );
};

export default Login;
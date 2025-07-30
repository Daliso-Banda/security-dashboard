import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Button,
    Divider,
    Stack,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
} from '@mui/material';

const PRIVILEGE_OPTIONS = ['User', 'Admin', 'Moderator']; // example roles

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit form state
    const [userPrivilege, setUserPrivilege] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        axios
            .get('http://localhost:3000/api/registered-users')
            .then((res) => {
                if (res.data.users) setUsers(res.data.users);
            })
            .catch((err) => {
                console.error('Error fetching users:', err);
                showSnackbar('Failed to load users', 'error');
            })
            .finally(() => setLoading(false));
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setUserPrivilege(user.privilege || 'User'); // default if no privilege field
    };

    const handleBack = () => {
        setSelectedUser(null);
    };

    const handlePrivilegeChange = (event) => {
        setUserPrivilege(event.target.value);
    };

    const handleSave = () => {
        if (!selectedUser) return;
        setIsSaving(true);

        axios
            .patch(`http://localhost:3000/api/registered-users/${selectedUser._id}`, {
                privilege: userPrivilege,
            })
            .then(() => {
                showSnackbar('User updated successfully', 'success');
                fetchUsers();
                setSelectedUser(null);
            })
            .catch((err) => {
                console.error('Error updating user:', err);
                showSnackbar('Failed to update user', 'error');
            })
            .finally(() => setIsSaving(false));
    };

    const handleDelete = () => {
        if (!selectedUser) return;
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedUser) return;
        setDeleteDialogOpen(false);

        axios
            .delete(`http://localhost:3000/api/registered-users/${selectedUser._id}`)
            .then(() => {
                showSnackbar('User deleted successfully', 'success');
                fetchUsers();
                setSelectedUser(null);
            })
            .catch((err) => {
                console.error('Error deleting user:', err);
                showSnackbar('Failed to delete user', 'error');
            });
    };

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ p: 4, maxWidth: 900, mx: 'auto', minHeight: '80vh', bgcolor: '#f9fafb' }}>
            <Typography variant="h4" fontWeight="bold" mb={4} align="center">
                Registered Users
            </Typography>

            {loading && (
                <Box display="flex" justifyContent="center" mt={6}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && !selectedUser && (
                <Paper elevation={3} sx={{ p: 2 }}>
                    <List>
                        {users.length === 0 && (
                            <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                                No registered users found.
                            </Typography>
                        )}
                        {users.map((user) => (
                            <React.Fragment key={user._id || user.name + user.timestamp}>
                                <ListItemButton onClick={() => handleUserClick(user)} sx={{ py: 1.5 }}>
                                    <ListItemAvatar>
                                        <Avatar src={user.image_url} alt={user.name} sx={{ width: 56, height: 56 }} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                {user.name}
                                            </Typography>
                                        }
                                        secondary={new Date(user.timestamp).toLocaleString()}
                                    />
                                </ListItemButton>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}

            {selectedUser && (
                <Paper elevation={4} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                    <Stack spacing={3} alignItems="center">
                        <Avatar
                            src={selectedUser.image_url}
                            alt={selectedUser.name}
                            sx={{ width: 140, height: 140, boxShadow: 3 }}
                        />
                        <Typography variant="h5" fontWeight="bold">
                            {selectedUser.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Registered on: {new Date(selectedUser.timestamp).toLocaleString()}
                        </Typography>

                        {/* Privilege selector */}
                        <FormControl fullWidth>
                            <InputLabel id="privilege-select-label">User Privilege</InputLabel>
                            <Select
                                labelId="privilege-select-label"
                                value={userPrivilege}
                                label="User Privilege"
                                onChange={handlePrivilegeChange}
                            >
                                {PRIVILEGE_OPTIONS.map((opt) => (
                                    <MenuItem key={opt} value={opt}>
                                        {opt}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Stack direction="row" spacing={2} mt={2}>
                            <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant="outlined" color="error" onClick={handleDelete}>
                                Delete User
                            </Button>
                            <Button variant="text" onClick={handleBack}>
                                Cancel
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            )}

            {/* Delete confirmation dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete user <strong>{selectedUser?.name}</strong>? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button color="error" onClick={confirmDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

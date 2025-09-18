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
    Chip,
    Zoom,
} from '@mui/material';

const PRIVILEGE_OPTIONS = ['User', 'Admin', 'Moderator'];
const PRIVILEGE_COLORS = {
    User: 'default',
    Admin: 'error',
    Moderator: 'primary',
};

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userPrivilege, setUserPrivilege] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        axios
            .get('http://10.24.91.149:5175/api/registered-users')
            .then((res) => {
                if (res.data.users) setUsers(res.data.users);
            })
            .catch(() => {
                showSnackbar('Failed to load users', 'error');
            })
            .finally(() => setLoading(false));
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setUserPrivilege(user.privilege || 'User');
    };

    const handlePrivilegeChange = (e) => setUserPrivilege(e.target.value);

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
            .catch(() => showSnackbar('Failed to update user', 'error'))
            .finally(() => setIsSaving(false));
    };

    const handleDelete = () => setDeleteDialogOpen(true);

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
            .catch(() => showSnackbar('Failed to delete user', 'error'));
    };

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto', minHeight: '90vh', bgcolor: '#f9fafc' }}>
            <Typography
                variant="h4"
                fontWeight="bold"
                mb={4}
                align="center"
                sx={{ letterSpacing: 1, color: '#222' }}
            >
                Registered Users
            </Typography>

            {loading && (
                <Box display="flex" justifyContent="center" mt={6}>
                    <CircularProgress color="primary" size={36} />
                </Box>
            )}

            {!loading && (
                <Paper
                    elevation={3}
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        bgcolor: '#fff',
                        boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)',
                    }}
                >
                    <List>
                        {users.length === 0 ? (
                            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                                No registered users found.
                            </Typography>
                        ) : (
                            users.map((user) => (
                                <React.Fragment key={user._id || user.name + user.timestamp}>
                                    <ListItemButton
                                        onClick={() => handleUserClick(user)}
                                        sx={{
                                            mb: 1,
                                            py: 1.5,
                                            borderRadius: 3,
                                            bgcolor: '#fafafa',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)',
                                            '&:hover': {
                                                bgcolor: '#f0f4f8',
                                                boxShadow: '0 4px 12px rgb(0 0 0 / 0.12)',
                                                transform: 'translateY(-2px)',
                                            },
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={user.image_url}
                                                alt={user.name}
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    border: '2px solid #ddd',
                                                    boxShadow: '0 0 8px rgba(0,0,0,0.1)',
                                                    mr: 3,
                                                }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    spacing={2}
                                                >
                                                    <Typography
                                                        variant="subtitle1"
                                                        fontWeight={700}
                                                        noWrap
                                                        sx={{ maxWidth: 240 }}
                                                        color="#1a1a1a"
                                                    >
                                                        {user.name}
                                                    </Typography>
                                                    <Chip
                                                        label={user.privilege || 'User'}
                                                        size="small"
                                                        color={PRIVILEGE_COLORS[user.privilege] || 'default'}
                                                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                                                    />
                                                </Stack>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                                                    Registered: {new Date(user.timestamp).toLocaleString()}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                    <Divider sx={{ my: 0.5 }} />
                                </React.Fragment>
                            ))
                        )}
                    </List>
                </Paper>
            )}

            {/* Profile Popup */}
            <Dialog
                open={Boolean(selectedUser)}
                onClose={() => setSelectedUser(null)}
                maxWidth="sm"
                fullWidth
                TransitionComponent={Zoom}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    },
                }}
            >
                {selectedUser && (
                    <>
                        {/* Header Banner */}
                        <Box
                            sx={{
                                height: 120,
                                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                                position: 'relative',
                            }}
                        >
                            <Avatar
                                src={selectedUser.image_url}
                                alt={selectedUser.name}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    border: '4px solid white',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    position: 'absolute',
                                    left: '50%',
                                    bottom: -60,
                                    transform: 'translateX(-50%)',
                                    transition: 'transform 0.3s ease',
                                    '&:hover': { transform: 'translateX(-50%) scale(1.05)' },
                                }}
                            />
                        </Box>

                        <DialogContent sx={{ pt: 8, textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                {selectedUser.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Registered on: {new Date(selectedUser.timestamp).toLocaleString()}
                            </Typography>

                            <Divider sx={{ my: 3 }} />

                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel id="privilege-select-label">User Privilege</InputLabel>
                                <Select
                                    labelId="privilege-select-label"
                                    value={userPrivilege}
                                    label="User Privilege"
                                    onChange={handlePrivilegeChange}
                                    sx={{ fontWeight: 600, borderRadius: 2 }}
                                >
                                    {PRIVILEGE_OPTIONS.map((opt) => (
                                        <MenuItem key={opt} value={opt}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </DialogContent>

                        <DialogActions sx={{ justifyContent: 'space-evenly', pb: 3, px: 4 }}>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={isSaving}
                                sx={{ borderRadius: 2, px: 3 }}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleDelete}
                                sx={{ borderRadius: 2, px: 3 }}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="text"
                                onClick={() => setSelectedUser(null)}
                                sx={{ borderRadius: 2, px: 3 }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    Confirm Deletion
                </DialogTitle>
                <DialogContent dividers>
                    Are you sure you want to delete user <strong>{selectedUser?.name}</strong>? This
                    action is permanent and cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar Notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        fontWeight: 500,
                        boxShadow: 2,
                        borderRadius: 2,
                        letterSpacing: 0.3,
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

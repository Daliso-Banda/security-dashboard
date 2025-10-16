import React, { useEffect, useState } from 'react';
const serverIP = import.meta.env.VITE_SERVER_IP;
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
    TextField,
} from '@mui/material';

const PRIVILEGE_OPTIONS = ['User', 'Admin', 'Moderator'];

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userPrivilege, setUserPrivilege] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => fetchUsers(), []);
    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        setFilteredUsers(users.filter(u => u.name.toLowerCase().includes(lowerQuery)));
    }, [searchQuery, users]);

    const fetchUsers = () => {
        setLoading(true);
        axios.get(`http://${serverIP}:3000/api/Users`)
            .then(res => {
                const fetchedUsers = res.data.users || [];
                setUsers(fetchedUsers);
                setFilteredUsers(fetchedUsers);
            })
            .catch(() => showSnackbar('Failed to load users', 'error'))
            .finally(() => setLoading(false));
    };

    const handleUserClick = user => {
        setSelectedUser(user);
        setUserPrivilege(user.privilege || 'User');
    };

    const handlePrivilegeChange = e => setUserPrivilege(e.target.value);

    const handleSave = () => {
        if (!selectedUser) return;
        setIsSaving(true);
        axios.patch(`http://${serverIP}:3000/api/Users/${selectedUser._id}`, { privilege: userPrivilege })
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
        axios.delete(`http://${serverIP}:3000/api/Users/${selectedUser._id}`)
            .then(() => {
                showSnackbar('User deleted successfully', 'success');
                fetchUsers();
                setSelectedUser(null);
            })
            .catch(() => showSnackbar('Failed to delete user', 'error'));
    };

    const showSnackbar = (message, severity = 'info') => setSnackbar({ open: true, message, severity });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    return (
        <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto', minHeight: '90vh', bgcolor: 'background.default' }}>
            <Typography variant="h4" fontWeight="800" mb={4} align="center" sx={{ letterSpacing: 1 }}>
                Registered Users
            </Typography>

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                <TextField
                    placeholder="Search users..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                        width: '60%',
                        maxWidth: 450,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    }}
                />
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" mt={6}>
                    <CircularProgress color="primary" size={36} />
                </Box>
            ) : (
                <Paper elevation={6} sx={{ p: 3, borderRadius: 3 }}>
                    <List>
                        {filteredUsers.length === 0 ? (
                            <Typography align="center" color="text.secondary" sx={{ py: 6 }}>No users found.</Typography>
                        ) : filteredUsers.map(user => (
                            <React.Fragment key={user._id || user.name + user.timestamp}>
                                <ListItemButton
                                    onClick={() => handleUserClick(user)}
                                    sx={{
                                        mb: 2, py: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)',
                                        transition: 'all 0.3s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                                        '&:hover': { bgcolor: 'rgba(144,202,249,0.10)', boxShadow: '0 6px 22px rgba(0,0,0,0.6)' },
                                        display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            src={user.image_url}
                                            alt={user.name}
                                            sx={{
                                                width: 60, height: 60, mr: 3,
                                                borderRadius: '50%',
                                                border: '2px solid rgba(255,255,255,0.06)',
                                                boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
                                                backgroundImage: user.image_url ? 'none' : 'linear-gradient(135deg, #0f1524, #121826)',
                                                color: '#e6e9ef',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {!user.image_url && user.name[0]}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                                                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: 240 }}>{user.name}</Typography>
                                                <Chip
                                                    label={user.privilege || 'User'}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 600, textTransform: 'capitalize',
                                                        bgcolor: user.privilege === 'Admin'
                                                            ? 'rgba(229, 115, 115, 0.2)'
                                                            : user.privilege === 'Moderator'
                                                                ? 'rgba(144, 202, 249, 0.2)'
                                                                : 'rgba(255,255,255,0.08)',
                                                        color: '#e6e9ef',
                                                    }}
                                                />
                                            </Stack>
                                        }
                                        secondary={<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Registered: {new Date(user.timestamp).toLocaleString()}
                                        </Typography>}
                                    />
                                </ListItemButton>
                                <Divider sx={{ my: 0.5 }} />
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}

            <Dialog
                open={Boolean(selectedUser)}
                onClose={() => setSelectedUser(null)}
                maxWidth="sm"
                fullWidth
                TransitionComponent={Zoom}
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                {selectedUser && (
                    <>
                        <Box sx={{ height: 140, background: 'linear-gradient(135deg, #0f1524, #121826)', position: 'relative', mb: 10 }}>
                            <Avatar
                                src={selectedUser.image_url || undefined}
                                alt={selectedUser.name}
                                sx={{
                                    width: 120, height: 120, border: '4px solid rgba(255,255,255,0.12)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                                    position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)',
                                    bgcolor: '#0f1524', fontSize: 48, objectFit: 'cover',
                                    color: '#e6e9ef', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                {!selectedUser.image_url && selectedUser.name[0]}
                            </Avatar>
                        </Box>

                        <DialogContent sx={{ pt: 6, textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight="800" gutterBottom>{selectedUser.name}</Typography>
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
                                    sx={{ fontWeight: 600, borderRadius: 2, '& .MuiSelect-select': { py: 1.5 } }}
                                >
                                    {PRIVILEGE_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </DialogContent>

                        <DialogActions sx={{ justifyContent: 'space-between', pb: 3, px: 4 }}>
                            <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ borderRadius: 2, px: 4 }}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant="outlined" color="error" onClick={handleDelete} sx={{ borderRadius: 2, px: 4 }}>Delete</Button>
                            <Button variant="text" onClick={() => setSelectedUser(null)} sx={{ borderRadius: 2, px: 4 }}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Confirm Deletion</DialogTitle>
                <DialogContent dividers>
                    Are you sure you want to delete user <strong>{selectedUser?.name}</strong>? This action is permanent and cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', fontWeight: 500 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

import { useState, useEffect } from 'react';
import type { Package, UserSubscription } from '../../types/package';
import { toast } from 'sonner';
import { profileRepository } from '@/server/repositories/profileRepository';
import { adminPackageRepository } from '@/server/repositories/adminPackageRepository';
import { adminSubscriptionRepository } from '@/server/repositories/adminSubscriptionRepository';
import {
    applyPackageDefaults,
    attachUsersToSubscriptions,
    toSubscriptionMutationInput,
    toSubscriptionUserOptions,
    type SubscriptionFormData,
    type SubscriptionUserOption
} from '@/features/admin/model/subscriptionManagementUseCases';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    CircularProgress,
    Autocomplete,
} from '@mui/material';
import { Edit, Add, CheckCircle, Cancel, AccessTime, Pending } from '@mui/icons-material';

const statusLabels = {
    pending: { label: 'Beklemede', color: 'warning' as const, icon: Pending },
    active: { label: 'Aktif', color: 'success' as const, icon: CheckCircle },
    expired: { label: 'Süresi Dolmuş', color: 'default' as const, icon: AccessTime },
    cancelled: { label: 'İptal', color: 'error' as const, icon: Cancel },
};

export default function SubscriptionManagement() {
    const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [users, setUsers] = useState<SubscriptionUserOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<UserSubscription | null>(null);
    const [formData, setFormData] = useState<SubscriptionFormData>({
        user_id: '',
        package_id: '',
        status: 'pending' as UserSubscription['status'],
        credits_remaining: 0,
        xp_remaining: 0,
        expires_at: '',
        payment_reference: '',
        notes: '',
    });
    const [selectedUser, setSelectedUser] = useState<SubscriptionUserOption | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subs, pkgs, recipientRows] = await Promise.all([
                adminSubscriptionRepository.listSubscriptionsWithPackages(),
                adminPackageRepository.listActivePackages(),
                profileRepository.listMessageRecipients()
            ]);

            const userOptions = toSubscriptionUserOptions(recipientRows);

            setSubscriptions(attachUsersToSubscriptions(subs, userOptions));
            setPackages(pkgs);
            setUsers(userOptions);
        } catch (error) {
            console.error('Veri yüklenirken hata:', error);
            toast.error('Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (sub?: UserSubscription) => {
        if (sub) {
            setEditingSub(sub);
            setSelectedUser(sub.user ? {
                id: sub.user.id,
                name: sub.user.name,
                email: sub.user.email
            } : null);
            setFormData({
                user_id: sub.user_id,
                package_id: sub.package_id,
                status: sub.status,
                credits_remaining: sub.credits_remaining || 0,
                xp_remaining: sub.xp_remaining || 0,
                expires_at: sub.expires_at ? sub.expires_at.split('T')[0] : '',
                payment_reference: sub.payment_reference || '',
                notes: sub.notes || '',
            });
        } else {
            setEditingSub(null);
            setSelectedUser(null);
            setFormData({
                user_id: '',
                package_id: '',
                status: 'pending',
                credits_remaining: 0,
                xp_remaining: 0,
                expires_at: '',
                payment_reference: '',
                notes: '',
            });
        }
        setDialogOpen(true);
    };

    const handlePackageChange = (packageId: string) => {
        const pkg = packages.find(p => p.id === packageId);
        if (!pkg) return;
        setFormData((prev) => applyPackageDefaults(packageId, packages, prev));
    };

    const handleSave = async () => {
        try {
            const subData = toSubscriptionMutationInput(formData);

            if (editingSub) {
                await adminSubscriptionRepository.updateSubscription(editingSub.id, subData);
                toast.success('Abonelik güncellendi');
            } else {
                await adminSubscriptionRepository.createSubscription(subData);
                toast.success('Abonelik oluşturuldu');
            }

            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            toast.error('İşlem başarısız');
        }
    };

    const activateSubscription = async (sub: UserSubscription) => {
        try {
            await adminSubscriptionRepository.activateSubscription(sub.id, new Date().toISOString());
            toast.success('Abonelik aktif edildi');
            fetchData();
        } catch {
            toast.error('Aktivasyon başarısız');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                    👥 Abonelik Yönetimi
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Yeni Abonelik
                </Button>
            </Box>

            <Paper sx={{ overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell>Kullanıcı</TableCell>
                            <TableCell>Paket</TableCell>
                            <TableCell align="center">Durum</TableCell>
                            <TableCell align="center">Kalan</TableCell>
                            <TableCell>Bitiş Tarihi</TableCell>
                            <TableCell align="center">İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subscriptions.map((sub) => {
                            const status = statusLabels[sub.status];
                            const StatusIcon = status.icon;
                            return (
                                <TableRow key={sub.id} hover>
                                    <TableCell>
                                        <Typography fontWeight="medium">{sub.user?.name || '-'}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {sub.user?.email}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography>{sub.package?.name || '-'}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            icon={<StatusIcon fontSize="small" />}
                                            label={status.label}
                                            size="small"
                                            color={status.color}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {sub.credits_remaining !== null && `${sub.credits_remaining} kredi`}
                                        {sub.xp_remaining !== null && `${sub.xp_remaining.toLocaleString()} XP`}
                                        {sub.credits_remaining === null && sub.xp_remaining === null && '-'}
                                    </TableCell>
                                    <TableCell>
                                        {sub.expires_at
                                            ? new Date(sub.expires_at).toLocaleDateString('tr-TR')
                                            : '-'
                                        }
                                    </TableCell>
                                    <TableCell align="center">
                                        {sub.status === 'pending' && (
                                            <Button
                                                size="small"
                                                color="success"
                                                onClick={() => activateSubscription(sub)}
                                            >
                                                Aktif Et
                                            </Button>
                                        )}
                                        <IconButton size="small" onClick={() => handleOpenDialog(sub)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {subscriptions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Henüz abonelik yok</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {/* Edit/Create Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingSub ? 'Aboneliği Düzenle' : 'Yeni Abonelik Oluştur'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <Autocomplete
                            options={users}
                            getOptionLabel={(user) => `${user.name} (${user.email})`}
                            value={selectedUser}
                            onChange={(_, newValue) => {
                                setSelectedUser(newValue);
                                setFormData(prev => ({ ...prev, user_id: newValue?.id || '' }));
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Kullanıcı" size="small" />
                            )}
                        />
                        <FormControl size="small">
                            <InputLabel>Paket</InputLabel>
                            <Select
                                value={formData.package_id}
                                label="Paket"
                                onChange={(e) => handlePackageChange(e.target.value)}
                            >
                                {packages.map((pkg) => (
                                    <MenuItem key={pkg.id} value={pkg.id}>
                                        {pkg.name} - ₺{pkg.price.toLocaleString()}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small">
                            <InputLabel>Durum</InputLabel>
                            <Select
                                value={formData.status}
                                label="Durum"
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserSubscription['status'] })}
                            >
                                <MenuItem value="pending">Beklemede</MenuItem>
                                <MenuItem value="active">Aktif</MenuItem>
                                <MenuItem value="expired">Süresi Dolmuş</MenuItem>
                                <MenuItem value="cancelled">İptal</MenuItem>
                            </Select>
                        </FormControl>
                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <TextField
                                label="Kalan Kredi"
                                type="number"
                                value={formData.credits_remaining}
                                onChange={(e) => setFormData({ ...formData, credits_remaining: Number(e.target.value) })}
                                size="small"
                            />
                            <TextField
                                label="Kalan XP"
                                type="number"
                                value={formData.xp_remaining}
                                onChange={(e) => setFormData({ ...formData, xp_remaining: Number(e.target.value) })}
                                size="small"
                            />
                        </Box>
                        <TextField
                            label="Bitiş Tarihi"
                            type="date"
                            value={formData.expires_at}
                            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Ödeme Referansı"
                            value={formData.payment_reference}
                            onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                            size="small"
                        />
                        <TextField
                            label="Notlar"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            size="small"
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>İptal</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {editingSub ? 'Güncelle' : 'Oluştur'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

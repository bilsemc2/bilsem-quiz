import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Package } from '../../types/package';
import { toast } from 'react-hot-toast';
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
    Switch,
    FormControlLabel,
    Chip,
    CircularProgress,
} from '@mui/material';
import { Edit, Delete, Add, DragIndicator } from '@mui/icons-material';

const packageTypeLabels = {
    bundle: 'Paket (Bundle)',
    xp_based: 'XP Tabanlı',
    credit_based: 'Kredi Tabanlı',
    time_based: 'Süre Tabanlı',
};

export default function PackageManagement() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [formData, setFormData] = useState({
        slug: '',
        name: '',
        description: '',
        price: 0,
        price_renewal: 0,
        type: 'bundle' as Package['type'],
        initial_credits: 0,
        xp_required: 0,
        features: '',
        includes: [] as string[],
        payment_url: '',
        whatsapp_url: '',
        qr_code_url: '',
        is_recommended: false,
        is_active: true,
        sort_order: 0,
    });

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const { data, error } = await supabase
                .from('packages')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            const parsed = (data || []).map(pkg => ({
                ...pkg,
                features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features || [],
                includes: pkg.includes || [],
            }));

            setPackages(parsed);
        } catch (error) {
            console.error('Paketler yüklenirken hata:', error);
            toast.error('Paketler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (pkg?: Package) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData({
                slug: pkg.slug,
                name: pkg.name,
                description: pkg.description || '',
                price: pkg.price,
                price_renewal: pkg.price_renewal || 0,
                type: pkg.type,
                initial_credits: pkg.initial_credits || 0,
                xp_required: pkg.xp_required || 0,
                features: pkg.features.join('\n'),
                includes: pkg.includes,
                payment_url: pkg.payment_url || '',
                whatsapp_url: pkg.whatsapp_url || '',
                qr_code_url: pkg.qr_code_url || '',
                is_recommended: pkg.is_recommended,
                is_active: pkg.is_active,
                sort_order: pkg.sort_order,
            });
        } else {
            setEditingPackage(null);
            setFormData({
                slug: '',
                name: '',
                description: '',
                price: 0,
                price_renewal: 0,
                type: 'bundle',
                initial_credits: 0,
                xp_required: 0,
                features: '',
                includes: [],
                payment_url: '',
                whatsapp_url: '',
                qr_code_url: '',
                is_recommended: false,
                is_active: true,
                sort_order: packages.length + 1,
            });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            const featuresArray = formData.features.split('\n').filter(f => f.trim());

            const packageData = {
                slug: formData.slug,
                name: formData.name,
                description: formData.description || null,
                price: formData.price,
                price_renewal: formData.price_renewal || null,
                type: formData.type,
                initial_credits: formData.type === 'credit_based' ? formData.initial_credits : null,
                xp_required: formData.type === 'xp_based' ? formData.xp_required : null,
                features: featuresArray,
                includes: formData.includes,
                payment_url: formData.payment_url || null,
                whatsapp_url: formData.whatsapp_url || null,
                qr_code_url: formData.qr_code_url || null,
                is_recommended: formData.is_recommended,
                is_active: formData.is_active,
                sort_order: formData.sort_order,
            };

            if (editingPackage) {
                const { error } = await supabase
                    .from('packages')
                    .update(packageData)
                    .eq('id', editingPackage.id);
                if (error) throw error;
                toast.success('Paket güncellendi');
            } else {
                const { error } = await supabase
                    .from('packages')
                    .insert(packageData);
                if (error) throw error;
                toast.success('Paket oluşturuldu');
            }

            setDialogOpen(false);
            fetchPackages();
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            toast.error('İşlem başarısız');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu paketi silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase.from('packages').delete().eq('id', id);
            if (error) throw error;
            toast.success('Paket silindi');
            fetchPackages();
        } catch {
            toast.error('Silme işlemi başarısız');
        }
    };

    const toggleInclude = (value: string) => {
        setFormData(prev => ({
            ...prev,
            includes: prev.includes.includes(value)
                ? prev.includes.filter(i => i !== value)
                : [...prev.includes, value],
        }));
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
                    📦 Paket Yönetimi
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Yeni Paket
                </Button>
            </Box>

            <Paper sx={{ overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell width={40}><DragIndicator /></TableCell>
                            <TableCell>Paket Adı</TableCell>
                            <TableCell>Tip</TableCell>
                            <TableCell align="right">Fiyat</TableCell>
                            <TableCell align="center">Önerilen</TableCell>
                            <TableCell align="center">Aktif</TableCell>
                            <TableCell align="center">İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {packages.map((pkg) => (
                            <TableRow key={pkg.id} hover>
                                <TableCell>{pkg.sort_order}</TableCell>
                                <TableCell>
                                    <Typography fontWeight="medium">{pkg.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {pkg.slug}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={packageTypeLabels[pkg.type]}
                                        size="small"
                                        color={pkg.type === 'bundle' ? 'primary' : 'default'}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    ₺{pkg.price.toLocaleString('tr-TR')}
                                </TableCell>
                                <TableCell align="center">
                                    {pkg.is_recommended ? '⭐' : '-'}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={pkg.is_active ? 'Aktif' : 'Pasif'}
                                        size="small"
                                        color={pkg.is_active ? 'success' : 'default'}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => handleOpenDialog(pkg)}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(pkg.id)}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Edit/Create Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingPackage ? 'Paketi Düzenle' : 'Yeni Paket Oluştur'}
                </DialogTitle>
                <DialogContent>
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                        <TextField
                            label="Slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            size="small"
                            helperText="URL için kullanılacak (örn: pro, standard)"
                        />
                        <TextField
                            label="Paket Adı"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            size="small"
                        />
                        <TextField
                            label="Açıklama"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            size="small"
                            multiline
                            rows={2}
                            sx={{ gridColumn: 'span 2' }}
                        />
                        <FormControl size="small">
                            <InputLabel>Paket Tipi</InputLabel>
                            <Select
                                value={formData.type}
                                label="Paket Tipi"
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as Package['type'] })}
                            >
                                <MenuItem value="bundle">Paket (Bundle)</MenuItem>
                                <MenuItem value="xp_based">XP Tabanlı</MenuItem>
                                <MenuItem value="credit_based">Kredi Tabanlı</MenuItem>
                                <MenuItem value="time_based">Süre Tabanlı</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Fiyat (₺)"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                            size="small"
                        />
                        {formData.type === 'credit_based' && (
                            <>
                                <TextField
                                    label="Başlangıç Kredisi"
                                    type="number"
                                    value={formData.initial_credits}
                                    onChange={(e) => setFormData({ ...formData, initial_credits: Number(e.target.value) })}
                                    size="small"
                                />
                                <TextField
                                    label="Yenileme Fiyatı (₺)"
                                    type="number"
                                    value={formData.price_renewal}
                                    onChange={(e) => setFormData({ ...formData, price_renewal: Number(e.target.value) })}
                                    size="small"
                                />
                            </>
                        )}
                        {formData.type === 'xp_based' && (
                            <TextField
                                label="Minimum XP"
                                type="number"
                                value={formData.xp_required}
                                onChange={(e) => setFormData({ ...formData, xp_required: Number(e.target.value) })}
                                size="small"
                            />
                        )}
                        <TextField
                            label="Sıralama"
                            type="number"
                            value={formData.sort_order}
                            onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                            size="small"
                        />
                        <TextField
                            label="Özellikler (her satırda bir özellik)"
                            value={formData.features}
                            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                            size="small"
                            multiline
                            rows={4}
                            sx={{ gridColumn: 'span 2' }}
                        />

                        {/* Ödeme Bağlantıları */}
                        <Box sx={{ gridColumn: 'span 2', mt: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                💳 Ödeme Bağlantıları
                            </Typography>
                        </Box>
                        <TextField
                            label="Ödeme Linki (PayTR vb.)"
                            value={formData.payment_url}
                            onChange={(e) => setFormData({ ...formData, payment_url: e.target.value })}
                            size="small"
                            placeholder="https://www.paytr.com/link/..."
                            sx={{ gridColumn: 'span 2' }}
                        />
                        <TextField
                            label="WhatsApp Linki"
                            value={formData.whatsapp_url}
                            onChange={(e) => setFormData({ ...formData, whatsapp_url: e.target.value })}
                            size="small"
                            placeholder="https://api.whatsapp.com/send/..."
                            sx={{ gridColumn: 'span 2' }}
                        />
                        <TextField
                            label="QR Kod URL"
                            value={formData.qr_code_url}
                            onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
                            size="small"
                            placeholder="/images/qr_paytr.png"
                        />

                        <Box sx={{ gridColumn: 'span 2' }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                İçerdiği Modüller
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                                {['genel_yetenek', 'resim', 'muzik'].map((mod) => (
                                    <Chip
                                        key={mod}
                                        label={mod === 'genel_yetenek' ? '🧠 Genel Yetenek' : mod === 'resim' ? '🎨 Resim' : '🎵 Müzik'}
                                        onClick={() => toggleInclude(mod)}
                                        color={formData.includes.includes(mod) ? 'primary' : 'default'}
                                        variant={formData.includes.includes(mod) ? 'filled' : 'outlined'}
                                    />
                                ))}
                            </Box>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_recommended}
                                    onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                                />
                            }
                            label="Tavsiye Edilen"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                            }
                            label="Aktif"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>İptal</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {editingPackage ? 'Güncelle' : 'Oluştur'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

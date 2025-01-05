# Kullanıcı Düzenleme Sistemi

## Genel Bakış
Admin panelinde kullanıcı yönetimi için geliştirilmiş bir sistemdir. Bu sistem sayesinde yöneticiler, kullanıcıların bilgilerini düzenleyebilir ve çeşitli durumlarını kontrol edebilir.

## Özellikler

### 1. Temel Bilgi Düzenleme
- **Tam Ad (full_name)**: Kullanıcının tam adını düzenleme
- **Puanlar (points)**: Kullanıcının sahip olduğu puanları düzenleme
- **Deneyim (experience)**: Kullanıcının deneyim puanını düzenleme

### 2. Kullanıcı Durumu Yönetimi
- **VIP Durumu**: Kullanıcının VIP statüsünü açma/kapama
- **Aktiflik Durumu**: Kullanıcı hesabını aktif/pasif yapma
- **Hesap İstatistikleri**: Kullanıcının performans ve aktivite istatistiklerini görüntüleme

## Kullanım Akışı

1. **Kullanıcı Seçimi**
   - Admin panelinde kullanıcılar listesinden ilgili kullanıcıya tıklanır
   - Kullanıcı bilgileri düzenleme formunda görüntülenir

2. **Bilgi Düzenleme**
   - İlgili alanlar güncellenir
   - Değişiklikler kaydedilir
   - Başarılı işlem sonrası onay mesajı gösterilir

3. **Durum Değişiklikleri**
   - VIP veya aktiflik durumu tek tıkla değiştirilebilir
   - Değişiklikler anında veritabanına yansır

## Güvenlik

- Sadece admin yetkisine sahip kullanıcılar bu işlemleri gerçekleştirebilir
- Tüm işlemler log kayıtlarına alınır
- Hassas bilgiler şifrelenerek saklanır

## Hata Yönetimi

- İşlem başarısız olursa kullanıcıya hata mesajı gösterilir
- Geçersiz veri girişleri kontrol edilir
- Bağlantı hataları uygun şekilde yönetilir

## Teknik Detaylar

- Sistem `AdminPage.tsx` içerisinde implement edilmiştir
- Supabase veritabanı ile entegre çalışır
- Real-time güncellemeler desteklenir

## Kod Örnekleri

### Kullanıcı Düzenleme Fonksiyonları

```typescript
// Kullanıcı düzenleme formunu açma
const handleEditUser = (user: User) => {
  try {
    console.log('Editing user:', user);
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      points: user.points || 0,
      experience: user.experience || 0
    });
  } catch (error) {
    console.error('Error in handleEditUser:', error);
    alert('Kullanıcı bilgileri yüklenirken bir hata oluştu.');
  }
};

// Form değişikliklerini yönetme
const handleEditFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
  try {
    const value = field === 'full_name'
      ? event.target.value 
      : Number(event.target.value) || 0;

    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  } catch (error) {
    console.error(`Error updating ${field}:`, error);
  }
};

// Değişiklikleri kaydetme
const handleSaveEdit = async () => {
  if (!editingUser) return;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: editFormData.full_name,
        points: editFormData.points,
        experience: editFormData.experience
      })
      .eq('id', editingUser.id)
      .select();

    if (error) {
      console.error('Error updating user:', error);
      alert('Kullanıcı güncellenirken bir hata oluştu: ' + error.message);
      return;
    }

    if (data) {
      console.log('User updated successfully:', data);
      alert('Kullanıcı başarıyla güncellendi!');
    }
  } catch (error) {
    console.error('Error in handleSaveEdit:', error);
    alert('Kullanıcı güncellenirken bir hata oluştu.');
  }
};
```

### Kullanıcı Arayüzü Bileşeni

```typescript
// Kullanıcı düzenleme formu
const UserEditForm = () => {
  return (
    <Dialog open={!!editingUser} onClose={() => setEditingUser(null)}>
      <DialogTitle>Kullanıcı Düzenle</DialogTitle>
      <DialogContent>
        <TextField
          label="Tam Ad"
          value={editFormData.full_name}
          onChange={handleEditFormChange('full_name')}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Puanlar"
          type="number"
          value={editFormData.points}
          onChange={handleEditFormChange('points')}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Deneyim"
          type="number"
          value={editFormData.experience}
          onChange={handleEditFormChange('experience')}
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditingUser(null)}>İptal</Button>
        <Button onClick={handleSaveEdit} variant="contained" color="primary">
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### Tip Tanımlamaları

```typescript
// Kullanıcı tipi
interface User {
  id: string;
  email: string;
  full_name: string;
  points: number;
  experience: number;
  is_admin: boolean;
  created_at: string;
}

// Form veri tipi
interface EditFormData {
  full_name: string;
  points: number;
  experience: number;
}
```

## İlgili Dosyalar

- `AdminPage.tsx`: Ana yönetim paneli ve kullanıcı düzenleme mantığı
- `User.ts`: Kullanıcı tipi ve interface tanımlamaları
- `database.types.ts`: Veritabanı tip tanımlamaları

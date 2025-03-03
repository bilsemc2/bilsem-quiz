import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Button, Table, Modal, Form, Input, Select, DatePicker, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  expires_at?: string;
  priority: 'low' | 'normal' | 'high';
  created_by: string;
  class_id: string;
  class_name?: string;
}

interface Class {
  id: string;
  name: string;
}

const AnnouncementManagement: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [form] = Form.useForm();

  // Duyuruları getir
  const fetchAnnouncements = async () => {
    setLoading(true);
    
    try {
      // Öğretmenin erişim yetkisi olan sınıfları al
      // Doğrudan öğretmenin sınıflarını al (classes tablosundan)
      const { data: teacherClasses, error: classError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', user?.id);
        
      console.log('Öğretmenin sınıfları sorgusu:', teacherClasses);
      
      if (classError) throw classError;
      
      // Sınıf listesini oluştur
      const classIds: string[] = [];
      const classList: Class[] = [];
      
      if (teacherClasses && Array.isArray(teacherClasses)) {
        teacherClasses.forEach((classItem: any) => {
          // Sınıf ID ve adını ekle
          if (classItem.id) {
            classIds.push(classItem.id);
            classList.push({
              id: classItem.id,
              name: classItem.name || `Sınıf ${classItem.id}`
            });
          }
        });
      }
      
      console.log('Sınıf ID listesi:', classIds);
      console.log('Sınıf listesi:', classList);
      
      setClasses(classList);
      
      if (classIds.length === 0) {
        setAnnouncements([]);
        setLoading(false);
        return;
      }
      
      // Bu sınıflara ait duyuruları getir
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Veri yapısını konsola yazdıralım
      console.log('Announcements data:', JSON.stringify(data, null, 2));
      console.log('Class list for matching:', JSON.stringify(classList, null, 2));

      // Sınıf adlarını ekle
      const announcementsWithClassName: Announcement[] = [];
      
      // Tüm sınıf ID'lerini ve tiplerini inceleyelim
      console.log('Class list types:', classList.map(c => ({ id: c.id, id_type: typeof c.id })));
      
      if (Array.isArray(data)) {
        data.forEach((announcement: any) => {
          try {
            // Duyuru class_id tipini inceleyelim
            const announcementClassId = String(announcement.class_id);
            
            // Sınıf bilgisini bul - string'e çevirerek karşılaştırma yapabiliriz
            const classInfo = classList.find(c => String(c.id) === announcementClassId);
            
            if (classInfo) {
              console.log(`Announcement ${announcement.id} için eşleşen sınıf bulundu:`, classInfo.name);
            } else {
              console.log(`Uyarı: Announcement ${announcement.id} (class_id=${announcement.class_id}) için sınıf bulunamadı`);
              console.log(`Mevcut sınıf listesi:`, classList.map(c => ({ id: String(c.id), name: c.name })));
            }
            
            // Duyuru nesnesini düzenle
            announcementsWithClassName.push({
              ...announcement,
              class_name: classInfo?.name || 'Bilinmeyen Sınıf'
            });
          } catch (err) {
            console.error('Duyuru işlenirken hata:', err, announcement);
            // Hataya rağmen duyuruyu ekle
            announcementsWithClassName.push({
              ...announcement,
              class_name: 'Bilinmeyen Sınıf'
            });
          }
        });
      }
      
      console.log('Processed announcements:', JSON.stringify(announcementsWithClassName, null, 2));
      setAnnouncements(announcementsWithClassName);
    } catch (error) {
      console.error('Duyurular alınırken hata:', error);
      toast.error('Duyurular yüklenirken bir hata oluştu', {
        icon: '❌',
        description: 'Lütfen daha sonra tekrar deneyin.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

  // Duyuru ekle/güncelle
  const handleSaveAnnouncement = async (values: any) => {
    try {
      if (editingAnnouncement) {
        // Duyuru güncelleme
        const { error } = await supabase
          .from('announcements')
          .update({
            title: values.title,
            content: values.content,
            priority: values.priority,
            expires_at: values.expires_at ? values.expires_at.toISOString() : null,
            class_id: values.class_id
          })
          .eq('id', editingAnnouncement.id);

        if (error) throw error;

        toast.success('Duyuru başarıyla güncellendi', {
          icon: '✅',
          description: 'Değişiklikler kaydedildi.'
        });
      } else {
        // Yeni duyuru ekleme
        const { error } = await supabase
          .from('announcements')
          .insert([{
            title: values.title,
            content: values.content,
            priority: values.priority,
            expires_at: values.expires_at ? values.expires_at.toISOString() : null,
            created_by: user?.id,
            class_id: values.class_id
          }]);

        if (error) throw error;

        toast.success('Duyuru başarıyla eklendi', {
          icon: '📢',
          description: 'Yeni duyuru öğrencilere gösterilecek.'
        });
      }

      form.resetFields();
      setModalVisible(false);
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Duyuru kaydedilirken hata:', error);
      toast.error('Duyuru kaydedilirken bir hata oluştu', {
        icon: '❌',
        description: 'Lütfen daha sonra tekrar deneyin.'
      });
    }
  };

  // Duyuru silme
  const handleDeleteAnnouncement = async (id: number) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Duyuru başarıyla silindi', {
        icon: '🗑️',
        description: 'Duyuru artık görüntülenmeyecek.'
      });
      
      fetchAnnouncements();
    } catch (error) {
      console.error('Duyuru silinirken hata:', error);
      toast.error('Duyuru silinirken bir hata oluştu', {
        icon: '❌',
        description: 'İşlem gerçekleştirilemedi.'
      });
    }
  };

  // Düzenleme modalını aç
  const handleEdit = (record: Announcement) => {
    setEditingAnnouncement(record);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      priority: record.priority,
      expires_at: record.expires_at ? dayjs(record.expires_at) : null,
      class_id: record.class_id
    });
    setModalVisible(true);
  };

  // Yeni duyuru modalını aç
  const handleAddNew = () => {
    setEditingAnnouncement(null);
    form.resetFields();
    if (classes.length > 0) {
      form.setFieldsValue({ 
        class_id: classes[0].id,
        priority: 'normal'
      });
    }
    setModalVisible(true);
  };

  // Öncelik etiketini render et
  const renderPriorityTag = (priority: string) => {
    const priorityMap: Record<string, { color: string, text: string }> = {
      high: { color: 'red', text: 'Önemli' },
      normal: { color: 'blue', text: 'Normal' },
      low: { color: 'default', text: 'Düşük' }
    };
    
    const info = priorityMap[priority] || priorityMap.normal;
    
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Sınıf',
      dataIndex: 'class_name',
      key: 'class_name',
    },
    {
      title: 'Başlık',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'İçerik',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text: string) => text.length > 100 ? `${text.substring(0, 100)}...` : text
    },
    {
      title: 'Öncelik',
      dataIndex: 'priority',
      key: 'priority',
      render: renderPriorityTag
    },
    {
      title: 'Oluşturulma Tarihi',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => dayjs(text).format('DD.MM.YYYY HH:mm')
    },
    {
      title: 'Son Geçerlilik',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (text: string) => text ? dayjs(text).format('DD.MM.YYYY HH:mm') : '-'
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: Announcement) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            type="text"
          />
          <Popconfirm
            title="Bu duyuruyu silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDeleteAnnouncement(record.id)}
            okText="Evet"
            cancelText="İptal"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger
              type="text"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Duyuru Yönetimi</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAddNew}
          disabled={classes.length === 0}
        >
          Yeni Duyuru
        </Button>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-xl font-medium text-gray-500 mb-2">Henüz yönettiğiniz bir sınıf bulunmuyor</h2>
          <p className="text-gray-400">Duyuru eklemek için önce bir sınıf oluşturmalı veya bir sınıfa öğretmen olarak atanmalısınız.</p>
        </div>
      ) : (
        <Table 
          columns={columns} 
          dataSource={announcements} 
          rowKey="id" 
          loading={loading}
          pagination={{ 
            pageSize: 10,
            position: ['bottomCenter'],
            showTotal: (total) => `Toplam ${total} duyuru`
          }}
        />
      )}

      {/* Duyuru Ekleme/Düzenleme Modalı */}
      <Modal
        title={editingAnnouncement ? 'Duyuru Düzenle' : 'Yeni Duyuru'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingAnnouncement(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveAnnouncement}
          initialValues={{ priority: 'normal' }}
        >
          <Form.Item
            name="class_id"
            label="Sınıf"
            rules={[{ required: true, message: 'Lütfen bir sınıf seçin' }]}
          >
            <Select placeholder="Sınıf seçin">
              {classes.map(cls => (
                <Select.Option key={cls.id} value={cls.id}>
                  {cls.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Başlık"
            rules={[{ required: true, message: 'Lütfen bir başlık girin' }]}
          >
            <Input placeholder="Duyuru başlığı" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="content"
            label="İçerik"
            rules={[{ required: true, message: 'Lütfen duyuru içeriğini girin' }]}
          >
            <Input.TextArea 
              placeholder="Duyuru detayları" 
              autoSize={{ minRows: 4, maxRows: 10 }}
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Öncelik"
            rules={[{ required: true, message: 'Lütfen öncelik seviyesi seçin' }]}
          >
            <Select>
              <Select.Option value="low">Düşük</Select.Option>
              <Select.Option value="normal">Normal</Select.Option>
              <Select.Option value="high">Önemli</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="expires_at"
            label="Son Geçerlilik Tarihi (İsteğe Bağlı)"
          >
            <DatePicker 
              showTime 
              format="DD.MM.YYYY HH:mm"
              placeholder="Seçmek için tıklayın" 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  setEditingAnnouncement(null);
                  form.resetFields();
                }}
              >
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAnnouncement ? 'Güncelle' : 'Kaydet'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AnnouncementManagement;

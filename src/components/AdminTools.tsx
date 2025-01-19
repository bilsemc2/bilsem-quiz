import React from 'react';
import { Button } from '@/components/ui/button';
import { fixProfessionImages } from '@/lib/puzzleService';
import { toast } from 'sonner';

export const AdminTools: React.FC = () => {
    const handleFixImages = async () => {
        try {
            await fixProfessionImages();
            toast.success('Meslek resimleri başarıyla güncellendi!');
        } catch (error) {
            console.error('Error fixing images:', error);
            toast.error('Resimler güncellenirken bir hata oluştu.');
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Admin Araçları</h2>
            <Button 
                onClick={handleFixImages}
                variant="outline"
                className="w-full mb-2"
            >
                Meslek Resimlerini Düzelt
            </Button>
        </div>
    );
};

export default AdminTools;

import { useState, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { toast } from 'sonner';

interface OnDemandPdfDownloadButtonProps {
  className: string;
  fileName: string;
  loadDocument: () => Promise<ReactElement>;
  children: ReactNode;
  loadingLabel?: ReactNode;
  disabled?: boolean;
}

const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export function OnDemandPdfDownloadButton({
  className,
  fileName,
  loadDocument,
  children,
  loadingLabel = 'PDF hazırlanıyor...',
  disabled = false
}: OnDemandPdfDownloadButtonProps) {
  const [isPreparing, setIsPreparing] = useState(false);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (disabled || isPreparing) {
      return;
    }

    setIsPreparing(true);

    try {
      const [{ pdf }, document] = await Promise.all([
        import('@react-pdf/renderer'),
        loadDocument()
      ]);

      const blob = await pdf(document).toBlob();
      triggerBlobDownload(blob, fileName);
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      toast.error('PDF hazırlanırken bir hata oluştu.');
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        void handleClick(event);
      }}
      disabled={disabled || isPreparing}
      className={`${className} disabled:cursor-wait disabled:opacity-70`}
    >
      {isPreparing ? loadingLabel : children}
    </button>
  );
}

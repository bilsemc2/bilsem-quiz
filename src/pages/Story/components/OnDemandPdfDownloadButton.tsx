import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode
} from 'react';
import { toast } from 'sonner';

interface OnDemandPdfDownloadButtonProps {
  className: string;
  fileName: string;
  loadDocument: () => Promise<ReactElement>;
  children: ReactNode;
  loadingLabel?: ReactNode;
  disabled?: boolean;
}

export function OnDemandPdfDownloadButton({
  className,
  fileName,
  loadDocument,
  children,
  loadingLabel = 'PDF hazırlanıyor...',
  disabled = false
}: OnDemandPdfDownloadButtonProps) {
  const [isPreparing, setIsPreparing] = useState(false);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const activeDownloadUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (activeDownloadUrlRef.current) {
        URL.revokeObjectURL(activeDownloadUrlRef.current);
      }
    };
  }, []);

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
      if (activeDownloadUrlRef.current) {
        URL.revokeObjectURL(activeDownloadUrlRef.current);
      }

      const nextUrl = URL.createObjectURL(blob);
      activeDownloadUrlRef.current = nextUrl;

      if (linkRef.current) {
        linkRef.current.href = nextUrl;
        linkRef.current.download = fileName;
        linkRef.current.click();
      }

      window.setTimeout(() => {
        if (activeDownloadUrlRef.current === nextUrl) {
          URL.revokeObjectURL(nextUrl);
          activeDownloadUrlRef.current = null;
        }
      }, 0);
    } catch {
      toast.error('PDF hazırlanırken bir hata oluştu.');
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <>
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
      <a ref={linkRef} className="hidden" aria-hidden="true" tabIndex={-1}>
        download
      </a>
    </>
  );
}

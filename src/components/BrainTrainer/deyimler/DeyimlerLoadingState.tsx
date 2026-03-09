const DeyimlerLoadingState = () => (
  <div className="flex flex-1 items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyber-pink border-t-transparent" />
      <p className="text-sm font-nunito font-black text-slate-500 dark:text-slate-400">
        Deyimler yükleniyor...
      </p>
    </div>
  </div>
);

export default DeyimlerLoadingState;

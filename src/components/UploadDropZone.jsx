import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileImage, X, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const ACCEPTED_FORMATS = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'application/dicom': ['.dcm', '.dicom'],
};

const MAX_SIZE_MB = 25;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadDropZone({ onFileAccepted, currentScan, onClear, onAnalyze, isAnalyzing }) {
  const [isHovering, setIsHovering] = useState(false);

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    if (fileRejections && fileRejections.length > 0) {
      const reason = fileRejections[0].errors[0]?.code;
      if (reason === 'file-too-large') {
        toast.error(`File exceeds ${MAX_SIZE_MB}MB limit.`);
      } else if (reason === 'file-invalid-type') {
        toast.error('Unsupported format. Use PNG, JPG, WEBP, or DICOM.');
      } else {
        toast.error('File could not be accepted. Please try another scan.');
      }
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const previewUrl = URL.createObjectURL(file);

    onFileAccepted({
      file,
      previewUrl,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    });

    toast.success(`${file.name} ready for analysis`);
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    multiple: false,
    disabled: !!currentScan,
  });

  // ─── Preview state: file uploaded, awaiting analysis ───
  if (currentScan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-2xl border border-slate-700 bg-bg-surface shadow-card overflow-hidden"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image preview */}
          <div className="relative bg-black flex items-center justify-center min-h-[280px] md:min-h-[360px]">
            {currentScan.type?.startsWith('image/') ? (
              <img
                src={currentScan.previewUrl}
                alt="Scan preview"
                className="w-full h-full object-contain max-h-[400px]"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400 p-8">
                <FileImage className="h-16 w-16" strokeWidth={1.2} />
                <span className="text-sm font-mono">DICOM preview unavailable</span>
                <span className="text-xs text-slate-500">File will still be processed</span>
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-risk-safe/15 border border-risk-safe/30 text-risk-safe text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              Ready
            </div>
          </div>

          {/* Metadata + actions */}
          <div className="p-6 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Scan File
                  </p>
                  <p className="text-base font-semibold text-slate-100 break-all">
                    {currentScan.name}
                  </p>
                </div>
                <button
                  onClick={onClear}
                  disabled={isAnalyzing}
                  className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Size</dt>
                  <dd className="font-mono text-slate-200">{formatBytes(currentScan.size)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Format</dt>
                  <dd className="font-mono text-slate-200">
                    {currentScan.name.split('.').pop()?.toUpperCase() || '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <motion.button
              whileHover={{ scale: isAnalyzing ? 1 : 1.02 }}
              whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm transition-colors',
                isAnalyzing
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-accent hover:bg-accent-hover text-white shadow-glow-blue'
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing scan…
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Run AI Analysis
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Empty state: drop zone ───
  return (
    <motion.div
      {...getRootProps()}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      animate={{
        scale: isDragActive ? 1.01 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'relative w-full min-h-[340px] md:min-h-[400px] rounded-2xl border-2 border-dashed cursor-pointer transition-colors duration-200',
        'flex flex-col items-center justify-center text-center px-6 py-12',
        isDragReject
          ? 'border-risk-danger bg-risk-danger/5'
          : isDragActive || isHovering
          ? 'border-accent bg-accent/5'
          : 'border-slate-700 bg-bg-surface/60 animate-border-pulse'
      )}
    >
      <input {...getInputProps()} />

      <motion.div
        animate={{
          y: isDragActive ? -8 : 0,
          scale: isDragActive ? 1.1 : 1,
        }}
        transition={{ type: 'spring', stiffness: 250, damping: 18 }}
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-2xl mb-6 transition-colors',
          isDragActive || isHovering
            ? 'bg-accent/15 text-accent'
            : 'bg-slate-800 text-slate-400'
        )}
      >
        <UploadCloud className="h-10 w-10" strokeWidth={1.5} />
      </motion.div>

      <AnimatePresence mode="wait">
        {isDragActive ? (
          <motion.h3
            key="drag"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xl font-semibold text-accent mb-2"
          >
            Release to upload your scan
          </motion.h3>
        ) : (
          <motion.h3
            key="idle"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xl font-semibold text-slate-100 mb-2"
          >
            Drop your scan here or click to browse
          </motion.h3>
        )}
      </AnimatePresence>

      <p className="text-sm text-slate-400 mb-6 max-w-sm">
        Securely upload a medical image. All processing happens on-device when offline.
      </p>

      {/* Format badges */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {['X-Ray', 'CT', 'MRI', 'DICOM'].map((fmt) => (
          <span
            key={fmt}
            className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-medium text-slate-300"
          >
            {fmt}
          </span>
        ))}
      </div>

      <p className="mt-5 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
        PNG · JPG · WEBP · DCM · Max {MAX_SIZE_MB}MB
      </p>
    </motion.div>
  );
}
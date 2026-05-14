import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileImage, X, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const ACCEPTED_FORMATS = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/tiff': ['.tiff', '.tif'],
  'application/dicom': ['.dcm', '.dicom'],
};

const MAX_SIZE_MB = 25;

const SCAN_TYPES = [
  { value: 'Chest X-ray', label: 'Chest X-ray', category: 'X-Ray' },
  { value: 'Chest CT', label: 'Chest CT', category: 'CT' },
  { value: 'Abdomen CT', label: 'Abdomen CT', category: 'CT' },
  { value: 'Brain CT', label: 'Brain CT', category: 'CT' },
  { value: 'Full Body CT', label: 'Full Body CT', category: 'CT' },
  { value: 'Brain MRI', label: 'Brain MRI', category: 'MRI' },
  { value: 'Spine MRI', label: 'Spine MRI', category: 'MRI' },
];

const CATEGORY_COLORS = {
  'X-Ray': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'CT': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'MRI': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadDropZone({
  onFileAccepted, currentScan, onClear,
  onAnalyze, isAnalyzing, onScanTypeChange
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [selectedType, setSelectedType] = useState('Chest X-ray');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleScanTypeSelect = (value) => {
    setSelectedType(value);
    setDropdownOpen(false);
    if (onScanTypeChange) onScanTypeChange(value);
  };

  const selectedScan = SCAN_TYPES.find(s => s.value === selectedType);

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
      scanType: selectedType,
      uploadedAt: new Date().toISOString(),
    });
    toast.success(`${file.name} ready for analysis`);
  }, [onFileAccepted, selectedType]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    multiple: false,
    disabled: !!currentScan,
  });

  // ─── Preview state ────────────────────────────────────────────────────────
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
            {/* Scan type badge on preview */}
            <div className={cn(
              "absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-semibold border",
              CATEGORY_COLORS[selectedScan?.category ?? 'X-Ray']
            )}>
              {selectedType}
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

              <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
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

              {/* Scan type shown on preview card */}
              <div className="rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2.5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Scan Type</p>
                <p className={cn(
                  "text-sm font-semibold",
                  CATEGORY_COLORS[selectedScan?.category ?? 'X-Ray'].split(' ')[1]
                )}>
                  {selectedType}
                </p>
              </div>
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

  // ─── Empty state: drop zone ───────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col gap-4">

      {/* Scan type selector */}
      <div className="relative">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-2">
          Select Scan Type
        </p>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full border",
              CATEGORY_COLORS[selectedScan?.category ?? 'X-Ray']
            )}>
              {selectedScan?.category}
            </span>
            <span className="text-sm font-medium text-slate-200">{selectedType}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform",
              dropdownOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden"
            >
              {['X-Ray', 'CT', 'MRI'].map((category) => (
                <div key={category}>
                  <div className="px-3 py-1.5 bg-slate-800/60">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      CATEGORY_COLORS[category].split(' ')[1]
                    )}>
                      {category}
                    </span>
                  </div>
                  {SCAN_TYPES.filter(s => s.category === category).map((scan) => (
                    <button
                      key={scan.value}
                      onClick={() => handleScanTypeSelect(scan.value)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-800",
                        selectedType === scan.value
                          ? "text-blue-400 bg-blue-500/10"
                          : "text-slate-300"
                      )}
                    >
                      {scan.label}
                    </button>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drop zone */}
      <motion.div
        {...getRootProps()}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        animate={{ scale: isDragActive ? 1.01 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={cn(
          'relative w-full min-h-[300px] md:min-h-[340px] rounded-2xl border-2 border-dashed cursor-pointer transition-colors duration-200',
          'flex flex-col items-center justify-center text-center px-6 py-10',
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
              Drop your {selectedType} here or click to browse
            </motion.h3>
          )}
        </AnimatePresence>

        <p className="text-sm text-slate-400 mb-6 max-w-sm">
          Securely upload a medical image. All processing happens on-device when offline.
        </p>

        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
          PNG · JPG · WEBP · TIFF · DCM · Max {MAX_SIZE_MB}MB
        </p>
      </motion.div>
    </div>
  );
}
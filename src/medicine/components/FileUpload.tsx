import React, { useState, useRef } from 'react'
import { Upload, FileText, Image as ImageIcon, Loader2, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

interface FileUploadProps {
    onUpload: (file: File) => void
    isProcessing: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isProcessing }) => {
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    // Fix 7: separate ref for camera capture
    const cameraRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (isValidFile(file)) {
                setSelectedFile(file)
            }
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (isValidFile(file)) {
                setSelectedFile(file)
            }
        }
    }

    const isValidFile = (file: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp', 'image/heic']
        return validTypes.includes(file.type) || file.name.endsWith('.pdf')
    }

    const onButtonClick = () => {
        inputRef.current?.click()
    }

    // Fix 7: trigger camera capture
    const onCameraClick = () => {
        cameraRef.current?.click()
    }

    const handleConfirm = () => {
        if (selectedFile) {
            onUpload(selectedFile)
            setSelectedFile(null)
        }
    }

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "relative h-48 rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center text-center p-6",
                    dragActive
                        ? "border-indigo-500 bg-indigo-50/10"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {/* Browse files input */}
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.webp,.heic"
                    onChange={handleChange}
                />

                {/* Fix 7: Camera capture input — separate element with capture attribute */}
                <input
                    ref={cameraRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleChange}
                />

                <AnimatePresence mode="wait">
                    {selectedFile ? (
                        <motion.div
                            key="selected"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="space-y-2"
                        >
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                                {selectedFile.type.includes('pdf') ? <FileText size={24} /> : <ImageIcon size={24} />}
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                {selectedFile.name}
                            </p>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                            >
                                Change File
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                        >
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                <Upload size={24} />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Manual Upload</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                Drag & drop prescription JPG, PNG or PDF<br />
                                or <button onClick={onButtonClick} className="text-indigo-500 hover:underline">browse files</button>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fix 7: action buttons row — Browse + Take Photo */}
            {!selectedFile && (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onButtonClick}
                        className="flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <FileText size={14} /> Browse Files
                    </button>
                    <button
                        onClick={onCameraClick}
                        className="flex items-center justify-center gap-2 py-3 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all"
                    >
                        <Camera size={14} /> Take Photo
                    </button>
                </div>
            )}

            {selectedFile && (
                <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="w-full py-4 bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <FileText size={16} />
                            Process Prescription
                        </>
                    )}
                </button>
            )}
        </div>
    )
}

import React, { useState, useRef } from 'react'
import { Upload, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
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
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
        return validTypes.includes(file.type) || file.name.endsWith('.pdf')
    }

    const onButtonClick = () => {
        inputRef.current?.click()
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
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
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

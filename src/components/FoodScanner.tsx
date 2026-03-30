import React, { useState } from 'react';
import { Camera, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { scanAndSearchFood } from '../services/medicine';
import { toast } from 'sonner';

export const FoodScanner: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<{
        scannedText: string,
        medicineResults: Array<{
            name: string,
            purpose: string,
            usage?: string
        }>
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        await processFile(file);
    };

    const processFile = async (file: File) => {
        setIsScanning(true);
        setError(null);
        setResults(null);

        try {
            const data = await scanAndSearchFood(file);
            setResults(data);
            if (data.medicineResults.length === 0) {
                toast.info('No matching products found in FDA database.');
            } else {
                toast.success('Scan complete!');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Scan failed';
            setError(message);
            toast.error(message);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Food & Medicine Scanner
                </h1>
                <p className="text-gray-500">Scan packaging to reveal purpose and usage</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center space-y-2">
                        <Camera className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="font-medium text-gray-600 group-hover:text-blue-600">Take Photo</span>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isScanning}
                    />
                </label>

                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-10 h-10 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        <span className="font-medium text-gray-600 group-hover:text-indigo-600">Upload Image</span>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isScanning}
                    />
                </label>
            </div>

            {isScanning && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-blue-600 font-medium animate-pulse">Processing image with OCR...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            {results && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 italic text-gray-600 text-sm">
                        <h3 className="font-semibold text-gray-900 not-italic mb-1">Scanned Text:</h3>
                        "{results.scannedText.substring(0, 200)}{results.scannedText.length > 200 ? '...' : ''}"
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                            Found {results.medicineResults.length} Matches
                        </h2>

                        {results.medicineResults.map((item, idx: number) => (
                            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-blue-700 border-b pb-2 mb-3">
                                    {item.name}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Purpose</span>
                                        <p className="text-gray-700 text-sm leading-relaxed">{item.purpose}</p>
                                    </div>
                                    {item.usage && (
                                        <div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Usage / Dosage</span>
                                            <p className="text-gray-700 text-sm leading-relaxed">{item.usage}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

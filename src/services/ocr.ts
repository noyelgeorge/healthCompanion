import { createWorker } from 'tesseract.js';

/**
 * Preprocesses an image to improve OCR accuracy.
 * Resizes, grayscales, and increases contrast.
 */
export async function preprocessImage(imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Target width for better OCR, keeping aspect ratio
            const targetWidth = 800;
            const scaleFactor = targetWidth / img.width;
            canvas.width = targetWidth;
            canvas.height = img.height * scaleFactor;

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Apply Grayscale and Contrast enhancement
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Grayscale
                let gray = 0.299 * r + 0.587 * g + 0.114 * b;

                // Increase Contrast (simple thresholding or linear stretch)
                // Using a simple contrast boost here
                const contrast = 1.2; // 0 to 2
                gray = (gray - 128) * contrast + 128;

                data[i] = data[i + 1] = data[i + 2] = gray;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(imageFile);
    });
}

const ocrCache = new Map<string, string>();

/**
 * Extracts text from an image file using OCR.
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
    const cacheKey = `${imageFile.name}-${imageFile.size}-${imageFile.lastModified}`;
    if (ocrCache.has(cacheKey)) {
        return ocrCache.get(cacheKey)!;
    }

    try {
        const preprocessedImageBase64 = await preprocessImage(imageFile);

        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(preprocessedImageBase64);
        await worker.terminate();

        const cleanedText = text.trim();
        if (!cleanedText) {
            throw new Error('Text not detected.');
        }

        ocrCache.set(cacheKey, cleanedText);
        return cleanedText;
    } catch (error) {
        console.error('OCR Error:', error);
        throw error instanceof Error ? error : new Error('OCR failed');
    }
}

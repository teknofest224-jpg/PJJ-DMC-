import { VALIDATION_LIMITS } from '../types/tjktTypes';

export interface CompressedPhotoResult {
  dataUrl: string;
  fileName: string;
  approxKb: number;
}

/**
 * Compresses an uploaded image file client-side into a clean JPEG data URL
 * strictly adhering to Firestore document limits and ^data:image/jpeg;base64,...
 */
export function compressImageToJpegDataUrl(file: File): Promise<CompressedPhotoResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(
        new Error('Format file tidak didukung. Harap pilih file foto/gambar (disarankan JPG/JPEG).')
      );
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('Ukuran foto asli terlalu besar (maksimal 15 MB).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file foto dari perangkat Anda.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        reject(new Error('File gambar rusak atau format tidak dikenali peramban.'));
      img.onload = () => {
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses kompresi gambar pada peramban.'));
          return;
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.72;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > VALIDATION_LIMITS.PHOTO_DATA_URL_MAX - 20000 && quality > 0.3) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (
          dataUrl.length > VALIDATION_LIMITS.PHOTO_DATA_URL_MAX ||
          !VALIDATION_LIMITS.JPEG_DATA_URL_PATTERN.test(dataUrl)
        ) {
          reject(
            new Error('Ukuran hasil kompresi foto masih melebihi batas. Coba gunakan foto resolusi standar.')
          );
          return;
        }

        const baseName = file.name.replace(/\.[^.]+$/, '') || 'bukti_tugas_pjj';
        const cleanFileName = `${baseName.slice(0, 90)}.jpg`;
        const approxKb = Math.max(1, Math.round((dataUrl.length * 0.75) / 1024));

        resolve({
          dataUrl,
          fileName: cleanFileName,
          approxKb,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

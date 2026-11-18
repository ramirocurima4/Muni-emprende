export interface ClientImageCompressOptions {
  maxDimension?: number;
  quality?: number;
  fileNamePrefix?: string;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function loadImageViaElement(
  file: File,
): Promise<{ width: number; height: number; source: CanvasImageSource; cleanup: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        source: img,
        cleanup: () => URL.revokeObjectURL(url),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo decodificar la imagen en el navegador."));
    };
    img.src = url;
  });
}

async function decodeImageForCanvas(
  file: File,
): Promise<{ width: number; height: number; source: CanvasImageSource; cleanup: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fallback a <img> si createImageBitmap falla en algún WebView antiguo
    }
  }
  return loadImageViaElement(file);
}

/**
 * Redimensiona y comprime una imagen en el navegador usando <canvas> antes de subirla,
 * para que fotos pesadas de celulares no fallen con pocos datos.
 * Si el formato (ej. HEIC en iOS) no se puede decodificar en el navegador, devuelve el archivo original
 * siempre que no supere el límite del servidor (8 MB).
 */
export async function compressImageFileForUpload(
  file: File,
  options: ClientImageCompressOptions = {},
): Promise<File> {
  const {
    maxDimension = 1200,
    quality = 0.82,
    fileNamePrefix = "foto",
  } = options;

  let decoded: Awaited<ReturnType<typeof decodeImageForCanvas>>;
  try {
    decoded = await decodeImageForCanvas(file);
  } catch {
    return file;
  }

  try {
    const { width, height, source } = decoded;
    if (!width || !height) {
      return file;
    }

    const longestSide = Math.max(width, height);
    const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    // Si ya es liviana (<= 350 KB) y no supera el tamaño máximo, no recomprimir innecesariamente
    if (scale === 1 && file.size <= 350 * 1024) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }

    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    let outputBlob = await canvasToBlob(canvas, "image/webp", quality);
    let extension = "webp";

    // Algunos navegadores devuelven image/png cuando no soportan WebP en canvas.toBlob
    if (!outputBlob || outputBlob.type !== "image/webp") {
      // Rellenar fondo blanco para JPEG por si el logo tenía transparencia PNG
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.restore();

      outputBlob = await canvasToBlob(canvas, "image/jpeg", quality);
      extension = "jpg";
    }

    if (!outputBlob) {
      return file;
    }

    // Si por alguna razón quedó más grande que el original y las dimensiones no excedían maxDimension, usar original
    if (scale === 1 && outputBlob.size >= file.size) {
      return file;
    }

    return new File([outputBlob], `${fileNamePrefix}.${extension}`, {
      type: outputBlob.type,
      lastModified: Date.now(),
    });
  } finally {
    decoded.cleanup();
  }
}

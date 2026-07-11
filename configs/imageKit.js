import 'dotenv/config';
import {ImageKit} from '@imagekit/nodejs';

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// --- Single, reusable ImageKit transformation strategy ---------------------
// One source of truth for every upload and delivery URL in the app.

// UPLOAD (transformation.pre): cap the longest edge to 1600px — `at_max`
// preserves aspect ratio and never upscales — with auto quality and WebP.
// Applying any transform also normalizes EXIF orientation into the stored file.
const INGEST_TRANSFORMATION = [
  { width: 1600, height: 1600, crop: 'at_max', quality: 'auto', format: 'webp' },
];

// DELIVERY (buildSrc): shared by product images and store logos so both are
// generated identically. `format: 'auto'` lets ImageKit negotiate AVIF/WebP/
// JPEG per browser — unlike the ingest transform above, which stores a fixed
// WebP master and must stay that way.
const DELIVERY_TRANSFORMATION = [
  { quality: 'auto' },
  { format: 'auto' },
  { width: '1024' },
];

// Pre-transformation string for files.upload({ transformation: { pre } }).
// Serialized once via the SDK's own builder — no hand-written strings.
export const UPLOAD_PRE_TRANSFORMATION =
  imagekit.helper.buildTransformationString(INGEST_TRANSFORMATION);

// Consistent delivery URL for any stored ImageKit asset. Falls back to the raw
// upload URL if buildSrc returns nothing.
export function buildImageUrl(filePath, fallbackUrl = '') {
  return (
    imagekit.helper.buildSrc({
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      src: filePath,
      transformation: DELIVERY_TRANSFORMATION,
    }) || fallbackUrl
  );
}
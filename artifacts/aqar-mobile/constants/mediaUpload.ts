import * as ImagePicker from 'expo-image-picker';
import { apiFetch, endpoints } from './api';

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function inferContentType(asset: ImagePicker.ImagePickerAsset, blob: Blob): string {
  const candidates = [
    asset.mimeType,
    blob.type,
    asset.fileName?.toLowerCase().endsWith('.png') ? 'image/png' : undefined,
    asset.fileName?.toLowerCase().endsWith('.webp') ? 'image/webp' : undefined,
    asset.fileName?.toLowerCase().endsWith('.jpg') || asset.fileName?.toLowerCase().endsWith('.jpeg')
      ? 'image/jpeg'
      : undefined,
  ];

  return candidates.find((value): value is string => Boolean(value)) ?? 'image/jpeg';
}

function validateImageAsset(contentType: string, size: number): void {
  if (!ACCEPTED_IMAGE_TYPES.has(contentType)) {
    throw new Error('نوع الصورة غير مدعوم. الصيغ المقبولة: JPG و PNG و WebP');
  }

  if (size <= 0) {
    throw new Error('تعذر قراءة حجم الصورة المختارة');
  }

  if (size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('حجم الصورة كبير جدًا. الحد الأقصى 5 ميغابايت');
  }
}

function buildFileName(asset: ImagePicker.ImagePickerAsset, contentType: string): string {
  const extension = EXTENSION_BY_TYPE[contentType] ?? 'jpg';
  const rawName = asset.fileName?.trim();

  if (rawName) {
    return rawName.includes('.') ? rawName : `${rawName}.${extension}`;
  }

  return `image-${Date.now()}.${extension}`;
}

export async function ensureMediaLibraryPermission(): Promise<void> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('اسمح للتطبيق بالوصول إلى الصور حتى تتمكن من رفعها');
  }
}

export async function uploadImageAsset(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const blobResponse = await fetch(asset.uri);
  if (!blobResponse.ok) {
    throw new Error('تعذر قراءة الصورة المختارة من الجهاز');
  }

  const blob = await blobResponse.blob();
  const contentType = inferContentType(asset, blob);
  const size = asset.fileSize ?? blob.size ?? 0;

  validateImageAsset(contentType, size);

  const { uploadURL, objectPath } = await apiFetch<{ uploadURL: string; objectPath: string }>(
    endpoints.requestUploadUrl,
    {
      method: 'POST',
      body: JSON.stringify({
        name: buildFileName(asset, contentType),
        size,
        contentType,
      }),
    },
  );

  const putRes = await fetch(uploadURL, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!putRes.ok) {
    throw new Error('فشل رفع الصورة، حاول مرة أخرى');
  }

  return objectPath;
}

export async function uploadImageAssets(
  assets: ImagePicker.ImagePickerAsset[],
): Promise<string[]> {
  const uploaded: string[] = [];

  for (const asset of assets) {
    uploaded.push(await uploadImageAsset(asset));
  }

  return uploaded;
}

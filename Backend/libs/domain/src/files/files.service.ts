import { Injectable } from '@nestjs/common';
import { nanoid } from '../common/nanoid';

@Injectable()
export class FilesService {
  /**
   * R2 stub — returns a fake signed URL for local development.
   */
  async createUploadUrl(input: {
    contentType: string;
    filename?: string;
  }) {
    const key = `uploads/${nanoid(16)}/${input.filename ?? 'file'}`;
    return {
      uploadUrl: `https://r2.local/signed-put/${encodeURIComponent(key)}?contentType=${encodeURIComponent(input.contentType)}`,
      key,
      expiresIn: 900,
    };
  }

  publicUrlForKey(key: string | null | undefined): string | null {
    if (!key) return null;
    return `https://cdn.local/${key}`;
  }
}

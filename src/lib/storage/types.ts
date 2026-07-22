export interface ImageStorage {
  upload(file: File, path: string): Promise<void>;
  remove(paths: string[]): Promise<void>;
  getPublicUrl(path: string): string;
}

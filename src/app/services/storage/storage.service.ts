import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = inject(Storage);

  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(this.storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  async deleteFileByUrl(url: string) {
    if (!url) return;
    try {
      const fileRef = ref(this.storage, url);
      await deleteObject(fileRef);
    } catch (e) { console.error('Error eliminando archivo', e); }
  }
}

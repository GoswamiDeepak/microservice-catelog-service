export interface FileData {
    fileName: string;
    fileData: ArrayBuffer;
}
export interface FileStorage {
    upload(data: FileData): Promise<void>;
    delete(fileName: string): void;
    getObject(fileName: string): string;
}

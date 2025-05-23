import { create } from "zustand";

interface FileStore {
  isFileUploaded: boolean;
  fileStatusLastUpdated: number;
  setFileUploaded: (status: boolean) => void;
  updateFileStatus: (status: boolean) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  isFileUploaded: false,
  fileStatusLastUpdated: 0,
  setFileUploaded: (status) => set({ isFileUploaded: status }),
  updateFileStatus: (status) =>
    set({
      isFileUploaded: status,
      fileStatusLastUpdated: Date.now(),
    }),
}));

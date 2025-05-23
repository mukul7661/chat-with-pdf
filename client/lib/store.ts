import { create } from "zustand";

interface FileStore {
  isFileUploaded: boolean;
  setFileUploaded: (status: boolean) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  isFileUploaded: false,
  setFileUploaded: (status) => set({ isFileUploaded: status }),
}));

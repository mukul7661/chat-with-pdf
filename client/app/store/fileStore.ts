import { create } from "zustand";

interface FileState {
  isFileUploaded: boolean;
  setFileUploaded: (status: boolean) => void;
}

const useFileStore = create<FileState>((set) => ({
  isFileUploaded: false,
  setFileUploaded: (status) => set({ isFileUploaded: status }),
}));

export default useFileStore;

import { API_ENDPOINTS } from "../constants";

export async function uploadFiles(files: File[], chatId: string) {
  try {
    const formData = new FormData();

    // Append all files to the formData with the key 'pdfs'
    Array.from(files).forEach((file) => {
      formData.append("pdfs", file);
    });

    // Include the chat ID in the upload
    formData.append("chatId", chatId);

    const response = await fetch(API_ENDPOINTS.UPLOAD_PDFS, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error uploading files:`, error);
    throw error;
  }
}

export async function checkFileStatus(jobIds: string[]) {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.FILE_STATUS}?jobIds=${jobIds.join(",")}`
    );

    if (!response.ok) {
      throw new Error("Failed to check file status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking file status:", error);
    throw error;
  }
}

export async function checkFileStatusByChatId(chatId: string) {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.FILE_STATUS}?chatId=${chatId}`
    );

    if (!response.ok) {
      throw new Error("Failed to check file status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking file status:", error);
    throw error;
  }
}

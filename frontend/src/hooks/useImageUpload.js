import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

function useImageUpload() {
  const [loading, setLoading] = useState(false);

  const uploadImage = async (file) => {
    if (!file) return false;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be under 5MB");
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      await API.post("/profile/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Image upload failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, loading };
}

export default useImageUpload;
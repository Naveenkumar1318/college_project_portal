import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

function useResumeUpload() {
  const [loading, setLoading] = useState(false);

  const uploadResume = async (file) => {
    if (!file) return false;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resume must be under 10MB");
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      await API.post("/profile/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Resume upload failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { uploadResume, loading };
}

export default useResumeUpload;
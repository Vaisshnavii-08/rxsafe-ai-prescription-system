import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';

const UploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please choose a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);

      // ✅ Correct backend route
      const response = await axios.post(
        `${API_BASE_URL}/api/prescriptions/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const prescriptionId = response.data.prescriptionId;

      if (!prescriptionId) {
        toast.error("Upload succeeded but backend didn't return prescriptionId");
        return;
      }

      toast.success('Prescription uploaded successfully!');

      // Notify parent (PatientDashboard)
      if (onUploadSuccess) onUploadSuccess(prescriptionId);

    } catch (error) {
      toast.error(
        'Upload failed: ' +
        (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-all"
    >
      <input
        type="file"
        id="fileInput"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-3">
        {loading ? (
          <Loader2 className="w-10 h-10 text-medical-blue animate-spin" />
        ) : (
          <Upload className="w-10 h-10 text-medical-blue" />
        )}

        <p className="text-gray-700 text-sm">
          {file ? file.name : 'Click to choose or drag and drop your prescription'}
        </p>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-5 bg-medical-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-medical-accent transition-all disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Upload & Analyze'}
      </button>
    </form>
  );
};

export default UploadForm;

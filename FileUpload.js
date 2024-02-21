'use client'

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
var error_message = null;

const FileUpload = () => {
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const validateFile = (file) => {

        // Check file extension
        const allowedExtensions = getAllowedExtensions(file.type);
        const fileExtension = getFileExtension(file.name);
        if (!allowedExtensions.includes(fileExtension)) {
            console.error('File extension is not allowed.');
            error_message = 'File extension is not allowed.'
            return false;
        }

        // Check file size
        if (file.size > getMaxSize(file.type)) {
            console.error('File size exceeds the maximum limit.');
            error_message = 'File size exceeds the maximum limit.'
            return false;
        }

        return true;
    };

    const getMaxSize = (fileType) => {
        switch (fileType) {
            case 'video/avi':
            case 'video/webm':
            case 'video/mp4':
                return 250 * 1024 * 1024; // 250MB
            // case for pdf
            case 'application/pdf':
                return 270 * 1024 * 1024; // 270MB
            case 'image/tiff':
            case 'image/psd':
            case 'image/eps':
            case 'image/svg+xml':
            case 'image/webp':
                return 50 * 1024 * 1024; // 50MB
            case 'audio/mp4':
                return 50 * 1024 * 1024; // 50MB
            case 'text/plain':
            case 'application/rtf':
            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                return 50 * 1024 * 1024; // 50MB
            default:
                return 0;
        }
    };

    const getAllowedExtensions = (fileType) => {
        switch (fileType) {
            case 'video/avi':
            case 'video/mp4':
            case 'video/webm':
                return ['avi', 'webm', 'mp4'];
            case 'application/pdf':
                return ['pdf'];
            case 'image/tiff':
            case 'image/psd':
            case 'image/eps':
            case 'image/svg+xml':
            case 'image/webp':
                return ['tiff', 'psd', 'eps', 'svg', 'webp'];
            case 'audio/mp4':
                return ['m4a'];
            case 'text/plain':
            case 'application/rtf':
            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                return ['txt', 'rtf', 'ppt', 'pptx'];
            default:
                return [];
        }
    };

    const getFileExtension = (filename) => {
        return filename.split('.').pop().toLowerCase();
    };

    const uploadChunk = async (chunk, chunkIndex, totalChunks, fileName) => {
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunk_index', chunkIndex);
        formData.append('total_chunks', totalChunks);
        formData.append('file_name', fileName);

        try {
            const response = await axios.post('http://localhost:8000/api/v1/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    //setUploadProgress(progress);
                    setUploadProgress(chunkIndex);
                },
            });
            // Handle response if needed
        } catch (error) {
            console.error('Error uploading chunk:', error);
            // Handle error
            setUploadProgress(0);
            return;
        }
    };

    const onDrop = async (acceptedFiles) => {
        setFiles(acceptedFiles);
        error_message = null;

        // Chunk and upload each file
        acceptedFiles.forEach(async (file) => {
            if (validateFile(file)) {
                const totalChunks = Math.ceil(file.size / MAX_CHUNK_SIZE);
                let start = 0;
                let end = MAX_CHUNK_SIZE;

                for (let chunkIndex = 1; chunkIndex <= totalChunks; chunkIndex++) {
                    const chunk = file.slice(start, end);
                    await uploadChunk(chunk, chunkIndex, totalChunks, file.name);
                    start = end;
                    end = start + MAX_CHUNK_SIZE;

                    if (chunkIndex === totalChunks) {
                        setUploadProgress(100);
                    }
                }
            }
            else {
                alert("File type not allowed");
                const file = acceptedFiles[0];
            }
        });
    };

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <div>
            <div {...getRootProps()} style={dropzoneStyles}>
                <input {...getInputProps()} />
                <p>Drag & drop some files here, or click to select files</p>
            </div>
            {files.length > 0 && (
                <div>
                    <h4>Selected Files:
                        {files.map((file) => (
                            <div key={file.name}>
                                <p>{file.name}</p>
                            </div>
                        ))}</h4>
                </div>
            )}
            {uploadProgress > 1 && (
                <div>
                    <h4>Upload Progress: {uploadProgress}%</h4>
                    <progress value={uploadProgress} max="100" />
                </div>
            )}
            {error_message && <p className="text-red-500 text-left">{error_message}</p>}
        </div>
    );
};

const dropzoneStyles = {
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
};

export default FileUpload;

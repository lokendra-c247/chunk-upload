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

        //download the chunks on the local
        const chunks = createFileChunks(chunk, MAX_CHUNK_SIZE);

        const onUploadProgress = (progressEvent) => {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(progress);
        };

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunk_index', chunkIndex);
        formData.append('total_chunks', totalChunks);
        formData.append('file_name', fileName);

        if (chunkIndex == 1) {
            try {
                const response = await axios.post('https://yatara-dev.s3.ca-central-1.amazonaws.com/large-file.pptx?uploadId=uzx4h_zLqNv8h1E2MitADqp8txi8rN1vnDsL1PFARWMmUiR5jdR8wsVctFYle..b7P5RDfkpAPaICIh6HgG2EgTtpNfaiMwm.QwKwCjYqyxQfA19htRPeWSuwvFm8de.u8rOPE_PJ5fwOe2eN9kcNQq05wqs2n8vgxF5kYTSL5k-&partNumber=1&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEOb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDGNhLWNlbnRyYWwtMSJGMEQCIFCqC0HU0sUmI4kiGJ7twntAQ38qKbe7oqNVofhimQb0AiBTKW4rugVnjCE85q0gqxOXvlMSRx6YKc1i14aZO7yRCyrNBQjQ%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDg4NDkyNzEzODY0MSIMYOMxrHQmJoCKAFlJKqEFXiBeMDQgm%2F1IHJgS62Nv56uvDjJ0fX9QxsrVUDFyFrrikx1y7%2FnzY%2B7SGOiWd0w989gLQ685XYConsxjN7eoMV9Ws565js2zWp6BFUdy5%2Fwn4a9hVLZ5Qg1bMnyrepNd0JEfBevVLsMDvzicdVFwR7CTs259fjlBGf8STw%2F182LJhBaryXLJ7Kyvp0%2FhMHbDrlw4K3O%2F2Hiu%2FD38ViH33tdwOR3dKOaPh00DyoNirQYxYP55UGfkwixR7nFy%2BUBhQvx%2F9UEXZEEzRH9jerwxjHxV87qC%2Fqsf1uOCNhegXEvJtkohJk2689BRG7qzU1Muq6j2GjiZszy5hvHCNPR%2F69K%2BfkPc09Gkf38MtpfdlNx1ypPJVX%2BQLv625WwFkKGWjzxJwLwg4PT1PjTk%2FAnAT47zCCvd1rmqIpC0qrFyZGvFV4gZhcXcUXJmrUQ%2Bfwetq8WfYagKIxkSQ9kuDRXNXVE2BJ7dtgj8TSmAQb%2FeaJHmr4AG1vmgosAGFL8OJpr%2F%2Ftw0J4jZaiqy1ST7%2FKzxl2pUMVUjxAZ7TxekHyHIzC1boTCN6jAakDJD9SXcuvP1U6mUTfPmtEnGX9EYL%2B6x5MfRSIhq7R20QkZVbSxtkywwYnB7OnEr4XH8lEcVPNnS1iYndpG0Vf6iRwIAIOQKyBzgxNJy7OwIkMxlD567fTqP9LujcDRQL6kUl58kBkzQiJcXpAITJCkkyJk03rU9M6TQd9cKtoIfSSvjlBs0pVKm5kMsYYyDmN4sbpGws1moovESaEezRdUZ7PqmiUkZTk%2FI7vkFi1ZRogbjUuz7R3e84UxqX%2BPjTU72NcBMo12FR3xlhqcfM0VIqITcnFyRtj5JkLGqGDUmbeORERMYfJWWeRjezKo9%2BcIYsZlUYoSzVTCKg%2FauBjqyAVszMwMVh%2BSgJBRGMNASZ3tsKNrTTThWl5qu5cCE%2B9k6%2BpObh1IBfZ%2BiZENqaBAnSiCDAJKImuGpxSUZxNjhVEOy8NEkhY2Ha6gXk%2F9bT6a2ijGJD3eV28WUfyNXd4rPCId4NsGlX8W1fZO3Af4qKm9DSJOLFW2%2BPrfFbpyQyD1umq4zRspU14klfZYjwtDAdiwpuRlu%2BPsZqbsfYzUGkEY6%2FcpoFUjfhaUeN5lzYlRBCFc%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIA44COERNITX6SN7KM%2F20240227%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20240227T071616Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Signature=5432a05c1b3fc0a362e875ed0d4d88dce3829bbc53d4604126cbc3c3ef13f8a4', formData, {
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
        }

        if (chunkIndex == 2) {
            try {
                const response = await axios.post('https://yatara-dev.s3.ca-central-1.amazonaws.com/large-file.pptx?uploadId=uzx4h_zLqNv8h1E2MitADqp8txi8rN1vnDsL1PFARWMmUiR5jdR8wsVctFYle..b7P5RDfkpAPaICIh6HgG2EgTtpNfaiMwm.QwKwCjYqyxQfA19htRPeWSuwvFm8de.u8rOPE_PJ5fwOe2eN9kcNQq05wqs2n8vgxF5kYTSL5k-&partNumber=2&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEOb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDGNhLWNlbnRyYWwtMSJGMEQCIFCqC0HU0sUmI4kiGJ7twntAQ38qKbe7oqNVofhimQb0AiBTKW4rugVnjCE85q0gqxOXvlMSRx6YKc1i14aZO7yRCyrNBQjQ%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDg4NDkyNzEzODY0MSIMYOMxrHQmJoCKAFlJKqEFXiBeMDQgm%2F1IHJgS62Nv56uvDjJ0fX9QxsrVUDFyFrrikx1y7%2FnzY%2B7SGOiWd0w989gLQ685XYConsxjN7eoMV9Ws565js2zWp6BFUdy5%2Fwn4a9hVLZ5Qg1bMnyrepNd0JEfBevVLsMDvzicdVFwR7CTs259fjlBGf8STw%2F182LJhBaryXLJ7Kyvp0%2FhMHbDrlw4K3O%2F2Hiu%2FD38ViH33tdwOR3dKOaPh00DyoNirQYxYP55UGfkwixR7nFy%2BUBhQvx%2F9UEXZEEzRH9jerwxjHxV87qC%2Fqsf1uOCNhegXEvJtkohJk2689BRG7qzU1Muq6j2GjiZszy5hvHCNPR%2F69K%2BfkPc09Gkf38MtpfdlNx1ypPJVX%2BQLv625WwFkKGWjzxJwLwg4PT1PjTk%2FAnAT47zCCvd1rmqIpC0qrFyZGvFV4gZhcXcUXJmrUQ%2Bfwetq8WfYagKIxkSQ9kuDRXNXVE2BJ7dtgj8TSmAQb%2FeaJHmr4AG1vmgosAGFL8OJpr%2F%2Ftw0J4jZaiqy1ST7%2FKzxl2pUMVUjxAZ7TxekHyHIzC1boTCN6jAakDJD9SXcuvP1U6mUTfPmtEnGX9EYL%2B6x5MfRSIhq7R20QkZVbSxtkywwYnB7OnEr4XH8lEcVPNnS1iYndpG0Vf6iRwIAIOQKyBzgxNJy7OwIkMxlD567fTqP9LujcDRQL6kUl58kBkzQiJcXpAITJCkkyJk03rU9M6TQd9cKtoIfSSvjlBs0pVKm5kMsYYyDmN4sbpGws1moovESaEezRdUZ7PqmiUkZTk%2FI7vkFi1ZRogbjUuz7R3e84UxqX%2BPjTU72NcBMo12FR3xlhqcfM0VIqITcnFyRtj5JkLGqGDUmbeORERMYfJWWeRjezKo9%2BcIYsZlUYoSzVTCKg%2FauBjqyAVszMwMVh%2BSgJBRGMNASZ3tsKNrTTThWl5qu5cCE%2B9k6%2BpObh1IBfZ%2BiZENqaBAnSiCDAJKImuGpxSUZxNjhVEOy8NEkhY2Ha6gXk%2F9bT6a2ijGJD3eV28WUfyNXd4rPCId4NsGlX8W1fZO3Af4qKm9DSJOLFW2%2BPrfFbpyQyD1umq4zRspU14klfZYjwtDAdiwpuRlu%2BPsZqbsfYzUGkEY6%2FcpoFUjfhaUeN5lzYlRBCFc%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIA44COERNITX6SN7KM%2F20240227%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20240227T071616Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Signature=a2754d6a718dee4a278d65c0edce8d475172163b2b78d07d0855c18922b3a813', formData, {
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
        }

    };

    // Function to divide a file into chunks
    function createFileChunks(file, chunkSize) {
        const chunks = [];
        let offset = 0;

        while (offset < file.size) {
            const chunk = file.slice(offset, offset + chunkSize);
            chunks.push(chunk);
            offset += chunkSize;
        }

        // download the chunk file on local 
        const fileNew = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(fileNew);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileNew.name;
        link.click();


        return chunks;
    }

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

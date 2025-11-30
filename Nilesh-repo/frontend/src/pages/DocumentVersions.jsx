import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { FileText, Download, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/button';

const DocumentVersions = () => {
  const { id } = useParams(); // conversation ID
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Document');

  useEffect(() => {
    const fetchDocumentVersions = async () => {
      try {
        const response = await axios.get(`api/documents/conversations/${id}/`);
        setDocumentTitle(response.data.title || 'Document');
        setVersions(response.data.document_versions || []);
      } catch (err) {
        console.error('Error fetching document versions:', err);
        setError('Failed to load document versions.');
        toast.error('Failed to load document versions.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentVersions();
  }, [id]);

  const handleDownloadVersionPdf = async (versionNumber) => {
    try {
      const response = await axios.get(`utils/conversations/${id}/versions/${versionNumber}/download-pdf/`, {
        responseType: 'blob', // Important for downloading files
      });
      const filename = `${documentTitle}_v${versionNumber}.pdf`;
      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, filename);
      toast.success(`Version ${versionNumber} PDF downloaded!`);
    } catch (err) {
      console.error(`Error downloading version ${versionNumber} PDF:`, err);
      toast.error(`Failed to download version ${versionNumber} PDF.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center text-blue-600 text-xl font-medium">
          <History className="w-6 h-6 animate-spin mr-3" />
          Loading document versions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-red-600 text-xl font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
            <History className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-xs font-medium">Version History</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Document Versions
          </h1>
          <p className="text-gray-400">
            Viewing versions for: <span className="font-medium text-blue-400">{documentTitle}</span>
          </p>
        </div>

        {versions.length === 0 ? (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-12 text-center">
            <History className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No versions found for this document.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {versions.map((version, index) => (
              <Card 
                key={version.version_number} 
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600 transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white mb-1">Version {version.version_number}</h2>
                    <p className="text-gray-400 text-xs">
                      Created: {new Date(version.timestamp).toLocaleDateString()} {new Date(version.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownloadVersionPdf(version.version_number)}
                      className="bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 text-sm"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      <span>PDF</span>
                    </Button>
                    <Button
                      onClick={() => navigate(`/document-creation/${id}?version=${version.version_number}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 text-sm"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVersions;

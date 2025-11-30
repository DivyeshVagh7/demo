import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { FileText, Download, Trash2, History, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { Button } from "@/Components/ui/button";

const VersionsSidebar = ({ conversationId, onSelectVersion, onClose, currentVersion, onDeleteVersion }) => { // Added onDeleteVersion prop
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Document');

  const fetchDocumentVersions = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/documents/conversations/${conversationId}/`);
      setDocumentTitle(response.data.title || 'Document');
      setVersions(response.data.document_versions || []);
    } catch (err) {
      console.error('Error fetching document versions:', err);
      setError('Failed to load document versions.');
      toast.error('Failed to load document versions.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchDocumentVersions();
  }, [conversationId, fetchDocumentVersions]);

  const handleDownloadVersionPdf = async (versionNumber) => {
    try {
      const response = await axios.get(`utils/conversations/${conversationId}/versions/${versionNumber}/download-pdf/`, {
        responseType: 'blob',
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

  const handleDeleteVersionClick = async (versionNumber) => { // Renamed to avoid conflict with prop
    if (onDeleteVersion) {
      await onDeleteVersion(conversationId, versionNumber);
      fetchDocumentVersions(); // Re-fetch versions after deletion
    }
  };

  return (
    <>
      <div className="p-4 border-b border-border/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-primary" />
          <span className="text-foreground font-semibold text-sm">Version History</span>
        </div>
        <button 
          onClick={() => onClose()} 
          className="p-2 hover:bg-foreground/10 rounded-lg transition-all text-muted-foreground cursor-pointer"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <History className="w-6 h-6 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading versions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-destructive text-center py-8 text-sm px-3">
            <p>{error}</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No versions found.</p>
          </div>
        ) : (
          versions.map((version) => {
            const isCurrentVersion = currentVersion === version.version_number;
            return (
              <div
                key={version.version_number}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isCurrentVersion
                    ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10'
                    : 'bg-card/40 border-border/50 hover:border-border/80 hover:bg-card/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-sm truncate">
                          Version {version.version_number}
                        </h3>
                        {isCurrentVersion && (
                          <Check className="w-4 h-4 text-accent flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        {new Date(version.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => onSelectVersion(version.version_number)}
                    size="sm"
                    className={`flex-1 text-xs font-medium rounded-lg transition-all ${
                      isCurrentVersion
                        ? 'bg-primary hover:bg-primary/80 text-foreground'
                        : 'bg-primary/80 hover:bg-primary text-foreground'
                    }`}
                  >
                    <FileText className="w-3 h-3 mr-1.5" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDownloadVersionPdf(version.version_number)}
                    size="sm"
                    variant="outline"
                    className="border-border/20 bg-card/40 hover:bg-card/60 hover:border-border/30 text-muted-foreground text-xs rounded-lg transition-all px-2"
                    title="Download PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteVersionClick(version.version_number)} // Call the new handler
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs rounded-lg transition-all px-2"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default VersionsSidebar;
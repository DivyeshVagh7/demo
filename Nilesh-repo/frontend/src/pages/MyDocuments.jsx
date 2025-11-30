import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { FileText, History, Download, Trash2, PlusCircle, Share2, Search, Filter, SortAsc } from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/Components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/Tabs";
import { Edit, Save, XCircle } from 'lucide-react';
import ShareModal from '../Components/ShareModal';
import { useAuth } from '../context/AuthContext';

const MyDocuments = () => {
  const { user } = useAuth();
  const [myDocumentsList, setMyDocumentsList] = useState([]);
  const [sharedWithMeDocumentsList, setSharedWithMeDocumentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [editingDocId, setEditingDocId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('my_documents');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/documents/conversations/');
      const allDocuments = response.data;

      const owned = [];
      const shared = [];

      allDocuments.forEach(doc => {
        if (doc.owner === user.username) {
          owned.push(doc);
        } else {
          const isSharedWithMe = doc.shared_with_users?.some(
            sharedUser => sharedUser.username === user.username
          );
          if (isSharedWithMe) {
            shared.push(doc);
          }
        }
      });

      setMyDocumentsList(owned);
      setSharedWithMeDocumentsList(shared);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents.');
      toast.error('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  const handleViewDocument = (documentId) => {
    navigate(`/document-creation/${documentId}`);
  };

  const handleDownloadPdf = async (documentId, title) => {
    try {
      const response = await axios.get(`api/utils/conversations/${documentId}/download-latest-pdf/`, {
        responseType: 'blob',
      });
      const { saveAs } = await import('file-saver');
      saveAs(response.data, `${title || 'legal_document'}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download PDF.');
    }
  };

  const handleEditClick = (docId, currentTitle) => {
    setEditingDocId(docId);
    setNewTitle(currentTitle);
  };

  const handleSaveTitle = async (docId) => {
    if (!newTitle.trim()) {
      toast.error('Document title cannot be empty.');
      return;
    }
    try {
      await axios.put(`api/documents/conversations/${docId}/`, { title: newTitle });
      toast.success('Document title updated!');
      setEditingDocId(null);
      setNewTitle('');
      fetchDocuments();
    } catch (err) {
      console.error('Error updating document title:', err);
      toast.error('Failed to update document title.');
    }
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    setNewTitle('');
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document and all its versions? This action cannot be undone.')) {
      try {
        await axios.delete(`api/documents/conversations/${documentId}/`);
        toast.success('Document deleted successfully!');
        fetchDocuments();
      } catch (err) {
        console.error('Error deleting document:', err);
        toast.error('Failed to delete document.');
      }
    }
  };

  const handleShareDocument = (doc) => {
    setSelectedDoc(doc);
    setIsShareModalOpen(true);
  };

  const filteredMyDocuments = myDocumentsList.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSharedDocuments = sharedWithMeDocumentsList.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      {isShareModalOpen && selectedDoc && (
        <ShareModal
          documentId={selectedDoc._id}
          documentTitle={selectedDoc.title}
          initialSharedWithUsers={selectedDoc.shared_with_users || []}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
              My Documents
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and organize your legal documents efficiently
            </p>
          </div>
          <Button
            onClick={() => navigate('/document-creation')}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-foreground px-8 py-6 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-lg font-semibold"
          >
            <PlusCircle className="w-6 h-6 mr-2" />
            Create New Document
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-card/40 border-border/50 backdrop-blur-sm h-12 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          {/* Future: Add Filter and Sort buttons here */}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-card/40 backdrop-blur-sm border border-border/50 p-1 rounded-xl w-full sm:w-auto inline-flex">
            <TabsTrigger
              value="my_documents"
              className="px-8 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              My Documents
            </TabsTrigger>
            <TabsTrigger
              value="shared_with_me"
              className="px-8 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              Shared with Me
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my_documents" className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground animate-pulse">Loading your documents...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-destructive/10 rounded-2xl border border-destructive/20">
                <p className="text-destructive font-medium">{error}</p>
              </div>
            ) : filteredMyDocuments.length === 0 ? (
              <div className="text-center py-20 bg-card/40 backdrop-blur-sm rounded-3xl border border-border/50 border-dashed">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {searchQuery ? "No documents match your search query." : "Get started by creating your first legal document with our AI assistant."}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => navigate('/document-creation')}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10 px-8 py-6 rounded-xl text-lg"
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Create Document
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredMyDocuments.map((doc) => (
                  <Card key={doc._id} className="group bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden rounded-2xl">
                    <CardHeader className="pb-4 relative">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={() => handleShareDocument(doc)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      {editingDocId === doc._id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="h-8 text-lg font-bold bg-background/50"
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle(doc._id)}
                          />
                          <Button size="icon" variant="ghost" onClick={() => handleSaveTitle(doc._id)} className="h-8 w-8 text-green-500">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8 text-muted-foreground">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/title">
                          <CardTitle className="text-xl font-bold truncate" title={doc.title}>
                            {doc.title}
                          </CardTitle>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditClick(doc._id, doc.title)}
                            className="h-6 w-6 opacity-0 group-hover/title:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      <CardDescription className="text-xs font-medium mt-1">
                        Last modified: {new Date(doc.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>

                    <div className="mt-auto p-6 pt-0 flex gap-3">
                      <Button
                        onClick={() => handleViewDocument(doc._id)}
                        className="flex-1 bg-primary/10 text-primary transition-colors font-medium"
                      >
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownloadPdf(doc._id, doc.title)}
                        className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc._id)}
                        className="border-border/50 hover:border-destructive/50 hover:bg-destructive/5 text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared_with_me" className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground animate-pulse">Loading shared documents...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-destructive/10 rounded-2xl border border-destructive/20">
                <p className="text-destructive font-medium">{error}</p>
              </div>
            ) : filteredSharedDocuments.length === 0 ? (
              <div className="text-center py-20 bg-card/40 backdrop-blur-sm rounded-3xl border border-border/50 border-dashed">
                <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Share2 className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No shared documents</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Documents shared with you by other users will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSharedDocuments.map((doc) => (
                  <Card key={doc._id} className="group bg-card/40 backdrop-blur-md border-border/50 hover:border-secondary/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden rounded-2xl">
                    <CardHeader className="pb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Share2 className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold truncate" title={doc.title}>
                          {doc.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg w-fit">
                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                        Shared by <span className="font-semibold text-foreground">{doc.owner}</span>
                      </div>
                    </CardHeader>

                    <div className="mt-auto p-6 pt-0 flex gap-3">
                      <Button
                        onClick={() => navigate(`/documentShare/${doc._id}`)}
                        className="flex-1 bg-secondary/10 text-secondary transition-colors font-medium"
                      >
                        View Shared
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownloadPdf(doc._id, doc.title)}
                        className="border-border/50 hover:border-secondary/50 hover:bg-secondary/5"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyDocuments;

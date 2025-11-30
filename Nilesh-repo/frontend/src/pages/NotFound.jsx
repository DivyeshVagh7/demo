import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion, Sparkles } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-background items-center justify-center p-6 overflow-hidden">
            {/* Animated background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div
                    className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: '2s', animationDuration: '4s' }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: '1s', animationDuration: '5s' }}
                />
            </div>

            <div className="relative z-10 max-w-2xl w-full text-center animate-fade-in-up">
                {/* 404 Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary rounded-full opacity-30 blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                        <div className="relative p-8 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 rounded-full border-2 border-primary/40 shadow-lg shadow-primary/20">
                            <FileQuestion className="w-24 h-24 text-primary drop-shadow-lg" />
                        </div>
                    </div>
                </div>

                {/* 404 Text */}
                <h1 className="text-8xl md:text-9xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">404</span>
                </h1>

                <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
                    Page Not Found
                </h2>

                <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                    Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-card/50 border border-border/50 text-foreground rounded-xl font-medium hover:bg-card/70 hover:border-border transition-all duration-200 flex items-center gap-2 min-w-[160px] justify-center"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Go Back</span>
                    </button>

                    <Link
                        to="/"
                        className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-foreground rounded-xl font-medium hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 flex items-center gap-2 min-w-[160px] justify-center"
                    >
                        <Home className="w-5 h-5" />
                        <span>Home Page</span>
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-12 p-6 bg-card/30 backdrop-blur-xl rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2 justify-center mb-4">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link
                            to="/document-analyser"
                            className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 hover:border-primary/50 transition-all duration-200"
                        >
                            Document Analyzer
                        </Link>
                        <Link
                            to="/document-creation"
                            className="px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 hover:border-accent/50 transition-all duration-200"
                        >
                            Create Document
                        </Link>
                        <Link
                            to="/lawyer-connect"
                            className="px-4 py-2 bg-secondary/10 border border-secondary/30 text-secondary rounded-lg text-sm font-medium hover:bg-secondary/20 hover:border-secondary/50 transition-all duration-200"
                        >
                            Find Lawyers
                        </Link>
                        <Link
                            to="/my-documents"
                            className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 hover:border-primary/50 transition-all duration-200"
                        >
                            My Documents
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
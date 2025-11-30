"use client"

import { ArrowRight, Shield, FileText, Zap, CheckCircle2, Sparkles, ArrowUpRight, X } from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Link } from "react-router-dom"
import React, { useState, Suspense } from "react"
import Navbar from "@/Components/Navbar/Navbar" // Import the new Navbar component

import { useAuth } from '../context/AuthContext'; // Import useAuth

const Subtle3DBackground = React.lazy(() => import("../Components/Subtle3DBackground.jsx"))

export default function Home() {
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [activeDemo, setActiveDemo] = useState("analyzer")
  const { isAuthenticated } = useAuth(); // Get isAuthenticated from AuthContext
  // isLoggedIn, showProfileMenu, profileMenuRef, navigate, isAuthenticated, user, logout, handleProtectedNavClick are now handled by Navbar component

  const featureDetails = {
    analyzer: {
      title: "AI Document Analyzer",
      description:
        "Transform complex legal documents into clear, actionable insights with our advanced AI-powered analysis engine.",
      features: [
        "Instant clause-by-clause breakdown",
        "Risk flagging and liability alerts",
        "Ask follow-up questions about any document",
      ],
    },
    creator: {
      title: "Smart Document Creator",
      description:
        "Generate custom legal documents through an intuitive AI-powered chatbot. Describe what you need and edit through natural conversation.",
      features: [
        "Conversational document generation",
        "Edit through natural chat interaction",
        "Download, edit, or regenerate instantly",
      ],
    },
    timeline: {
      title: "Document History Timeline",
      description:
        "Track every change made to your documents with a clear, chronological timeline and restore any previous version instantly.",
      features: [
        "Complete version history with timestamps",
        "Instantly restore any previous version",
        "Track changes made to your documents",
      ],
    },
    signature: {
      title: "Secure E-Signature",
      description:
        "Sign documents with complete legal validity and security. Compliant with eIDAS, ESIGN Act, and other global regulations.",
      features: [
        "Legally binding digital signatures",
        "Multi-party signature workflows",
        "Bank-level encryption and audit trail",
      ],
    },
    "gen-track-sign": {
      title: "Generate, Track & Sign",
      description:
        "Create custom documents with AI, track every version change in real-time, and collect legally binding e-signatures from multiple parties. Manage your entire document lifecycle in one platform.",
      features: [
        "AI-powered custom document creation",
        "Complete version history with timestamps",
        "Legally binding e-signatures & verification",
        "Edit and regenerate with AI suggestions",
      ],
    },
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <Suspense fallback={null}>
          <Subtle3DBackground />
        </Suspense>
      </div>

      <div className="relative z-10">

        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute -bottom-20 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>

          <div className="relative w-full px-4 sm:px-6 lg:px-8"> {/* Changed to w-full */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary border border-primary/20 rounded-full">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-white">AI-Powered Legal Revolution</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black leading-tight text-balance">
                  Master Legal Docs in
                  <span className="block bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
                    Seconds, Not Hours
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Stop struggling with confusing contracts. Our AI instantly simplifies legal jargon, flags risks,
                  generates custom legal documents, and connects you with expert lawyers when you need them.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {isAuthenticated ? (
                    <>
                      <Button
                        size="lg"
                        className="gap-2 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 text-white font-bold text-base px-8"
                        asChild
                      >
                        <Link to="/document-creation">
                          Document Generation <ArrowRight className="w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-muted-foreground/30 font-bold text-base px-8 bg-transparent"
                        asChild
                      >
                        <Link to="/document-analyzer">Document Analyzer</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="gap-2 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 text-white font-bold text-base px-8"
                        asChild
                      >
                        <Link to="/signup">
                          Sign Up <ArrowRight className="w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-muted-foreground/30 font-bold text-base px-8 bg-transparent"
                        asChild
                      >
                        <Link to="/login">Sign In</Link>
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-6 pt-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>No card needed</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-1 border border-primary/30">
                  <div className="bg-card rounded-xl overflow-hidden border border-primary/10">
                    {/* Toggle Buttons */}
                    <div className="flex border-b border-primary/10">
                      <button
                        onClick={() => setActiveDemo("analyzer")}
                        className={`flex-1 px-6 py-3 text-sm font-bold transition-all ${activeDemo === "analyzer"
                          ? "bg-gradient-to-r from-primary to-secondary text-white"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Document Analysis
                      </button>
                      <button
                        onClick={() => setActiveDemo("creator")}
                        className={`flex-1 px-6 py-3 text-sm font-bold transition-all ${activeDemo === "creator"
                          ? "bg-gradient-to-r from-primary to-secondary text-white"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Document Generator
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 space-y-4 min-h-64">
                      {activeDemo === "analyzer" ? (
                        <>
                          <div className="flex items-center gap-3 pb-4 border-b border-primary/20">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-lg">Document Analysis</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                              <ArrowUpRight className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium">Clauses decoded instantly</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                              <Shield className="w-5 h-5 text-secondary flex-shrink-0" />
                              <span className="text-sm font-medium">Risk alerts highlighted</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                              <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium">Key terms simplified</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 pb-4 border-b border-secondary/20">
                            <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-lg">Document Generator</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                              <Zap className="w-5 h-5 text-secondary flex-shrink-0" />
                              <span className="text-sm font-medium">AI-powered document creation</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                              <ArrowUpRight className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium">Chat-based editing interface</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                              <FileText className="w-5 h-5 text-secondary flex-shrink-0" />
                              <span className="text-sm font-medium">Instant download & regenerate</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features-detailed"
          className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-border" // Changed to w-full
        >
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
                Core Capabilities
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Powerful Features That Work Together</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every tool you need to master legal documents, from AI analysis to secure collaboration.
            </p>
          </div>

          {/* Feature 1: AI-Powered Document Analyzer */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative order-2 md:order-1 cursor-pointer" onClick={() => setSelectedFeature("analyzer")}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-1 border border-primary/30 overflow-hidden">
                <div className="relative bg-gradient-to-br from-primary/5 via-card to-secondary/5 rounded-xl h-64 flex flex-col items-center justify-center gap-6 p-8">
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-primary">Document Analysis Engine</p>
                    <p className="text-xs text-muted-foreground">AI-powered clause detection</p>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 h-2 bg-primary/40 rounded-full"></div>
                      <span className="text-xs text-primary font-mono">100%</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-2 bg-secondary/40 rounded-full"></div>
                      <span className="text-xs text-secondary font-mono">5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div>
                <h3 className="text-3xl md:text-4xl font-black mb-3 text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
                  AI Document Analyzer
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Transform complex legal documents into clear, actionable insights. Our advanced AI reads through pages
                  of dense legal text and instantly highlights key terms, identifies risks, and provides plain-English
                  summaries. Say goodbye to hours of frustrating document review.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Instant clause-by-clause breakdown</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Risk flagging and liability alerts</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Ask follow-up questions about any document</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2: Smart Document Creator */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6 order-1 md:order-1">
              <div>
                <h3 className="text-3xl md:text-4xl font-black mb-3 text-transparent bg-gradient-to-r from-secondary to-primary bg-clip-text">
                  Smart Document Creator
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Generate custom legal documents through an intuitive AI-powered chatbot. Describe exactly what you
                  need, and our AI creates a tailored document. Edit, refine, and regenerate using natural conversation
                  until your document is perfect.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Conversational document generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Edit through natural chat interaction</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Download, edit, or regenerate instantly</span>
                </li>
              </ul>
            </div>
            <div
              className="relative group cursor-pointer order-2 md:order-2"
              onClick={() => setSelectedFeature("creator")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-1 border border-secondary/30 overflow-hidden">
                <div className="relative bg-gradient-to-b from-card via-card/50 to-card rounded-xl p-6 h-64 flex flex-col justify-end gap-3">
                  <div className="space-y-3">
                    <div className="flex gap-2 justify-start">
                      <div className="bg-primary/20 rounded-lg px-4 py-2 text-xs text-primary max-w-[70%]">
                        Create a contract...
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <div className="bg-secondary/20 rounded-lg px-4 py-2 text-xs text-secondary max-w-[70%]">
                        Processing...
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div
                        className="w-3 h-3 bg-secondary rounded-full animate-bounce"
                        style={{ animationDelay: "0s" }}
                      ></div>
                      <div
                        className="w-3 h-3 bg-secondary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-3 h-3 bg-secondary rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Document History Timeline */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div
              className="relative group order-2 md:order-1 cursor-pointer"
              onClick={() => setSelectedFeature("timeline")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-1 border border-primary/30 overflow-hidden">
                <div className="relative bg-gradient-to-br from-card to-card/80 rounded-xl p-6 h-64 flex flex-col justify-center gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">Current v1.2.3</p>
                        <p className="text-xs text-muted-foreground">Now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-70">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Previous v1.2.2</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-50">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Previous v1.2.1</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div>
                <h3 className="text-3xl md:text-4xl font-black mb-3 text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
                  Document History Timeline
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Track every change made to your documents with a clear, chronological timeline. Access all previous
                  versions of your documents with timestamps, see exactly what was modified, and instantly restore any
                  earlier version with a single click.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Complete version history with timestamps</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Instantly restore any previous version</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Track changes made to your documents</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 4: Secure E-Signature */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6 order-1 md:order-1">
              <div>
                <h3 className="text-3xl md:text-4xl font-black mb-3 text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
                  Secure E-Signature
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Sign documents with complete legal validity and security. Our e-signature solution is compliant with
                  eIDAS, ESIGN Act, and other global regulations. Send signature requests to multiple parties, track
                  completion status, and store signed documents securely.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Legally binding digital signatures</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Multi-party signature workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Bank-level encryption and audit trail</span>
                </li>
              </ul>
            </div>
            <div
              className="relative group cursor-pointer order-2 md:order-2"
              onClick={() => setSelectedFeature("signature")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-1 border border-primary/30 overflow-hidden">
                <div className="relative bg-gradient-to-b from-card to-card/50 rounded-xl p-8 h-64 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-primary">DOCUMENT SIGNATURE</p>
                    <p className="text-sm text-muted-foreground">Legal Agreement v1.2</p>
                  </div>
                  <div className="border-2 border-dashed border-primary/30 rounded-lg h-20 flex items-center justify-center bg-primary/5">
                    <div className="text-center">
                      <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-xs text-primary font-mono">Sign here</p>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-lg hover:shadow-lg transition">
                    Sign Document
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 5: Document Generator with Version Tracking & E-Signature */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20 border-t border-border pt-20">
            <div
              className="relative group cursor-pointer order-2 md:order-1"
              onClick={() => setSelectedFeature("gen-track-sign")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-1 border border-secondary/30 overflow-hidden">
                <div className="relative bg-gradient-to-b from-card via-card/50 to-card rounded-xl p-6 h-64 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-secondary">DOCUMENT GENERATOR</span>
                    <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">v1.2.3</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-2 bg-orange-400/40 rounded-full"></div>
                    <span className="text-xs text-orange-400 font-mono">Version 3</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 bg-lime-400/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-lime-400" />
                    </div>
                    <span className="text-xs text-lime-400">3 Signatures Verified</span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-primary/20">
                    <p className="text-xs text-muted-foreground text-center">Last edited 2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div>
                <h3 className="text-3xl md:text-4xl font-black mb-3 text-transparent bg-gradient-to-r from-secondary to-primary bg-clip-text">
                  Generate, Track & Sign
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Create custom documents with AI, track every version change in real-time, and collect legally binding
                  e-signatures from multiple parties. Manage your entire document lifecycle in one platform.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">AI-powered custom document creation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Complete version history with timestamps</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Legally binding e-signatures & verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground">Edit and regenerate with AI suggestions</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-border"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Three Simple Steps to Mastery</h2>
            <p className="text-lg text-muted-foreground">From analysis to generation to signature in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                number: "01",
                title: "Analyze or Generate",
                description:
                  "Upload documents for instant AI analysis or create new ones from scratch with our intelligent generator.",
                color: "from-primary",
              },
              {
                number: "02",
                title: "Version & Edit",
                description:
                  "Make edits, request AI-powered changes, and track every version with complete revision history.",
                color: "from-secondary",
              },
              {
                number: "03",
                title: "Sign & Deliver",
                description:
                  "Collect legally binding e-signatures from all parties with verification and secure audit trails.",
                color: "from-primary",
              },
            ].map((step, idx /* eslint-disable-line no-unused-vars */) => (
              <div key={step.number} className="relative group">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${step.color} to-transparent opacity-0 group-hover:opacity-10 transition-opacity rounded-xl`}
                ></div>
                <div className="relative border border-primary/20 rounded-xl p-8 group-hover:border-primary/40 transition-colors">
                  <div
                    className={`text-6xl font-black bg-gradient-to-r ${step.color} to-secondary bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform`}
                  >
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
          </div>
          <div className="w-full px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            <div className="grid md:grid-cols-5 gap-12 mb-12">
              {/* Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/advoc-ai-logo.png" alt="Advoc AI" className="h-8" />
                  <span className="text-white font-black text-sm">Advoc AI</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Master legal documents with AI-powered analysis, generation, and secure e-signatures.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground mb-4">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Features
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Pricing
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Security
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground mb-4">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      About
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Blog
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Contact
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Privacy
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Terms
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Disclaimer
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">&copy; 2025 Advoc AI. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <span className="text-xs text-muted-foreground">Built with AI for legal professionals</span>
              </div>
            </div>
          </div>
        </footer>

        {selectedFeature && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedFeature(null)}
          >
            <div
              className="bg-card border border-primary/30 rounded-2xl max-w-2xl w-full p-8 space-y-6 relative max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedFeature(null)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>

              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                  {featureDetails[selectedFeature].title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {featureDetails[selectedFeature].description}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold">Key Benefits:</h3>
                <ul className="space-y-2">
                  {featureDetails[selectedFeature].features.map((feature, idx /* eslint-disable-line no-unused-vars */) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 text-white font-bold text-base"
                asChild
              >
                <Link
                  to={
                    selectedFeature === 'analyzer' ? '/document-analyser' :
                      selectedFeature === 'creator' ? '/document-creation' :
                        selectedFeature === 'timeline' ? '/my-documents' :
                          selectedFeature === 'signature' ? '/my-documents' :
                            selectedFeature === 'gen-track-sign' ? '/document-creation' :
                              '/document-analyser'
                  }
                >
                  Try {featureDetails[selectedFeature].title} <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
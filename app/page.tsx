"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Terminal, Zap, Shield, LogIn, LogOut, Key, CheckCircle, FileText, AlertTriangle, Edit3, Eye, Trash2, UploadCloud, RefreshCw } from "lucide-react";

const DEFAULT_TEMPLATES = [
  {
    id: "sde",
    label: "SDE Role",
    defaultSubject: "Application for Full Stack Software Development Engineer Role",
    body: "Hi {{name}},\n\nI am currently working at Encora as an SDE, building scalable REST APIs and responsive web applications. I have strong proficiency in Java and hands-on experience in full stack development.\n\nI stay up to date with modern AI technologies and actively work alongside AI tools to enhance development workflows, accelerate iteration, and improve overall engineering efficiency.\n\nI am looking for opportunities where I can contribute to challenging engineering problems and continue growing as a developer. I have attached my resume for your consideration.\n\nBest regards,\nSujal Koli\n+91 7757879653\nsujalkoli03@gmail.com"
  },
  { 
    id: "intern", 
    label: "Internship", 
    defaultSubject: "Application for Internship Opportunity",
    body: "Hi {{name}},\n\nI'm reaching out regarding potential internship opportunities. I have a solid foundation in DSA and building scalable APIs. Please see my attached resume.\n\nRegards,\nSujal Koli" 
  }
];

export default function Page() {
  const [formData, setFormData] = useState({ 
    receiver_email: "", 
    receiver_name: ""
  });
  const [appPassword, setAppPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState("idle"); 
  const [serverMessage, setServerMessage] = useState("");
  
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState("sde");
  const [isEditingBody, setIsEditingBody] = useState(false);
  
  // New Subject Line Editing States
  const [customSubject, setCustomSubject] = useState("");
  const [isEditingSubject, setIsEditingSubject] = useState(false);

  // Resume attachment state tracking
  const [resumeMode, setResumeMode] = useState<"default" | "custom" | "none">("default");
  const [customResumeName, setCustomResumeName] = useState<string>("");
  const [customResumeBase64, setCustomResumeBase64] = useState<string>(""); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Whenever template changes, sync the active subject state block
  useEffect(() => {
    setCustomSubject(currentTemplate.defaultSubject);
    setIsEditingSubject(false);
    setIsEditingBody(false);
  }, [selectedTemplateId]);

  useEffect(() => {
    const savedPassword = localStorage.getItem("sujal_os_app_pass");
    if (savedPassword) {
      setAppPassword(savedPassword);
      setIsLoggedIn(true);
    }
    
    const savedTemplates = localStorage.getItem("sujal_os_custom_templates");
    if (savedTemplates) {
      try { setTemplates(JSON.parse(savedTemplates)); } catch (e) { }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (appPassword.trim().length >= 16) {
      localStorage.setItem("sujal_os_app_pass", appPassword.trim());
      setIsLoggedIn(true);
      setStatus("idle");
      setServerMessage("");
    } else {
      setStatus("warning");
      setServerMessage("Authentication Failed: Please enter a valid 16-digit Google App Password.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sujal_os_app_pass");
    setAppPassword("");
    setIsLoggedIn(false);
    setStatus("idle");
    setServerMessage("");
  };

  const handleTemplateUpdate = (newBodyText: string) => {
    const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, body: newBodyText } : t);
    setTemplates(updated);
    localStorage.setItem("sujal_os_custom_templates", JSON.stringify(updated));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomResumeName(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        const resultString = reader.result as string;
        const base64Data = resultString.split(",")[1];
        setCustomResumeBase64(base64Data);
        setResumeMode("custom");
      };
      reader.onerror = () => {
        setStatus("error");
        setServerMessage("Local File System Failure: Error reading chosen document.");
      };
      reader.readAsDataURL(file);
    }
  };

  const clearResume = () => {
    setResumeMode("none");
    setCustomResumeName("");
    setCustomResumeBase64("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetToDefaultResume = () => {
    setResumeMode("default");
    setCustomResumeName("");
    setCustomResumeBase64("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getActiveResumeName = () => {
    if (resumeMode === "default") return "Sujal_Koli_Latest_Resume.pdf";
    if (resumeMode === "custom") return customResumeName;
    return "NONE (No Attachment)";
  };

  const handleSend = async () => {
    if (!isLoggedIn || !appPassword) {
      setStatus("warning");
      setServerMessage("Uplink Blocked: Authentication Key required. Please authenticate via the upper-right uplink.");
      return;
    }
    if (!formData.receiver_email.trim()) {
      setStatus("warning");
      setServerMessage("Targeting Error: Destination recipient email address required.");
      return;
    }
    if (!formData.receiver_name.trim()) {
      setStatus("warning");
      setServerMessage("Targeting Error: Recipient name is mandatory to execute payload replacement.");
      return;
    }

    setStatus("sending");
    setServerMessage("");
    
    try {
      const res = await fetch("https://sujal-os-backend.onrender.com/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_email: "sujalkoli03@gmail.com",
          app_password: appPassword,
          receiver_email: formData.receiver_email.trim(),
          receiver_name: formData.receiver_name.trim(),
          // Passing custom edited dynamic subject line parameter variables to backend
          subject: customSubject.trim(),
          body: currentTemplate.body.replace("{{name}}", formData.receiver_name.trim()),
          resume_status: resumeMode,
          custom_resume_data: resumeMode === "custom" ? customResumeBase64 : null,
          custom_resume_name: resumeMode === "custom" ? customResumeName : null
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus("success");
        setServerMessage(data.message || `Email successfully dispatched to ${formData.receiver_email}`);
      } else {
        setStatus("error");
        setServerMessage(data.detail || "Transaction aborted by gateway server.");
      }
    } catch {
      setStatus("error");
      setServerMessage("Failed to reach server. Ensure backend process is online.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 text-slate-900 p-4 md:p-8 font-sans selection:bg-slate-900 selection:text-cyan-300 relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Navigation / Header Pod */}
        <nav className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 border-b border-white/30 pb-6 gap-4 backdrop-blur-md bg-white/10 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-slate-950">
            <Zap size={24} className="animate-pulse text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />
            <span className="font-black tracking-widest text-3xl uppercase text-white drop-shadow-sm">SUJAL_OS_v3.5</span>
          </div>

          <div className="w-full sm:w-auto bg-white/15 border border-white/20 p-3 rounded-xl flex items-center gap-4 shadow-md backdrop-blur-md">
            {isLoggedIn ? (
              <div className="flex items-center gap-4 w-full justify-between sm:justify-start">
                <div className="flex items-center gap-2 font-mono text-xs text-emerald-950 font-bold">
                  <CheckCircle size={14} className="text-emerald-700" />
                  <span>UPLINK_CONNECTED</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-rose-700 text-white border border-rose-500 px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-rose-800 transition-all shadow-sm"
                >
                  <LogOut size={12} /> Disconnect
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex items-center">
                  <Key size={12} className="absolute left-3 text-slate-700" />
                  <input 
                    type="password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="Enter App Password..."
                    className="bg-white/40 border border-white/30 pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-slate-900 font-mono w-48 text-slate-900 placeholder-slate-700 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  className="flex items-center gap-1 bg-slate-950 text-cyan-300 px-4 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-slate-900 transition-all shadow-md"
                >
                  <LogIn size={12} /> Mount
                </button>
              </form>
            )}
          </div>
        </nav>

        {/* Dynamic Notifications */}
        {status === "success" && (
          <div className="mb-6 p-4 bg-emerald-600 text-white border border-emerald-400 rounded-xl flex items-start gap-3 shadow-lg backdrop-blur-md transition-all">
            <CheckCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-black uppercase text-xs tracking-wider">Mission Accomplished</p>
              <p className="text-xs font-mono mt-0.5 opacity-90">{serverMessage}</p>
            </div>
          </div>
        )}

        {status === "warning" && (
          <div className="mb-6 p-4 bg-amber-400 text-slate-950 border border-amber-200 rounded-xl flex items-start gap-3 shadow-lg backdrop-blur-md transition-all">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-black uppercase text-xs tracking-wider">System Warning</p>
              <p className="text-xs font-mono mt-0.5 font-bold">{serverMessage}</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 p-4 bg-rose-600 text-white border border-rose-400 rounded-xl flex items-start gap-3 shadow-lg backdrop-blur-md transition-all">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-black uppercase text-xs tracking-wider">Transmission Error</p>
              <p className="text-xs font-mono mt-0.5 opacity-90">{serverMessage}</p>
            </div>
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Inputs Section */}
          <div className="md:col-span-7 space-y-6">
            <h1 className="text-7xl font-black italic uppercase tracking-tighter leading-none text-white drop-shadow-sm">
              Target <span className="text-slate-950 drop-shadow-none">Lock</span>
            </h1>
            
            <div className="bg-white/15 backdrop-blur-md p-6 rounded-2xl border border-white/20 space-y-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-950 font-bold uppercase tracking-widest">Destination Address</label>
                  <span className="text-[10px] bg-slate-950 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold tracking-wider">REQUIRED</span>
                </div>
                <input 
                  className="w-full bg-white/20 border border-white/30 p-3 rounded-lg outline-none focus:border-slate-950 font-mono text-sm text-slate-900 placeholder-slate-700 font-medium"
                  placeholder="RECIPIENT@MAIL.COM"
                  value={formData.receiver_email}
                  onChange={(e) => setFormData({...formData, receiver_email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-900 font-bold uppercase tracking-widest opacity-80">Recipient Name</label>
                  <span className="text-[10px] bg-slate-950 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold tracking-wider">REQUIRED</span>
                </div>
                <input 
                  className="w-full bg-white/20 border border-white/30 p-3 rounded-lg outline-none focus:border-slate-950 text-sm text-slate-900 placeholder-slate-700 font-medium"
                  placeholder="AGENT / COMPANY NAME"
                  value={formData.receiver_name}
                  onChange={(e) => setFormData({...formData, receiver_name: e.target.value})}
                />
              </div>
            </div>

            {/* Resume Matrix Container */}
            <div className="space-y-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-md">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-950 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <UploadCloud size={14} /> Resume Attachment Matrix
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-black tracking-wider ${
                  resumeMode === "default" ? "bg-slate-950 text-cyan-300" :
                  resumeMode === "custom" ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-300"
                }`}>
                  {resumeMode.toUpperCase()}
                </span>
              </div>

              <div className="bg-white/20 p-3 rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden w-full">
                  <FileText size={16} className={resumeMode === "none" ? "text-rose-800" : "text-slate-950"} />
                  <span className={`text-xs font-mono font-bold truncate ${resumeMode === "none" ? "text-rose-900 line-through opacity-60" : "text-slate-900"}`}>
                    {getActiveResumeName()}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  {resumeMode !== "default" && (
                    <button
                      type="button"
                      onClick={resetToDefaultResume}
                      className="p-1.5 bg-white/30 border border-white/20 rounded-lg hover:bg-white/50 text-slate-950 transition-all"
                      title="Reset to default document"
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                  {resumeMode !== "none" ? (
                    <button
                      type="button"
                      onClick={clearResume}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-700/20 text-rose-950 border border-rose-500/30 rounded-lg text-xs font-bold uppercase hover:bg-rose-700 hover:text-white transition-all"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  ) : (
                    <label className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 text-cyan-300 rounded-lg text-xs font-black uppercase cursor-pointer hover:bg-slate-900 transition-all shadow-sm">
                      <UploadCloud size={12} /> Upload PDF
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Template Buttons */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-950 font-bold flex items-center gap-2">
                <FileText size={14} /> Select Payload Template:
              </h3>
              <div className="flex gap-3">
                {templates.map((t) => (
                  <button 
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all shadow-sm ${
                      selectedTemplateId === t.id 
                        ? "bg-slate-950 border-slate-950 text-cyan-300 font-black shadow-lg scale-[1.01]" 
                        : "bg-white/10 border-white/20 text-slate-900 hover:bg-white/20"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Console Output Columns */}
          <div className="md:col-span-5 bg-white/15 backdrop-blur-md p-6 rounded-2xl border border-white/20 flex flex-col justify-between min-h-[420px] shadow-xl">
            <div className="font-mono text-xs text-slate-900 space-y-3">
              <p className="text-slate-950 flex items-center gap-2 font-bold"><Terminal size={14}/> &gt; Console_Ready</p>
              
              <div className="bg-white/20 p-3 border border-white/10 rounded-lg space-y-1 text-[11px] text-slate-900 font-medium">
                <p>&gt; Source: sujalkoli03@gmail.com</p>
                <p>&gt; Template Match: {currentTemplate.label}</p>
                <p>&gt; File Attachment: {getActiveResumeName()}</p>
                <p>&gt; Auth Token State: {isLoggedIn ? "VERIFIED_LOCAL" : "NULL_PENDING"}</p>
                <p>&gt; System Status: <span className={`font-black tracking-wide ${
                  status === "success" ? "text-emerald-800" : 
                  status === "error" ? "text-rose-800" : 
                  status === "warning" ? "text-amber-800" : "text-blue-900"
                }`}>{status.toUpperCase()}</span></p>
              </div>

              {/* ENHANCEMENT: EDITABLE SUBJECT LINE HUB */}
              <div className="border border-white/20 rounded-lg overflow-hidden bg-white/10">
                <div className="flex justify-between items-center bg-white/30 px-3 py-2 border-b border-white/10">
                  <span className="text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                    {isEditingSubject ? "Editing Subject Key:" : "Transmission Subject:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingSubject(!isEditingSubject)}
                    className="flex items-center gap-1 text-[10px] text-slate-950 font-bold uppercase hover:text-slate-800 transition-colors"
                  >
                    {isEditingSubject ? (
                      <>
                        <Eye size={11} /> Lock Subject
                      </>
                    ) : (
                      <>
                        <Edit3 size={11} /> Edit Subject
                      </>
                    )}
                  </button>
                </div>
                
                {isEditingSubject ? (
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full bg-white/40 text-slate-900 text-[11px] font-mono px-3 py-2.5 focus:outline-none border-none focus:ring-1 focus:ring-slate-950 font-medium"
                    placeholder="Enter dynamic subject structure..."
                  />
                ) : (
                  <div className="p-3 text-[11px] font-mono text-slate-950 font-bold truncate bg-white/5">
                    {customSubject.replace("{{name}}", formData.receiver_name.trim() || "[Name]")}
                  </div>
                )}
              </div>
              
              {/* EDITABLE TEMPLATE BODY HUB */}
              <div className="border border-white/20 rounded-lg overflow-hidden bg-white/10">
                <div className="flex justify-between items-center bg-white/30 px-3 py-2 border-b border-white/10">
                  <span className="text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                    {isEditingBody ? "Editing Base Template:" : "Live Payload Preview:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingBody(!isEditingBody)}
                    className="flex items-center gap-1 text-[10px] text-slate-950 font-bold uppercase hover:text-slate-800 transition-colors"
                  >
                    {isEditingBody ? (
                      <>
                        <Eye size={11} /> Lock & Preview
                      </>
                    ) : (
                      <>
                        <Edit3 size={11} /> Modify Template
                      </>
                    )}
                  </button>
                </div>
                
                {isEditingBody ? (
                  <textarea
                    value={currentTemplate.body}
                    onChange={(e) => handleTemplateUpdate(e.target.value)}
                    rows={5}
                    className="w-full bg-white/40 text-slate-900 text-[11px] font-mono p-3 focus:outline-none border-none resize-none focus:ring-1 focus:ring-slate-950 font-medium"
                    placeholder="Write template structure..."
                  />
                ) : (
                  <div className="p-3 text-[11px] max-h-28 overflow-y-auto font-mono text-slate-900 font-medium whitespace-pre-wrap bg-white/5">
                    {currentTemplate.body.replace("{{name}}", formData.receiver_name.trim() || "[Name]")}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleSend}
              disabled={status === "sending"}
              className="w-full bg-slate-950 text-cyan-300 font-black py-4 rounded-xl hover:bg-slate-900 transition-all uppercase tracking-[0.2em] shadow-lg disabled:opacity-40 mt-4 active:scale-[0.99]"
            >
              {status === "sending" ? "Dispatching Comms..." : "Execute Send"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
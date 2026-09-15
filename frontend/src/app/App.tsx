import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  LayoutDashboard,
  Loader2,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Terminal,
  Trash2,
  Upload,
  UserCheck,
  Wifi,
  X,
  XCircle,
} from 'lucide-react'
import {
  analyzeAudit,
  createMapping,
  disableMapping,
  downloadAuditReport,
  evaluateCompliance,
  fetchAudit,
  fetchHealth,
  listAudits,
  listLearnedMappings,
  listUnknownCommands,
  uploadAuditFile,
  type LearnedMapping,
  type MappingPayload,
  type UnknownCommand,
} from '../services/api'
import { Sidebar, type PageKey } from '../components/Sidebar'
import { Header } from '../components/Header'
import { SecurityTopology3D } from '../components/SecurityTopology3D'
import { LandingPage } from '../components/LandingPage'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'

import { AuditResult, AuditSummaryItem, FrameworkSelection, VendorSelection } from '../types'



import { RiskBadge, StatusPill, SeverityBadge, VendorBadge } from '../components/Shared'
/* =========================================================================
   1. DASHBOARD PAGE (With 3D Security Posture / Network Topology)
   ========================================================================= */
import { AuditPage } from '../pages/AuditPage'
import { DashboardPage } from '../pages/DashboardPage'

/* =========================================================================
   2. CONFIGURATION AUDITS PAGE (Uploader + Audit History)
   ========================================================================= */


/* =========================================================================
   3. AUDIT RESULTS PAGE (Flagship View: Technical Findings & CLI Remediation)
   ========================================================================= */
import { ResultsPage } from '../pages/ResultsPage'

/* =========================================================================
   4. TRAINING CENTER PAGE (Knowledge & Adaptive Machine-Teaching)
   ========================================================================= */
import { TrainingPage } from '../pages/TrainingPage'

/* =========================================================================
   5. REPORTS ARCHIVE PAGE (Document Management Style)
   ========================================================================= */
import { ReportsPage } from '../pages/ReportsPage'

/* =========================================================================
   6. SETTINGS PAGE (System Settings & Telemetry)
   ========================================================================= */
import { SettingsPage } from '../pages/SettingsPage'

/* =========================================================================
   7. PROFILE PAGE (User Account Settings)
   ========================================================================= */
import { ProfilePage } from '../pages/ProfilePage'



const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()
  const loc = useLocation()
  console.log(`[AUTH] ProtectedRoute evaluation. loading=${loading}, isAuthenticated=${isAuthenticated}, pathname=${loc.pathname}`);
  
  if (loading) return <div className="flex h-screen items-center justify-center bg-surface-primary text-brand-bright"><Loader2 className="animate-spin" size={32} /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

/* =========================================================================
   8. ROOT APPLICATION COMPONENT
   ========================================================================= */
export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const getPageFromPath = (path: string): PageKey => {
    const route = path.replace('/', '')
    if (route === '' || route === 'home') return 'home'
    if (['dashboard', 'audit', 'results', 'training', 'reports', 'settings', 'profile'].includes(route)) return route as PageKey
    return 'home'
  }
  
  const currentPage = getPageFromPath(location.pathname)

  const handleNavigate = (page: PageKey) => {
    if (page === 'home') navigate('/dashboard')
    else navigate(`/${page}`)
  }
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [selectedVendor, setSelectedVendor] = useState<VendorSelection>('auto')
  const [selectedFramework, setSelectedFramework] = useState<FrameworkSelection>('CIS')
  const [aiEnabled, setAiEnabled] = useState<boolean>(true)
  const [configText, setConfigText] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [auditsList, setAuditsList] = useState<AuditSummaryItem[]>([])
  const [unresolvedCount, setUnresolvedCount] = useState<number>(0)
  const [learnedCount, setLearnedCount] = useState<number>(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [error, setError] = useState<string>('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const progressStages = [
    { label: 'Upload Ingestion', active: isAnalyzing },
    { label: 'Multi-Vendor Detection', active: isAnalyzing },
    { label: 'Rule Parsing', active: isAnalyzing },
    { label: 'Unknown Syntax Isolation', active: isAnalyzing },
    { label: aiEnabled ? 'AI Normalization' : 'Deterministic Mode', active: isAnalyzing },
    { label: 'Compliance Engine', active: isAnalyzing },
    { label: 'Remediation Mapping', active: isAnalyzing },
  ]

  const refreshHealthAndAudits = async () => {
    try {
      await fetchHealth()
      setBackendStatus('online')
    } catch {
      setBackendStatus('offline')
    }

    try {
      const [audits, unknowns, mappings] = await Promise.all([
        listAudits(),
        listUnknownCommands(),
        listLearnedMappings(),
      ])
      setAuditsList(audits)
      setUnresolvedCount(unknowns.length)
      setLearnedCount(mappings.filter((m) => m.enabled).length)
    } catch {
      // Keep existing state if offline
    }
  }

  useEffect(() => {
    refreshHealthAndAudits()
  }, [])

  const handleFileSelect = async (file: File | null) => {
    if (!file) return
    setUploadedFile(file)
    const text = await file.text()
    setConfigText(text)
  }

  const handleAnalyze = async () => {
    if (!configText.trim() && !uploadedFile) {
      setError('Please provide a configuration file or text to audit.')
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      const fileToUpload =
        uploadedFile ??
        new File(
          [configText],
          `${selectedVendor === 'auto' ? 'network_device' : selectedVendor}_config.cfg`,
          { type: 'text/plain' }
        )

      const uploadResponse = await uploadAuditFile(fileToUpload)
      const auditId = uploadResponse.audit_id
      const analysisResult = await analyzeAudit(auditId, aiEnabled)
      const complianceResult = await evaluateCompliance(auditId, selectedFramework)

      setAuditResult({
        ...analysisResult,
        ...complianceResult,
        framework: complianceResult.framework,
        score: complianceResult.score,
        summary: complianceResult.summary,
        findings: complianceResult.findings,
      })

      // Refresh audits and metrics
      await refreshHealthAndAudits()
      navigate('/results')
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Audit pipeline failed'
      setError(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleViewAudit = async (auditId: number, framework: string = 'CIS') => {
    setIsAnalyzing(true)
    setError('')
    try {
      const analysisResult = await analyzeAudit(auditId, aiEnabled)
      const complianceResult = await evaluateCompliance(auditId, framework || 'CIS')

      setAuditResult({
        ...analysisResult,
        ...complianceResult,
        framework: complianceResult.framework,
        score: complianceResult.score,
        summary: complianceResult.summary,
        findings: complianceResult.findings,
      })
      navigate('/results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit results')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDownloadReport = async (auditId: number) => {
    setIsDownloadingReport(true)
    try {
      await downloadAuditReport(auditId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report')
    } finally {
      setIsDownloadingReport(false)
    }
  }

  return (
    <Routes>
      <Route path="/" element={
        <LandingPage
          onNavigate={handleNavigate}
          onStartAudit={() => navigate('/audit')}
        />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="flex h-screen w-full overflow-hidden bg-surface-primary text-text-primary selection:bg-brand-primary/30 selection:text-brand-bright">
            <Sidebar
              currentPage={currentPage}
              onNavigate={handleNavigate}
              backendStatus={backendStatus}
              unresolvedCount={unresolvedCount}
              hasActiveAudit={auditsList.some((a) => a.compliance_score === null && a.status === 'Evaluating')}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              isMobileOpen={isMobileMenuOpen}
              onMobileClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
              <Header 
                currentPage={currentPage} 
                onNavigate={handleNavigate} 
                onMenuClick={() => setIsMobileMenuOpen(true)}
              />

              <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 relative">
                <Routes>
                  <Route path="/dashboard" element={
                    <DashboardPage
                      audits={auditsList}
                      unresolvedCount={unresolvedCount}
                      learnedCount={learnedCount}
                      onNavigate={handleNavigate}
                      onViewAudit={handleViewAudit}
                      onDownloadReport={handleDownloadReport}
                      isDownloading={isDownloadingReport}
                    />
                  } />
                  <Route path="/audit" element={
                    <AuditPage
                      configText={configText}
                      setConfigText={setConfigText}
                      selectedVendor={selectedVendor}
                      setSelectedVendor={setSelectedVendor}
                      selectedFramework={selectedFramework}
                      setSelectedFramework={setSelectedFramework}
                      aiEnabled={aiEnabled}
                      setAiEnabled={setAiEnabled}
                      onFilePicked={handleFileSelect}
                      onAnalyze={handleAnalyze}
                      isAnalyzing={isAnalyzing}
                      uploadedFile={uploadedFile}
                      error={error}
                      progressStages={progressStages}
                      audits={auditsList}
                      onViewAudit={handleViewAudit}
                      onDownloadReport={handleDownloadReport}
                      isDownloading={isDownloadingReport}
                    />
                  } />
                  <Route path="/results" element={
                    <ResultsPage
                      result={auditResult}
                      onAuditUpdated={setAuditResult}
                      onDownloadReport={handleDownloadReport}
                      isDownloading={isDownloadingReport}
                      onNavigate={handleNavigate}
                    />
                  } />
                  <Route path="/training" element={<TrainingPage />} />
                  <Route path="/reports" element={
                    <ReportsPage
                      audits={auditsList}
                      onViewAudit={handleViewAudit}
                      onDownloadReport={handleDownloadReport}
                      isDownloading={isDownloadingReport}
                      onRefresh={refreshHealthAndAudits}
                    />
                  } />
                  <Route path="/settings" element={
                    <SettingsPage
                      backendStatus={backendStatus}
                      onRefreshHealth={refreshHealthAndAudits}
                    />
                  } />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

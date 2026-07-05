import { Shield, ArrowRight, FileText, Calendar, Download, Lock, CheckCircle, BarChart3, ChevronRight } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col overflow-x-hidden selection:bg-blue-600/10 selection:text-blue-600">
      {/* Header / Navbar */}
      <header className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100/80 fixed top-0 left-0 right-0 z-50 flex items-center px-8 justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">ExpiryGuard</span>
            <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-md ml-2 border border-blue-100 uppercase tracking-wide">
              Enterprise
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onSignIn}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 px-8 max-w-7xl mx-auto w-full flex flex-col items-center">
        <div className="text-center max-w-3xl space-y-6 mt-8">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider animate-pulse">
            <CheckCircle className="w-3.5 h-3.5" /> Next-Gen Expiry Tracking
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            Enterprise Expiry Tracking, <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Supercharged by AI
            </span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Eliminate manual data entry. Upload documents, extract metadata instantly, track critical regulatory milestones, and manage renewal audit trails effortlessly.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={onGetStarted}
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 group"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onSignIn}
              className="px-7 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-base transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Access Portal
            </button>
          </div>
        </div>

        {/* Visual Dashboard Mockup Preview */}
        <div
          className="w-full max-w-5xl mt-16 rounded-3xl border border-gray-200/80 bg-white p-4 shadow-2xl relative group overflow-hidden"
          style={{ boxShadow: "0 40px 100px rgba(15,23,42,0.12)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-700" />
          <div className="h-6 flex items-center gap-1.5 px-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-[10px] text-gray-400 font-medium ml-2">expiryguard.tatasteel.com/dashboard</span>
          </div>
          {/* High-fidelity layout graphics representation */}
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              <div className="h-32 bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Automated AI Scanner</span>
                  <span className="text-xs bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">fire_safety_certificate.pdf</p>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">Pre-filled with 98% AI Confidence</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-28 bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between">
                  <span className="text-xs text-gray-400 font-semibold">Active Records</span>
                  <span className="text-2xl font-black text-gray-900">842</span>
                </div>
                <div className="h-28 bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between">
                  <span className="text-xs text-gray-400 font-semibold">Critical Expiries</span>
                  <span className="text-2xl font-black text-red-600">5</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs text-gray-400 font-semibold">Monthly renewals status</span>
                <div className="flex gap-2.5 items-end h-28 pt-4">
                  <div className="flex-1 bg-blue-100 h-12 rounded-t-lg" />
                  <div className="flex-1 bg-blue-100 h-20 rounded-t-lg" />
                  <div className="flex-1 bg-blue-600 h-24 rounded-t-lg" />
                  <div className="flex-1 bg-blue-100 h-16 rounded-t-lg" />
                </div>
              </div>
              <span className="text-xs text-gray-500 font-medium">Compliance trajectory stable</span>
            </div>
          </div>
        </div>

        {/* Feature Grid Section */}
        <div className="w-full mt-28">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Engineered for High-Stakes Compliance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-5 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI Document Intelligence</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Extract names, vendors, issue/expiry dates, category folders, and numbers dynamically from PDFs and image scans using layout reasoning models.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center mb-5 text-purple-600">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Urgency-Based Calendars</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Visualize expirations across all departments in a centralized grid, color-coded automatically by priority status to prevent critical gaps.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-5 text-green-600">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Dynamic Reports & Exports</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Compile regulatory records into custom-designed Excel spreadsheets, formatted PDF lists, or raw CSV sheets in a click.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center mb-5 text-amber-600">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Role-Based Operations</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Enforce security profiles using dynamic roles. Grant write access to Managers, read limits to Viewers, and administration rights to Admins.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-cyan-50 rounded-xl flex items-center justify-center mb-5 text-cyan-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Trend Forecasting</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Map compliance risks over a rolling 12-month calendar window. Predict renewal surges and budget compliance costs in advance.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between items-start border-dashed border-2">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Ready to mitigate compliance risks?</h3>
                <p className="text-sm text-gray-400">Join other departments tracking compliance assets in real-time.</p>
              </div>
              <button
                onClick={onGetStarted}
                className="mt-6 flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 group cursor-pointer"
              >
                Sign up your team
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10 px-8 text-center text-xs text-gray-400">
        <p>© 2026 ExpiryGuard. All rights reserved. Tata Steel Ltd Enterprise Deployment.</p>
      </footer>
    </div>
  );
}

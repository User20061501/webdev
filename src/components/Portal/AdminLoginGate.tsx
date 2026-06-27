import { useState, FormEvent } from "react";
import { Key, Lock, ArrowLeft, Loader2, CheckCircle, User, AlertTriangle } from "lucide-react";

interface AdminLoginGateProps {
  onSuccess: (session: { username: string; passcode: string; role: "Owner" | "Admin" | "Moderator" }) => void;
  onCancel: () => void;
}

export default function AdminLoginGate({ onSuccess, onCancel }: AdminLoginGateProps) {
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const trimmedUser = username.trim();
    const trimmedPass = passcode.trim();
    if (!trimmedUser || !trimmedPass) {
      setError("Please input a valid username and passcode.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: trimmedUser, passcode: trimmedPass })
      });

      if (res.ok) {
        const sessionData = await res.json();
        setSuccess(true);
        setSuccessMessage(sessionData.message);
        setTimeout(() => {
          onSuccess({
            username: sessionData.username,
            passcode: sessionData.passcode,
            role: sessionData.role
          });
        }, 1100);
      } else {
        const errData = await res.json();
        setError(errData.error || "Incorrect Credentials. Direct authorization is refused.");
      }
    } catch (err) {
      setError("Unable to connect with verification server. Please ensure the dev server is active.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-gate" className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-50/50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
        
        {/* Custom Golden Ganesha Calligraphy Image Asset */}
        <div className="mx-auto flex justify-center items-center">
          {success ? (
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 relative">
              <CheckCircle className="w-12 h-12 text-emerald-600 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold shadow tracking-widest uppercase">
                Verified
              </div>
            </div>
          ) : (
            <div className="relative group transition-transform duration-300 hover:scale-105">
              <svg
                viewBox="0 0 200 200"
                className="w-32 h-32 drop-shadow-[0_4px_12px_rgba(234,179,8,0.25)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Metallic Gold Gradient */}
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="30%" stopColor="#fbbf24" />
                    <stop offset="70%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  {/* Soft Golden Glow Filter */}
                  <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#d97706" floodOpacity="0.45" />
                  </filter>
                </defs>
                
                {/* Ganesha Calligraphy Paths */}
                <g filter="url(#goldGlow)">
                  <path
                    d="M100 25 C100 12, 106 8, 100 3 C94 8, 100 12, 100 25"
                    stroke="url(#goldGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M82 35 C88 27, 112 27, 118 35"
                    stroke="url(#goldGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M91 43 C91 38, 109 38, 109 43"
                    stroke="url(#goldGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="51" r="4.5" fill="url(#goldGrad)" />
                  <path
                    d="M93 58 C96 61, 104 61, 107 58"
                    stroke="url(#goldGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Left Fan/Ear Calligraphy Curve */}
                  <path
                    d="M98 46 C35 46, 30 95, 62 106 C72 111, 83 100, 88 95"
                    stroke="url(#goldGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Right Fan/Ear Calligraphy Curve */}
                  <path
                    d="M102 46 C165 46, 170 95, 138 106 C128 111, 117 100, 112 95"
                    stroke="url(#goldGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Nose-Trunk (Sondh) Calligraphy Curve */}
                  <path
                    d="M100 63 C101 90, 128 115, 122 150 C116 182, 74 182, 69 150 C66 134, 80 123, 93 128 C101 131, 103 140, 96 144 C85 149, 79 138, 85 133"
                    stroke="url(#goldGrad)"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Left and Right Tusks */}
                  <path
                    d="M88 78 L80 81"
                    stroke="url(#goldGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M112 78 L120 81"
                    stroke="url(#goldGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  
                  {/* Flank Calligraphy details */}
                  <path
                    d="M43 122 C28 132, 33 153, 46 148 C53 145, 46 135, 40 137"
                    stroke="url(#goldGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M157 122 C172 132, 167 153, 154 148 C147 145, 154 135, 160 137"
                    stroke="url(#goldGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
              <div className="absolute bottom-1 right-2 w-7 h-7 bg-[#4a0605] text-yellow-500 rounded-full flex items-center justify-center border border-yellow-500/30 shadow-md group-hover:rotate-12 transition-transform">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>

        {/* Text descriptions */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-black text-amber-800 bg-amber-50 border border-amber-100 px-2.5 py-1 uppercase tracking-widest rounded">
            Riaan Enterprises
          </span>
          <h2 className="font-display font-black text-xl text-gray-900 tracking-tight pt-2 uppercase">
            Merchant Staff Login
          </h2>
          <p className="font-sans text-xs text-gray-400 font-light leading-relaxed">
            Username and passcode verification required.
          </p>
        </div>

        {/* Display response feedback */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-lg text-left font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg text-left flex items-center gap-2 font-mono">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Field */}
          <div className="relative text-left">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              autoComplete="username"
              placeholder="Enter staff username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || success}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a0605]/10 focus:border-[#4a0605] transition-all font-mono"
              required
              autoFocus
            />
          </div>

          {/* Passcode Field */}
          <div className="relative text-left">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Key className="w-4 h-4" />
            </span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter secure staff passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              disabled={loading || success}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a0605]/10 focus:border-[#4a0605] transition-all font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || success || !username || !passcode}
            className="w-full py-3 bg-[#4a0605] hover:bg-[#340202] text-white font-display font-bold tracking-widest text-xs uppercase flex items-center justify-center space-x-1.5 shadow-lg shadow-red-950/20 rounded-full transform hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 ease-out disabled:opacity-50 select-none cursor-pointer"
          >
            {success ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Opening Secure Portal...</span>
              </>
            ) : loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Authorize Secured Session</span>
            )}
          </button>
        </form>

        {/* Return helper */}
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading || success}
            className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-[#4a0605] transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer Front</span>
          </button>
        </div>

      </div>
    </div>
  );
}

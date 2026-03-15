"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏨</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">You are offline</h1>
        <p className="text-slate-500 text-sm mb-6">
          IHMS requires an internet connection. Please check your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

import React, { useState, ReactNode } from "react";
import { RDLabProvider, useOptionalRDLabStore } from "@/stores/rdLabStore";

class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Error Loading R&D Labs</h2>
            <p className="text-sm text-slate-400 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function RDLabsWorkspace() {
  return (
    <ErrorBoundary>
      <RDLabProvider>
        <RDLabsWorkspaceContent />
      </RDLabProvider>
    </ErrorBoundary>
  );
}

function RDLabsWorkspaceContent() {
  const store = useOptionalRDLabStore();

  if (!store) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Loading R&D Labs...</p>
          <p className="text-sm text-slate-400">Store initializing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-400/20 bg-slate-900/50">
        <h1 className="text-2xl font-bold text-cyan-300">R&D Labs Dashboard</h1>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Empty State */}
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-cyan-300 mb-4">No Projects Yet</h2>
            <p className="text-slate-400 mb-6">Start by creating a new R&D project</p>
            <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium">
              + Create New Project
            </button>
          </div>

          {/* Project Grid - Empty */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
            <div className="bg-slate-900/50 border border-cyan-400/10 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Active Projects</p>
              <p className="text-3xl font-bold text-cyan-300">0</p>
            </div>
            <div className="bg-slate-900/50 border border-cyan-400/10 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Experiments</p>
              <p className="text-3xl font-bold text-cyan-300">{store.experiments.length}</p>
            </div>
            <div className="bg-slate-900/50 border border-cyan-400/10 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Team Members</p>
              <p className="text-3xl font-bold text-cyan-300">1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

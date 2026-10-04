"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  Hash,
  Plus,
  ChevronDown,
  Check,
  Radio,
  X,
  Loader2,
  FolderTree,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Layers,
} from "lucide-react";
import { WorkspaceItem, ChannelItem } from "@/lib/workspace";

interface WorkspaceSidebarProps {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem;
  activeChannel: ChannelItem;
  isOpen: boolean;
  onToggle: () => void;
  onSelectWorkspace: (workspace: WorkspaceItem) => void;
  onSelectChannel: (channel: ChannelItem) => void;
  onCreateChannel: (channel: ChannelItem) => void;
  onCreateWorkspace?: (workspace: WorkspaceItem) => void;
}

export function WorkspaceSidebar({
  workspaces,
  activeWorkspace,
  activeChannel,
  isOpen,
  onToggle,
  onSelectWorkspace,
  onSelectChannel,
  onCreateChannel,
  onCreateWorkspace,
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  // New channel state
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelTopic, setNewChannelTopic] = useState("");
  const [channelSubmitting, setChannelSubmitting] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);

  // New workspace state
  const [newWsName, setNewWsName] = useState("");
  const [wsSubmitting, setWsSubmitting] = useState(false);

  // Handle Channel Navigation
  const handleChannelClick = (channel: ChannelItem) => {
    onSelectChannel(channel);
    router.push(`/workspace/${activeWorkspace.slug}/channel/${channel.id}`);
  };

  // Handle Workspace Switch
  const handleWorkspaceClick = (ws: WorkspaceItem) => {
    onSelectWorkspace(ws);
    setWorkspaceMenuOpen(false);
    const defaultChan = ws.channels[0];
    if (defaultChan) {
      router.push(`/workspace/${ws.slug}/channel/${defaultChan.id}`);
    } else {
      router.push(`/workspace/${ws.slug}`);
    }
  };

  // Create Channel Submit
  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newChannelName
      .trim()
      .toLowerCase()
      .replace(/^#+/, "")
      .replace(/[^a-z0-9_-]+/g, "-");

    if (!cleanName) {
      setChannelError("Channel name is required.");
      return;
    }

    setChannelSubmitting(true);
    setChannelError(null);

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.slug}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          topic: newChannelTopic.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.channel) {
        onCreateChannel(data.channel);
        setShowChannelModal(false);
        setNewChannelName("");
        setNewChannelTopic("");
        handleChannelClick(data.channel);
      } else {
        setChannelError(data.error || "Failed to create channel");
      }
    } catch (err: unknown) {
      // Offline fallback: create local channel
      const fallbackChannel: ChannelItem = {
        id: `chan_${Date.now()}_${cleanName}`,
        workspaceId: activeWorkspace.id,
        name: cleanName,
        topic: newChannelTopic.trim() || null,
      };
      onCreateChannel(fallbackChannel);
      setShowChannelModal(false);
      setNewChannelName("");
      setNewChannelTopic("");
      handleChannelClick(fallbackChannel);
    } finally {
      setChannelSubmitting(false);
    }
  };

  // Create Workspace Submit
  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setWsSubmitting(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWsName.trim() }),
      });
      const data = await res.json();
      if (data.workspace) {
        if (onCreateWorkspace) onCreateWorkspace(data.workspace);
        setShowWorkspaceModal(false);
        setNewWsName("");
        handleWorkspaceClick(data.workspace);
      }
    } catch {
      const slug = newWsName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const localWs: WorkspaceItem = {
        id: `ws_${Date.now()}`,
        name: newWsName.trim(),
        slug,
        role: "ADMIN",
        channels: [
          {
            id: `chan_${Date.now()}_gen`,
            workspaceId: `ws_${Date.now()}`,
            name: "general",
            topic: `Discussions for ${newWsName.trim()}`,
          },
        ],
      };
      if (onCreateWorkspace) onCreateWorkspace(localWs);
      setShowWorkspaceModal(false);
      setNewWsName("");
      handleWorkspaceClick(localWs);
    } finally {
      setWsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        id="open-workspace-sidebar-btn"
        onClick={onToggle}
        className="fixed bottom-4 left-4 z-40 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-xl backdrop-blur-xs instrument-btn transition-transform hover:scale-105 cursor-pointer"
        title="Open Workspace & Channel Navigator"
        aria-label="Open Workspace Navigation"
      >
        <div className="flex items-center gap-2 font-mono text-xs">
          <PanelLeftOpen className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline uppercase tracking-wider text-zinc-300">
            {activeWorkspace.name} // #{activeChannel.name}
          </span>
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Create Channel Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 sm:p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300">
                <Hash className="w-4 h-4 text-cyan-400" />
                <h2 className="font-semibold text-zinc-100">Create New Channel</h2>
              </div>
              <button
                id="close-channel-modal-btn"
                onClick={() => setShowChannelModal(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChannelSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] uppercase text-zinc-400 mb-1">
                  Channel Name
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-zinc-500 font-bold">#</span>
                  <input
                    id="new-channel-name-input"
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. standup-daily"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded pl-7 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase text-zinc-400 mb-1">
                  Topic / Purpose (Optional)
                </label>
                <input
                  id="new-channel-topic-input"
                  type="text"
                  value={newChannelTopic}
                  onChange={(e) => setNewChannelTopic(e.target.value)}
                  placeholder="e.g. Daily sync, blockers & updates"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {channelError && (
                <p className="text-[11px] text-red-400 font-mono">{channelError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChannelModal(false)}
                  className="flex-1 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={channelSubmitting || !newChannelName.trim()}
                  className="flex-1 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold uppercase tracking-wider disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {channelSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Channel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 sm:p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300">
                <Building className="w-4 h-4 text-purple-400" />
                <h2 className="font-semibold text-zinc-100">Create New Workspace</h2>
              </div>
              <button
                id="close-ws-modal-btn"
                onClick={() => setShowWorkspaceModal(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] uppercase text-zinc-400 mb-1">
                  Workspace Name
                </label>
                <input
                  id="new-ws-name-input"
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Research & Dev"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="flex-1 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={wsSubmitting || !newWsName.trim()}
                  className="flex-1 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold uppercase tracking-wider disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {wsSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Sidebar Column */}
      <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950/95 flex flex-col font-mono text-xs select-none">
        {/* Workspace Switcher Header */}
        <div className="p-3 border-b border-zinc-800">
          <div className="relative">
            <button
              id="workspace-switcher-btn"
              onClick={() => setWorkspaceMenuOpen((v) => !v)}
              className="w-full flex items-center justify-between p-2 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-left transition-colors cursor-pointer group"
              aria-label="Switch Workspace"
              aria-expanded={workspaceMenuOpen}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded bg-purple-950 border border-purple-600/60 flex items-center justify-center text-[10px] font-bold text-purple-300 shrink-0">
                  {activeWorkspace.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="font-bold text-zinc-100 truncate text-[11px] uppercase tracking-wide">
                    {activeWorkspace.name}
                  </div>
                  <div className="text-[9px] text-zinc-500 truncate">
                    /{activeWorkspace.slug}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform ${
                  workspaceMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Workspace Dropdown */}
            {workspaceMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1 animate-fade-in-up">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                  Accessible Workspaces
                </div>
                {workspaces.map((ws) => {
                  const isSelected = ws.id === activeWorkspace.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleWorkspaceClick(ws)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800 transition-colors cursor-pointer ${
                        isSelected ? "bg-zinc-800/80 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-zinc-200 truncate">{ws.name}</div>
                          <div className="text-[9px] text-zinc-500">{ws.channels.length} channels</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    </button>
                  );
                })}

                <div className="pt-1 mt-1 border-t border-zinc-800">
                  <button
                    id="add-workspace-btn"
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      setShowWorkspaceModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-purple-300 hover:bg-zinc-800 transition-colors cursor-pointer text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Workspace...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Channel Navigation Rack */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 tab-scroll">
          <div>
            <div className="flex items-center justify-between mb-2 px-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FolderTree className="w-3 h-3 text-cyan-400" />
                Channels ({activeWorkspace.channels?.length || 0})
              </span>
              <button
                id="create-channel-btn"
                onClick={() => setShowChannelModal(true)}
                className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Create Channel"
                aria-label="Create Channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {(activeWorkspace.channels || []).map((ch) => {
                const isActive = ch.id === activeChannel.id || ch.name === activeChannel.name;
                return (
                  <button
                    key={ch.id}
                    id={`channel-link-${ch.name}`}
                    onClick={() => handleChannelClick(ch)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-all cursor-pointer text-left ${
                      isActive
                        ? "bg-cyan-950/80 border border-cyan-800/80 text-cyan-200 font-bold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-cyan-400" : "text-zinc-600"
                        }`}
                      />
                      <span className="truncate">{ch.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Channel Details / Topic Card */}
          {activeChannel && (
            <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 text-[11px]">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Active Scope
              </div>
              <div className="text-zinc-200 font-semibold truncate">
                #{activeChannel.name}
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                {activeChannel.topic || "Standard accessibility meeting channel."}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Footer / Collapse */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase">RACK: CONNECTED</span>
          </div>
          <button
            id="collapse-sidebar-btn"
            onClick={onToggle}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}

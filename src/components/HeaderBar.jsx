import { useState, useRef } from "react";
import useClickOutside from "../hooks/useClickOutside";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  List, AlignJustify, LayoutGrid, Moon, Sun, HelpCircle,
  MoreHorizontal, BarChart3, Trash2,
} from "lucide-react";

const pillStyles = syncPillStyles.full;

export default function HeaderBar({
  quotes, filtered,
  view, compact, setView, setCompact,
  showStats, setShowStats,
  showExport, setShowExport,
  showAddMore, setShowAddMore,
  isMobile,
  setConfirmClear,
  addMoreRef,
  exportRef,
  headerRef,
  headerVisible,
  exportDropdownContent,
  syncStatus,
  lastSynced,
  onManualSync,
  dark,
  toggleTheme,
  onShowShortcuts,
}) {
  return (
    <div ref={headerRef} style={{ ...styles.header, alignItems: "center" }}>
      <h1 style={{ ...styles.title, display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={28} />
        Commonplace
      </h1>
      <div className="flex gap-1.5 items-center flex-wrap">
        <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} pillStyles={pillStyles} />
        <Button
          variant="ghost"
          size="icon"
          className="ui-tip ui-tip-below"
          data-tip={dark ? "Light mode" : "Dark mode"}
          onClick={toggleTheme}
        >
          {dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
        </Button>
        {!isMobile && (
          <div style={styles.viewTog}>
            <button className="ui-tip ui-tip-below view-btn" data-tip="Table view" style={{ ...styles.viewBtn, ...(view === "table" && !compact ? styles.viewOn : {}) }} onClick={() => { setView("table"); setCompact(false); }}>
              <List size={16} strokeWidth={1.5} />
            </button>
            <button className="ui-tip ui-tip-below view-btn" data-tip="Compact view" style={{ ...styles.viewBtn, ...(view === "table" && compact ? styles.viewOn : {}) }} onClick={() => { setView("table"); setCompact(true); }}>
              <AlignJustify size={16} strokeWidth={1.5} />
            </button>
            <button className="ui-tip ui-tip-below view-btn" data-tip="Card view" style={{ ...styles.viewBtn, ...(view === "cards" ? styles.viewOn : {}) }} onClick={() => setView("cards")}>
              <LayoutGrid size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}
        <div ref={exportRef} style={{ position: "relative" }}>
          <Button
            variant="outline"
            size="sm"
            className="ui-tip ui-tip-below"
            data-tip="Export or share your collection"
            onClick={() => setShowExport(!showExport)}
          >
            Export ↓
          </Button>
          {showExport && headerVisible && exportDropdownContent}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ui-tip ui-tip-below text-primary"
          data-tip="Add more quotes"
          onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}
        >
          + Add more
        </Button>

        {/* Overflow menu — migrated to Radix DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ui-tip ui-tip-below"
              data-tip="More actions"
            >
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>View</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setShowStats(s => !s)}>
              <BarChart3 size={15} strokeWidth={1.5} className="text-muted-foreground" />
              {showStats ? "Hide full stats" : "Full stats"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Preferences</DropdownMenuLabel>
            <DropdownMenuItem onClick={onShowShortcuts}>
              <HelpCircle size={15} strokeWidth={1.5} className="text-muted-foreground" />
              Keyboard shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Data</DropdownMenuLabel>
            <DropdownMenuItem destructive onClick={() => setConfirmClear(true)}>
              <Trash2 size={15} strokeWidth={1.5} />
              New batch
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

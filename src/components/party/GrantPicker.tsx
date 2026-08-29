"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n/locale";
import { folderLabel, type PetGrants, type SandboxMode } from "@/lib/grants";
import { cn } from "@/lib/utils";

type GrantPickerProps = {
  grants: PetGrants;
  deskAvailable: boolean;
  onChange: (next: PetGrants) => void;
};

export function GrantPicker({
  grants,
  deskAvailable,
  onChange,
}: GrantPickerProps) {
  const { t } = useI18n();
  const [fullOpen, setFullOpen] = useState(false);
  const [paste, setPaste] = useState("");

  const addPath = (folder: string) => {
    const path = folder.trim();
    if (!path) return;
    const sandbox: SandboxMode =
      grants.sandbox === "read_only" ? "workspace" : grants.sandbox;
    onChange({
      sandbox,
      folders: [...new Set([...grants.folders, path])],
    });
  };

  const pickFolder = async () => {
    const picked = deskAvailable
      ? await window.petassist?.openDirectory()
      : null;
    if (picked) {
      addPath(picked);
      return;
    }
  };

  const setMode = async (sandbox: SandboxMode) => {
    if (sandbox === "full_access") {
      setFullOpen(true);
      return;
    }
    onChange({ ...grants, sandbox });
    if (sandbox === "workspace" && grants.folders.length === 0) {
      await pickFolder();
    }
  };

  return (
    <div className="mt-3">
      <p className="mb-1 text-[11px] font-semibold text-slate-500">
        {t.grants.heading}
      </p>
      <div className="flex flex-wrap gap-1">
        {(
          [
            ["read_only", t.grants.readOnly],
            ["workspace", t.grants.workspace],
            ["full_access", t.grants.fullAccess],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={grants.sandbox === id ? "default" : "outline"}
            className={cn(
              id === "full_access" &&
                grants.sandbox === "full_access" &&
                "bg-orange-500 text-white hover:opacity-90"
            )}
            onClick={() => void setMode(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {grants.sandbox === "full_access" ? (
        <Badge variant="destructive" className="mt-2">
          {t.grants.fullAccess}
        </Badge>
      ) : null}
      {(grants.sandbox === "workspace" || grants.folders.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {grants.folders.map((folder) => (
            <span
              key={folder}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
              title={folder}
            >
              <span className="truncate">{folderLabel(folder)}</span>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700"
                onClick={() =>
                  onChange({
                    ...grants,
                    folders: grants.folders.filter((p) => p !== folder),
                  })
                }
              >
                {t.grants.remove}
              </button>
            </span>
          ))}
          <Button size="sm" variant="secondary" onClick={() => void pickFolder()}>
            {t.grants.addFolder}
          </Button>
        </div>
      )}
      {!deskAvailable && grants.sandbox !== "read_only" ? (
        <form
          className="mt-2 flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            addPath(paste);
            setPaste("");
          }}
        >
          <input
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={t.grants.pathPlaceholder}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] outline-none"
          />
          <Button type="submit" size="sm" className="h-8 px-2 text-xs">
            {t.grants.pastePath}
          </Button>
        </form>
      ) : null}
      <AlertDialog open={fullOpen} onOpenChange={setFullOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.grants.fullTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.grants.fullBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.grants.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onChange({ ...grants, sandbox: "full_access" })}
            >
              {t.grants.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";
import type { ExtractionResult } from "../types";

const KEY = "designdna:history:v1";
const MAX = 12;

export function loadHistory(): ExtractionResult[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function getFromHistory(id: string) {
  return loadHistory().find((r) => r.id === id) ?? null;
}

export function saveToHistory(r: ExtractionResult) {
  let list = [r, ...loadHistory().filter((x) => x.id !== r.id)].slice(0, MAX);
  // localStorage is ~5MB; drop oldest entries until it fits
  while (list.length) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return; } catch { list = list.slice(0, -1); }
  }
}

export function removeFromHistory(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadHistory().filter((r) => r.id !== id)));
}

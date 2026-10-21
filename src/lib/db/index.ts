'use client';
import type { Repo } from './types';
import { localRepo } from './local';
import { supabaseRepo } from './supabase';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let repo: Repo | null = null;
/** Supabase when env vars are set, otherwise the localStorage demo adapter. */
export function db(): Repo {
  if (!repo) repo = URL && KEY ? supabaseRepo(URL, KEY) : localRepo();
  return repo;
}
export * from './types';

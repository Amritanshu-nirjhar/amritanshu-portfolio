import type { Metadata } from "next";
import NotFoundShell from "@/components/NotFoundShell";
import { profile } from "@/lib/data";

export const metadata: Metadata = { title: `404 — ${profile.name}` };

export default function NotFound() {
  return <NotFoundShell />;
}

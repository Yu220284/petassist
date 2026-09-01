import { DemoConsole } from "@/components/demo/DemoConsole";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desk",
  description:
    "Stick them on the desk. Research only, drafts only, this folder only.",
};

export default function DeskPage() {
  return <DemoConsole />;
}

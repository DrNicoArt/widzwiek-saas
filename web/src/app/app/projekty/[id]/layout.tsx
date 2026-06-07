import type { ReactNode } from "react";
import { DEMO_PROJECTS } from "@/lib/mockData";
import ProjectClientLayout from "./ProjectClientLayout";

export function generateStaticParams() {
  return [...DEMO_PROJECTS.map((project) => ({ id: project.id })), { id: "sample-demo" }];
}

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return <ProjectClientLayout>{children}</ProjectClientLayout>;
}

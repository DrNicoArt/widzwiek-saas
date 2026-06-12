import type { ReactNode } from "react";
import { SAMPLE_PROJECTS } from "@/lib/sampleData";
import ProjectClientLayout from "./ProjectClientLayout";

export function generateStaticParams() {
  return [...SAMPLE_PROJECTS.map((project) => ({ id: project.id })), { id: "sample" }];
}

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return <ProjectClientLayout>{children}</ProjectClientLayout>;
}

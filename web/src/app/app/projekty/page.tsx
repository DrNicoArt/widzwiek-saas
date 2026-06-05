"use client";
import { motion } from "framer-motion";
import { DEMO_PROJECTS, type DemoProject } from "@/lib/mockData";
import PageHeader from "@/components/shell/PageHeader";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { stagger, inView } from "@/lib/motion";

export default function Projekty() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icon="folder" title="Projekty" demo desc="Biblioteka materiałów. W demo to dane przykładowe; po podłączeniu storage będą realne projekty użytkownika." />
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_PROJECTS.map((p: DemoProject) => <ProjectCard key={p.id} p={p} />)}
      </motion.div>
    </div>
  );
}

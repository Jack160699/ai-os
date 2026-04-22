import express from "express";
import { fetchProjects, updateLead } from "../../services/supabase.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ ok: true, domain: "delivery" });
});

router.post("/kickoff", async (req, res) => {
  const phone = String(req.body?.phone || "").trim();
  const project = String(req.body?.project || "website").trim();
  if (!phone) {
    return res.status(400).json({ ok: false, error: "phone is required" });
  }
  await updateLead(phone, `delivery:${project}:kickoff`);
  return res.status(200).json({ ok: true, phone, project });
});

router.get("/board", async (req, res) => {
  const projects = await fetchProjects(Number(req.query.limit || 200));
  const tasks = projects.map((p) => ({
    id: `task-${p.id}`,
    project_id: p.id,
    phone: p.phone || null,
    title: `${p.project_type || "website"} setup`,
    status: p.status || "kickoff",
    priority: p.status === "kickoff" ? "high" : "normal",
    updated_at: p.updated_at,
  }));
  return res.status(200).json({ ok: true, projects, tasks });
});

export default router;

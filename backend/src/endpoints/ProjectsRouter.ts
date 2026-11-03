import { Router } from "express";
import { requireAuthenticated } from "../middleware/userAuth";
import { projectRepository } from "../database/db";
import { validateBody } from "../middleware/validateRequestBody";
import { projectCreateBodySchema, projectUpdateBodySchema } from "../schemas/ProjectSchema";

export const ProjectsRouter = Router()


ProjectsRouter.get(
'/',
requireAuthenticated,
async (req, res) => {
    const userId = req.user!.id
    const projects = await projectRepository.findBy({ owner: {id: userId} })
    return res.status(200).json(projects)
});

ProjectsRouter.get(
'/:projectId',
requireAuthenticated,
async (req, res) => {
    const projectId = Number(req.params.projectId)
    const userId = req.user!.id
    const project = await projectRepository.findOneBy({
        id: projectId,
        owner: {id: userId}
    })

    if(project === null){
        return res.status(404).json({message: "Project not found"})
    }
    res.json(project)
});

ProjectsRouter.post(
'/create',
requireAuthenticated,
validateBody(projectCreateBodySchema),
async (req, res) => {
    const userId = req.user!.id
    const { project_name, project_description } = req.body

    const project = await projectRepository.create({
        name: project_name,
        description: project_description,
        owner: {id: userId}
    })
    await projectRepository.save(project)
    return res.status(200).json({message: "ok"})
});

ProjectsRouter.put('/:projectId',
requireAuthenticated,
validateBody(projectUpdateBodySchema),
async (req, res) => {
    const projectId = Number(req.params.projectId);
    const userId = req.user!.id;
    const { project_name, project_description } = req.body;

    const project = await projectRepository.findOneBy({ id: projectId, owner: { id: userId } });
    if (project === null){
        return res.status(404).json({ message: "Project not found" });
    }

    project.name = project_name ?? project.name;
    project.description = project_description ?? project.description;
    await projectRepository.save(project);

    return res.status(200).json({ message: "Project updated" });
});

ProjectsRouter.delete(
'/:projectId',
requireAuthenticated,
async (req, res) => {
    const projectId = Number(req.params.projectId);
    const userId = req.user!.id;

    const project = await projectRepository.findOneBy({ id: projectId, owner: { id: userId } });
    if (project === null){
        return res.status(404).json({ message: "Project not found" });
    }

    await projectRepository.remove(project);
    return res.status(200).json({ message: "Project deleted" });
});

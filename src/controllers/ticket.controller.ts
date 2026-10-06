import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { triageTicket } from "../services/triage.service";
import { publishTriageEvent } from "../services/webhook.service";

const createTicketSchema = z.object({
  subject: z.string().min(3).max(180),
  description: z.string().min(5).max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional()
});

const updateTicketSchema = z.object({
  subject: z.string().min(3).max(180).optional(),
  description: z.string().min(5).max(5000).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional()
}).refine(value => Object.keys(value).length > 0, "At least one field is required");

export async function createTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createTicketSchema.parse(req.body);
    const ticket = await prisma.ticket.create({
      data: { ...data, createdById: req.user!.id }
    });
    res.status(201).json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function listTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const where = status && ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)
      ? { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.ticket.count({ where })
    ]);

    res.json({ data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
}

export async function getTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    res.json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateTicketSchema.parse(req.body);
    const exists = await prisma.ticket.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!exists) throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");

    const ticket = await prisma.ticket.update({ where: { id: req.params.id }, data });
    res.json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function deleteTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const exists = await prisma.ticket.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!exists) throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");

    await prisma.ticket.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function triage(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");

    const result = triageTicket(ticket.subject, ticket.description);
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        category: result.category,
        priority: result.priority,
        assignedTeam: result.assignedTeam,
        triageConfidence: result.confidence
      }
    });

    const webhook = await publishTriageEvent({
      event: "ticket.triaged",
      ticketId: updated.id,
      category: updated.category,
      priority: updated.priority,
      assignedTeam: updated.assignedTeam,
      confidence: updated.triageConfidence
    });

    res.json({ data: { ticket: updated, triage: result, integration: webhook } });
  } catch (error) {
    next(error);
  }
}

import { Router } from "express";
import {
  createTicket,
  deleteTicket,
  getTicket,
  listTickets,
  triage,
  updateTicket
} from "../controllers/ticket.controller";
import { authenticate, requireRole } from "../middleware/auth";

export const ticketRouter = Router();

ticketRouter.use(authenticate);
ticketRouter.post("/", createTicket);
ticketRouter.get("/", listTickets);
ticketRouter.get("/:id", getTicket);
ticketRouter.patch("/:id", updateTicket);
ticketRouter.delete("/:id", requireRole("ADMIN"), deleteTicket);
ticketRouter.post("/:id/triage", triage);

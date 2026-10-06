import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { loginUser, registerUser } from "../services/auth.service";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = credentialsSchema.parse(req.body);
    const user = await registerUser(data.email, data.password);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = credentialsSchema.parse(req.body);
    const result = await loginUser(data.email, data.password);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

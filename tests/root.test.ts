process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-that-is-long-enough";

jest.mock("../src/config/prisma", () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }])
  }
}));

import request from "supertest";
import { app } from "../src/app";

describe("system endpoints", () => {
  it("returns service metadata", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.service).toBe("TriageFlow");
  });

  it("returns a healthy status when database check succeeds", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("returns Prometheus metrics", async () => {
    const response = await request(app).get("/metrics");
    expect(response.status).toBe(200);
    expect(response.text).toContain("triageflow_");
  });
});

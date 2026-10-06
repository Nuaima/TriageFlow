import { triageTicket } from "../src/services/triage.service";

describe("triageTicket", () => {
  it("routes a failed SIM activation to technical support", () => {
    const result = triageTicket(
      "SIM activation failed",
      "Customer cannot activate the eSIM after payment"
    );

    expect(result.category).toBe("ACTIVATION");
    expect(result.assignedTeam).toBe("Technical Support");
    expect(result.priority).toBe("HIGH");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("escalates compromised account language", () => {
    const result = triageTicket(
      "Account compromised",
      "Unauthorized activity detected and customer reports stolen credentials"
    );

    expect(result.category).toBe("SECURITY");
    expect(result.priority).toBe("CRITICAL");
    expect(result.assignedTeam).toBe("Security Operations");
  });

  it("falls back safely for unmatched requests", () => {
    const result = triageTicket("General request", "Please update my profile details");

    expect(result.category).toBe("GENERAL_SUPPORT");
    expect(result.assignedTeam).toBe("Customer Support");
  });
});

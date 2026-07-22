import { describe, it, expect } from "vitest";
import { INDIA_STATES, INDIA_STATES_AND_DISTRICTS } from "./indiaLocations";

describe("indiaLocations", () => {
  it("lists all 28 states and 8 union territories (36 total)", () => {
    expect(INDIA_STATES).toHaveLength(36);
  });

  it("has at least one district for every state/UT", () => {
    for (const state of INDIA_STATES) {
      expect(INDIA_STATES_AND_DISTRICTS[state].length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate district names within a state", () => {
    for (const state of INDIA_STATES) {
      const districts = INDIA_STATES_AND_DISTRICTS[state];
      expect(new Set(districts).size).toBe(districts.length);
    }
  });

  it("includes well-known states and districts as a spot check", () => {
    expect(INDIA_STATES).toContain("Tamil Nadu");
    expect(INDIA_STATES_AND_DISTRICTS["Tamil Nadu"]).toContain("Chennai");
    expect(INDIA_STATES).toContain("Kerala");
    expect(INDIA_STATES_AND_DISTRICTS["Kerala"]).toContain("Ernakulam");
    expect(INDIA_STATES).toContain("Delhi");
  });

  it("sorts states and districts in a stable, predictable order for the dropdowns", () => {
    const sortedStates = [...INDIA_STATES].sort();
    expect(INDIA_STATES).toEqual(sortedStates);

    for (const state of INDIA_STATES) {
      const districts = INDIA_STATES_AND_DISTRICTS[state];
      expect(districts).toEqual([...districts].sort());
    }
  });
});

/**
 * vastuRules.test.ts
 * Tests all 12 rule categories through the evaluator.
 */
import { describe, it, expect } from 'vitest';
import { evaluateRules } from '../vastuEvaluator';
import { TRADITIONAL_V1_RULES } from '../vastuRules';
import { buildVastuZoneMap } from '../vastuZones';
import { DEFAULT_VASTU_SETTINGS } from '@vastuplan/shared';
import type { Plot, DesignEntity, RoomEntity, DoorEntity } from '@vastuplan/shared';

const PLOT: Plot = {
  shape: 'rectangle', width: 40, length: 60,
  unit: 'feet', facing: 'east', orientationDegrees: 90,
};

const makeRoom = (
  id: string,
  roomType: string,
  x: number, y: number,
  w: number, h: number
): RoomEntity => ({
  id, type: 'room',
  position: { x, y },
  dimensions: { width: w, height: h },
  rotation: 0,
  properties: { name: roomType, roomType, displayName: roomType },
  floorIndex: 0, locked: false, visible: true,
});

const makeDoor = (id: string, role: string, x: number, y: number): DoorEntity => ({
  id, type: 'door',
  position: { x, y },
  dimensions: { width: 3, height: 7 },
  rotation: 0,
  properties: {
    hostWallId: 'w1', offsetAlongWall: 0,
    doorType: 'single', swingDirection: 'left', swingOrientation: 'inward',
    width: 3, height: 7,
    doorRole: role as any,
  },
  floorIndex: 0, locked: false, visible: true,
});

const zoneMap = buildVastuZoneMap(PLOT);

function runRules(entities: DesignEntity[]) {
  return evaluateRules(entities, zoneMap, PLOT, TRADITIONAL_V1_RULES, DEFAULT_VASTU_SETTINGS);
}

describe('Kitchen rules', () => {
  it('Kitchen in SE zone → preferred', () => {
    // SE: x=26-40, y=40-60 (approx)
    const kitchen = makeRoom('k1', 'kitchen', 28, 42, 10, 12);
    const results = runRules([kitchen]);
    const kitchenResult = results.find(
      (r) => r.entityId === 'k1' && r.ruleId === 'kitchen-southeast-preferred'
    );
    expect(kitchenResult?.status).toBe('preferred');
  });

  it('Kitchen in NE zone → violation for avoid rule', () => {
    // NE: x=26-40, y=0-20
    const kitchen = makeRoom('k1', 'kitchen', 28, 2, 10, 12);
    const results = runRules([kitchen]);
    const avoidResult = results.find(
      (r) => r.entityId === 'k1' && r.ruleId === 'kitchen-northeast-avoid'
    );
    expect(avoidResult?.status).toBe('violation');
    expect(avoidResult?.severity).toBe('critical');
  });

  it('Kitchen in NW zone → acceptable', () => {
    // NW: x=0-13, y=0-20
    const kitchen = makeRoom('k1', 'kitchen', 2, 2, 10, 12);
    const results = runRules([kitchen]);
    const prefResult = results.find(
      (r) => r.entityId === 'k1' && r.ruleId === 'kitchen-southeast-preferred'
    );
    expect(prefResult?.status).toBe('acceptable');
  });
});

describe('Master Bedroom rules', () => {
  it('Master bedroom in SW → preferred', () => {
    // SW: x=0-13, y=40-60
    const room = makeRoom('mb1', 'master-bedroom', 2, 42, 12, 16);
    const results = runRules([room]);
    const result = results.find(
      (r) => r.entityId === 'mb1' && r.ruleId === 'master-bedroom-southwest'
    );
    expect(result?.status).toBe('preferred');
  });

  it('Master bedroom in NE → violation', () => {
    // NE: x=26-40, y=0-20
    const room = makeRoom('mb1', 'master-bedroom', 28, 2, 12, 16);
    const results = runRules([room]);
    const avoidResult = results.find(
      (r) => r.entityId === 'mb1' && r.ruleId === 'master-bedroom-northeast-avoid'
    );
    expect(avoidResult?.status).toBe('violation');
  });
});

describe('Pooja Room rules', () => {
  it('Pooja room in NE → preferred', () => {
    // NE: x=26-40, y=0-20
    const room = makeRoom('p1', 'pooja-room', 28, 2, 8, 8);
    const results = runRules([room]);
    const result = results.find(
      (r) => r.entityId === 'p1' && r.ruleId === 'pooja-northeast-preferred'
    );
    expect(result?.status).toBe('preferred');
  });

  it('Pooja room in SW → violation (avoid zone)', () => {
    const room = makeRoom('p1', 'pooja-room', 2, 42, 8, 8);
    const results = runRules([room]);
    const result = results.find(
      (r) => r.entityId === 'p1' && r.ruleId === 'pooja-northeast-preferred'
    );
    expect(result?.status).toBe('violation');
  });
});

describe('Bathroom/Toilet rules', () => {
  it('Toilet in NE → critical violation', () => {
    const room = makeRoom('t1', 'toilet', 28, 2, 6, 6);
    const results = runRules([room]);
    const critical = results.find(
      (r) => r.entityId === 't1' && r.ruleId === 'toilet-northeast-critical'
    );
    expect(critical?.status).toBe('violation');
    expect(critical?.severity).toBe('critical');
  });

  it('Toilet in NW → preferred', () => {
    const room = makeRoom('t1', 'toilet', 2, 2, 6, 6);
    const results = runRules([room]);
    const result = results.find(
      (r) => r.entityId === 't1' && r.ruleId === 'toilet-northwest-southeast-acceptable'
    );
    expect(result?.status).toBe('preferred');
  });
});

describe('Staircase rules', () => {
  it('Staircase in SW → preferred', () => {
    const stair: DesignEntity = {
      id: 's1', type: 'staircase',
      position: { x: 2, y: 42 },
      dimensions: { width: 10, height: 10 },
      rotation: 0,
      properties: { staircaseType: 'straight', steps: 12, direction: 'up', width: 4 },
      floorIndex: 0, locked: false, visible: true,
    };
    const results = runRules([stair]);
    const result = results.find((r) => r.entityId === 's1' && r.ruleId === 'staircase-south-west-preferred');
    expect(result?.status).toBe('preferred');
  });

  it('Staircase in NE → critical violation', () => {
    const stair: DesignEntity = {
      id: 's1', type: 'staircase',
      position: { x: 28, y: 2 },
      dimensions: { width: 10, height: 10 },
      rotation: 0,
      properties: { staircaseType: 'straight', steps: 12, direction: 'up', width: 4 },
      floorIndex: 0, locked: false, visible: true,
    };
    const results = runRules([stair]);
    const critical = results.find((r) => r.entityId === 's1' && r.ruleId === 'staircase-northeast-avoid');
    expect(critical?.status).toBe('violation');
    expect(critical?.severity).toBe('critical');
  });
});

describe('Brahmasthan rule', () => {
  it('Room in CENTER → violation', () => {
    // CENTER: x=13-26, y=20-40
    const room = makeRoom('c1', 'living-room', 15, 22, 10, 10);
    const results = runRules([room]);
    const brahmasthan = results.find(
      (r) => r.entityId === 'c1' && r.ruleId === 'brahmasthan-keep-open'
    );
    expect(brahmasthan?.status).toBe('violation');
  });
});

describe('Entrance rules', () => {
  it('No main entrance → not-applicable result', () => {
    const door = makeDoor('d1', 'interior', 39, 30);
    const results = runRules([door]);
    const result = results.find((r) => r.ruleId === 'entrance-preferred-direction');
    // No main-entrance door → should be not-applicable
    expect(result?.status).toBe('not-applicable');
  });

  it('Main entrance on East side → preferred', () => {
    // East boundary: x near 40, any y
    const door = makeDoor('d1', 'main-entrance', 39, 30);
    const results = runRules([door]);
    const result = results.find(
      (r) => r.entityId === 'd1' && r.ruleId === 'entrance-preferred-direction'
    );
    expect(result?.status).toBe('preferred');
  });

  it('Main entrance on South side → violation', () => {
    // South: center x=13-26, y near 60
    const door = makeDoor('d1', 'main-entrance', 20, 59);
    const results = runRules([door]);
    const result = results.find(
      (r) => r.entityId === 'd1' && r.ruleId === 'entrance-preferred-direction'
    );
    expect(result?.status).toBe('violation');
  });
});

describe('not-applicable results', () => {
  it('Returns not-applicable for missing entity type', () => {
    // No parking entity in design
    const results = runRules([]);
    const parkingResult = results.find((r) => r.ruleId === 'parking-southeast-northwest');
    expect(parkingResult?.status).toBe('not-applicable');
  });
});

/**
 * vastuZones.test.ts
 * Tests for zone map generation for multiple plot sizes.
 */
import { describe, it, expect } from 'vitest';
import { buildVastuZoneMap, ALL_VASTU_DIRECTIONS } from '../vastuZones';
import type { Plot } from '@vastuplan/shared';

const makePlot = (width: number, length: number): Plot => ({
  shape: 'rectangle', width, length,
  unit: 'feet', facing: 'east', orientationDegrees: 90,
});

describe('buildVastuZoneMap', () => {
  const plotSizes = [
    { width: 30, length: 40, label: '30×40' },
    { width: 40, length: 60, label: '40×60' },
    { width: 50, length: 80, label: '50×80' },
  ];

  for (const { width, length, label } of plotSizes) {
    describe(`Plot ${label}`, () => {
      const plot = makePlot(width, length);
      const zoneMap = buildVastuZoneMap(plot);

      it('produces all 9 zones', () => {
        expect(Object.keys(zoneMap).length).toBe(9);
        for (const dir of ALL_VASTU_DIRECTIONS) {
          expect(zoneMap[dir]).toBeDefined();
        }
      });

      it('every zone has worldBounds and normalizedBounds', () => {
        for (const dir of ALL_VASTU_DIRECTIONS) {
          const zone = zoneMap[dir]!;
          expect(zone.worldBounds).toBeDefined();
          expect(zone.normalizedBounds).toBeDefined();
        }
      });

      it('normalizedBounds values are in [0,1]', () => {
        for (const dir of ALL_VASTU_DIRECTIONS) {
          const nb = zoneMap[dir]!.normalizedBounds;
          expect(nb.minX).toBeGreaterThanOrEqual(0);
          expect(nb.minY).toBeGreaterThanOrEqual(0);
          expect(nb.maxX).toBeLessThanOrEqual(1);
          expect(nb.maxY).toBeLessThanOrEqual(1);
        }
      });

      it('worldBounds match plot dimensions', () => {
        for (const dir of ALL_VASTU_DIRECTIONS) {
          const wb = zoneMap[dir]!.worldBounds;
          expect(wb.x + wb.width).toBeLessThanOrEqual(width + 0.001);
          expect(wb.y + wb.height).toBeLessThanOrEqual(length + 0.001);
        }
      });

      it('CENTER zone is in the middle third', () => {
        const center = zoneMap['CENTER']!;
        const nb = center.normalizedBounds;
        expect(nb.minX).toBeCloseTo(1/3, 5);
        expect(nb.maxX).toBeCloseTo(2/3, 5);
        expect(nb.minY).toBeCloseTo(1/3, 5);
        expect(nb.maxY).toBeCloseTo(2/3, 5);
      });

      it('NW zone has minX=0, minY=0', () => {
        const nw = zoneMap['NW']!;
        expect(nw.normalizedBounds.minX).toBeCloseTo(0);
        expect(nw.normalizedBounds.minY).toBeCloseTo(0);
      });

      it('SE zone has maxX=1, maxY=1', () => {
        const se = zoneMap['SE']!;
        expect(se.normalizedBounds.maxX).toBeCloseTo(1);
        expect(se.normalizedBounds.maxY).toBeCloseTo(1);
      });

      it('zone centers are within zone bounds', () => {
        for (const dir of ALL_VASTU_DIRECTIONS) {
          const zone = zoneMap[dir]!;
          const { x, y, width: w, height: h } = zone.worldBounds;
          expect(zone.center.x).toBeGreaterThanOrEqual(x - 0.001);
          expect(zone.center.x).toBeLessThanOrEqual(x + w + 0.001);
          expect(zone.center.y).toBeGreaterThanOrEqual(y - 0.001);
          expect(zone.center.y).toBeLessThanOrEqual(y + h + 0.001);
        }
      });
    });
  }
});

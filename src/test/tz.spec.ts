import { expect } from 'chai';
import { TimeZoneIdentifier } from '../lib/tz';

describe('TimeZoneIdentifier: names outside the built-in table', () => {
  // Chrome/ICU reports these legacy names; they used to throw "Unknown timezone" on Node
  const cases: Array<[string, string]> = [
    ['Asia/Saigon', '+07:00'],
    ['Asia/Calcutta', '+05:30'],
    ['Asia/Katmandu', '+05:45'],
    ['Asia/Rangoon', '+06:30'],
    ['Etc/UCT', '+00:00'],
    ['Etc/Zulu', '+00:00'],
  ];
  for (const [zone, offset] of cases) {
    it(`${zone} -> ${offset}`, () => {
      expect(TimeZoneIdentifier.getTimeZoneGMTOffset(zone)).to.equal(offset);
      expect(TimeZoneIdentifier.isSupported(zone)).to.equal(true);
    });
  }

  it('Europe/Kyiv resolves like Europe/Kiev (±DST, never throws)', () => {
    const kyiv = TimeZoneIdentifier.getTimeZoneOffsetInSeconds('Europe/Kyiv');
    expect([7200, 10800]).to.include(kyiv);
  });

  it('table entries keep their table value', () => {
    expect(TimeZoneIdentifier.getTimeZoneGMTOffset('Europe/Moscow')).to.equal('+03:00');
    expect(TimeZoneIdentifier.getTimeZoneGMTOffset('Asia/Ho_Chi_Minh')).to.equal('+07:00');
  });

  it('garbage is still rejected', () => {
    expect(() => TimeZoneIdentifier.getTimeZoneGMTOffset('Mars/Olympus')).to.throw(/Unknown timezone `Mars\/Olympus`/);
    expect(() => TimeZoneIdentifier.getTimeZoneGMTOffset('undefined')).to.throw(/Unknown timezone/);
    expect(TimeZoneIdentifier.isSupported('Mars/Olympus')).to.equal(false);
    expect(TimeZoneIdentifier.isSupported('')).to.equal(false);
  });
});

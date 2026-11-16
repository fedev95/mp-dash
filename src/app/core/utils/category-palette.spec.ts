import { CATEGORY_PALETTE, nextAvailableColor } from './category-palette';

describe('nextAvailableColor', () => {
  it('returns the first color when none is used', () => {
    expect(nextAvailableColor([])).toBe(CATEGORY_PALETTE[0]);
  });

  it('skips colors already in use', () => {
    expect(nextAvailableColor([CATEGORY_PALETTE[0], CATEGORY_PALETTE[1]])).toBe(
      CATEGORY_PALETTE[2],
    );
  });

  it('cycles through the palette once every color is taken', () => {
    const used = [...CATEGORY_PALETTE, CATEGORY_PALETTE[0]];
    expect(nextAvailableColor(used)).toBe(CATEGORY_PALETTE[used.length % CATEGORY_PALETTE.length]);
  });

  it('only contains #rrggbb colors accepted by firestore.rules', () => {
    for (const color of CATEGORY_PALETTE) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

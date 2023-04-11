import { describe, test } from 'vitest';
import { loadFactors } from '../loader';

describe('tarif loader', () => {
  test('saves cantons', () => {
    loadFactors(2022);
  });
});

import { describe, test } from 'vitest';
import { loadDeductions } from '../loader';

describe('tarif loader', () => {
  test('saves cantons', () => {
    loadDeductions(2022);
  });
});

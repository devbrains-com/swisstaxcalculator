import { describe, test } from 'vitest';
import { loadTarifs } from '../loader';

describe('tarif loader', () => {
  test('saves cantons', () => {
    loadTarifs(2022);
  });
});

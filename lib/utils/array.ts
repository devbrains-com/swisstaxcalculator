export const sortArray = <T>(
  array: T[],
  selector: (input: T) => number,
  order: 'asc' | 'desc' = 'asc'
) => {
  const sortedArray = [...array];
  sortedArray.sort((a, b) => {
    if (selector(a) < selector(b)) return order === 'asc' ? -1 : 1;
    if (selector(a) > selector(b)) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return sortedArray;
};

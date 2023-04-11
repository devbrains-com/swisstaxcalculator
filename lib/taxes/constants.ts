// Alleinstehend, Verheiratet, Eingetragene Partnerschaft, Konkubinat
export const relationships = ['s', 'm', 'rp', 'c'] as const;

// Christkatholisch, Römisch-katholisch, Reformiert, Sonstige/Keine
export const confessions = ['christ', 'roman', 'protestant', 'other'] as const;

export const dataParsedRelativePath = 'data/parsed/';
export const dataParsedBasePath = `./${dataParsedRelativePath}`;
export const dataRawBasePath = './data/raw/';

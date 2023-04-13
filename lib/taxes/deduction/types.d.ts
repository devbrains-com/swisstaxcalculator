import { TaxLocationRaw } from '../types';
import { TaxInput, TaxGrossNetDetail } from '../typesClient';

export interface TaxDeductionDefinitionInput {
  target?: string;
  amount?: number;
  multiplier?: number;
}

export interface TaxDeductionDefinition {
  id: string;
  rule: (taxInput: TaxInput) => boolean;
  input: (
    taxInput: TaxInput,
    grossDeductions: TaxGrossNetDetail[]
  ) => TaxDeductionDefinitionInput[];
}

export interface TaxDeductionTableItem {
  id: string;
  minimum: number;
  maximum: number;
  format: TaxDeductionTableItemFormat;
  percent: number;
  amount: number;
  name: {
    de: string;
    en: string;
    it: string;
    fr: string;
  };
}

export interface TaxDeductionTable {
  type: TaxDeductionTableType;
  target: TaxDeductionTableTarget;
  items: TaxDeductionTableItem[];
}

export interface TaxDeductionTableExtended extends TaxDeductionTable {
  itemsById: Map<string, TaxDeductionTableItem>;
}

export type TaxDeductionTableType = 'EINKOMMENSSTEUER' | 'VERMOEGENSSTEUER';
export type TaxDeductionTableTarget = 'BUND' | 'KANTON' | 'GEMEINDE';
export type TaxDeductionTableItemFormat =
  | 'PERCENT'
  | 'STANDARDIZED'
  | 'MAXIMUM'
  | 'PERCENT,MINIMUM,MAXIMUM'
  | '';

export interface TaxDeductionTableRaw {
  TaxType: string;
  Target: string;
  Table: {
    Minimum: number;
    Maximum: number;
    Format: string;
    Percent: number;
    Amount: number;
    Name: {
      DE: string;
      EN: string;
      ID: string;
      IT: string;
      FR: string;
    };
  }[];
  Location: TaxLocationRaw;
}

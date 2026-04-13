# 🇨🇭 Swiss Tax Calculator

The goal of this repository is to implement all the logic used to calculate the swiss taxes and serve it in a super fast service to do any kind of calculations in any kind of environment.

<br>

## 👋 Get started

- Clone the repository
- yarn install (installs all the dependencies)
- yarn dev (runs the dev server)

<br>

## 👉 Functionality

- **Nuxt 3** application with server api and static demo page (https://github.com/nuxt/nuxt)
- **./pages/index.vue** shows an example page for calculating taxes
  - Live preview https://swisstaxcalculator.vercel.app/
  - Inspired by https://swisstaxcalculator.estv.admin.ch/#/calculator
- **./server/api/** API routes for tax calculation and locations
- **./lib/taxes/** covers all the tax logic
- **./data/** includes all the raw and parsed data

<br>

## Supported tax types

- Income & wealth (fortune)
- (Pension) capital withdrawal

<br>

## Supported income types

- Taxable income
- Net income
- Gross income

The speciality about the gross- and net-income types is the deductions that are made automatically based on the tax input and the possible deductions.

<br>

## ℹ️ Data source

### Tarifs, Factors and Deductions

https://swisstaxcalculator.estv.admin.ch/#/taxdata

### (Pension) capital withdrawal definitions

Some information is from https://finpension.ch/de/vergleich-kapitalbezugssteuer/ and the updated values are from the individual canton tax laws directly.

<br>

## 🔥 Static deployment support

To run the service, there is no database required. All the data is either in the code files or imported from the raw data during dev / build time using the following command.

```
yarn importdata <year>[,<year>,...] [--download]

Raw data: ./data/raw/...
Parsed data: ./data/parsed/...
```

### Automatic download & import

Use the `--download` flag to fetch raw data directly from the ESTV API and import it in one step:

```
yarn importdata 2026 --download
yarn importdata 2024,2025,2026 --download
```

### Manual import

To import from existing raw files (without downloading), just run:

```
yarn importdata 2026
```

To import more tax years manually, copy the raw files into `./data/raw/<year>/` and run the `importdata` script. The raw data can be retrieved by looking into the requests done by the browser (just save the results):

1. tarifs.json: https://swisstaxcalculator.estv.admin.ch/#/taxdata/tax-scales (API_exportManyTaxScales)
2. deductions.json: https://swisstaxcalculator.estv.admin.ch/#/taxdata/deductions (API_exportManyDeductions)
3. factors.json: https://swisstaxcalculator.estv.admin.ch/#/taxdata/tax-rates (API_exportManySimpleRates)

<br>

## 🚀 Blazing fast execution

The data is parsed into small chunks, mostly per canton to guarantee a fast loading time and minimal memory consumption. Once loaded, the data is held in memory until the service is stopped.

In an **always on environment**, the data will be in memory until redeployed. This ensures maximum execution speed.

For **cloud functions**, the data has to be reloaded once the function was removed and reloaded into memory.

<br>

## 📡 HTTP API

The Nuxt server exposes three JSON endpoints. Base URL is the deployment root (e.g. `https://swisstaxcalculator.vercel.app`).

### `POST /api/taxes` — calculate taxes

Request body (`TaxInput`):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `calculationType` | `'incomeAndWealth' \| 'capital'` | yes | `incomeAndWealth` = yearly income + fortune tax. `capital` = one-off pension-capital withdrawal tax. |
| `year` | `number` | yes | Tax year (e.g. `2025`). Must match a directory under `data/parsed/`. |
| `cantonId` | `number` | yes | ESTV canton ID. Resolve from `/api/locations`. |
| `locationId` | `number` | yes | BFS ID of the municipality (`BfsID` from `/api/locations`). |
| `relationship` | `'s' \| 'm' \| 'rp' \| 'c'` | yes | Single, married, registered partnership, cohabitation. `m`/`rp` require `persons.length === 2`; `s`/`c` require `1`. |
| `children` | `number` | yes | Number of dependent children (affects deductions and the tarif group). |
| `fortune` | `number` | yes | Net fortune in CHF. For `calculationType: 'capital'` this field carries the capital amount. |
| `persons` | `TaxInputPerson[]` | yes | 1 or 2 persons (see below). |
| `deductions` | `TaxDeductionGeneralInput` | no | Shared household deductions (see below). |
| `includeProgression` | `boolean` | no | When `true`, the response includes a per-bracket breakdown for charting the effective marginal-rate progression (see *Progression* below). |

`TaxInputPerson`:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `age` | `number` | yes | Age in years (affects some deductions). |
| `confession` | `'christ' \| 'roman' \| 'protestant' \| 'other'` | yes | Church tax is levied only for the first three; `other` means no church tax. |
| `incomeType` | `'gross' \| 'net' \| 'taxable'` | yes | Which level of income `income` represents. `gross` triggers automatic AHV/IV/EO/ALV/NBU/PK deductions; `net` only the income deductions; `taxable` skips all automatic deductions. |
| `income` | `number` | yes | Income in CHF at the level given by `incomeType`. |
| `pkDeduction` | `number` | no | Employee pension-fund contribution (in CHF) to deduct from a gross income. |
| `deductions` | `TaxDeductionPerPersonInput` | no | Per-person deductions (see below). |

`TaxDeductionPerPersonInput` — all CHF, all optional:

`insurancePremiums`, `pillar3a`, `mealCosts`, `travelExpenses`, `otherProfessionalExpenses`, `professionalExpensesSideline`, `otherDeductions`.

`TaxDeductionGeneralInput` — all CHF, all optional:

`insurancePremiumsKids`, `childcareCosts`, `debtInterest`, `maintenanceCostsRealEstate`, `otherDeductions`.

#### Response (`TaxResult`)

```jsonc
{
  "input": { /* echo of TaxInput */ },
  "taxesIncomeCanton": 0,
  "taxesIncomeCity": 0,
  "taxesIncomeChurch": 0,
  "taxesFortuneCanton": 0,
  "taxesFortuneCity": 0,
  "taxesFortuneChurch": 0,
  "taxesIncomeBund": 0,
  "taxesPersonnel": 0,
  "taxesTotal": 0,
  "details": {
    "grossNetDetails": [{ "person": { /* ... */ }, "grossIncome": 0, "ahvIvEo": 0, "alv": 0, "nbu": 0, "pk": 0, "netIncome": 0 }],
    "netIncomeCanton": 0,
    "netIncomeBund": 0,
    "deductionsIncome": [{ "id": "pillar3a", "name": "…", "target": "P1", "amountCanton": 0, "amountBund": 0 }],
    "deductionsFortune": [],
    "taxableFortuneCanton": 0,
    "taxableIncomeCanton": 0,
    "taxableIncomeBund": 0
  },
  "progression": { /* only when includeProgression === true, see below */ }
}
```

All monetary amounts are in CHF. `taxesTotal` is the sum of all line items above it.

#### Progression (optional)

Set `"includeProgression": true` to receive a bracket-wise breakdown of the effective marginal tax rates. Useful for rendering staircase / bar charts of the user's position in the tarif.

```jsonc
"progression": {
  "overall":        { /* ProgressionResult — Bund + canton + city + church combined */ },
  "bund":           { /* ProgressionResult — federal (Bund) income tax only */ },
  "cantonIncome":   { /* ProgressionResult — canton income tax × full Steuerfuss */ },
  "cantonFortune":  { /* ProgressionResult — canton fortune tax × full Steuerfuss */ }
}
```

`ProgressionResult`:

| Field | Type | Description |
| --- | --- | --- |
| `taxableIncome` | `number` | The taxable base (income or fortune) this progression was evaluated on, in CHF. |
| `brackets` | `ProgressionBracket[]` | All brackets from the tarif, lowest rate first. See below. |
| `currentBracketIndex` | `number` | Index into `brackets` of the bracket that contains the user's `taxableIncome`. |
| `amountIntoCurrentBracket` | `number` | How many CHF of the user's income are already in the current bracket (`taxableIncome − currentBracket.lowerBound`). |
| `amountToNextBracket` | `number \| null` | CHF of additional income needed to cross into the next bracket. `null` when already in the tarif's top bracket. |
| `nextBracketPercent` | `number \| null` | Effective marginal rate of the next bracket (`null` at top). |
| `previousBracketPercent` | `number \| null` | Effective marginal rate of the previous bracket (`null` at bottom). |

`ProgressionBracket`:

| Field | Type | Description |
| --- | --- | --- |
| `lowerBound` | `number` | CHF threshold where this bracket starts. |
| `upperBound` | `number` | CHF threshold where this bracket ends. **If `upperBound === lowerBound` the bracket is open-ended at the top** ("ab CHF X"). |
| `percent` | `number` | Effective marginal rate in percent (e.g. `16.92` means 16.92%). For `cantonIncome` / `cantonFortune` this already includes the canton + city + church multiplier; for `overall` it also stacks the federal rate. |
| `amountInBracket` | `number` | CHF of the user's income that falls inside this bracket. `0` for brackets above the user's income. |
| `taxInBracket` | `number` | CHF of tax generated in this bracket for the user. `0` for brackets above the user's income. |

Notes:
- The `overall` progression is projected onto the canton-taxable-income axis; Bund thresholds are shifted by `taxableIncomeCanton − taxableIncomeBund` so both systems line up.
- Canton `FREIBURG` tarifs are continuous (no discrete steps) and return a single-bracket progression at the effective rate for the given income.
- Minor rounding differences (a few CHF) can exist between `sum(brackets.taxInBracket)` and the corresponding headline tax number because the underlying calculation rounds down to the nearest 100 CHF at intermediate steps.

#### Example

```bash
curl -X POST https://swisstaxcalculator.vercel.app/api/taxes \
  -H 'Content-Type: application/json' \
  -d '{
    "calculationType": "incomeAndWealth",
    "year": 2025,
    "cantonId": 26,
    "locationId": 1,
    "relationship": "s",
    "children": 0,
    "fortune": 0,
    "persons": [{
      "age": 35,
      "confession": "other",
      "incomeType": "gross",
      "income": 100000
    }],
    "includeProgression": true
  }'
```

#### Errors

`500` responses include the usual Nitro error envelope (`{ statusCode, statusMessage, message, ... }`). Common causes:
- Unknown `cantonId` / `locationId` / `year` combination (no factors or tarifs on disk).
- Invalid person count for the given `relationship` (see `validateTaxInput`).

### `GET /api/locations`

Returns the list of Swiss municipalities for the default tax year, one entry per BFS ID:

```jsonc
[{ "TaxLocationID": 891400000, "BfsID": 1, "BfsName": "Aeugst am Albis", "CantonID": 26, "Canton": "ZH" }, ...]
```

Use `BfsID` as `locationId` and `CantonID` as `cantonId` in a `POST /api/taxes` call.

### `GET /api/inputdata`

Returns the static dropdown metadata the reference UI uses: available years, relationships, confessions, income types, and deduction field configs with default values and localized (German) labels. Handy if you want to build your own form without hard-coding these enums.

<br>

## 🤝 Contribution & Usage

For issues and questions, please create an issue.

Please contact me (michael.bolliger@gmail.com) if you want to contribute or use this repository in your own environment or application. Thank you.

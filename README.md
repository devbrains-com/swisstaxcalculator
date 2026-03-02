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

## 🤝 Contribution & Usage

For issues and questions, please create an issue.

Please contact me (michael.bolliger@gmail.com) if you want to contribute or use this repository in your own environment or application. Thank you.

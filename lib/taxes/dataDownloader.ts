/* eslint-disable no-console */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { dataRawBasePath } from './constants';

const API_BASE =
  'https://swisstaxcalculator.estv.admin.ch/delegate/ost-integration/v1/lg-proxy/operation/c3b67379_ESTV';

const endpoints = {
  tarifs: { path: '/API_exportManyTaxScales', body: (year: number) => ({ TaxYear: year, TaxGroupID: 88 }) },
  factors: { path: '/API_exportManySimpleRates', body: (year: number) => ({ TaxYear: year, TaxGroupID: 99 }) },
  deductions: { path: '/API_exportManyDeductions', body: (year: number) => ({ TaxYear: year, TaxGroupID: 88 }) }
};

const fetchJson = (urlPath: string, body: object): Promise<string> => {
  const url = `${API_BASE}${urlPath}`;
  const postData = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const data = Buffer.concat(chunks).toString();
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
            return;
          }
          resolve(data);
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const downloadFile = async (year: number, name: string, endpoint: typeof endpoints.tarifs) => {
  console.log(`  Downloading ${name}.json for ${year}...`);
  const data = await fetchJson(endpoint.path, endpoint.body(year));

  const parsed = JSON.parse(data) as { response: unknown[] };
  if (!parsed.response || parsed.response.length === 0) {
    throw new Error(`No data returned for ${name} ${year}. The year may not be available yet.`);
  }
  console.log(`  Got ${parsed.response.length} entries for ${name}`);

  const dirPath = path.resolve(`${dataRawBasePath}${year}`);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(`${dirPath}/${name}.json`, data);
};

export const downloadRawData = async (year: number) => {
  console.log(`Downloading raw data for ${year} from swisstaxcalculator.estv.admin.ch...`);

  await downloadFile(year, 'tarifs', endpoints.tarifs);
  await downloadFile(year, 'factors', endpoints.factors);
  await downloadFile(year, 'deductions', endpoints.deductions);

  console.log(`Download complete for ${year}\n`);
};

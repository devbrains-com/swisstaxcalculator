<template>
  <div class="w-full max-w-5xl mx-auto px-3 sm:px-8">
    <div class="mb-40">
      <h1 class="text-2xl mt-9 mb-4">Steuerrechner</h1>
      <div class="flex flex-wrap justify-between gap-9">
        <div class="max-w-sm">
          <FormKit :value="defaultInput" type="form" :actions="false" @submit="submit">
            <div class="grid grid-cols-2 gap-4">
              <FormKit
                type="buttonSelect"
                :name="nameof < TaxInput > ((x) => x.taxType)"
                label="Steuerart"
                :options="[
                  { value: 'ev', label: 'Einkommens- und Vermögenssteuer' },
                  { value: 'pc', label: 'Vorsorge Kapitalsteuer' }
                ]"
                orientation="row"
                option-label-classes="text-xs"
                outer-class="col-span-2"
              />
              <FormKit
                type="number"
                :name="nameof < TaxInput > ((x) => x.year)"
                :step="1"
                :min="2022"
                :max="2022"
                label="Steuerjahr"
              />
              <FormKit
                type="autocomplete"
                :name="nameof < TaxInput > ((x) => x.locationId)"
                label="Steuergemeinde"
                :options="taxLocations"
                outer-class="col-span-2"
                :filter-min-length="2"
              />
              <FormKit
                v-model="civilStatus"
                :name="nameof < TaxInput > ((x) => x.relationship)"
                type="buttonSelect"
                label="Zivilstand"
                :options="civilStatusOptions"
                outer-class="col-span-2"
                orientation="row"
                option-label-classes="text-xs"
              />
              <FormKit
                label="Anzahl Kinder"
                :name="nameof < TaxInput > ((x) => x.children)"
                type="select"
                validation="required"
                :as-number="true"
                :options="childrenOptions"
                :step-next="true"
              />

              <FormKit type="list" :name="nameof < TaxInput > ((x) => x.persons)">
                <FormKit v-for="person in personItems" :key="person" type="group">
                  <div
                    v-if="showSecondPerson"
                    class="col-start-1 text-sm font-medium text-normal-600 -mb-3"
                  >
                    Person {{ person }}
                  </div>
                  <FormKit
                    :key="person"
                    type="numberSuffix"
                    suffix="Jahre"
                    :name="nameof < TaxInputPerson > ((x) => x.age)"
                    :step="1"
                    :min="18"
                    :max="150"
                    label="Alter"
                    outer-class="col-start-1"
                  />
                  <FormKit
                    :key="person"
                    type="buttonSelect"
                    :name="nameof < TaxInputPerson > ((x) => x.confession)"
                    validation-label="Konfession"
                    :options="confessionOptions"
                    outer-class="col-span-2"
                    orientation="row"
                    option-label-classes="text-xs"
                  />

                  <FormKit
                    :key="person"
                    type="numberSuffix"
                    suffix="CHF"
                    :name="nameof < TaxInputPerson > ((x) => x.income)"
                    :step="1"
                    :min="0"
                    :value="0"
                    label="Brutto Einkommen"
                  />

                  <FormKit
                    :key="person"
                    type="numberSuffix"
                    suffix="CHF"
                    :name="nameof < TaxInputPerson > ((x) => x.pkDeduction)"
                    :step="1"
                    :min="0"
                    :max="10000"
                    :value="0"
                    label="PK-Beitrag Arbeitnehmer"
                    outer-class="col-start-1"
                  />

                  <FormKit
                    :key="person"
                    type="numberSuffix"
                    suffix="CHF"
                    :name="nameof < TaxInputPerson > ((x) => x.pillar3aDeduction)"
                    :step="1"
                    :min="0"
                    :max="10000000"
                    :value="0"
                    label="Säule 3a Beitrag"
                  />
                </FormKit>
              </FormKit>
              <FormKit
                type="numberSuffix"
                suffix="CHF"
                :name="nameof < TaxInput > ((x) => x.fortune)"
                outer-class="col-start-1"
                :step="1"
                :min="0"
                label="Reinvermögen"
              />
              <GlobalButton type="submit" class="col-start-1">Berechnen</GlobalButton>
            </div>
          </FormKit>
        </div>
        <div v-if="taxes" class="max-w-sm">
          <h3 class="text-lg leading-7">Resultat Steuerberechnung</h3>
          <div class="grid grid-cols-2 text-sm mt-4">
            <!-- Taxes canton -->
            <div class="font-medium">Kantonssteuer</div>
            <div class="font-medium font-numerictab text-right">
              {{ displayCurrencyShort(taxes.taxesIncomeCanton + taxes.taxesFortuneCanton) }}
            </div>

            <div class="">Einkommenssteuer</div>
            <div class="font-numerictab text-sm text-right">
              {{ displayCurrencyShort(taxes.taxesIncomeCanton) }}
            </div>

            <div class="">Vermögenssteuer</div>
            <div class="font-numerictab text-right">
              {{ displayCurrencyShort(taxes.taxesFortuneCanton) }}
            </div>
            <div class="col-span-2 mt-2 bg-normal-200 h-1.5">
              <div
                class="h-1.5 bg-primary-600"
                :style="{
                  width: `${
                    ((taxes.taxesIncomeCanton + taxes.taxesFortuneCanton) / taxes.taxesTotal) * 100
                  }%`
                }"
              />
            </div>

            <!-- Taxes city -->
            <div class="col-span-2 mt-4"></div>
            <div class="font-medium">Gemeindesteuern</div>
            <div class="font-medium font-numerictab text-right">
              {{ displayCurrencyShort(taxes.taxesIncomeCity + taxes.taxesFortuneCity) }}
            </div>

            <div class="">Einkommenssteuer</div>
            <div class="font-numerictab text-sm text-right">
              {{ displayCurrencyShort(taxes.taxesIncomeCity) }}
            </div>

            <div class="">Vermögenssteuer</div>
            <div class="font-numerictab text-right">
              {{ displayCurrencyShort(taxes.taxesFortuneCity) }}
            </div>

            <div class="col-span-2 mt-2 bg-normal-200 h-1.5">
              <div
                class="h-1.5 bg-primary-600"
                :style="{
                  width: `${
                    ((taxes.taxesIncomeCity + taxes.taxesFortuneCity) / taxes.taxesTotal) * 100
                  }%`
                }"
              />
            </div>

            <!-- Taxes Church -->
            <div class="col-span-2 mt-4"></div>
            <div class="font-medium">Kirchensteuern</div>
            <div class="font-medium font-numerictab text-right">
              {{ displayCurrencyShort(taxes.taxesIncomeChurch + taxes.taxesFortuneChurch) }}
            </div>

            <div class="">Einkommenssteuer</div>
            <div class="font-numerictab text-sm text-right">
              {{ displayCurrencyShort(taxes.taxesIncomeChurch) }}
            </div>

            <div class="">Vermögenssteuer</div>
            <div class="font-numerictab text-right">
              {{ displayCurrencyShort(taxes.taxesFortuneChurch) }}
            </div>

            <div class="col-span-2 mt-2 bg-normal-200 h-1.5">
              <div
                class="h-1.5 bg-primary-600"
                :style="{
                  width: `${
                    ((taxes.taxesIncomeChurch + taxes.taxesFortuneChurch) / taxes.taxesTotal) * 100
                  }%`
                }"
              />
            </div>

            <!-- Taxes person -->
            <div class="col-span-2 mt-4"></div>
            <div class="font-medium">Personalsteuer</div>
            <div class="font-medium font-numerictab text-right">
              {{ displayCurrencyShort(taxes.taxesPersonnel) }}
            </div>

            <div class="col-span-2 mt-2 bg-normal-200 h-1.5">
              <div
                class="h-1.5 bg-primary-600"
                :style="{
                  width: `${0 * 100}%`
                }"
              />
            </div>

            <!-- Taxes bund -->
            <div class="col-span-2 mt-4"></div>
            <div class="font-medium">Direkte Bundessteuer</div>
            <div class="font-medium font-numerictab text-right">
              {{ displayCurrencyShort(taxes.taxesIncomeBund) }}
            </div>

            <div class="col-span-2 mt-2 bg-normal-200 h-1.5">
              <div
                class="h-1.5 bg-primary-600"
                :style="{
                  width: `${(taxes.taxesIncomeBund / taxes.taxesTotal) * 100}%`
                }"
              />
            </div>

            <!-- Taxes total -->
            <div class="col-span-2 mt-4 border-t mb-4"></div>
            <div class="">Total Einkommenssteuer</div>
            <div class="font-numerictab text-sm text-right">
              {{
                displayCurrencyShort(
                  taxes.taxesIncomeCity +
                    taxes.taxesIncomeCanton +
                    taxes.taxesIncomeChurch +
                    taxes.taxesIncomeBund
                )
              }}
            </div>

            <div class="">Total Vermögenssteuer</div>
            <div class="font-numerictab text-right">
              {{
                displayCurrencyShort(
                  taxes.taxesFortuneCity + taxes.taxesFortuneCanton + taxes.taxesFortuneChurch
                )
              }}
            </div>
            <div class="font-medium">Total Steuern</div>
            <div class="font-medium font-numerictab text-right">
              {{ displayCurrencyShort(taxes.taxesTotal) }}
            </div>
          </div>
        </div>

        <div v-if="taxes">
          <div class="max-w-2xl text-sm">
            <h3 class="text-lg leading-7">Details Steuerberechnung</h3>
            <!-- Gross to net -->
            <table
              v-if="detailsGrossNet.length > 0"
              class="w-full font-numerictab border-spacing-y-2 border-separate"
            >
              <tr class="bg-normal-200">
                <th class="w-auto text-left">Brutto- / Nettoeinkommen</th>
                <th class="w-32 text-right">P1</th>
                <th class="w-32 text-right"><span v-if="showSecondPerson">P2</span></th>
              </tr>
              <tr v-for="(item, index) in detailsGrossNet" :key="index" class="last:font-medium">
                <td>{{ item.label }}</td>
                <td class="text-right">{{ displayCurrency(item.p1) }}</td>
                <td class="text-right">
                  <span v-if="showSecondPerson">{{ displayCurrency(item.p2 ?? 0) }}</span>
                </td>
              </tr>
            </table>

            <!-- Deductions -->
            <table class="w-full mt-9 border-spacing-y-2 border-separate">
              <thead>
                <tr class="bg-normal-200">
                  <th class="w-auto text-left">Einkommen</th>
                  <th class="w-32 text-right">Kanton</th>
                  <th class="w-32 text-right">Bund</th>
                </tr>
              </thead>
              <tbody class="">
                <tr
                  v-for="(item, index) in detailsDeductionsIncome"
                  :key="index"
                  class="last:font-medium"
                >
                  <td class="">{{ item.label }}</td>
                  <td class="text-right font-numerictab">{{ displayCurrency(item.canton) }}</td>
                  <td class="text-right font-numerictab">
                    {{ displayCurrency(item.bund) }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Fortune -->
            <table class="w-full mt-9 border-spacing-y-2 border-separate">
              <thead>
                <tr class="bg-normal-200">
                  <th class="w-auto text-left">Vermögen</th>
                  <th class="w-32 text-right">Kanton</th>
                  <th class="w-32"></th>
                </tr>
              </thead>
              <tbody class="">
                <tr
                  v-for="(item, index) in detailsDeductionsFortune"
                  :key="index"
                  class="last:font-medium"
                >
                  <td class="">{{ item.label }}</td>
                  <td class="text-right font-numerictab">{{ displayCurrency(item.canton) }}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormKitNode } from '@formkit/core';
import { nameof } from 'ts-simple-nameof';
import {
  civilStatusOptions,
  confessionOptions,
  childrenOptions
} from '~~/lib/components/listOptions';
import { TaxInput, TaxInputPerson, TaxRelationship, TaxResult } from '~~/lib/taxes/types';

const defaultInput: Partial<TaxInput> = {
  taxType: 'ev',
  children: 0,
  fortune: 250000,
  locationId: 66,
  relationship: 's',
  year: 2022,
  persons: [
    {
      age: 30,
      confession: 'roman',
      income: 100000,
      incomeType: 'GROSS',
      pkDeduction: 5000
    }
  ]
};

const taxLocationsResult = useLazyFetch(`/api/locations`);

const taxLocations = computed(
  () =>
    taxLocationsResult.data.value?.map((item) => ({
      value: item.BfsID,
      label: `${item.BfsName} (${item.Canton})`
    })) ?? []
);

const civilStatus = ref<TaxRelationship>();

const showSecondPerson = computed(() => civilStatus.value === 'm' || civilStatus.value === 'rp');
const personItems = computed(() => (showSecondPerson.value ? [1, 2] : [1]));

const taxes = ref<TaxResult>();

type GrossNetItem = { label: string; p1: number; p2?: number };
const detailsGrossNet = computed(() => {
  if (!taxes.value || !taxes.value.details.grossNetDetails) return [];

  const details: GrossNetItem[] = [];

  const grossP1 = taxes.value.details.grossNetDetails[0];
  const grossP2 =
    taxes.value.details.grossNetDetails.length > 1
      ? taxes.value.details.grossNetDetails[1]
      : undefined;

  details.push({ label: 'Bruttoeinkommen', p1: grossP1.grossIncome, p2: grossP2?.grossIncome });
  details.push({ label: 'AHV-, IV-, EO-Beiträge	', p1: grossP1.ahvIvEo, p2: grossP2?.ahvIvEo });
  details.push({ label: 'ALV-Beiträge	', p1: grossP1.alv, p2: grossP2?.alv });
  details.push({ label: 'NBU-Beiträge	', p1: grossP1.nbu, p2: grossP2?.nbu });
  details.push({ label: 'Pensionskassenbeiträge', p1: grossP1.pk, p2: grossP2?.pk });
  details.push({ label: 'Nettoeinkommen', p1: grossP1.netIncome, p2: grossP2?.netIncome });

  return details;
});

type DeductionItem = { label: string; canton: number; bund: number };
const detailsDeductionsIncome = computed(() => {
  if (!taxes.value) return [];

  const details: DeductionItem[] = [];
  const deductionsIncome = taxes.value.details.deductionsIncome;

  details.push({
    label: 'Nettoeinkommen Haupterwerb',
    canton: taxes.value.details.netIncomeCanton,
    bund: taxes.value.details.netIncomeBund
  });

  deductionsIncome.forEach((deduction) => {
    details.push({
      label:
        deduction.name + (showSecondPerson.value && deduction.target ? ` ${deduction.target}` : ''),
      canton: deduction.amountCanton,
      bund: deduction.amountBund
    });
  });

  details.push({
    label: 'Steuerbares Einkommen',
    canton: taxes.value.details.taxableIncomeCanton,
    bund: taxes.value.details.taxableIncomeBund
  });

  return details;
});

const detailsDeductionsFortune = computed(() => {
  if (!taxes.value) return [];

  const details: DeductionItem[] = [];
  const deductionsFortune = taxes.value.details.deductionsFortune;

  details.push({
    label: 'Reinvermögen',
    canton: taxes.value.input.fortune,
    bund: 0
  });

  deductionsFortune.forEach((deduction) => {
    details.push({
      label: deduction.name + (showSecondPerson.value ? deduction.target : ''),
      canton: deduction.amountCanton,
      bund: deduction.amountBund
    });
  });

  details.push({
    label: 'Steuerbares Vermögen',
    canton: taxes.value.details.taxableFortuneCanton,
    bund: 0
  });

  return details;
});

const submit = async (value: any, node?: FormKitNode) => {
  // Reset errors
  node?.setErrors([]);

  // Add cantonId accordign to locationId
  const taxInput: Partial<TaxInput> = {
    ...value,
    cantonId: taxLocationsResult.data.value?.find((x) => x.BfsID === value.locationId)?.CantonID
  };

  try {
    const result = await $fetch(`/api/taxes/`, {
      method: 'post',
      body: taxInput
    });

    taxes.value = result;
  } catch (error: any) {
    // Show error to the user
    node?.setErrors(['Es ist ein unerwarteter Fehler aufgetreten.', error.message]);
    taxes.value = undefined;
  }
};
</script>

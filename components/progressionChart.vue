<template>
  <div class="w-full">
    <div class="text-sm font-medium mb-2">{{ title }}</div>

    <div v-if="!hasBrackets" class="text-sm text-normal-500">
      Keine Progression zu diesem Tarif.
    </div>

    <template v-else>
      <!-- Bar chart: equal-width columns. Bar HEIGHT = effective rate.
           Bar FILL (from bottom) = how far user's income reaches through that bracket. -->
      <div
        class="relative grid items-end gap-1 h-40"
        :style="{ gridTemplateColumns: `repeat(${progression.brackets.length}, minmax(0, 1fr))` }"
      >
        <div
          v-for="(bracket, index) in progression.brackets"
          :key="index"
          class="relative h-full flex flex-col justify-end group"
        >
          <div
            class="relative w-full rounded-t overflow-hidden"
            :style="{ height: `${barHeightPercent(bracket.percent)}%` }"
          >
            <div class="absolute inset-0 bg-normal-200" />
            <div
              class="absolute left-0 right-0 bottom-0 transition-colors"
              :class="fillColor(index)"
              :style="{ height: `${fillPercent(index) * 100}%` }"
            />
          </div>
          <div
            class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-normal-800 text-white text-xs rounded px-2 py-1 z-20"
          >
            <div>
              <span class="font-medium">{{ formatPercent(bracket.percent) }}</span>
              <span v-if="index === progression.currentBracketIndex"> — aktuelle Stufe</span>
              <span v-else-if="index < progression.currentBracketIndex"> — bereits besteuert</span>
              <span v-else> — noch nicht erreicht</span>
            </div>
            <div class="text-normal-300">
              <template v-if="bracket.upperBound > bracket.lowerBound">
                CHF {{ displayCurrency(bracket.lowerBound) }}–{{
                  displayCurrency(bracket.upperBound)
                }}
              </template>
              <template v-else>ab CHF {{ displayCurrency(bracket.lowerBound) }}</template>
            </div>
            <div v-if="bracket.amountInBracket > 0">
              {{ displayCurrencyShort(bracket.amountInBracket) }} besteuert →
              {{ displayCurrencyShort(bracket.taxInBracket) }} Steuer
            </div>
          </div>
        </div>
      </div>

      <!-- X-axis: effective percent per bracket -->
      <div
        class="grid gap-1 mt-1 text-[10px] font-numerictab text-center"
        :style="{ gridTemplateColumns: `repeat(${progression.brackets.length}, minmax(0, 1fr))` }"
      >
        <div
          v-for="(bracket, index) in progression.brackets"
          :key="index"
          :class="
            index === progression.currentBracketIndex
              ? 'text-primary-700 font-medium'
              : 'text-normal-500'
          "
        >
          {{ formatPercent(bracket.percent) }}
        </div>
      </div>

      <!-- Context: current bracket range + next / previous distances -->
      <div class="mt-3 text-xs text-normal-700 space-y-0.5 leading-snug">
        <div v-if="currentBracket">
          Aktuell
          <span class="font-medium">{{ formatPercent(currentBracket.percent) }}</span>
          auf den Bereich
          <template v-if="currentBracket.upperBound > currentBracket.lowerBound">
            CHF {{ displayCurrency(currentBracket.lowerBound) }}–{{
              displayCurrency(currentBracket.upperBound)
            }}
          </template>
          <template v-else>ab CHF {{ displayCurrency(currentBracket.lowerBound) }}</template>
          ({{ displayCurrencyShort(progression.amountIntoCurrentBracket) }} bisher).
        </div>
        <div v-if="progression.amountToNextBracket !== null && progression.nextBracketPercent !== null">
          +{{ displayCurrencyShort(progression.amountToNextBracket) }} → nächste Stufe
          {{ formatPercent(progression.nextBracketPercent) }}.
        </div>
        <div v-else-if="currentBracket">Oberste Stufe des Tarifs — höher geht es nicht.</div>
        <div
          v-if="
            progression.previousBracketPercent !== null &&
            progression.amountIntoCurrentBracket > 0
          "
        >
          −{{ displayCurrencyShort(progression.amountIntoCurrentBracket) }} → vorherige Stufe
          {{ formatPercent(progression.previousBracketPercent) }}.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ProgressionResult } from '~/lib/taxes/typesClient';
import { displayCurrency, displayCurrencyShort } from '~/utils/formatUtils';

const props = defineProps<{
  title: string;
  progression: ProgressionResult;
}>();

const hasBrackets = computed(
  () => props.progression.brackets.length > 0 && props.progression.taxableIncome > 0
);

const currentBracket = computed(
  () => props.progression.brackets[props.progression.currentBracketIndex]
);

const maxPercent = computed(() =>
  Math.max(0.0001, ...props.progression.brackets.map((b) => b.percent))
);

const barHeightPercent = (percent: number) => {
  if (percent <= 0) return 3;
  return Math.max(3, (percent / maxPercent.value) * 100);
};

const fillPercent = (index: number): number => {
  const bracket = props.progression.brackets[index];
  const current = props.progression.currentBracketIndex;
  if (index > current) return 0;
  if (index < current) return 1;
  // Current bracket: partial fill
  const width = bracket.upperBound - bracket.lowerBound;
  if (width <= 0) {
    // Open-top bracket — user is inside, no upper bound; fill completely.
    return bracket.amountInBracket > 0 ? 1 : 0;
  }
  return Math.min(1, Math.max(0, bracket.amountInBracket / width));
};

const fillColor = (index: number) => {
  const current = props.progression.currentBracketIndex;
  if (index === current) return 'bg-primary-600';
  if (index < current) return 'bg-primary-300';
  return ''; // above-current, no fill rendered
};

const formatPercent = (p: number) => {
  const rounded = Math.round(p * 100) / 100;
  return `${rounded.toLocaleString('de-CH')}%`;
};
</script>

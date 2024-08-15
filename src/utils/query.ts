import { LabelConfig, LabelConfigType } from './LabelConfig';

export function buildQueryExpression(labelsToApply: LabelConfig[], replacer: (v: string) => string): string {
  let filterExpression = '';
  let queryFilters = [];
  for (let i = 0; i < labelsToApply.length; i++) {
    const label = labelsToApply[i];
    const value = label.value ? label.value : label.values ? label.values[0] : '';
    if (!value) {
      continue;
    }
    if (label.type === LabelConfigType.Filter) {
      filterExpression += `${label.operator}\`${replacer(value)}\``;
      continue;
    }
    queryFilters.push(`${label.label}${label.operator}"${replacer(value)}"`);
  }
  return `{${queryFilters.join(',')}} ${filterExpression}`;
}

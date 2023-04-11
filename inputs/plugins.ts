import { FormKitNode } from '@formkit/core';

export const asNumberPlugin = (node: FormKitNode) => {
  if (
    node.context?.asNumber ||
    node.context?.attrs.asNumber ||
    node.context?.attrs['as-number'] ||
    (node.context?.type === 'number' && !node.context?.asNumber)
  ) {
    node.hook.input((value, next) => {
      if (value !== undefined) {
        return next(value || value === 0 ? Number(value) : null);
      } else return next(value);
    });
  }
};

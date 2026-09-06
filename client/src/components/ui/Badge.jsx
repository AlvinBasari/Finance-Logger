import React from 'react';
import { getStatusConfig, getBoxStatusConfig } from '../../utils/formatters';

export const Badge = ({ status, type = 'invoice', customText, className = '' }) => {
  const config = type === 'box' ? getBoxStatusConfig(status) : getStatusConfig(status);
  const text = customText || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {text}
    </span>
  );
};

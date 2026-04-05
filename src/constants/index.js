// src/constants/index.js
export * from './colors';
export * from './typography';
export * from './layout';

export const APP_NAME = 'WMS Mobile';
export const APP_VERSION = '1.0.0';

export const PLANOGRAM_TYPE = {
  RACK: 'rack',
  FLOOR: 'floor',
};

export const OPNAME_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted',
};

export const API_TIMEOUT = 30000; // 30 seconds

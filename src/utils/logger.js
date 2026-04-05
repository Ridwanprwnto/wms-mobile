// src/utils/logger.js
import {logger, consoleTransport, fileAsyncTransport} from 'react-native-logs';
import RNFS from 'react-native-fs';

const logDir = `${RNFS.DocumentDirectoryPath}/logs`;

const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  severity: __DEV__ ? 'debug' : 'warn',
  transport: __DEV__ ? consoleTransport : fileAsyncTransport,
  transportOptions: __DEV__
    ? {
        colors: {
          debug: 'white',
          info: 'blueBright',
          warn: 'yellowBright',
          error: 'redBright',
        },
      }
    : {
        FS: RNFS,
        fileName: `wms_{date-today}.log`,
        filePath: logDir,
      },
  async: true,
  dateFormat: 'time',
  printDate: true,
  enabled: true,
};

export const log = logger.createLogger(config);

export default log;

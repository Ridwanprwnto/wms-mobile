import Config from 'react-native-config';

const apiConfig = {
  // Development: gunakan URL terpisah untuk setiap service
  development: {
    IMS: {
      baseUrl: Config.API_URL_IMS,
      endpoint: Config.ENDPOINT_IMS,
      fullUrl: `${Config.API_URL_IMS}${Config.ENDPOINT_IMS}`, // fix: was Config.PI_URL_IMS
    },
    WMS: {
      baseUrl: Config.API_URL_WMS,
      endpoint: Config.ENDPOINT_WMS,
      fullUrl: `${Config.API_URL_WMS}${Config.ENDPOINT_WMS}`,
    },
  },
  // Production: gunakan API Gateway untuk semua service
  production: {
    IMS: {
      baseUrl: Config.API_URL_GATEWAY,
      endpoint: Config.ENDPOINT_IMS,
      fullUrl: `${Config.API_URL_GATEWAY}${Config.ENDPOINT_IMS}`,
    },
    WMS: {
      baseUrl: Config.API_URL_GATEWAY,
      endpoint: Config.ENDPOINT_WMS,
      fullUrl: `${Config.API_URL_GATEWAY}${Config.ENDPOINT_WMS}`,
    },
  },
};

// fix: logic sebelumnya terbalik — APP_ENV=production harus pakai production config
const currentConfig =
  Config.APP_ENV === 'production' ? apiConfig.production : apiConfig.development;

/**
 * Mendapatkan fullUrl untuk service tertentu
 * @param {'IMS' | 'WMS'} service - Nama service
 * @returns {string} URL lengkap service (baseUrl + endpoint)
 */
export function getApiUrl(service) {
  if (!currentConfig[service]) {
    throw new Error(`Service "${service}" tidak ditemukan dalam konfigurasi API`);
  }
  return currentConfig[service].fullUrl;
}

/**
 * Mendapatkan baseUrl untuk service tertentu (dipakai axios baseURL)
 * @param {'IMS' | 'WMS'} service
 * @returns {string}
 */
export function getBaseUrl(service) {
  if (!currentConfig[service]) {
    throw new Error(`Service "${service}" tidak ditemukan dalam konfigurasi API`);
  }
  return currentConfig[service].baseUrl;
}

/**
 * Build URL lengkap dengan path tambahan
 * @param {'IMS' | 'WMS'} service
 * @param {string} path - Path tambahan (misal: '/users/login')
 * @returns {string}
 */
export function buildApiUrl(service, path = '') {
  const baseUrl = getApiUrl(service);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
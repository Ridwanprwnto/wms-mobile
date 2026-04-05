// src/service/opnameService.js
import Config from 'react-native-config';
import {wmsApi} from './api';

/**
 * Endpoint WMS main:
 *   dev  → http://192.168.33.60:4100/api-wmsmobile/main
 *   prod → http://192.168.33.146:8000/api-wmsmobile/main
 *
 * wmsApi sudah memiliki baseURL = API_URL_WMS (dev) / API_URL_GATEWAY (prod),
 * jadi url yang dikirim cukup path relatif dari baseURL.
 */
const MAIN_PREFIX = `${Config.ENDPOINT_WMS}${Config.MAIN_PATH}`;

const opnameService = {
  // ===========================================================================
  // DASHBOARD
  // ===========================================================================

  /**
   * Get dashboard summary: total_product, total_lokasi_plano, total_produk_tanpa_plano
   */
  async getDashboardSummary() {
    const response = await wmsApi.get(`${MAIN_PREFIX}/atk/dashboard/summary`);
    return response.data;
  },

  // ===========================================================================
  // PLANOGRAM SEARCH — Opname by Planogram
  // ===========================================================================

  /**
   * Cari lokasi planogram berdasarkan input teks bebas (LINE+RAK+SHELF+CELL)
   * @param {string} query - teks pencarian
   * @param {number} limit
   */
  async searchPlanogramByAddress(query, limit = 20) {
    const response = await wmsApi.get(`${MAIN_PREFIX}/atk/planogram/search`, {
      params: {q: query, limit},
    });
    return response.data;
  },

  /**
   * Get detail satu lokasi planogram beserta storage produk yang terpasang
   * @param {number} id_plano
   */
  async getPlanogramLineDetail(id_plano) {
    const response = await wmsApi.get(`${MAIN_PREFIX}/atk/planogram/line/${id_plano}`);
    return response.data;
  },

  /**
   * Get items opname (history) berdasarkan lokasi planogram
   * @param {number} id_plano
   */
  async getItemsByLinePlano(id_plano) {
    const response = await wmsApi.get(`${MAIN_PREFIX}/atk/opname/items/${id_plano}`);
    return response.data;
  },

  /**
   * Kosongkan semua storage produk di lokasi planogram
   * @param {number} id_plano
   */
  async clearStoragePlano(id_plano) {
    const response = await wmsApi.delete(
      `${MAIN_PREFIX}/atk/opname/clear-plano/${id_plano}`,
    );
    return response.data;
  },

  // ===========================================================================
  // PRODUCT SEARCH — Opname by Product
  // ===========================================================================

  /**
   * Cari produk berdasarkan PRDCD atau nama
   * @param {object} params - { search, page, limit }
   */
  async getProductList(params = {}) {
    const response = await wmsApi.get(`${MAIN_PREFIX}/atk/products`, {params});
    return response.data;
  },

  /**
   * Get semua planogram yang terpasang produk tersebut (by-product)
   * @param {string} prdcd
   */
  async getItemsByPrdcd(prdcd) {
    const response = await wmsApi.get(
      `${MAIN_PREFIX}/atk/opname/by-product/${prdcd}`,
    );
    return response.data;
  },

  // ===========================================================================
  // UPSERT / SAVE OPNAME
  // ===========================================================================

  /**
   * Simpan/update qty opname di suatu alamat planogram.
   * Sekaligus memperbarui pot_storage_plano (qty aktual).
   * @param {object} data - { id_plano, prdcd, quantity, notes? }
   */
  async upsertOpnameItem(data) {
    const response = await wmsApi.post(`${MAIN_PREFIX}/atk/opname/item`, data);
    return response.data;
  },

  /**
   * Upsert storage planogram langsung (tanpa history opname_items)
   * Berguna jika ingin langsung update qty plano saja
   * @param {object} data - { id_plano, prdcd, qty }
   */
  async upsertStoragePlano(data) {
    const response = await wmsApi.post(
      `${MAIN_PREFIX}/atk/planogram/storage`,
      data,
    );
    return response.data;
  },
};

export default opnameService;
// src/store/opnameStore.js
import {create} from 'zustand';
import {opnameService} from '../service';
import {log} from '../utils';

const useOpnameStore = create((set, get) => ({
  // ===========================================================================
  // STATE
  // ===========================================================================

  // Dashboard
  dashboardSummary: null,

  // Opname by Planogram
  planogramSearchResults: [],
  selectedPlanogramLine: null,   // detail lokasi + storage dari API
  planogramLineDetail: null,     // { line, items } dari getItemsByLinePlano

  // Opname by Product
  productSearchResults: [],
  selectedProduct: null,         // info produk (dari getItemsByPrdcd response)
  productPlanograms: [],         // list planogram yg terpasang produk tsb

  // Loading states
  isLoadingDashboard:    false,
  isLoadingPlanoSearch:  false,
  isLoadingPlanoDetail:  false,
  isLoadingProductSearch: false,
  isLoadingProductPlano: false,
  isSubmitting:          false,

  // Error
  error: null,

  // ===========================================================================
  // DASHBOARD
  // ===========================================================================

  fetchDashboardSummary: async () => {
    set({isLoadingDashboard: true});
    try {
      const response = await opnameService.getDashboardSummary();
      set({dashboardSummary: response.data || response, isLoadingDashboard: false});
    } catch (error) {
      log.error('[Opname] fetchDashboardSummary error:', error);
      set({isLoadingDashboard: false});
    }
  },

  // ===========================================================================
  // OPNAME BY PLANOGRAM
  // ===========================================================================

  /**
   * Cari lokasi planogram berdasarkan teks (LINE+RAK+SHELF+CELL)
   */
  searchPlanogram: async query => {
    if (!query || query.trim().length === 0) {
      set({planogramSearchResults: []});
      return;
    }
    set({isLoadingPlanoSearch: true, error: null});
    try {
      const response = await opnameService.searchPlanogramByAddress(query.trim());
      set({
        planogramSearchResults: response.data || [],
        isLoadingPlanoSearch: false,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal mencari lokasi planogram';
      log.error('[Opname] searchPlanogram error:', message);
      set({isLoadingPlanoSearch: false, error: message, planogramSearchResults: []});
    }
  },

  /**
   * Pilih lokasi planogram → load detail storage + opname history
   */
  selectPlanogramLine: async id_plano => {
    set({isLoadingPlanoDetail: true, planogramLineDetail: null, error: null});
    try {
      // Detail lokasi + storage (pot_storage_plano)
      const lineRes = await opnameService.getPlanogramLineDetail(id_plano);
      // History opname items
      const itemsRes = await opnameService.getItemsByLinePlano(id_plano);
      set({
        selectedPlanogramLine: lineRes.data || lineRes,
        planogramLineDetail: itemsRes.data || itemsRes,
        isLoadingPlanoDetail: false,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal memuat detail lokasi';
      log.error('[Opname] selectPlanogramLine error:', message);
      set({isLoadingPlanoDetail: false, error: message});
    }
  },

  /**
   * Kosongkan storage di lokasi planogram tertentu
   */
  clearStoragePlano: async id_plano => {
    set({isSubmitting: true, error: null});
    try {
      const response = await opnameService.clearStoragePlano(id_plano);
      // Refresh detail setelah dikosongkan
      await get().selectPlanogramLine(id_plano);
      set({isSubmitting: false});
      return {success: true, data: response.data || response};
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal mengosongkan storage';
      log.error('[Opname] clearStoragePlano error:', message);
      set({isSubmitting: false, error: message});
      return {success: false, message};
    }
  },

  /**
   * Simpan qty opname di alamat planogram
   */
  upsertOpnameItem: async data => {
    set({isSubmitting: true, error: null});
    try {
      const response = await opnameService.upsertOpnameItem(data);
      set({isSubmitting: false});
      log.info('[Opname] Item saved:', data);
      return {success: true, data: response.data || response};
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal menyimpan data opname';
      log.error('[Opname] upsertOpnameItem error:', message);
      set({isSubmitting: false, error: message});
      return {success: false, message};
    }
  },

  // ===========================================================================
  // OPNAME BY PRODUCT
  // ===========================================================================

  /**
   * Cari produk berdasarkan PRDCD atau nama
   */
  searchProduct: async query => {
    if (!query || query.trim().length === 0) {
      set({productSearchResults: []});
      return;
    }
    set({isLoadingProductSearch: true, error: null});
    try {
      const response = await opnameService.getProductList({
        search: query.trim(),
        limit: 20,
      });
      set({
        productSearchResults: response.data || [],
        isLoadingProductSearch: false,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal mencari produk';
      log.error('[Opname] searchProduct error:', message);
      set({isLoadingProductSearch: false, error: message, productSearchResults: []});
    }
  },

  /**
   * Pilih produk → load semua planogram yang terpasang produk tsb
   */
  selectProductForOpname: async prdcd => {
    set({isLoadingProductPlano: true, productPlanograms: [], selectedProduct: null, error: null});
    try {
      const response = await opnameService.getItemsByPrdcd(prdcd);
      const res = response.data || response;
      set({
        selectedProduct:    res.product || null,
        productPlanograms:  res.planograms || [],
        isLoadingProductPlano: false,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal memuat planogram produk';
      log.error('[Opname] selectProductForOpname error:', message);
      set({isLoadingProductPlano: false, error: message});
    }
  },

  // ===========================================================================
  // RESET
  // ===========================================================================

  resetError: () => set({error: null}),

  resetPlanogramSearch: () =>
    set({planogramSearchResults: [], selectedPlanogramLine: null, planogramLineDetail: null}),

  resetProductSearch: () =>
    set({productSearchResults: [], selectedProduct: null, productPlanograms: []}),
}));

export default useOpnameStore;

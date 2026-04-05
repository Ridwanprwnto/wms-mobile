// src/screens/main/opname/OpnameListScreen.js
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import {Header, Card} from '../../../components';
import {useOpnameStore} from '../../../store';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from '../../../constants';
import {debounce} from '../../../utils';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-komponen: Label Alamat Planogram
// ─────────────────────────────────────────────────────────────────────────────
const PlanoAddress = ({line, rack, shelf, cell, loc, style}) => {
  const parts = [
    line,
    rack && `R${rack}`,
    shelf && `S${shelf}`,
    cell && `C${cell}`,
    loc,
  ].filter(Boolean);
  return (
    <Text style={[styles.planoAddr, style]}>{parts.join(' - ') || '-'}</Text>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Komponen A: Opname by Planogram
// Aturan bisnis: 1 alamat planogram = hanya 1 produk.
// Jika sudah terisi → tampilkan produk + ubah qty + kosongkan.
// Jika kosong → tampilkan form pasang produk baru.
// ─────────────────────────────────────────────────────────────────────────────
const OpnameByPlanogramCard = () => {
  const {
    planogramSearchResults,
    isLoadingPlanoSearch,
    selectedPlanogramLine,
    isLoadingPlanoDetail,
    isSubmitting,
    searchPlanogram,
    selectPlanogramLine,
    clearStoragePlano,
    upsertOpnameItem,
    resetPlanogramSearch,
  } = useOpnameStore();

  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);

  // State edit qty produk yang sudah terpasang
  const [isEditing, setIsEditing] = useState(false);
  const [editQty, setEditQty] = useState('');
  const [editSaved, setEditSaved] = useState(false);

  // State form pasang produk baru (saat lokasi kosong)
  const [newPrdcd, setNewPrdcd] = useState('');
  const [newQty, setNewQty] = useState('');

  const debouncedSearch = useCallback(debounce(q => searchPlanogram(q), 350), []);

  const handleQueryChange = text => {
    setQuery(text);
    setShowResults(text.trim().length > 0);
    debouncedSearch(text);
  };

  const handleClearQuery = () => {
    setQuery('');
    setShowResults(false);
    setSelectedLine(null);
    setIsEditing(false);
    setEditQty('');
    setNewPrdcd('');
    setNewQty('');
    setEditSaved(false);
    resetPlanogramSearch();
  };

  const handleSelectLine = async line => {
    setSelectedLine(line);
    setShowResults(false);
    setIsEditing(false);
    setEditQty('');
    setNewPrdcd('');
    setNewQty('');
    setEditSaved(false);
    await selectPlanogramLine(line.id_plano);
  };

  const handleClearStorage = () => {
    Alert.alert(
      'Kosongkan Lokasi',
      `Produk di lokasi ini akan dihapus dari planogram. Lanjutkan?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Ya, Kosongkan',
          style: 'destructive',
          onPress: async () => {
            const result = await clearStoragePlano(selectedLine.id_plano);
            if (!result.success) {
              Alert.alert('Gagal', result.message);
            } else {
              setIsEditing(false);
              setEditQty('');
              setEditSaved(false);
            }
          },
        },
      ],
    );
  };

  const handleSaveEdit = async prdcd => {
    const qty = parseInt(editQty, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Qty tidak valid', 'Masukkan angka yang benar (≥ 0)');
      return;
    }
    const result = await upsertOpnameItem({
      id_plano: selectedLine.id_plano,
      prdcd,
      quantity: qty,
    });
    if (result.success) {
      setIsEditing(false);
      setEditSaved(true);
      await selectPlanogramLine(selectedLine.id_plano);
    } else {
      Alert.alert('Gagal Simpan', result.message);
    }
  };

  const handlePasangProduk = async () => {
    if (!newPrdcd.trim()) {
      Alert.alert('PRDCD wajib diisi', 'Masukkan kode produk (PRDCD)');
      return;
    }
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Qty tidak valid', 'Masukkan angka yang benar (≥ 0)');
      return;
    }
    const result = await upsertOpnameItem({
      id_plano: selectedLine.id_plano,
      prdcd: newPrdcd.trim().toUpperCase(),
      quantity: qty,
    });
    if (result.success) {
      setNewPrdcd('');
      setNewQty('');
      await selectPlanogramLine(selectedLine.id_plano);
    } else {
      Alert.alert('Gagal', result.message);
    }
  };

  // Data produk terpasang — 1 lokasi = 1 produk (ambil item pertama)
  const storageList =
    selectedPlanogramLine?.data?.storage ||
    selectedPlanogramLine?.storage ||
    [];
  const occupiedItem = storageList.length > 0 ? storageList[0] : null;

  return (
    <Card style={styles.modeCard} shadow="md">
      {/* Header */}
      <View style={styles.modeHeader}>
        <View style={[styles.modeIconWrap, {backgroundColor: Colors.primary + '15'}]}>
          <Icon name="map-marker-radius" size={20} color={Colors.primary} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.modeTitle}>Opname by Planogram</Text>
          <Text style={styles.modeSubtitle}>
            Cari lokasi planogram (LINE-RAK-SHELF-CELL)
          </Text>
        </View>
      </View>

      {/* Info aturan 1 lokasi = 1 produk */}
      <View style={styles.ruleNote}>
        <Icon name="information-outline" size={13} color={Colors.warning} />
        <Text style={styles.ruleNoteText}>
          1 alamat planogram hanya dapat menampung 1 produk
        </Text>
      </View>

      {/* Input pencarian lokasi */}
      <View style={styles.searchBox}>
        <Icon
          name="magnify"
          size={18}
          color={Colors.gray400}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari lokasi, mis: A01 atau A01-R01-S01"
          placeholderTextColor={Colors.gray300}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="characters"
          returnKeyType="search"
        />
        {isLoadingPlanoSearch && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={{marginRight: 4}}
          />
        )}
        {query.length > 0 && !isLoadingPlanoSearch && (
          <TouchableOpacity onPress={handleClearQuery}>
            <Icon name="close-circle" size={18} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Hasil pencarian lokasi */}
      {showResults && planogramSearchResults.length > 0 && (
        <View style={styles.resultsBox}>
          {planogramSearchResults.map(line => (
            <TouchableOpacity
              key={line.id_plano}
              style={[
                styles.resultItem,
                selectedLine?.id_plano === line.id_plano &&
                  styles.resultItemActive,
              ]}
              onPress={() => handleSelectLine(line)}>
              <Icon
                name="map-marker"
                size={15}
                color={
                  selectedLine?.id_plano === line.id_plano
                    ? Colors.primary
                    : Colors.gray400
                }
              />
              <View style={{flex: 1}}>
                <PlanoAddress
                  line={line.line_master_plano}
                  rack={line.rack_plano}
                  shelf={line.shelf_plano}
                  cell={line.cell_plano}
                  loc={line.loc_plano}
                  style={
                    selectedLine?.id_plano === line.id_plano && {
                      color: Colors.primary,
                    }
                  }
                />
                <Text style={styles.resultMeta}>
                  {line.total_storage > 0 ? 'Terisi 1 produk' : 'Kosong'}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.gray300} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showResults &&
        !isLoadingPlanoSearch &&
        planogramSearchResults.length === 0 && (
          <View style={styles.emptySearch}>
            <Text style={styles.emptySearchText}>Lokasi tidak ditemukan</Text>
          </View>
        )}

      {/* Detail lokasi terpilih */}
      {selectedLine && (
        <View style={styles.detailBox}>
          {isLoadingPlanoDetail ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{marginVertical: 16}}
            />
          ) : (
            <>
              {/* Header: Alamat + tombol Kosongkan */}
              <View style={styles.detailHeader}>
                <View style={styles.detailAddrWrap}>
                  <Icon
                    name="map-marker-check"
                    size={16}
                    color={Colors.primary}
                  />
                  <PlanoAddress
                    line={selectedLine.line_master_plano}
                    rack={selectedLine.rack_plano}
                    shelf={selectedLine.shelf_plano}
                    cell={selectedLine.cell_plano}
                    loc={selectedLine.loc_plano}
                    style={styles.detailAddrText}
                  />
                </View>
                {occupiedItem && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={handleClearStorage}
                    disabled={isSubmitting}>
                    <Icon name="delete-sweep" size={14} color={Colors.error} />
                    <Text style={styles.clearBtnText}>Kosongkan</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ─── KASUS A: Lokasi sudah terisi produk ─── */}
              {occupiedItem ? (
                <View style={styles.occupiedWrap}>
                  <View style={styles.occupiedBadge}>
                    <Icon
                      name="package-variant-closed"
                      size={13}
                      color={Colors.success}
                    />
                    <Text style={styles.occupiedBadgeText}>
                      Produk Terpasang
                    </Text>
                  </View>

                  <View style={styles.storageRow}>
                    <View style={styles.storageInfo}>
                      <Text style={styles.storagePrdcd}>
                        {occupiedItem.prdcd}
                      </Text>
                      <Text style={styles.storageName} numberOfLines={1}>
                        {occupiedItem.nama || occupiedItem.singkat || '-'}
                      </Text>
                      <View style={styles.storageMeta}>
                        <Text style={styles.storageFrac}>
                          Frac: {occupiedItem.frac || '-'}
                        </Text>
                        <Text style={styles.storageQty}>
                          Qty Plano:{' '}
                          <Text
                            style={{
                              fontWeight: FontWeight.bold,
                              color: Colors.primary,
                            }}>
                            {occupiedItem.qty}
                          </Text>
                        </Text>
                        <Text style={styles.storageUnit}>
                          {occupiedItem.unit || ''}
                        </Text>
                      </View>
                    </View>

                    {/* Edit qty inline */}
                    {isEditing ? (
                      <View style={styles.editWrap}>
                        <TextInput
                          style={styles.editInput}
                          value={editQty}
                          onChangeText={v => {
                            setEditQty(v);
                            setEditSaved(false);
                          }}
                          keyboardType="numeric"
                          placeholder="Qty baru"
                          placeholderTextColor={Colors.gray300}
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.saveSmBtn}
                          onPress={() => handleSaveEdit(occupiedItem.prdcd)}
                          disabled={isSubmitting}>
                          {isSubmitting ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <Icon name="check" size={16} color={Colors.white} />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelSmBtn}
                          onPress={() => {
                            setIsEditing(false);
                            setEditQty('');
                            setEditSaved(false);
                          }}>
                          <Icon name="close" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.editBtn,
                          editSaved && styles.editBtnSaved,
                        ]}
                        onPress={() => {
                          setIsEditing(true);
                          const rawQty = parseInt(occupiedItem.qty, 10);
                          setEditQty(isNaN(rawQty) ? '' : String(rawQty));
                          setEditSaved(false);
                        }}>
                        {editSaved ? (
                          <>
                            <Icon
                              name="check"
                              size={13}
                              color={Colors.success}
                            />
                            <Text
                              style={[
                                styles.editBtnText,
                                {color: Colors.success},
                              ]}>
                              Tersimpan
                            </Text>
                          </>
                        ) : (
                          <>
                            <Icon
                              name="pencil"
                              size={13}
                              color={Colors.accent}
                            />
                            <Text style={styles.editBtnText}>Ubah Qty</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.ruleHint}>
                    Untuk memasang produk lain, kosongkan lokasi ini terlebih
                    dahulu.
                  </Text>
                </View>
              ) : (
                /* ─── KASUS B: Lokasi kosong → form pasang produk baru ─── */
                <View>
                  <View style={styles.emptyDetail}>
                    <Icon
                      name="package-variant-closed-plus"
                      size={30}
                      color={Colors.gray300}
                    />
                    <Text style={styles.emptyDetailText}>
                      Lokasi ini kosong
                    </Text>
                  </View>

                  <View style={styles.addNewWrap}>
                    <Text style={styles.addNewTitle}>
                      Pasang Produk ke Lokasi Ini
                    </Text>
                    <View style={styles.addNewRow}>
                      <TextInput
                        style={[styles.editInput, {flex: 2, marginRight: 6}]}
                        value={newPrdcd}
                        onChangeText={setNewPrdcd}
                        placeholder="PRDCD"
                        placeholderTextColor={Colors.gray300}
                        autoCapitalize="characters"
                      />
                      <TextInput
                        style={[styles.editInput, {flex: 1, marginRight: 6}]}
                        value={newQty}
                        onChangeText={setNewQty}
                        placeholder="Qty"
                        placeholderTextColor={Colors.gray300}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={styles.saveSmBtn}
                        onPress={handlePasangProduk}
                        disabled={isSubmitting}>
                        {isSubmitting ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.white}
                          />
                        ) : (
                          <Icon name="plus" size={16} color={Colors.white} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Komponen B: Opname by Product
// ─────────────────────────────────────────────────────────────────────────────
const OpnameByProductCard = () => {
  const {
    productSearchResults,
    isLoadingProductSearch,
    selectedProduct,
    productPlanograms,
    isLoadingProductPlano,
    isSubmitting,
    searchProduct,
    selectProductForOpname,
    upsertOpnameItem,
    resetProductSearch,
  } = useOpnameStore();

  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState(null);
  const [qtyInput, setQtyInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const debouncedSearch = useCallback(debounce(q => searchProduct(q), 350), []);

  const handleQueryChange = text => {
    setQuery(text);
    setShowResults(text.trim().length > 0);
    setSelectedPlano(null);
    setSaveSuccess(false);
    debouncedSearch(text);
  };

  const handleClearQuery = () => {
    setQuery('');
    setShowResults(false);
    setSelectedPlano(null);
    setSaveSuccess(false);
    resetProductSearch();
  };

  const handleSelectProduct = async product => {
    setShowResults(false);
    setSelectedPlano(null);
    setSaveSuccess(false);
    await selectProductForOpname(product.prdcd);
  };

  const handleSelectPlano = plano => {
    setSelectedPlano(plano);
    const rawQty = parseInt(plano.qty_plano, 10);
    setQtyInput(isNaN(rawQty) ? '' : String(rawQty));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedPlano) return;
    const qty = parseInt(qtyInput, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Qty tidak valid', 'Masukkan angka yang benar (≥ 0)');
      return;
    }
    const result = await upsertOpnameItem({
      id_plano: selectedPlano.id_plano,
      prdcd: selectedProduct.prdcd,
      quantity: qty,
    });
    if (result.success) {
      setSaveSuccess(true);
      setSelectedPlano(null);
      // Refresh list planogram
      await selectProductForOpname(selectedProduct.prdcd);
    } else {
      Alert.alert('Gagal Simpan', result.message);
    }
  };

  return (
    <Card style={styles.modeCard} shadow="md">
      {/* Header */}
      <View style={styles.modeHeader}>
        <View style={[styles.modeIconWrap, {backgroundColor: Colors.rack + '15'}]}>
          <Icon name="package-variant-closed" size={20} color={Colors.rack} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.modeTitle}>Opname by Produk</Text>
          <Text style={styles.modeSubtitle}>
            Cari PRDCD atau nama produk/barang
          </Text>
        </View>
      </View>

      {/* Input pencarian produk */}
      <View style={styles.searchBox}>
        <Icon
          name="magnify"
          size={18}
          color={Colors.gray400}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="PRDCD atau nama produk..."
          placeholderTextColor={Colors.gray300}
          value={query}
          onChangeText={handleQueryChange}
          returnKeyType="search"
        />
        {isLoadingProductSearch && (
          <ActivityIndicator
            size="small"
            color={Colors.rack}
            style={{marginRight: 4}}
          />
        )}
        {query.length > 0 && !isLoadingProductSearch && (
          <TouchableOpacity onPress={handleClearQuery}>
            <Icon name="close-circle" size={18} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Hasil pencarian produk */}
      {showResults && productSearchResults.length > 0 && (
        <View style={styles.resultsBox}>
          {productSearchResults.map(prod => (
            <TouchableOpacity
              key={prod.prdcd}
              style={styles.resultItem}
              onPress={() => handleSelectProduct(prod)}>
              <Icon name="package-variant" size={15} color={Colors.gray400} />
              <View style={{flex: 1}}>
                <Text style={styles.planoAddr}>{prod.prdcd}</Text>
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {prod.nama || prod.singkat || '-'}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.gray300} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showResults &&
        !isLoadingProductSearch &&
        productSearchResults.length === 0 && (
          <View style={styles.emptySearch}>
            <Text style={styles.emptySearchText}>Produk tidak ditemukan</Text>
          </View>
        )}

      {/* Info & daftar planogram produk terpilih */}
      {selectedProduct && (
        <View style={styles.detailBox}>
          {/* Info produk */}
          <View style={styles.productInfoWrap}>
            <View style={styles.productBadge}>
              <Text style={styles.productPrdcd}>{selectedProduct.prdcd}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.productNama} numberOfLines={2}>
                {selectedProduct.nama || selectedProduct.singkat || '-'}
              </Text>
              <View style={styles.productMeta}>
                <Text style={styles.productMetaText}>
                  Kemasan: {selectedProduct.kemasan || '-'}
                </Text>
                <Text style={styles.productMetaText}>
                  Frac: {selectedProduct.frac || '-'}
                </Text>
                <Text style={styles.productMetaText}>
                  Unit: {selectedProduct.unit || '-'}
                </Text>
              </View>
            </View>
          </View>

          {isLoadingProductPlano ? (
            <ActivityIndicator
              color={Colors.rack}
              style={{marginVertical: 16}}
            />
          ) : productPlanograms.length === 0 ? (
            <View style={styles.emptyDetail}>
              <Icon name="map-marker-off" size={28} color={Colors.gray200} />
              <Text style={styles.emptyDetailText}>
                Produk ini belum terpasang di planogram manapun
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.addNewTitle}>Pilih Lokasi Planogram</Text>
              {productPlanograms.map(plano => {
                const isSelected =
                  selectedPlano?.id_plano === plano.id_plano;
                return (
                  <TouchableOpacity
                    key={String(plano.id_plano)}
                    style={[
                      styles.planoRow,
                      isSelected && styles.planoRowActive,
                    ]}
                    onPress={() => handleSelectPlano(plano)}>
                    <Icon
                      name="map-marker"
                      size={16}
                      color={isSelected ? Colors.rack : Colors.gray400}
                    />
                    <View style={{flex: 1}}>
                      <PlanoAddress
                        line={plano.line_master_plano}
                        rack={plano.rack_plano}
                        shelf={plano.shelf_plano}
                        cell={plano.cell_plano}
                        loc={plano.loc_plano}
                        style={isSelected && {color: Colors.rack}}
                      />
                      <View style={styles.storageMeta}>
                        <Text style={styles.storageFrac}>
                          Frac: {plano.frac || '-'}
                        </Text>
                        <Text style={styles.storageQty}>
                          Qty Plano:{' '}
                          <Text
                            style={{
                              fontWeight: FontWeight.bold,
                              color: Colors.primary,
                            }}>
                            {plano.qty_plano ?? '-'}
                          </Text>
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Icon
                        name="check-circle"
                        size={18}
                        color={Colors.rack}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Form input qty jika lokasi sudah dipilih */}
          {selectedPlano && (
            <View style={styles.qtyFormWrap}>
              <Text style={styles.addNewTitle}>Input Qty Opname</Text>
              <View style={styles.addNewRow}>
                <TextInput
                  style={[styles.editInput, {flex: 1, marginRight: 8}]}
                  value={qtyInput}
                  onChangeText={v => {
                    setSaveSuccess(false);
                    setQtyInput(v);
                  }}
                  keyboardType="numeric"
                  placeholder="Masukkan qty opname"
                  placeholderTextColor={Colors.gray300}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, saveSuccess && styles.saveBtnSuccess]}
                  onPress={handleSave}
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : saveSuccess ? (
                    <>
                      <Icon name="check" size={16} color={Colors.white} />
                      <Text style={styles.saveBtnText}>Tersimpan</Text>
                    </>
                  ) : (
                    <>
                      <Icon
                        name="content-save"
                        size={16}
                        color={Colors.white}
                      />
                      <Text style={styles.saveBtnText}>Simpan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const OpnameListScreen = ({navigation}) => {
  return (
    <View style={styles.root}>
      <Header
        title="Opname Barang"
        subtitle="Pilih metode opname"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Icon name="information" size={16} color={Colors.info} />
          <Text style={styles.infoBannerText}>
            Pilih salah satu metode opname di bawah ini. Perubahan qty akan
            langsung disimpan ke planogram.
          </Text>
        </View>

        <OpnameByPlanogramCard />
        <OpnameByProductCard />

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.background},
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },

  // ── Info Banner ──
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.infoBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
  },
  infoBannerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.info,
    lineHeight: 18,
  },

  // ── Mode Card ──
  modeCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modeSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── Rule Note ──
  ruleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    marginBottom: Spacing.sm,
  },
  ruleNoteText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    flex: 1,
  },
  ruleHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  // ── Search ──
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  searchIcon: {marginRight: Spacing.xs},
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },

  // ── Results ──
  resultsBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  resultItemActive: {
    backgroundColor: Colors.primary + '08',
  },
  planoAddr: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  resultMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  emptySearch: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // ── Detail Box ──
  detailBox: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailAddrWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailAddrText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.errorBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  clearBtnText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: FontWeight.semiBold,
  },

  // ── Occupied Wrap ──
  occupiedWrap: {},
  occupiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  occupiedBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.semiBold,
  },

  // ── Storage Row ──
  storageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  storageInfo: {flex: 1},
  storagePrdcd: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  storageName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  storageMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  storageFrac: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    backgroundColor: Colors.gray100,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storageQty: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  storageUnit: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },

  // ── Edit Button ──
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.infoBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  editBtnSaved: {
    backgroundColor: Colors.successBg,
  },
  editBtnText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.semiBold,
  },

  // ── Edit / Add Inline ──
  editWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.borderFocus,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    minWidth: 70,
  },
  saveSmBtn: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSmBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorBg,
  },

  // ── Add New Wrap ──
  addNewWrap: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addNewTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // ── Product Info (by-product card) ──
  productInfoWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  productBadge: {
    backgroundColor: Colors.rack + '15',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  productPrdcd: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.rack,
    textAlign: 'center',
  },
  productNama: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  productMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // ── Plano Row (by-product) ──
  planoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.white,
  },
  planoRowActive: {
    borderColor: Colors.rack,
    backgroundColor: Colors.rack + '08',
  },

  // ── Qty Form ──
  qtyFormWrap: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  saveBtnSuccess: {
    backgroundColor: Colors.success,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.white,
  },

  // ── Empty ──
  emptyDetail: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyDetailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  bottomPad: {height: Spacing['3xl']},
});

export default OpnameListScreen;

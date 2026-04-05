// src/screens/main/home/HomeScreen.js
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import Config from 'react-native-config';
import {Card, ConfirmDialog, Snackbar, LoadingView} from '../../../components';
import {useAuthStore, useOpnameStore} from '../../../store';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from '../../../constants';
import {formatDate} from '../../../utils';

const SummaryCard = ({label, value, icon, color, bg, isLoading}) => (
  <View style={[styles.summaryCard, {backgroundColor: bg}]}>
    <View style={[styles.summaryIcon, {backgroundColor: color + '22'}]}>
      <Icon name={icon} size={22} color={color} />
    </View>
    {isLoading ? (
      <View style={styles.summaryLoadingDot} />
    ) : (
      <Text style={[styles.summaryValue, {color}]}>{value ?? '-'}</Text>
    )}
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const QuickMenu = ({icon, label, color, bg, onPress}) => (
  <TouchableOpacity
    style={[styles.menuCard, {backgroundColor: bg}]}
    onPress={onPress}
    activeOpacity={0.8}>
    <View style={[styles.menuIconWrap, {backgroundColor: color}]}>
      <Icon name={icon} size={26} color={Colors.white} />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({navigation}) => {
  const {user, logout} = useAuthStore();
  const {dashboardSummary, fetchDashboardSummary, isLoadingDashboard} =
    useOpnameStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'info',
  });

  const loadData = useCallback(async () => {
    await fetchDashboardSummary();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setShowLogout(false);
  };

  const summary = dashboardSummary || {};
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDecor} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>
                {(user?.name || user?.username || 'Pengguna').toUpperCase()}
              </Text>
              <View style={styles.roleBadge}>
                <Icon
                  name="shield-account"
                  size={12}
                  color={Colors.accentLight}
                />
                <Text style={styles.roleText}>{user?.groupName || 'Operator'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => setShowLogout(true)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.onlineDot} />
            </TouchableOpacity>
          </View>

          {/* Summary Cards — 3 card baru */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.summaryScroll}
            contentContainerStyle={styles.summaryContent}>
            <SummaryCard
              label="Total Produk"
              value={summary.total_product}
              icon="package-variant-closed"
              color={Colors.accent}
              bg="rgba(0,180,216,0.15)"
              isLoading={isLoadingDashboard}
            />
            <SummaryCard
              label="Lokasi Planogram"
              value={summary.total_lokasi_plano}
              icon="map-marker-multiple"
              color={Colors.success}
              bg="rgba(6,214,160,0.15)"
              isLoading={isLoadingDashboard}
            />
            <SummaryCard
              label="Tanpa Planogram"
              value={summary.total_produk_tanpa_plano}
              icon="package-variant-closed-remove"
              color={Colors.warning}
              bg="rgba(255,183,3,0.15)"
              isLoading={isLoadingDashboard}
            />
          </ScrollView>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }>
        {/* Quick Menu — hanya Opname Barang & Pengaturan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Utama</Text>
          <View style={styles.menuGrid}>
            <QuickMenu
              icon="clipboard-text-search"
              label="Opname Barang"
              color={Colors.primary}
              bg={Colors.gray50}
              onPress={() => navigation.navigate('OpnameList')}
            />
            <QuickMenu
              icon="cog"
              label="Pengaturan"
              color={Colors.gray500}
              bg={Colors.gray100}
              onPress={() =>
                setSnackbar({
                  visible: true,
                  message: 'Fitur segera hadir',
                  type: 'info',
                })
              }
            />
          </View>
        </View>

        {/* Today's Info */}
        <View style={[styles.section, styles.infoSection]}>
          <View style={styles.infoRow}>
            <Icon
              name="calendar-today"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.infoText}>
              {formatDate(new Date(), 'long')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              {`${user?.officeCode} - ${user?.deptName} ${user?.officeName}`.toUpperCase() ||
                'Gudang Utama'}
            </Text>
          </View>
        </View>

        {/* App Version & Developer */}
        <View style={styles.appInfoWrap}>
          <Icon name="warehouse" size={14} color={Colors.gray300} />
          <Text style={styles.appVersion}>v{Config.APP_VERSION}</Text>
          <Text style={styles.appDot}>·</Text>
          <Text style={styles.appCopyright}>
            {Config.APP_COPYRIGHT} {Config.APP_DEVELOPER}
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Logout Confirm */}
      <ConfirmDialog
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        title="Keluar Aplikasi"
        message="Apakah Anda yakin ingin keluar dari aplikasi WMS Mobile?"
        confirmLabel="Ya, Keluar"
        type="warning"
        isLoading={loggingOut}
      />

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar(p => ({...p, visible: false}))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.background},
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primaryLight,
    top: -80,
    right: -50,
    opacity: 0.4,
  },
  headerContent: {
    paddingTop: Spacing['2xl'] + 8,
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  roleText: {
    fontSize: FontSize.xs,
    color: Colors.accentLight,
    fontWeight: FontWeight.medium,
  },
  avatarBtn: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  onlineDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  summaryScroll: {marginHorizontal: -Spacing.lg},
  summaryContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  summaryCard: {
    width: 110,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  summaryLoadingDot: {
    width: 32,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extraBold,
  },
  summaryLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  body: {flex: 1},
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  menuCard: {
    width: '47.5%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    ...Shadow.xs,
  },
  menuIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  menuLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadow.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  appInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    flexWrap: 'wrap',
  },
  appVersion: {
    fontSize: FontSize.xs,
    color: Colors.gray300,
  },
  appDot: {
    fontSize: FontSize.xs,
    color: Colors.gray300,
  },
  appCopyright: {
    fontSize: FontSize.xs,
    color: Colors.gray300,
  },
  bottomPad: {height: Spacing['3xl']},
});

export default HomeScreen;

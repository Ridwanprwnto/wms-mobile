import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Platform,
} from 'react-native';
import {useThemeStore, useAuthStore, useToastStore} from '../../../store';
import {FontSize, FontWeight, Radius, Spacing, Shadows} from '../../../constants/sizes';
import {AppConfig} from '../../../constants/config';
import {Icon, Card, ConfirmModal, Divider, Button} from '../../../components';
import AuthService from '../../../service/authService';
import {parseApiError} from '../../../utils/helpers';

// ── Setting row ─────────────────────────────────────────────────────────────
const SettingRow = ({iconName, label, value, onPress, rightElement, isLast}) => {
  const {theme} = useThemeStore();
  const C = theme.colors;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.settingRow,
        {borderBottomColor: C.border},
        !isLast && {borderBottomWidth: 1},
      ]}
    >
      <View style={[styles.settingIcon, {backgroundColor: C.surfaceElevated}]}>
        <Icon name={iconName} size={18} color={C.textSecondary} />
      </View>
      <View style={styles.settingMiddle}>
        <Text style={[styles.settingLabel, {color: C.text}]}>{label}</Text>
        {value ? <Text style={[styles.settingValue, {color: C.textMuted}]}>{value}</Text> : null}
      </View>
      {rightElement ?? (
        onPress ? <Icon name="chevron-right" size={18} color={C.textMuted} /> : null
      )}
    </TouchableOpacity>
  );
};

// ── Section card ─────────────────────────────────────────────────────────────
const SettingSection = ({title, children}) => {
  const {theme} = useThemeStore();
  const C = theme.colors;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {color: C.textMuted}]}>{title}</Text>
      <Card padding={false} style={{overflow: 'hidden'}}>
        {children}
      </Card>
    </View>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
const ProfileScreen = ({navigation}) => {
  const {theme, mode, setMode, toggle} = useThemeStore();
  const {user, logout}                 = useAuthStore();
  const {show}                         = useToastStore();
  const C = theme.colors;

  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setShowLogout(false);
    setLoggingOut(true);
    try {
      await AuthService.logout();
      logout();            // Zustand clears state → AppStack re-renders to Auth
      show('Berhasil keluar', 'success');
    } catch (e) {
      show(parseApiError(e), 'error');
    } finally {
      setLoggingOut(false);
    }
  };

  const themeModes = [
    {key: 'light',  label: 'Terang',  iconName: 'weather-sunny'},
    {key: 'dark',   label: 'Gelap',   iconName: 'weather-night'},
    {key: 'system', label: 'Sistem',  iconName: 'theme-light-dark'},
  ];

  const displayName = user?.name     || user?.username || 'Pengguna';
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <View style={[styles.root, {backgroundColor: C.background}]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar & Name ─────────────────────────────────────────── */}
        <View style={[styles.profileHeader, {backgroundColor: C.primary}]}>
          <View style={[styles.avatar, {backgroundColor: 'rgba(255,255,255,0.22)'}]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          {user?.email && (
            <Text style={styles.email}>{user.email}</Text>
          )}
          {user?.role && (
            <View style={styles.rolePill}>
              <Icon name="shield-account-outline" size={13} color="#fff" />
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          )}
        </View>

        {/* ── Account info ──────────────────────────────────────────── */}
        <SettingSection title="INFORMASI AKUN">
          <SettingRow
            iconName="account-outline"
            label="Username"
            value={user?.username || '-'}
            isLast={!user?.warehouse_name}
          />
          {user?.warehouse_name && (
            <SettingRow
              iconName="warehouse"
              label="Gudang"
              value={user.warehouse_name}
              isLast
            />
          )}
        </SettingSection>

        {/* ── Theme ─────────────────────────────────────────────────── */}
        <SettingSection title="TAMPILAN">
          <View style={styles.themeSection}>
            <Text style={[styles.themeLabel, {color: C.textSecondary}]}>Mode Tampilan</Text>
            <View style={styles.themeOptions}>
              {themeModes.map(({key, label, iconName}) => {
                const active = mode === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setMode(key)}
                    activeOpacity={0.75}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: active ? C.primary     : C.surfaceElevated,
                        borderColor:     active ? C.primary     : C.border,
                      },
                    ]}
                  >
                    <Icon name={iconName} size={18} color={active ? '#fff' : C.textMuted} />
                    <Text
                      style={[
                        styles.themeOptionText,
                        {color: active ? '#fff' : C.textSecondary},
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SettingSection>

        {/* ── App info ──────────────────────────────────────────────── */}
        <SettingSection title="INFORMASI APLIKASI">
          <SettingRow
            iconName="information-outline"
            label="Versi Aplikasi"
            value={AppConfig.appVersion}
          />
          <SettingRow
            iconName="server-outline"
            label="API Server"
            value={AppConfig.apiBaseUrl}
            isLast
          />
        </SettingSection>

        {/* ── Logout ────────────────────────────────────────────────── */}
        <Button
          title="Keluar dari Akun"
          iconName="logout"
          variant="danger"
          fullWidth
          size="lg"
          onPress={() => setShowLogout(true)}
          loading={loggingOut}
          style={styles.logoutBtn}
        />

        <Text style={[styles.copyright, {color: C.textMuted}]}>
          © 2025 {AppConfig.appName} · v{AppConfig.appVersion}
        </Text>
      </ScrollView>

      <ConfirmModal
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        title="Keluar?"
        message="Anda akan keluar dari akun ini. Pastikan semua opname sudah tersimpan."
        iconName="logout"
        iconColor={C.danger}
        confirmText="Ya, Keluar"
        confirmVariant="danger"
        loading={loggingOut}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root:             {flex: 1},
  scroll:           {paddingBottom: Spacing[10]},

  profileHeader:    {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 24 : Spacing[6],
    paddingBottom: Spacing[8],
    paddingHorizontal: Spacing[6],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: Spacing[6],
  },
  avatar:           {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  avatarText:       {fontSize: FontSize['3xl'], fontWeight: FontWeight.black, color: '#fff'},
  displayName:      {fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: '#fff', marginBottom: 4},
  email:            {fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: Spacing[3]},
  rolePill:         {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing[3], paddingVertical: 5, borderRadius: Radius.full,
  },
  roleText:         {fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff'},

  section:          {paddingHorizontal: Spacing[4], marginBottom: Spacing[4]},
  sectionTitle:     {fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.8, marginBottom: Spacing[2]},

  settingRow:       {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing[3], paddingHorizontal: Spacing[4], gap: Spacing[3],
  },
  settingIcon:      {width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center'},
  settingMiddle:    {flex: 1},
  settingLabel:     {fontSize: FontSize.base, fontWeight: FontWeight.medium},
  settingValue:     {fontSize: FontSize.xs, marginTop: 2},

  themeSection:     {padding: Spacing[4]},
  themeLabel:       {fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, marginBottom: Spacing[3]},
  themeOptions:     {flexDirection: 'row', gap: Spacing[2]},
  themeOption:      {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing[2], paddingVertical: Spacing[3], borderRadius: Radius.lg, borderWidth: 1.5,
  },
  themeOptionText:  {fontSize: FontSize.xs, fontWeight: FontWeight.bold},

  logoutBtn:        {marginHorizontal: Spacing[4], marginBottom: Spacing[4]},
  copyright:        {fontSize: FontSize.xs, textAlign: 'center', marginBottom: Spacing[4]},
});

export default ProfileScreen;

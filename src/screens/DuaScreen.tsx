import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, ScrollView, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { DUAS, DUA_CATEGORY_META, type Dua, type DuaCategory } from '../constants/duas';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';

const FAVORITES_KEY = 'dua_favorites';
const ALL_CATS = Object.keys(DUA_CATEGORY_META) as DuaCategory[];

export function DuaScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<DuaCategory | 'favorites' | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Dua | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((raw) => {
      if (raw) setFavorites(new Set(JSON.parse(raw)));
    });
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = DUAS;
    if (activeCategory === 'favorites') list = list.filter((d) => favorites.has(d.id));
    else if (activeCategory) list = list.filter((d) => d.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.title.toLowerCase().includes(q) ||
        d.translation.toLowerCase().includes(q) ||
        d.transliteration.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeCategory, favorites]);

  const openDua = (dua: Dua) => {
    setSelected(dua);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: Dua }) => {
    const meta = DUA_CATEGORY_META[item.category];
    const isFav = favorites.has(item.id);
    return (
      <TouchableOpacity style={styles.card} onPress={() => openDua(item)} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <View style={[styles.catBadge, { backgroundColor: meta.color + '20' }]}>
            <Text style={styles.catBadgeIcon}>{meta.icon}</Text>
            <Text style={[styles.catBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.favIcon, isFav && styles.favIconActive]}>{isFav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardArabic} numberOfLines={2}>{item.arabic}</Text>
        <Text style={styles.cardTap}>Tap to read full dua ›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dua Library</Text>
        <Text style={styles.headerSub}>{DUAS.length} supplications</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search duas..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        <TouchableOpacity
          style={[styles.catChip, activeCategory === null && styles.catChipActive]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.catChipText, activeCategory === null && styles.catChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.catChip, activeCategory === 'favorites' && styles.catChipActive]}
          onPress={() => setActiveCategory(activeCategory === 'favorites' ? null : 'favorites')}
        >
          <Text style={[styles.catChipText, activeCategory === 'favorites' && styles.catChipTextActive]}>❤️ Saved</Text>
        </TouchableOpacity>
        {ALL_CATS.map((cat) => {
          const m = DUA_CATEGORY_META[cat];
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, isActive && styles.catChipActive, isActive && { borderColor: m.color }]}
              onPress={() => setActiveCategory(isActive ? null : cat)}
            >
              <Text style={styles.catChipEmoji}>{m.icon}</Text>
              <Text style={[styles.catChipText, isActive && styles.catChipTextActive, isActive && { color: m.color }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <AdBanner unitId={AD_UNITS.bannerDua} />

      {/* List */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🤲</Text>
              <Text style={styles.emptyText}>No duas found</Text>
            </View>
          }
        />
      </Animated.View>

      {/* Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHandle} />
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderRow}>
                  <View style={[styles.catBadge, { backgroundColor: DUA_CATEGORY_META[selected.category].color + '20' }]}>
                    <Text style={styles.catBadgeIcon}>{DUA_CATEGORY_META[selected.category].icon}</Text>
                    <Text style={[styles.catBadgeText, { color: DUA_CATEGORY_META[selected.category].color }]}>
                      {DUA_CATEGORY_META[selected.category].label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleFavorite(selected.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={[styles.favIcon, favorites.has(selected.id) && styles.favIconActive]}>
                      {favorites.has(selected.id) ? '❤️' : '🤍'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{selected.title}</Text>
                <View style={styles.arabicCard}>
                  <Text style={styles.modalArabic}>{selected.arabic}</Text>
                </View>
                <Text style={styles.modalTranslit}>{selected.transliteration}</Text>
                <View style={styles.divider} />
                <Text style={styles.modalTranslation}>{selected.translation}</Text>
                <Text style={styles.modalRef}>— {selected.reference}</Text>
              </ScrollView>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontFamily: theme.typography.fontHeadingBold, fontSize: 26, color: theme.colors.text },
  headerSub: { fontFamily: theme.typography.fontBody, fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontFamily: theme.typography.fontBody, fontSize: 14, color: theme.colors.text },
  searchClear: { fontSize: 14, color: theme.colors.textMuted, padding: 4 },

  catRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.full,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  catChipActive: { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent },
  catChipEmoji: { fontSize: 12 },
  catChipText: { fontFamily: theme.typography.fontBodyMedium, fontSize: 12, color: theme.colors.textMuted },
  catChipTextActive: { color: theme.colors.accent },

  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.borderSoft,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catBadgeIcon: { fontSize: 11 },
  catBadgeText: { fontSize: 11, fontFamily: theme.typography.fontBodyMedium },
  favIcon: { fontSize: 16 },
  favIconActive: {},
  cardTitle: { fontFamily: theme.typography.fontBodyBold, fontSize: 14, color: theme.colors.text, marginBottom: 6 },
  cardArabic: { fontFamily: 'System', fontSize: 18, color: theme.colors.textSecondary, textAlign: 'right', lineHeight: 30, marginBottom: 6 },
  cardTap: { fontFamily: theme.typography.fontBody, fontSize: 11, color: theme.colors.accent },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontFamily: theme.typography.fontBodyMedium, fontSize: 16, color: theme.colors.textMuted },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,15,6,0.5)' },
  modalSheet: {
    backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: theme.colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontFamily: theme.typography.fontHeadingBold, fontSize: 20, color: theme.colors.text, marginBottom: 16 },
  arabicCard: {
    backgroundColor: theme.colors.accentMuted, borderRadius: theme.borderRadius.md,
    padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border,
  },
  modalArabic: { fontFamily: 'System', fontSize: 22, color: theme.colors.textSecondary, textAlign: 'right', lineHeight: 38 },
  modalTranslit: { fontFamily: theme.typography.fontBody, fontSize: 14, color: theme.colors.textMuted, fontStyle: 'italic', marginBottom: 12, lineHeight: 22 },
  divider: { height: 1, backgroundColor: theme.colors.borderSoft, marginBottom: 12 },
  modalTranslation: { fontFamily: theme.typography.fontBody, fontSize: 15, color: theme.colors.textSecondary, lineHeight: 24, marginBottom: 10 },
  modalRef: { fontFamily: theme.typography.fontBodyMedium, fontSize: 12, color: theme.colors.textMuted, marginBottom: 20 },
  modalClose: {
    backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  modalCloseText: { fontFamily: theme.typography.fontBodyBold, fontSize: 15, color: '#fff' },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://fakestoreapi.com/products';
const FAVORITES_KEY = 'shopexplorer_favorites';

// ─────────────────────────────────────────
// SKELETON COMPONENT
// ─────────────────────────────────────────
function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.cardBody}>
        <View style={styles.skeletonLine1} />
        <View style={styles.skeletonLine2} />
        <View style={styles.skeletonLine3} />
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────
export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favorites, setFavorites] = useState({}); // { id: true/false }
  const [showFavOnly, setShowFavOnly] = useState(false);

  // ── LOAD FAVORITES DARI ASYNCSTORAGE ──
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_KEY);
        if (stored) setFavorites(JSON.parse(stored));
      } catch (e) {
        console.log('Gagal load favorites:', e);
      }
    };
    loadFavorites();
  }, []);

  // ── FETCH PRODUCTS ──
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat data produk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ── TOGGLE FAVORIT + SIMPAN KE ASYNCSTORAGE ──
  const toggleFavorite = async (id) => {
    const updated = { ...favorites, [id]: !favorites[id] };
    setFavorites(updated);
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Gagal simpan favorites:', e);
    }
  };

  // ── FILTER LIST ──
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchFav = showFavOnly ? !!favorites[p.id] : true;
    return matchSearch && matchFav;
  });

  const openDetail = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const closeDetail = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  // ── RENDER KARTU PRODUK ──
  const renderItem = ({ item }) => {
    const isFav = !!favorites[item.id];
    return (
      <TouchableOpacity style={styles.card} onPress={() => openDetail(item)} activeOpacity={0.85}>
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
            {/* TOMBOL FAVORIT */}
            <TouchableOpacity onPress={() => toggleFavorite(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.favIcon, isFav && styles.favIconActive]}>
                {isFav ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
            <Text style={styles.cardRating}>
              {renderStars(item.rating?.rate ?? 0)}{' '}
              <Text style={styles.cardRatingCount}>({item.rating?.count ?? 0})</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─────────────────────────────────────────
  // STATE: LOADING → SKELETON
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛍️ ShopExplorer</Text>
          <Text style={styles.headerSub}>Memuat produk...</Text>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────
  // STATE: ERROR
  // ─────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Oops! Terjadi Kesalahan</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────────────────────────────────
  // STATE: SUCCESS
  // ─────────────────────────────────────────
  const favCount = Object.values(favorites).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛍️ ShopExplorer</Text>
        <Text style={styles.headerSub}>{products.length} produk tersedia</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Bar: Semua / Favorit */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, !showFavOnly && styles.filterChipActive]}
          onPress={() => setShowFavOnly(false)}
        >
          <Text style={[styles.filterChipText, !showFavOnly && styles.filterChipTextActive]}>
            Semua
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, showFavOnly && styles.filterChipActive]}
          onPress={() => setShowFavOnly(true)}
        >
          <Text style={[styles.filterChipText, showFavOnly && styles.filterChipTextActive]}>
            ❤️ Favorit {favCount > 0 ? `(${favCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FlatList atau Empty State */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIllustration}>{showFavOnly ? '💔' : '🔎'}</Text>
          <Text style={styles.emptyTitle}>
            {showFavOnly ? 'Belum Ada Favorit' : 'Produk Tidak Ditemukan'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {showFavOnly
              ? 'Tap ikon ❤️ di kartu produk untuk menambahkan ke favorit.'
              : `Tidak ada produk yang cocok dengan "${search}".\nCoba kata kunci lain.`}
          </Text>
          {!showFavOnly && (
            <TouchableOpacity style={styles.clearSearchBtn} onPress={() => setSearch('')}>
              <Text style={styles.clearSearchText}>Hapus Pencarian</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL DETAIL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={closeDetail}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{ uri: selectedProduct.image }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <View style={styles.modalContent}>
                  <View style={styles.modalTopRow}>
                    <Text style={styles.modalCategory}>
                      {selectedProduct.category.toUpperCase()}
                    </Text>
                    <TouchableOpacity onPress={() => toggleFavorite(selectedProduct.id)}>
                      <Text style={styles.modalFavBtn}>
                        {favorites[selectedProduct.id] ? '❤️ Difavoritkan' : '🤍 Favoritkan'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalTitle}>{selectedProduct.title}</Text>
                  <View style={styles.modalPriceRow}>
                    <Text style={styles.modalPrice}>${selectedProduct.price.toFixed(2)}</Text>
                    <View style={styles.modalRatingBadge}>
                      <Text style={styles.modalRatingText}>★ {selectedProduct.rating?.rate ?? '-'}</Text>
                      <Text style={styles.modalRatingCount}>{selectedProduct.rating?.count ?? 0} ulasan</Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.modalDescLabel}>Deskripsi Produk</Text>
                  <Text style={styles.modalDesc}>{selectedProduct.description}</Text>
                  <TouchableOpacity style={styles.addToCartBtn}>
                    <Text style={styles.addToCartText}>🛒 Tambah ke Keranjang</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  // Header
  header: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#C7D2FE', marginTop: 2 },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginTop: -12, marginBottom: 10, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  clearBtn: { fontSize: 14, color: '#9CA3AF', paddingLeft: 8 },

  // Filter chips
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF',
  },
  filterChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterChipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },

  // Card
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12,
    marginBottom: 12, overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardImage: { width: 90, height: 90, margin: 12 },
  cardBody: { flex: 1, paddingVertical: 12, paddingRight: 12, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCategory: { fontSize: 10, color: '#6366F1', fontWeight: '600', letterSpacing: 0.5 },
  favIcon: { fontSize: 16 },
  favIconActive: {},
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#111827', marginVertical: 4, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  cardRating: { fontSize: 11, color: '#F59E0B' },
  cardRatingCount: { color: '#9CA3AF', fontSize: 10 },

  // Skeleton
  skeletonImage: { width: 90, height: 90, margin: 12, backgroundColor: '#E5E7EB', borderRadius: 8 },
  skeletonLine1: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 4, width: '40%', marginBottom: 8 },
  skeletonLine2: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 4, width: '90%', marginBottom: 6 },
  skeletonLine3: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 4, width: '70%' },

  // Centered (error)
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 32 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorMessage: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: '#4F46E5', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIllustration: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  clearSearchBtn: { borderWidth: 1.5, borderColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  clearSearchText: { color: '#4F46E5', fontWeight: '600', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: 32 },
  modalClose: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    backgroundColor: '#F3F4F6', borderRadius: 20, width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  modalCloseText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  modalImage: { width: '100%', height: 220, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalContent: { padding: 20 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalCategory: { fontSize: 11, color: '#6366F1', fontWeight: '700', letterSpacing: 1 },
  modalFavBtn: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', lineHeight: 24, marginBottom: 14 },
  modalPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalPrice: { fontSize: 24, fontWeight: '800', color: '#4F46E5' },
  modalRatingBadge: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  modalRatingText: { fontSize: 14, fontWeight: '700', color: '#D97706' },
  modalRatingCount: { fontSize: 10, color: '#92400E', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 },
  modalDescLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  modalDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 24 },
  addToCartBtn: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addToCartText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
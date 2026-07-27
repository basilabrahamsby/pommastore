import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WishlistNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  WishlistNotifier() : super([]) {
    _loadFromPrefs();
  }

  static const _prefsKey = 'kozmocart_wishlist_items';

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final dataStr = prefs.getString(_prefsKey);
      if (dataStr != null && dataStr.isNotEmpty) {
        final List<dynamic> decoded = json.decode(dataStr);
        state = decoded.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    } catch (e) {
      print('WishlistNotifier: Error loading from SharedPreferences: $e');
    }
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final dataStr = json.encode(state);
      await prefs.setString(_prefsKey, dataStr);
    } catch (e) {
      print('WishlistNotifier: Error saving to SharedPreferences: $e');
    }
  }

  void toggleWishlist(Map<String, dynamic> product) {
    final id = product['id']?.toString() ?? '';
    if (id.isEmpty) return;

    final exists = state.any((item) => (item['id']?.toString() ?? '') == id);
    if (exists) {
      state = state.where((item) => (item['id']?.toString() ?? '') != id).toList();
    } else {
      state = [...state, product];
    }
    _saveToPrefs();
  }

  void clearWishlist() {
    state = [];
    _saveToPrefs();
  }

  bool isWishlisted(String id) {
    return state.any((item) => (item['id']?.toString() ?? '') == id);
  }
}

final wishlistProvider = StateNotifierProvider<WishlistNotifier, List<Map<String, dynamic>>>((ref) {
  return WishlistNotifier();
});

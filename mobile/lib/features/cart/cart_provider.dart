import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api/api_client.dart';
import '../../core/api/token_manager.dart';

class CartItem {
  final String id;
  final String name;
  final double price;
  final int quantity;
  final String imageUrl;
  final String variantName;
  final int loyaltyPoints;
  final String slug;

  CartItem({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    required this.imageUrl,
    required this.variantName,
    required this.loyaltyPoints,
    required this.slug,
  });

  CartItem copyWith({
    String? id,
    String? name,
    double? price,
    int? quantity,
    String? imageUrl,
    String? variantName,
    int? loyaltyPoints,
    String? slug,
  }) {
    return CartItem(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      imageUrl: imageUrl ?? this.imageUrl,
      variantName: variantName ?? this.variantName,
      loyaltyPoints: loyaltyPoints ?? this.loyaltyPoints,
      slug: slug ?? this.slug,
    );
  }

  Map<String, dynamic> toServerJson() => {
        'variant_id': id,
        'quantity': quantity,
        'name': name,
        'price': price,
        'image_url': imageUrl,
        'variant_name': variantName,
        'loyalty_points': loyaltyPoints,
        'slug': slug,
      };

  Map<String, dynamic> toLocalJson() => {
        'id': id,
        'name': name,
        'price': price,
        'quantity': quantity,
        'imageUrl': imageUrl,
        'variantName': variantName,
        'loyaltyPoints': loyaltyPoints,
        'slug': slug,
      };

  factory CartItem.fromLocalJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      quantity: int.tryParse(json['quantity']?.toString() ?? '1') ?? 1,
      imageUrl: json['imageUrl']?.toString() ?? '',
      variantName: json['variantName']?.toString() ?? '',
      loyaltyPoints: int.tryParse(json['loyaltyPoints']?.toString() ?? '0') ?? 0,
      slug: json['slug']?.toString() ?? '',
    );
  }

  factory CartItem.fromServerJson(Map<String, dynamic> json) {
    return CartItem(
      id: (json['variant_id'] ?? json['id'])?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      quantity: int.tryParse(json['quantity']?.toString() ?? '1') ?? 1,
      imageUrl: (json['image_url'] ?? json['imageUrl'])?.toString() ?? '',
      variantName: (json['variant_name'] ?? json['variantName'])?.toString() ?? '',
      loyaltyPoints:
          int.tryParse((json['loyalty_points'] ?? json['loyaltyPoints'])?.toString() ?? '0') ?? 0,
      slug: json['slug']?.toString() ?? '',
    );
  }
}

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]) {
    _init();
  }

  static const _prefsKey = 'pommastore_cart_items';
  final _api = ApiClient();

  Future<void> _init() async {
    try {
      print('CartNotifier: Initializing cart state...');
      await _loadFromPrefs();
      final token = await TokenManager.getToken();
      if (token != null && token.isNotEmpty) {
        print('CartNotifier: User is logged in, syncing with server...');
        await _fetchAndMergeServerCart();
      } else {
        print('CartNotifier: Guest user, using local cart. Count: ${state.length}');
      }
    } catch (e) {
      print('CartNotifier: Error during initialization: $e');
    }
  }

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final dataStr = prefs.getString(_prefsKey);
      if (dataStr != null && dataStr.isNotEmpty) {
        final List<dynamic> decoded = json.decode(dataStr);
        state =
            decoded.map((e) => CartItem.fromLocalJson(e as Map<String, dynamic>)).toList();
        print('CartNotifier: Loaded ${state.length} items from SharedPreferences');
      }
    } catch (e) {
      print('CartNotifier: Error loading from SharedPreferences: $e');
    }
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final success = await prefs.setString(
          _prefsKey, json.encode(state.map((e) => e.toLocalJson()).toList()));
      print('CartNotifier: Saved ${state.length} items to SharedPreferences. Success: $success');
    } catch (e) {
      print('CartNotifier: Error saving to SharedPreferences: $e');
    }
  }

  Future<void> _fetchAndMergeServerCart() async {
    try {
      final res = await _api.dio.get('/storefront/account/cart');
      if (res.statusCode == 200) {
        final serverItems = (res.data as List<dynamic>? ?? [])
            .map((e) => CartItem.fromServerJson(e as Map<String, dynamic>))
            .toList();

        final Map<String, CartItem> merged = {for (var i in serverItems) i.id: i};
        for (final local in state) {
          if (merged.containsKey(local.id)) {
            final serverQty = merged[local.id]!.quantity;
            final mergedQty = local.quantity > serverQty ? local.quantity : serverQty;
            merged[local.id] = merged[local.id]!.copyWith(quantity: mergedQty);
          } else {
            merged[local.id] = local;
          }
        }

        state = merged.values.toList();
        await _saveToPrefs();
        await _pushToServer();
        print('CartNotifier: Server cart merged. Total items: ${state.length}');
      }
    } catch (e) {
      print('CartNotifier: Error merging server cart: $e');
    }
  }

  Future<void> _pushToServer() async {
    try {
      final token = await TokenManager.getToken();
      if (token == null || token.isEmpty) return;
      print('CartNotifier: Pushing cart state to server...');
      await _api.dio.put('/storefront/account/cart',
          data: state.map((e) => e.toServerJson()).toList());
      print('CartNotifier: Successfully pushed cart state to server.');
    } catch (e) {
      print('CartNotifier: Error pushing cart state to server: $e');
    }
  }

  void addItem({
    required String id,
    required String name,
    required double price,
    required String imageUrl,
    required String variantName,
    required int loyaltyPoints,
    required String slug,
    int quantity = 1,
  }) {
    print('CartNotifier: Adding item. ID: $id, Name: $name, Price: $price');
    if (id.isEmpty) {
      print('CartNotifier: Error - Item ID is empty. Cannot add item.');
      return;
    }

    final existingIndex = state.indexWhere((item) => item.id == id);
    if (existingIndex != -1) {
      final existing = state[existingIndex];
      state = [
        for (final item in state)
          if (item.id == id) item.copyWith(quantity: existing.quantity + quantity) else item
      ];
      print('CartNotifier: Updated existing item quantity to: ${existing.quantity + quantity}');
    } else {
      state = [
        ...state,
        CartItem(
          id: id,
          name: name,
          price: price,
          quantity: quantity,
          imageUrl: imageUrl,
          variantName: variantName,
          loyaltyPoints: loyaltyPoints,
          slug: slug,
        )
      ];
      print('CartNotifier: Added new item. Total items in state: ${state.length}');
    }
    _saveToPrefs();
    _pushToServer();
  }

  void removeItem(String id) {
    print('CartNotifier: Removing item ID: $id');
    state = state.where((item) => item.id != id).toList();
    _saveToPrefs();
    _pushToServer();
  }

  void updateQuantity(String id, int quantity) {
    print('CartNotifier: Updating quantity for ID: $id to $quantity');
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    state = [
      for (final item in state)
        if (item.id == id) item.copyWith(quantity: quantity) else item
    ];
    _saveToPrefs();
    _pushToServer();
  }

  void clearCart() {
    print('CartNotifier: Clearing cart');
    state = [];
    _saveToPrefs();
    _pushToServer();
  }

  int getItemQty(String id) {
    try {
      return state.firstWhere((item) => item.id == id).quantity;
    } catch (_) {
      return 0;
    }
  }

  Future<void> syncWithServerAfterLogin() async {
    print('CartNotifier: Syncing with server after login...');
    await _fetchAndMergeServerCart();
  }

  Future<void> clearOnLogout() async {
    print('CartNotifier: Clearing cart on logout...');
    state = [];
    await _saveToPrefs();
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});

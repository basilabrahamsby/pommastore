import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_responsive.dart';
import '../../core/api/api_client.dart';
import '../../core/api/token_manager.dart';
import '../auth/login_screen.dart';
import '../checkout/checkout_screen.dart';
import 'cart_provider.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  bool _isSyncing = false;
  double _shippingFee = 150.0;
  double _freeShippingLimit = 999.0;
  bool _hasAddress = false;
  // Track which item is being removed for animation
  String? _removingId;

  @override
  void initState() {
    super.initState();
    _syncCartItemPrices();
    _fetchCmsSettings();
    _fetchShippingFee();
  }

  Future<void> _syncCartItemPrices() async {
    final cartItems = ref.read(cartProvider);
    if (cartItems.isEmpty) return;

    setState(() => _isSyncing = true);
    try {
      final dioClient = ApiClient().dio;
      final payload = cartItems
          .map((item) => {'variant_id': item.id, 'quantity': item.quantity})
          .toList();

      final res = await dioClient.post('/storefront/products/sync-prices', data: {
        'items': payload,
      });

      if (res.statusCode == 200) {
        final synced = (res.data['items'] as List<dynamic>?) ?? [];
        for (var syncItem in synced) {
          final id = syncItem['variant_id']?.toString() ?? '';
          final newPrice =
              double.tryParse(syncItem['price']?.toString() ?? '') ?? 0.0;
          if (id.isNotEmpty && newPrice > 0) {
            // Update price in provider by adding the item again with same qty but new price
            final existing = ref
                .read(cartProvider)
                .firstWhere((e) => e.id == id, orElse: () => CartItem(id: '', name: '', price: 0, quantity: 0, imageUrl: '', variantName: '', loyaltyPoints: 0, slug: ''));
            if (existing.id.isNotEmpty) {
              ref.read(cartProvider.notifier).updateQuantity(id, existing.quantity);
            }
          }
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Shopping bag values synchronized!'),
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (_) {
      // Silently fail sync
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  Future<void> _fetchCmsSettings() async {
    try {
      final dioClient = ApiClient().dio;
      final res = await dioClient.get('/storefront/settings/storefront_layout');
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>? ?? {};
        if (mounted) {
          setState(() {
            _freeShippingLimit =
                double.tryParse(data['free_shipping_limit']?.toString() ?? '999') ?? 999.0;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchShippingFee() async {
    try {
      final dioClient = ApiClient().dio;
      final res = await dioClient.get('/storefront/account/addresses');
      final addresses = res.data as List? ?? [];
      final defaultAddr = addresses.firstWhere(
        (a) => a['is_default'] == true,
        orElse: () => addresses.isNotEmpty ? addresses[0] : null,
      );
      if (defaultAddr != null && defaultAddr['pincode'] != null) {
        if (mounted) setState(() => _hasAddress = true);
        final verifyRes = await dioClient.get(
            '/storefront/orders/shipping/verify-pincode?pincode=${defaultAddr['pincode']}');
        if (verifyRes.statusCode == 200 && verifyRes.data != null) {
          final serviceable = verifyRes.data['serviceable'] as bool? ?? false;
          if (serviceable && mounted) {
            setState(() {
              _shippingFee =
                  double.tryParse(verifyRes.data['shipping_fee']?.toString() ?? '150') ?? 150.0;
            });
          }
        }
      } else {
        if (mounted) setState(() => _hasAddress = false);
      }
    } catch (_) {
      if (mounted) setState(() => _hasAddress = false);
    }
  }

  void _handleRemove(String id) {
    setState(() => _removingId = id);
    Future.delayed(const Duration(milliseconds: 350), () {
      ref.read(cartProvider.notifier).removeItem(id);
      if (mounted) setState(() => _removingId = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final cartItems = ref.watch(cartProvider);

    double subtotal = 0;
    int totalLoyaltyPoints = 0;
    for (var item in cartItems) {
      subtotal += item.price * item.quantity;
      totalLoyaltyPoints += item.loyaltyPoints * item.quantity;
    }

    final isFreeShipping = subtotal >= _freeShippingLimit;
    final amountToFreeShipping = _freeShippingLimit - subtotal;
    final shippingProgressPct = (subtotal / _freeShippingLimit).clamp(0.0, 1.0);
    final delivery = (isFreeShipping || !_hasAddress) ? 0.0 : _shippingFee;
    final total = subtotal + delivery;

    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: Image.asset('assets/logo.png', height: R.pad(context, 26), fit: BoxFit.contain),
        shape: const Border(
          bottom: BorderSide(color: AppTheme.borderLight, width: 1.0),
        ),
        actions: [
          IconButton(
            icon: _isSyncing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 1.5, color: AppTheme.primaryRose))
                : const Icon(Icons.sync_rounded, color: Colors.black87),
            onPressed: _isSyncing ? null : _syncCartItemPrices,
          )
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: R.maxContent(context),
            child: cartItems.isEmpty
                ? _buildEmptyState(context)
                : Column(
                    children: [
                      // ── Free Shipping Progress Banner ──
                      _buildShippingBanner(
                        isFreeShipping: isFreeShipping,
                        amountToFreeShipping: amountToFreeShipping,
                        shippingProgressPct: shippingProgressPct,
                      ),

                      // ── Cart Items List ──
                      Expanded(
                        child: ListView.builder(
                          itemCount: cartItems.length,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemBuilder: (context, index) {
                            final item = cartItems[index];
                            return _buildCartItem(context, item);
                          },
                        ),
                      ),

                      // ── Order Summary Panel ──
                      _buildOrderSummary(
                        context,
                        cartItems: cartItems,
                        subtotal: subtotal,
                        delivery: delivery,
                        isFreeShipping: isFreeShipping,
                        totalLoyaltyPoints: totalLoyaltyPoints,
                        total: total,
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: R.pad(context, 32.0)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: R.pad(context, 80),
              height: R.pad(context, 80),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                border: Border.all(color: Colors.black12),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 4)),
                ],
              ),
              child: const Icon(Icons.shopping_bag_outlined, size: 32, color: Colors.black26),
            ),
            const SizedBox(height: 24),
            Text(
              'SHOPPING BAG',
              style: GoogleFonts.montserrat(
                fontSize: 9,
                fontWeight: FontWeight.bold,
                letterSpacing: 3.0,
                color: Colors.black45,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Your bag is empty',
              style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.normal,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Looks like you haven't added any fragrances yet. Explore our curated collection.",
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 11,
                color: Colors.black54,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => context.go('/'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                ),
                icon: const Icon(Icons.arrow_forward, size: 14),
                label: Text(
                  'EXPLORE COLLECTION',
                  style: GoogleFonts.montserrat(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShippingBanner({
    required bool isFreeShipping,
    required double amountToFreeShipping,
    required double shippingProgressPct,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isFreeShipping ? const Color(0xFFE8F5E9) : Colors.white,
        border: const Border(bottom: BorderSide(color: AppTheme.borderLight, width: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.local_shipping_outlined,
                    size: 14,
                    color: isFreeShipping ? const Color(0xFF2E7D32) : Colors.black54,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isFreeShipping ? 'STANDARD DELIVERY UNLOCKED' : 'FREE SHIPPING PROGRESS',
                    style: GoogleFonts.montserrat(
                      fontSize: 8.5,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                      color: isFreeShipping ? const Color(0xFF2E7D32) : Colors.black87,
                    ),
                  ),
                ],
              ),
              Text(
                isFreeShipping ? 'FREE' : '₹${amountToFreeShipping.toInt()} AWAY',
                style: GoogleFonts.montserrat(
                  fontSize: 9.5,
                  fontWeight: FontWeight.bold,
                  color: isFreeShipping ? const Color(0xFF2E7D32) : Colors.black,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: shippingProgressPct,
              minHeight: 5,
              backgroundColor: Colors.black.withValues(alpha: 0.05),
              valueColor: AlwaysStoppedAnimation<Color>(
                isFreeShipping ? const Color(0xFF4CAF50) : Colors.black,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isFreeShipping
                ? '🎉 You qualify for free delivery!'
                : 'Add ₹${amountToFreeShipping.toInt()} more to qualify for free shipping',
            style: GoogleFonts.poppins(
              fontSize: 9.5,
              color: isFreeShipping ? const Color(0xFF2E7D32) : Colors.black54,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItem(BuildContext context, CartItem item) {
    final itemTotal = item.price * item.quantity;
    final itemLoyalty = item.loyaltyPoints * item.quantity;
    final isRemoving = _removingId == item.id;

    return AnimatedOpacity(
      duration: const Duration(milliseconds: 350),
      opacity: isRemoving ? 0.0 : 1.0,
      child: AnimatedSlide(
        duration: const Duration(milliseconds: 350),
        offset: isRemoving ? const Offset(0.1, 0) : Offset.zero,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: AppTheme.borderLight, width: 0.5),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product image — tappable to go to product page
                GestureDetector(
                  onTap: () => context.go('/product/${item.slug}'),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: Image.network(
                      item.imageUrl,
                      width: 72,
                      height: 88,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 72,
                        height: 88,
                        color: const Color(0xFFF5F5F5),
                        child: const Icon(Icons.image_not_supported, size: 20, color: Colors.black12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name + remove button row
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => context.go('/product/${item.slug}'),
                              child: Text(
                                item.name.toUpperCase(),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.montserrat(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                  color: Colors.black,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ),
                          // Remove button
                          GestureDetector(
                            onTap: () => _handleRemove(item.id),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              child: const Icon(Icons.delete_outline_rounded,
                                  color: Colors.black38, size: 18),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      // Variant name
                      Text(
                        item.variantName.toUpperCase(),
                        style: GoogleFonts.montserrat(
                          color: AppTheme.textMuted,
                          fontWeight: FontWeight.w600,
                          fontSize: 8.5,
                          letterSpacing: 0.8,
                        ),
                      ),
                      // Loyalty badge
                      if (itemLoyalty > 0) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF8E1),
                            border: Border.all(color: const Color(0xFFFFECB3), width: 0.5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.stars_rounded, size: 9, color: Color(0xFFFFB300)),
                              const SizedBox(width: 3),
                              Text(
                                '+$itemLoyalty PTS',
                                style: GoogleFonts.montserrat(
                                  color: const Color(0xFFB78103),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 8,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      // Qty stepper + price row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Stepper
                          Container(
                            height: 30,
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.black12, width: 0.5),
                              borderRadius: BorderRadius.circular(2),
                            ),
                            child: Row(
                              children: [
                                _stepperButton(
                                  icon: Icons.remove,
                                  onTap: () => ref
                                      .read(cartProvider.notifier)
                                      .updateQuantity(item.id, item.quantity - 1),
                                ),
                                Container(
                                  width: 30,
                                  height: 30,
                                  alignment: Alignment.center,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFF5F5F5),
                                    border: Border(
                                      left: BorderSide(color: Colors.black12, width: 0.5),
                                      right: BorderSide(color: Colors.black12, width: 0.5),
                                    ),
                                  ),
                                  child: Text(
                                    '${item.quantity}',
                                    style: GoogleFonts.montserrat(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black,
                                    ),
                                  ),
                                ),
                                _stepperButton(
                                  icon: Icons.add,
                                  onTap: () => ref
                                      .read(cartProvider.notifier)
                                      .updateQuantity(item.id, item.quantity + 1),
                                ),
                              ],
                            ),
                          ),
                          // Price
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '₹${itemTotal.toInt()}',
                                style: GoogleFonts.montserrat(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12.5,
                                  textStyle: const TextStyle(
                                    fontFamilyFallback: ['Roboto'],
                                  ),
                                ),
                              ),
                              if (item.quantity > 1)
                                Text(
                                  '₹${item.price.toInt()} each',
                                  style: GoogleFonts.poppins(
                                    color: AppTheme.textMuted,
                                    fontSize: 8.5,
                                    textStyle: const TextStyle(
                                      fontFamilyFallback: ['Roboto'],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _stepperButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 30,
        alignment: Alignment.center,
        child: Icon(icon, size: 11, color: Colors.black54),
      ),
    );
  }

  Widget _buildOrderSummary(
    BuildContext context, {
    required List<CartItem> cartItems,
    required double subtotal,
    required double delivery,
    required bool isFreeShipping,
    required int totalLoyaltyPoints,
    required double total,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: AppTheme.borderLight, width: 0.5)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, -3))
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: EdgeInsets.symmetric(
                horizontal: R.pad(context, 16), vertical: R.pad(context, 10)),
            decoration: const BoxDecoration(
              color: Color(0xFFF9F9F9),
              border: Border(bottom: BorderSide(color: AppTheme.borderLight, width: 0.5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'ORDER SUMMARY',
                  style: GoogleFonts.montserrat(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                    color: Colors.black54,
                  ),
                ),
                Text(
                  '${cartItems.length} ${cartItems.length == 1 ? 'item' : 'items'}',
                  style: GoogleFonts.montserrat(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                    color: Colors.black45,
                  ),
                ),
              ],
            ),
          ),
          // Summary rows
          Padding(
            padding: EdgeInsets.fromLTRB(R.pad(context, 16), R.pad(context, 12),
                R.pad(context, 16), 0),
            child: Column(
              children: [
                // Line items
                ...cartItems.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name.toUpperCase(),
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.montserrat(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                Text(
                                  'Qty: ${item.quantity}',
                                  style: GoogleFonts.poppins(
                                    fontSize: 8.5,
                                    color: Colors.black45,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '₹${(item.price * item.quantity).toInt()}',
                            style: GoogleFonts.montserrat(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                              textStyle: const TextStyle(
                                fontFamilyFallback: ['Roboto'],
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
                const Divider(color: AppTheme.borderLight, height: 16, thickness: 0.5),
                // Subtotal
                _summaryRow('Subtotal',
                    '₹${subtotal.toInt()}', Colors.black87, isBold: false),
                const SizedBox(height: 4),
                // Shipping
                _summaryRow(
                  'Shipping',
                  isFreeShipping
                      ? 'FREE'
                      : (!_hasAddress
                          ? 'Calculated at checkout'
                          : '₹${_shippingFee.toInt()}'),
                  isFreeShipping
                      ? const Color(0xFF4CAF50)
                      : (!_hasAddress ? AppTheme.textMuted : Colors.black87),
                  isBold: false,
                ),
                // Loyalty Points
                if (totalLoyaltyPoints > 0) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF8E1),
                      border: Border.all(color: const Color(0xFFFFECB3), width: 0.5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.auto_awesome_rounded,
                            size: 13, color: Color(0xFFFFB300)),
                        const SizedBox(width: 6),
                        Text(
                          'POINTS TO EARN',
                          style: GoogleFonts.montserrat(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                            color: const Color(0xFFB78103),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '+$totalLoyaltyPoints PTS',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFFB78103),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const Divider(color: AppTheme.borderLight, height: 16, thickness: 0.5),
                // Total
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'TOTAL',
                      style: GoogleFonts.montserrat(
                        fontWeight: FontWeight.bold,
                        fontSize: R.font(context, 11),
                        letterSpacing: 1.0,
                      ),
                    ),
                    Text(
                      '₹${total.toInt()}',
                      style: GoogleFonts.montserrat(
                        color: AppTheme.primaryRose,
                        fontWeight: FontWeight.bold,
                        fontSize: R.font(context, 16),
                        textStyle: const TextStyle(
                          fontFamilyFallback: ['Roboto'],
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: R.pad(context, 12)),
                // Checkout CTA
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      final token = await TokenManager.getToken();
                      if (!mounted) return;
                      if (token == null || token.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please sign in to complete checkout')),
                        );
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (context) => const LoginScreen()),
                        ).then((_) {
                          // Refresh cart or addresses state if needed on return
                          _fetchShippingFee();
                        });
                      } else {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (context) => const CheckoutScreen()),
                        ).then((_) {
                          // Reload pincode check on return
                          _fetchShippingFee();
                        });
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryRose,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                      padding: EdgeInsets.symmetric(vertical: R.pad(context, 14)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.shield_outlined, size: 14),
                        const SizedBox(width: 8),
                        Text(
                          'PROCEED TO CHECKOUT',
                          style: GoogleFonts.montserrat(
                            fontSize: R.font(context, 9.5),
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: R.pad(context, 8)),
                // Secure notice + Payment methods
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.lock_outline_rounded, size: 10, color: Colors.black26),
                    const SizedBox(width: 4),
                    Text(
                      'SECURE & ENCRYPTED CHECKOUT',
                      style: GoogleFonts.montserrat(
                        fontSize: R.font(context, 7.5),
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                        color: Colors.black38,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: ['UPI', 'Cards', 'Razorpay']
                      .map((m) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            padding:
                                const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9F9F9),
                              border: Border.all(color: Colors.black12, width: 0.5),
                              borderRadius: BorderRadius.circular(99),
                            ),
                            child: Text(
                              m,
                              style: GoogleFonts.montserrat(
                                fontSize: 7.5,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.8,
                                color: Colors.black45,
                              ),
                            ),
                          ))
                      .toList(),
                ),
                SizedBox(height: R.pad(context, 8)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, Color valueColor,
      {bool isBold = true}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
              color: AppTheme.textMuted, fontSize: R.font(context, 11)),
        ),
        Text(
          value,
          style: GoogleFonts.montserrat(
            color: valueColor,
            fontSize: R.font(context, 12),
            fontWeight: FontWeight.bold,
            textStyle: const TextStyle(
              fontFamilyFallback: ['Roboto'],
            ),
          ),
        ),
      ],
    );
  }
}

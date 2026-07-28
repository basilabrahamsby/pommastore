import 'dart:math' as math;
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_responsive.dart';
import '../../core/api/api_client.dart';
import '../../core/api/token_manager.dart';
import '../../core/locale/locale_provider.dart';
import '../cart/cart_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _api = ApiClient();
  bool _isLoading = true;
  bool _isSubmitting = false;

  List<Map<String, dynamic>> _addresses = [];
  Map<String, dynamic>? _selectedAddress;
  bool _showNewAddressForm = false;

  // Custom Address Form fields
  final _labelController = TextEditingController(text: 'Home');
  final _line1Controller = TextEditingController();
  final _line2Controller = TextEditingController();
  final _cityController = TextEditingController(text: 'Dubai');
  final _stateController = TextEditingController(text: 'Dubai');
  final _pincodeController = TextEditingController(text: '00000');
  final _phoneController = TextEditingController();

  // Payment Selection: 'card' (Stripe) or 'cod' (Cash on Delivery)
  String _paymentMethod = 'card';

  // Checkout success details
  bool _orderPlacedSuccess = false;
  String _orderNumber = '';
  String _carrierName = '';
  String _trackingNumber = '';
  double _freeShippingLimit = 100.0;
  double _calculatedShippingFee = 17.0;

  final List<String> _uaeEmirates = [
    'Dubai',
    'Abu Dhabi',
    'Sharjah',
    'Ajman',
    'Ras Al Khaimah',
    'Fujairah',
    'Umm Al Quwain',
    'Al Ain'
  ];

  @override
  void initState() {
    super.initState();
    _loadAddresses();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final res = await _api.dio.get('/storefront/settings/storefront_layout');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final limit = data['free_shipping_limit'];
        if (limit != null) {
          setState(() {
            _freeShippingLimit = double.tryParse(limit.toString()) ?? 100.0;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _loadAddresses() async {
    try {
      final res = await _api.dio.get('/storefront/account/addresses');
      final list = List<Map<String, dynamic>>.from(res.data);

      setState(() {
        _addresses = list;
        if (list.isNotEmpty) {
          _selectedAddress = list.firstWhere(
            (addr) => addr['is_default'] == true,
            orElse: () => list.first,
          );
          _showNewAddressForm = false;
          if (_selectedAddress != null && _selectedAddress!['pincode'] != null) {
            _verifyShippingFeeForPincode(_selectedAddress!['pincode'].toString(), _selectedAddress!['city']?.toString() ?? '');
          }
        } else {
          _showNewAddressForm = true;
        }
        _isLoading = false;
      });
    } catch (_) {
      setState(() {
        _showNewAddressForm = true;
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyShippingFeeForPincode(String pincode, String city) async {
    try {
      final res = await _api.dio.get('/storefront/orders/shipping/verify-pincode', queryParameters: {
        'pincode': pincode,
        'city': city,
      });
      if (res.statusCode == 200 && res.data != null) {
        final fee = double.tryParse(res.data['shipping_fee']?.toString() ?? '17') ?? 17.0;
        setState(() {
          _calculatedShippingFee = fee;
        });
      }
    } catch (_) {}
  }

  Future<void> _addNewAddress() async {
    final line1 = _line1Controller.text.trim();
    final city = _cityController.text.trim();

    if (line1.isEmpty || city.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter street address and Emirate/City')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final body = {
        'label': _labelController.text.trim(),
        'address_line1': line1,
        'address_line2': _line2Controller.text.trim(),
        'city': city,
        'state': city,
        'pincode': _pincodeController.text.trim().isEmpty ? '00000' : _pincodeController.text.trim(),
        'country': 'United Arab Emirates',
        'phone': _phoneController.text.trim(),
        'is_default': _addresses.isEmpty,
      };

      final res = await _api.dio.post('/storefront/account/addresses', data: body);
      final newAddr = Map<String, dynamic>.from(res.data);

      setState(() {
        _addresses.add(newAddr);
        _selectedAddress = newAddr;
        _showNewAddressForm = false;

        _line1Controller.clear();
        _line2Controller.clear();
        _phoneController.clear();

        _isSubmitting = false;
      });
      _verifyShippingFeeForPincode(newAddr['pincode']?.toString() ?? '00000', city);
    } catch (e) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save delivery address.')),
      );
    }
  }

  Future<void> _placeOrder() async {
    final isAr = ref.read(localeProvider).languageCode == 'ar';

    // ---- Auth Guard: ensure user is logged in before checkout ----
    final token = await TokenManager.getToken();
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isAr ? '🔒 يرجى تسجيل الدخول لإتمام الطلب' : '🔒 Please login to complete your order',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: Colors.black87,
          duration: const Duration(seconds: 3),
          action: SnackBarAction(
            label: isAr ? 'دخول' : 'Login',
            textColor: const Color(0xFFE91E8C),
            onPressed: () => context.push('/login'),
          ),
        ),
      );
      return;
    }

    Map<String, dynamic> activeAddress;

    if (_showNewAddressForm) {
      final line1 = _line1Controller.text.trim();
      final city = _cityController.text.trim();

      if (line1.isEmpty || city.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(isAr ? 'يرجى إكمال تفاصيل عنوان التسليم' : 'Please fill in shipping address details')),
        );
        return;
      }
      activeAddress = {
        'label': _labelController.text.trim(),
        'address_line1': line1,
        'address_line2': _line2Controller.text.trim(),
        'city': city,
        'state': city,
        'pincode': _pincodeController.text.trim().isEmpty ? '00000' : _pincodeController.text.trim(),
        'phone': _phoneController.text.trim(),
        'country': 'United Arab Emirates',
      };
    } else {
      if (_selectedAddress == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(isAr ? 'يرجى اختيار عنوان التسليم' : 'Please select or add a shipping address')),
        );
        return;
      }
      activeAddress = _selectedAddress!;
    }

    final cartItems = ref.read(cartProvider);
    if (cartItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(isAr ? 'سلة التسوق فارغة' : 'Your cart is empty')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      double subtotal = 0;
      for (var item in cartItems) {
        subtotal += item.price * item.quantity;
      }
      final isFreeShipping = subtotal >= _freeShippingLimit;
      final shippingFee = isFreeShipping ? 0.0 : _calculatedShippingFee;

      final orderItems = cartItems.map((item) => {
        'variant_id': item.id,
        'quantity': item.quantity,
        'unit_price': item.price,
        'discount_amount': 0.0,
      }).toList();

      // ================= 1. CASH ON DELIVERY (COD) =================
      if (_paymentMethod == 'cod') {
        final body = {
          'payment_method': 'cod',
          'payment_gateway': 'cod',
          'payment_status': 'pending',
          'channel': 'storefront',
          'shipping_amount': shippingFee,
          'discount_amount': 0.0,
          'loyalty_points_used': 0,
          'shipping_address': activeAddress,
          'billing_address': activeAddress,
          'items': orderItems,
        };

        final createRes = await _api.dio.post('/storefront/orders/checkout', data: body);
        final resData = createRes.data as Map<String, dynamic>;

        ref.read(cartProvider.notifier).clearCart();

        setState(() {
          _isSubmitting = false;
          _orderPlacedSuccess = true;
          _orderNumber = resData['order_number']?.toString() ?? 'POMMA-${math.Random().nextInt(99999)}';
          _carrierName = resData['carrier']?.toString() ?? 'Delivery Panda';
          _trackingNumber = resData['tracking_number']?.toString() ?? 'AWB-${math.Random().nextInt(999999)}';
        });
        return;
      }

      // ================= 2. STRIPE CREDIT CARD / APPLE PAY =================
      final body = {
        'payment_method': 'stripe',
        'payment_gateway': 'stripe',
        'payment_status': 'pending',
        'channel': 'storefront',
        'shipping_amount': shippingFee,
        'discount_amount': 0.0,
        'loyalty_points_used': 0,
        'shipping_address': activeAddress,
        'billing_address': activeAddress,
        'items': orderItems,
      };

      final createRes = await _api.dio.post('/storefront/orders/stripe/create', data: body);
      final stripeData = createRes.data as Map<String, dynamic>;

      final stripeSessionId = stripeData['stripe_session_id']?.toString() ?? '';
      final stripeUrl = stripeData['url']?.toString();
      final orderNumber = stripeData['order_number']?.toString() ?? '';

      if (stripeUrl != null && stripeUrl.isNotEmpty) {
        final Uri url = Uri.parse(stripeUrl);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        }
      }

      // Verify Stripe Payment
      final verifyRes = await _api.dio.post('/storefront/orders/stripe/verify', data: {
        'order_number': orderNumber,
        'stripe_session_id': stripeSessionId,
      });

      final verifyData = verifyRes.data as Map<String, dynamic>;
      ref.read(cartProvider.notifier).clearCart();

      setState(() {
        _isSubmitting = false;
        _orderPlacedSuccess = true;
        _orderNumber = orderNumber.isNotEmpty ? orderNumber : (verifyData['order_number']?.toString() ?? 'POMMA-STRIPE');
        _carrierName = verifyData['carrier']?.toString() ?? 'Delivery Panda';
        _trackingNumber = verifyData['tracking_number']?.toString() ?? 'AWB-PENDING';
      });
    } catch (e) {
      setState(() => _isSubmitting = false);
      String errorMsg = isAr ? 'فشلت عملية إتمام الطلب. يرجى المحاولة مرة أخرى' : 'Checkout failed. Please try again.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data.containsKey('detail')) {
          errorMsg = data['detail'].toString();
        }
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMsg)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = ref.watch(localeProvider).languageCode == 'ar';

    if (_orderPlacedSuccess) {
      return _buildSuccessScreen(isAr);
    }

    final cartItems = ref.watch(cartProvider);
    double subtotal = 0;
    for (var item in cartItems) {
      subtotal += item.price * item.quantity;
    }
    final isFreeShipping = subtotal >= _freeShippingLimit;
    final shippingFee = isFreeShipping ? 0.0 : _calculatedShippingFee;
    final total = subtotal + shippingFee;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          isAr ? 'الدفع الآمن' : 'SECURE CHECKOUT',
          style: GoogleFonts.montserrat(
            fontSize: R.font(context, 13),
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
            color: Colors.black87,
          ),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryRose))
          : SingleChildScrollView(
              padding: EdgeInsets.all(R.pad(context, 16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. SHIPPING ADDRESS SECTION
                  _buildSectionTitle(isAr ? 'عنوان التسليم' : 'SHIPPING ADDRESS'),
                  const SizedBox(height: 12),

                  if (!_showNewAddressForm && _selectedAddress != null) ...[
                    Container(
                      padding: EdgeInsets.all(R.pad(context, 14)),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.borderLight),
                        borderRadius: BorderRadius.circular(12),
                        color: AppTheme.surfaceLight,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                (_selectedAddress!['label'] ?? 'HOME').toString().toUpperCase(),
                                style: GoogleFonts.montserrat(
                                  fontWeight: FontWeight.bold,
                                  fontSize: R.font(context, 11),
                                  color: AppTheme.primaryRose,
                                ),
                              ),
                              TextButton(
                                onPressed: _showAddressSelectionBottomSheet,
                                child: Text(
                                  isAr ? 'تغيير' : 'CHANGE',
                                  style: GoogleFonts.montserrat(
                                    fontSize: R.font(context, 10),
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_selectedAddress!['address_line1']}${_selectedAddress!['address_line2'] != null && _selectedAddress!['address_line2'].toString().isNotEmpty ? ', ${_selectedAddress!['address_line2']}' : ''}',
                            style: GoogleFonts.poppins(fontSize: R.font(context, 11), color: Colors.black87),
                          ),
                          Text(
                            '${_selectedAddress!['city']}, United Arab Emirates',
                            style: GoogleFonts.poppins(fontSize: R.font(context, 11), color: Colors.black54),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // New Address Form
                    Container(
                      padding: EdgeInsets.all(R.pad(context, 14)),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.borderLight),
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.white,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isAr ? 'عنوان تسليم جديد' : 'NEW SHIPPING ADDRESS',
                            style: GoogleFonts.montserrat(
                              fontWeight: FontWeight.bold,
                              fontSize: R.font(context, 10),
                              color: AppTheme.textMuted,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildTextField(_labelController, isAr ? 'تسمية العنوان (مثل: المنزل، المكتب)' : 'Address Label (e.g. Home, Office)'),
                          const SizedBox(height: 10),
                          _buildTextField(_line1Controller, isAr ? 'عنوان الشارع / اسم المبنى' : 'Address Line 1 (Street details)'),
                          const SizedBox(height: 10),
                          _buildTextField(_line2Controller, isAr ? 'الشقة / المنطقة (اختياري)' : 'Address Line 2 (Apartment, Area - Optional)'),
                          const SizedBox(height: 10),
                          // Emirate Dropdown
                          DropdownButtonFormField<String>(
                            value: _uaeEmirates.contains(_cityController.text) ? _cityController.text : 'Dubai',
                            decoration: InputDecoration(
                              labelText: isAr ? 'الإمارة / المدينة' : 'Emirate / City',
                              labelStyle: GoogleFonts.poppins(fontSize: 11, color: Colors.black45),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.borderLight)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.borderLight)),
                            ),
                            items: _uaeEmirates.map((emirate) {
                              final isFeeFree = isFreeShipping;
                              final feeVal = (emirate == 'Abu Dhabi' || emirate == 'Al Ain') ? 25 : 17;

                              return DropdownMenuItem(
                                value: emirate,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      emirate,
                                      style: GoogleFonts.montserrat(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.black87,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isFeeFree
                                            ? const Color(0xFFE8F5E9)
                                            : const Color(0xFFF5F5F5),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(
                                          color: isFeeFree
                                              ? const Color(0xFFA5D6A7)
                                              : Colors.black12,
                                          width: 0.5,
                                        ),
                                      ),
                                      child: Text(
                                        isFeeFree
                                            ? (isAr ? 'مجاني' : 'FREE')
                                            : (isAr ? 'د.إ $feeVal توصيل' : 'AED $feeVal Delivery'),
                                        style: GoogleFonts.montserrat(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.bold,
                                          color: isFeeFree
                                              ? const Color(0xFF2E7D32)
                                              : Colors.black87,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _cityController.text = val;
                                  _stateController.text = val;
                                });
                                _verifyShippingFeeForPincode(_pincodeController.text, val);
                              }
                            },
                          ),
                          const SizedBox(height: 10),
                          _buildTextField(_pincodeController, isAr ? 'الرمز البريدي / Pincode (اختياري)' : 'Postal / Pincode (Optional - e.g. 00000)'),
                          const SizedBox(height: 10),
                          _buildTextField(_phoneController, isAr ? 'رقم الهاتف' : 'Phone Number (+971)'),
                          if (_addresses.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            TextButton.icon(
                              onPressed: () {
                                setState(() {
                                  _showNewAddressForm = false;
                                });
                              },
                              icon: const Icon(Icons.arrow_back, size: 14, color: Colors.black),
                              label: Text(isAr ? 'إلغاء' : 'CANCEL', style: GoogleFonts.montserrat(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // 2. PAYMENT METHOD SELECTION (MATCHING STOREFRONT EXACTLY)
                  _buildSectionTitle(isAr ? 'طريقة الدفع' : 'PAYMENT METHOD'),
                  const SizedBox(height: 12),

                  // Option 1: Stripe Card / Apple Pay
                  InkWell(
                    onTap: () => setState(() => _paymentMethod = 'card'),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: EdgeInsets.all(R.pad(context, 14)),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _paymentMethod == 'card' ? AppTheme.primaryRose : Colors.black12,
                          width: _paymentMethod == 'card' ? 1.5 : 1.0,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        color: _paymentMethod == 'card' ? AppTheme.primaryRose.withValues(alpha: 0.03) : Colors.white,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.credit_card_rounded,
                            color: _paymentMethod == 'card' ? AppTheme.primaryRose : Colors.black45,
                            size: 22,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isAr ? 'بطاقة ائتمان / خصم (Stripe)' : 'STRIPE SECURE CARD PAYMENT',
                                  style: GoogleFonts.montserrat(
                                    fontWeight: FontWeight.bold,
                                    fontSize: R.font(context, 11),
                                    color: Colors.black87,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  isAr ? 'ادفع بأمان عبر بطاقة الائتمان أو Apple Pay' : 'Pay securely with Credit / Debit Card or Apple Pay',
                                  style: GoogleFonts.poppins(
                                    fontSize: R.font(context, 10),
                                    color: Colors.black54,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Radio<String>(
                            value: 'card',
                            groupValue: _paymentMethod,
                            activeColor: AppTheme.primaryRose,
                            onChanged: (val) => setState(() => _paymentMethod = 'card'),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Option 2: Cash on Delivery (COD)
                  InkWell(
                    onTap: () => setState(() => _paymentMethod = 'cod'),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: EdgeInsets.all(R.pad(context, 14)),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _paymentMethod == 'cod' ? AppTheme.primaryRose : Colors.black12,
                          width: _paymentMethod == 'cod' ? 1.5 : 1.0,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        color: _paymentMethod == 'cod' ? AppTheme.primaryRose.withValues(alpha: 0.03) : Colors.white,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.payments_outlined,
                            color: _paymentMethod == 'cod' ? AppTheme.primaryRose : Colors.black45,
                            size: 22,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isAr ? 'الدفع عند الاستلام (COD)' : 'CASH ON DELIVERY (COD)',
                                  style: GoogleFonts.montserrat(
                                    fontWeight: FontWeight.bold,
                                    fontSize: R.font(context, 11),
                                    color: Colors.black87,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  isAr ? 'ادفع نقداً عند استلام طلبتك في جميع الإمارات' : 'Pay cash upon delivery anywhere in UAE',
                                  style: GoogleFonts.poppins(
                                    fontSize: R.font(context, 10),
                                    color: Colors.black54,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Radio<String>(
                            value: 'cod',
                            groupValue: _paymentMethod,
                            activeColor: AppTheme.primaryRose,
                            onChanged: (val) => setState(() => _paymentMethod = 'cod'),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // 3. ORDER ITEMS BREAKDOWN
                  _buildSectionTitle(isAr ? 'المنتجات في الطلب' : 'ITEMS IN ORDER'),
                  const SizedBox(height: 12),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: cartItems.length,
                    separatorBuilder: (_, __) => const Divider(color: AppTheme.borderLight),
                    itemBuilder: (context, index) {
                      final item = cartItems[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Image.network(
                                item.imageUrl,
                                width: 44,
                                height: 44,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  width: 44,
                                  height: 44,
                                  color: AppTheme.surfaceLight,
                                  child: const Icon(Icons.broken_image_outlined, size: 16),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: GoogleFonts.montserrat(
                                      fontWeight: FontWeight.bold,
                                      fontSize: R.font(context, 12),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${item.variantName} × ${item.quantity}',
                                    style: GoogleFonts.poppins(
                                      fontSize: R.font(context, 10.5),
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              '${isAr ? 'د.إ' : 'AED'} ${(item.price * item.quantity).toInt()}',
                              style: GoogleFonts.montserrat(
                                fontWeight: FontWeight.bold,
                                fontSize: R.font(context, 12.5),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 24),
                  const Divider(color: AppTheme.borderLight, thickness: 1),
                  const SizedBox(height: 12),

                  // 4. ORDER SUMMARY ROW (MATCHING STOREFRONT EXACTLY)
                  _buildSummaryLine(isAr ? 'المجموع الفرعي' : 'Subtotal', '${isAr ? 'د.إ' : 'AED'} ${subtotal.toInt()}', isBold: false),
                  const SizedBox(height: 6),

                  // Taxable Value & UAE VAT (5.0% inclusive)
                  (() {
                    final double taxableVal = subtotal / 1.05;
                    final double vatVal = subtotal - taxableVal;

                    return Column(
                      children: [
                        _buildSummaryLine(
                          isAr ? 'القيمة الخاضعة للضريبة' : 'Taxable Value',
                          '${isAr ? 'د.إ' : 'AED'} ${taxableVal.toStringAsFixed(2)}',
                          color: AppTheme.textMuted,
                          isBold: false,
                        ),
                        const SizedBox(height: 6),
                        _buildSummaryLine(
                          isAr ? 'ضريبة القيمة المضافة (5٪)' : 'VAT (5.0% Incl.)',
                          '${isAr ? 'د.إ' : 'AED'} ${vatVal.toStringAsFixed(2)}',
                          color: AppTheme.textMuted,
                          isBold: false,
                        ),
                        const SizedBox(height: 6),
                      ],
                    );
                  })(),

                  _buildSummaryLine(
                    isAr ? 'الشحن' : 'Shipping',
                    isFreeShipping ? (isAr ? 'مجاني' : 'FREE') : '${isAr ? 'د.إ' : 'AED'} ${shippingFee.toInt()}',
                    color: isFreeShipping ? const Color(0xFF4CAF50) : Colors.black87,
                    isBold: false,
                  ),

                  const SizedBox(height: 12),
                  const Divider(color: AppTheme.borderLight),
                  const SizedBox(height: 12),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isAr ? 'إجمالي قيمة الطلب' : 'Total Order Value',
                        style: GoogleFonts.montserrat(
                          fontWeight: FontWeight.bold,
                          fontSize: R.font(context, 13),
                          color: Colors.black,
                        ),
                      ),
                      Text(
                        '${isAr ? 'د.إ' : 'AED'} ${total.toInt()}',
                        style: GoogleFonts.montserrat(
                          fontWeight: FontWeight.bold,
                          fontSize: R.font(context, 16),
                          color: AppTheme.primaryRose,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 28),

                  // PLACE ORDER CTA BUTTON
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _placeOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryRose,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        elevation: 2,
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : Text(
                              '${isAr ? 'تأكيد الطلب' : 'PLACE ORDER'} (${isAr ? 'د.إ' : 'AED'} ${total.toInt()})',
                              style: GoogleFonts.montserrat(
                                fontSize: R.font(context, 11),
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.5,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  void _showAddressSelectionBottomSheet() {
    final isAr = ref.read(localeProvider).languageCode == 'ar';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isAr ? 'اختر عنوان التسليم' : 'SELECT SHIPPING LOCATION',
                        style: GoogleFonts.montserrat(fontWeight: FontWeight.bold, fontSize: 11.5, color: AppTheme.textMuted),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () => Navigator.of(context).pop(),
                      )
                    ],
                  ),
                  const SizedBox(height: 12),
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: _addresses.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final addr = _addresses[index];
                        final isSelected = _selectedAddress?['id'] == addr['id'];
                        return InkWell(
                          onTap: () {
                            setModalState(() {
                              _selectedAddress = addr;
                            });
                            setState(() {
                              _selectedAddress = addr;
                              _showNewAddressForm = false;
                              if (addr['pincode'] != null) {
                                _verifyShippingFeeForPincode(addr['pincode'].toString(), addr['city']?.toString() ?? '');
                              }
                            });
                            Navigator.of(context).pop();
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: isSelected ? AppTheme.primaryRose : Colors.black12,
                                width: isSelected ? 1.5 : 1.0,
                              ),
                              borderRadius: BorderRadius.circular(10),
                              color: isSelected ? AppTheme.primaryRose.withValues(alpha: 0.03) : Colors.white,
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isSelected ? Icons.check_circle : Icons.circle_outlined,
                                  color: isSelected ? AppTheme.primaryRose : Colors.black26,
                                  size: 18,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        (addr['label'] ?? 'HOME').toString().toUpperCase(),
                                        style: GoogleFonts.montserrat(fontWeight: FontWeight.bold, fontSize: 11),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${addr['address_line1']}, ${addr['city']}, UAE',
                                        style: GoogleFonts.poppins(fontSize: 11, color: Colors.black54),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _showNewAddressForm = true;
                      });
                      Navigator.of(context).pop();
                    },
                    icon: const Icon(Icons.add, size: 16),
                    label: Text(isAr ? 'إضافة عنوان جديد' : 'ADD NEW ADDRESS', style: GoogleFonts.montserrat(fontSize: 10, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSuccessScreen(bool isAr) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: const BoxDecoration(
                    color: Color(0xFFE8F5E9),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle_rounded, size: 48, color: Color(0xFF2E7D32)),
                ),
                const SizedBox(height: 24),
                Text(
                  isAr ? 'تم تأكيد طلبك بنجاح!' : 'ORDER CONFIRMED!',
                  style: GoogleFonts.montserrat(
                    fontSize: R.font(context, 15),
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2.0,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  isAr
                      ? 'شكراً لتسوقك مع Pomma Store. تم استلام طلبك ويجري تجهيزه للشحن.'
                      : 'Thank you for shopping with Pomma Store. Your order has been placed and is being prepared for dispatch.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: R.font(context, 11),
                    color: Colors.black54,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Column(
                    children: [
                      _buildSuccessRow(isAr ? 'رقم الطلب' : 'ORDER NUMBER', _orderNumber),
                      const SizedBox(height: 8),
                      _buildSuccessRow(isAr ? 'شركة الشحن' : 'CARRIER', _carrierName),
                      const SizedBox(height: 8),
                      _buildSuccessRow(isAr ? 'رقم التتبع (AWB)' : 'TRACKING AWB', _trackingNumber),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                      elevation: 0,
                    ),
                    child: Text(
                      isAr ? 'متابعة التسوق' : 'CONTINUE SHOPPING',
                      style: GoogleFonts.montserrat(
                        fontSize: R.font(context, 10),
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2.0,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.montserrat(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.black45)),
        Text(value, style: GoogleFonts.montserrat(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.black87)),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.montserrat(
        fontSize: 10,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.5,
        color: AppTheme.textMuted,
      ),
    );
  }

  Widget _buildSummaryLine(String label, String value, {Color color = Colors.black, bool isBold = true}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.montserrat(
            fontSize: R.font(context, 10.5),
            color: color == Colors.black ? Colors.black87 : color,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.montserrat(
            fontSize: R.font(context, 10.5),
            color: color,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(TextEditingController controller, String label) {
    return TextField(
      controller: controller,
      style: GoogleFonts.poppins(fontSize: 11),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.poppins(fontSize: 11, color: Colors.black45),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.borderLight)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.borderLight)),
      ),
    );
  }
}

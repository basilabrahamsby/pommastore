import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_responsive.dart';
import '../../core/api/api_client.dart';
import '../../core/api/token_manager.dart';
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
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();

  // Native Razorpay instance
  late Razorpay _razorpay;

  // Checkout success details
  bool _orderPlacedSuccess = false;
  String _orderNumber = '';
  String _carrierName = '';
  String _trackingNumber = '';
  double _freeShippingLimit = 999.0;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
    _loadSettings();
    if (!kIsWeb) {
      _initNativeRazorpay();
    }
    _pincodeController.addListener(_onPincodeChanged);
  }

  Future<void> _loadSettings() async {
    try {
      final res = await _api.dio.get('/storefront/settings/storefront_layout');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final limit = data['free_shipping_limit'];
        if (limit != null) {
          setState(() {
            _freeShippingLimit = double.tryParse(limit.toString()) ?? 999.0;
          });
        }
      }
    } catch (_) {}
  }

  void _onPincodeChanged() {
    final pincode = _pincodeController.text.trim();
    if (pincode.length == 6) {
      _autoFillCityState(pincode);
    }
  }

  Future<void> _autoFillCityState(String pincode) async {
    try {
      final res = await _api.dio.get('/storefront/orders/shipping/verify-pincode?pincode=$pincode');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final serviceable = data['serviceable'] as bool? ?? false;
        if (serviceable) {
          final city = data['district']?.toString() ?? '';
          final state = data['state']?.toString() ?? '';
          
          setState(() {
            if (city.isNotEmpty) {
              _cityController.text = city;
            }
            if (state.isNotEmpty) {
              _stateController.text = state;
            }
          });
        }
      }
    } catch (_) {}
  }

  void _initNativeRazorpay() {
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleNativePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handleNativePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleNativeExternalWallet);
  }

  @override
  void dispose() {
    _labelController.dispose();
    _line1Controller.dispose();
    _line2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    if (!kIsWeb) {
      _razorpay.clear();
    }
    super.dispose();
  }

  Future<void> _loadAddresses() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.dio.get('/storefront/account/addresses');
      final data = res.data as List? ?? [];
      final list = data.map((item) => Map<String, dynamic>.from(item)).toList();
      
      setState(() {
        _addresses = list;
        if (list.isNotEmpty) {
          _selectedAddress = list.firstWhere(
            (addr) => addr['is_default'] == true,
            orElse: () => list.first,
          );
          _showNewAddressForm = false;
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

  Future<void> _addNewAddress() async {
    final line1 = _line1Controller.text.trim();
    final city = _cityController.text.trim();
    final state = _stateController.text.trim();
    final pincode = _pincodeController.text.trim();

    if (line1.isEmpty || city.isEmpty || state.isEmpty || pincode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill out all address fields')),
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
        'state': state,
        'pincode': pincode,
        'country': 'India',
        'is_default': _addresses.isEmpty,
      };

      final res = await _api.dio.post('/storefront/account/addresses', data: body);
      final newAddr = Map<String, dynamic>.from(res.data);
      
      setState(() {
        _addresses.add(newAddr);
        _selectedAddress = newAddr;
        _showNewAddressForm = false;
        
        // Reset inputs
        _line1Controller.clear();
        _line2Controller.clear();
        _cityController.clear();
        _stateController.clear();
        _pincodeController.clear();
        
        _isSubmitting = false;
      });
    } catch (e) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save address. Please try again.')),
      );
    }
  }

  Future<void> _placeOrder() async {
    Map<String, dynamic> activeAddress;

    if (_showNewAddressForm) {
      final line1 = _line1Controller.text.trim();
      final city = _cityController.text.trim();
      final state = _stateController.text.trim();
      final pincode = _pincodeController.text.trim();

      if (line1.isEmpty || city.isEmpty || state.isEmpty || pincode.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please fill in shipping address fields')),
        );
        return;
      }
      activeAddress = {
        'label': _labelController.text.trim(),
        'address_line1': line1,
        'address_line2': _line2Controller.text.trim(),
        'city': city,
        'state': state,
        'pincode': pincode,
        'country': 'India',
      };
    } else {
      if (_selectedAddress == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select or add a shipping address')),
        );
        return;
      }
      activeAddress = _selectedAddress!;
    }

    final cartItems = ref.read(cartProvider);
    if (cartItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your cart is empty')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // Calculate totals
      double subtotal = 0;
      for (var item in cartItems) {
        subtotal += item.price * item.quantity;
      }
      final isFreeShipping = subtotal >= _freeShippingLimit;
      final shippingFee = isFreeShipping ? 0.0 : 150.0;

      // Construct order payload matching backend's OrderCreate
      final body = {
        'payment_method': 'prepaid',
        'payment_gateway': 'razorpay',
        'payment_status': 'pending',
        'channel': 'storefront',
        'shipping_amount': shippingFee,
        'discount_amount': 0.0,
        'loyalty_points_used': 0,
        'shipping_address': activeAddress,
        'billing_address': activeAddress,
        'items': cartItems.map((item) => {
          'variant_id': item.id,
          'quantity': item.quantity,
          'unit_price': item.price,
          'discount_amount': 0.0,
        }).toList(),
      };

      // 1. Create the pending order on the backend to obtain Razorpay order details
      final createRes = await _api.dio.post('/storefront/orders/razorpay/create', data: body);
      final rzpOrderData = createRes.data as Map<String, dynamic>;

      final String razorpayOrderId = rzpOrderData['razorpay_order_id'] ?? '';
      final int amountInPaise = rzpOrderData['amount'] ?? 0;
      final String orderNumber = rzpOrderData['order_number'] ?? '';
      final String razorpayKeyId = rzpOrderData['razorpay_key_id'] ?? '';

      // 2. Launch Razorpay payment UI based on platform
      if (kIsWeb) {
        // Since we are running in Chrome for simulation/tests, display a high-fidelity simulation overlay
        _showWebPaymentSimulation(orderNumber, razorpayOrderId, amountInPaise);
      } else {
        // Launch Razorpay's native mobile SDK checkout
        final options = {
          'key': razorpayKeyId,
          'amount': amountInPaise,
          'name': 'Pommastore',
          'order_id': razorpayOrderId,
          'description': 'Secure Order Payment for $orderNumber',
          'prefill': {
            'contact': activeAddress['phone'] ?? '',
            'email': activeAddress['email'] ?? '',
          }
        };
        _razorpay.open(options);
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      final errorMsg = e.toString().contains('400')
          ? 'Failed to verify checkout. Adjust details/check stock.'
          : 'Checkout failed. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMsg)));
    }
  }

  // Web Payment simulation dialog overlay
  void _showWebPaymentSimulation(String orderNumber, String rzpOrderId, int amountInPaise) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 380),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.security_rounded, color: AppTheme.primaryRose, size: 24),
                      const SizedBox(width: 10),
                      Text(
                        'Razorpay Checkout',
                        style: GoogleFonts.montserrat(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: AppTheme.borderLight),
                  const SizedBox(height: 12),
                  _buildSimLine('Order Number', orderNumber),
                  _buildSimLine('Gateway Order ID', rzpOrderId),
                  _buildSimLine('Payment Amount', '₹${(amountInPaise / 100).toStringAsFixed(2)}'),
                  const SizedBox(height: 24),
                  
                  // Mock details to simulate credit card field
                  Text(
                    'SIMULATED CARD DETAILS',
                    style: GoogleFonts.montserrat(fontSize: 8.5, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(color: const Color(0xFFF9F9FB), borderRadius: BorderRadius.circular(8)),
                    child: Text(
                      '••••  ••••  ••••  1111  (Razorpay Test)',
                      style: GoogleFonts.poppins(fontSize: 12.5, color: Colors.black54),
                    ),
                  ),
                  const SizedBox(height: 28),
                  
                  ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      _verifyPayment(orderNumber, rzpOrderId, 'pay_mock_${math.Random().nextInt(9999999)}', 'sig_mock_verified');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4CAF50),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: Text(
                      'SIMULATE SUCCESSFUL PAYMENT',
                      style: GoogleFonts.montserrat(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                    ),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      _cancelPayment(orderNumber);
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: const BorderSide(color: Colors.redAccent),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      'SIMULATE CANCEL PAYMENT',
                      style: GoogleFonts.montserrat(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.redAccent, letterSpacing: 1.0),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSimLine(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.montserrat(fontSize: 11, color: Colors.black54)),
          Text(value, style: GoogleFonts.montserrat(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87)),
        ],
      ),
    );
  }

  Future<void> _verifyPayment(String orderNumber, String rzpOrderId, String rzpPaymentId, String signature) async {
    try {
      final verifyBody = {
        'order_number': orderNumber,
        'razorpay_order_id': rzpOrderId,
        'razorpay_payment_id': rzpPaymentId,
        'razorpay_signature': signature,
      };

      final verifyRes = await _api.dio.post('/storefront/orders/razorpay/verify', data: verifyBody);
      final verifiedData = verifyRes.data as Map<String, dynamic>;
      final orderMap = verifiedData['order'] as Map<String, dynamic>? ?? verifiedData;

      // Clear local cart
      ref.read(cartProvider.notifier).clearCart();

      setState(() {
        _orderPlacedSuccess = true;
        _orderNumber = orderMap['order_number']?.toString() ?? orderNumber;
        _carrierName = orderMap['carrier']?.toString() ?? 'Delhivery';
        _trackingNumber = orderMap['tracking_number']?.toString() ?? '';
        _isSubmitting = false;
      });
    } catch (_) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment verification failed on server.')),
      );
    }
  }

  Future<void> _cancelPayment(String orderNumber) async {
    try {
      await _api.dio.post('/storefront/orders/razorpay/cancel', data: {'order_number': orderNumber});
    } catch (_) {}
    setState(() => _isSubmitting = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Payment cancelled by user')),
    );
  }

  // Native Razorpay handlers
  void _handleNativePaymentSuccess(PaymentSuccessResponse response) {
    if (_orderNumber.isNotEmpty) {
      _verifyPayment(_orderNumber, response.orderId ?? '', response.paymentId ?? '', response.signature ?? '');
    }
  }

  void _handleNativePaymentError(PaymentFailureResponse response) {
    _cancelPayment(_orderNumber);
  }

  void _handleNativeExternalWallet(ExternalWalletResponse response) {
    setState(() => _isSubmitting = false);
  }

  // Prompts Address Sheet modal
  void _showAddressSelectionBottomSheet() {
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
                        'SELECT SHIPPING LOCATION',
                        style: GoogleFonts.montserrat(fontWeight: FontWeight.bold, fontSize: 11.5, color: AppTheme.textMuted),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 220),
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
                              borderRadius: BorderRadius.circular(12),
                              color: isSelected ? AppTheme.primaryRose.withOpacity(0.02) : Colors.white,
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                                  color: isSelected ? AppTheme.primaryRose : Colors.black38,
                                  size: 18,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        addr['label']?.toString().toUpperCase() ?? 'SAVED LOCATION',
                                        style: GoogleFonts.montserrat(fontWeight: FontWeight.bold, fontSize: 10),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${addr['address_line1']}, ${addr['city']} - ${addr['pincode']}',
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
                    icon: const Icon(Icons.add, size: 16, color: Colors.white),
                    label: Text(
                      'ADD NEW ADDRESS',
                      style: GoogleFonts.montserrat(fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1.0),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryRose,
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

  @override
  Widget build(BuildContext context) {
    if (_orderPlacedSuccess) {
      return _buildSuccessScreen();
    }

    final cartItems = ref.watch(cartProvider);
    double subtotal = 0;
    for (var item in cartItems) {
      subtotal += item.price * item.quantity;
    }
    final isFreeShipping = subtotal >= _freeShippingLimit;
    final shippingFee = isFreeShipping ? 0.0 : 150.0;
    final total = subtotal + shippingFee;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'SECURE CHECKOUT',
          style: GoogleFonts.montserrat(
            fontSize: R.font(context, 12.5),
            fontWeight: FontWeight.bold,
            letterSpacing: 2.0,
            color: Colors.black87,
          ),
        ),
        centerTitle: true,
        shape: const Border(bottom: BorderSide(color: AppTheme.borderLight, width: 1.0)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryRose))
          : SafeArea(
              child: Center(
                child: ConstrainedBox(
                  constraints: R.maxContent(context),
                  child: SingleChildScrollView(
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: R.pad(context, 20),
                        vertical: R.pad(context, 16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // 1. SHIPPING ADDRESS SECTION
                          _buildSectionTitle('SHIPPING ADDRESS'),
                          const SizedBox(height: 12),
                          
                          if (!_showNewAddressForm && _selectedAddress != null) ...[
                            // Amazon-style selected address card (clean layout)
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.black12),
                                borderRadius: BorderRadius.circular(16),
                                color: const Color(0xFFF9F9FB),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.location_on_outlined, color: AppTheme.primaryRose, size: 24),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _selectedAddress?['label']?.toString().toUpperCase() ?? 'DELIVERY ADDRESS',
                                          style: GoogleFonts.montserrat(
                                            fontWeight: FontWeight.bold,
                                            fontSize: R.font(context, 10.5),
                                            color: Colors.black87,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${_selectedAddress?['address_line1']}\n${_selectedAddress?['city']}, ${_selectedAddress?['state']} - ${_selectedAddress?['pincode']}',
                                          style: GoogleFonts.poppins(
                                            fontSize: R.font(context, 12),
                                            color: Colors.black54,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: _showAddressSelectionBottomSheet,
                                    child: Text(
                                      'CHANGE',
                                      style: GoogleFonts.montserrat(
                                        fontWeight: FontWeight.bold,
                                        fontSize: R.font(context, 10),
                                        color: AppTheme.primaryRose,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ] else ...[
                            // Address Input Form
                            _buildAddressForm(),
                            if (_addresses.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              TextButton(
                                onPressed: () {
                                  setState(() => _showNewAddressForm = false);
                                },
                                child: Text(
                                  'CANCEL AND USE SAVED ADDRESS',
                                  style: GoogleFonts.montserrat(
                                    color: AppTheme.textMuted,
                                    fontWeight: FontWeight.bold,
                                    fontSize: R.font(context, 9.5),
                                  ),
                                ),
                              ),
                            ],
                          ],
                          
                          const SizedBox(height: 24),
                          
                          // 2. EXCLUSIVE PAYMENT METHOD (RAZORPAY)
                          _buildSectionTitle('PAYMENT METHOD'),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              border: Border.all(color: AppTheme.primaryRose, width: 1.5),
                              borderRadius: BorderRadius.circular(16),
                              color: AppTheme.primaryRose.withOpacity(0.02),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.payment_rounded, color: AppTheme.primaryRose, size: 24),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'RAZORPAY SECURE GATEWAY',
                                        style: GoogleFonts.montserrat(
                                          fontWeight: FontWeight.bold,
                                          fontSize: R.font(context, 11),
                                          color: Colors.black87,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Pay securely via UPI, Card, NetBanking or Wallet.',
                                        style: GoogleFonts.poppins(
                                          fontSize: R.font(context, 10.5),
                                          color: Colors.black54,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          
                          const SizedBox(height: 28),
                          
                          // 3. ORDER ITEMS BREAKDOWN
                          _buildSectionTitle('ITEMS IN ORDER'),
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
                                      '₹${(item.price * item.quantity).toInt()}',
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
                          
                          // 4. ORDER SUMMARY ROW
                          _buildSummaryLine('Subtotal', '₹${subtotal.toInt()}', isBold: false),
                          const SizedBox(height: 6),
                          _buildSummaryLine(
                            'Shipping',
                            isFreeShipping ? 'FREE' : '₹${shippingFee.toInt()}',
                            color: isFreeShipping ? const Color(0xFF4CAF50) : Colors.black87,
                            isBold: false,
                          ),
                          const SizedBox(height: 12),
                          _buildSummaryLine('Total Order Value', '₹${total.toInt()}', isBold: true),
                          
                          const SizedBox(height: 36),
                          
                          // 5. PLACE ORDER BUTTON
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _isSubmitting ? null : _placeOrder,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryRose,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                elevation: 0,
                              ),
                              child: _isSubmitting
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : Text(
                                      'PLACE ORDER (₹${total.toInt()})',
                                      style: GoogleFonts.montserrat(
                                        fontSize: R.font(context, 12),
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.5,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.montserrat(
        fontSize: R.font(context, 10.5),
        fontWeight: FontWeight.bold,
        letterSpacing: 1.5,
        color: AppTheme.textMuted,
      ),
    );
  }

  Widget _buildSummaryLine(String label, String value, {Color? color, bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.montserrat(
            fontSize: isBold ? R.font(context, 12.5) : R.font(context, 12),
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: isBold ? Colors.black87 : AppTheme.textMuted,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.montserrat(
            fontSize: isBold ? R.font(context, 15) : R.font(context, 13.5),
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: color ?? (isBold ? AppTheme.primaryRose : Colors.black87),
          ),
        ),
      ],
    );
  }

  Widget _buildAddressForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9FB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black12, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'NEW SHIPPING ADDRESS',
            style: GoogleFonts.montserrat(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54),
          ),
          const SizedBox(height: 16),
          
          TextField(
            controller: _labelController,
            style: GoogleFonts.poppins(fontSize: 13),
            decoration: const InputDecoration(
              labelText: 'Address Label (e.g. Home, Office)',
              border: OutlineInputBorder(),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          
          TextField(
            controller: _line1Controller,
            style: GoogleFonts.poppins(fontSize: 13),
            decoration: const InputDecoration(
              labelText: 'Address Line 1 (Street details)',
              border: OutlineInputBorder(),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          
          TextField(
            controller: _line2Controller,
            style: GoogleFonts.poppins(fontSize: 13),
            decoration: const InputDecoration(
              labelText: 'Address Line 2 (Apartment, Area - Optional)',
              border: OutlineInputBorder(),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _pincodeController,
            style: GoogleFonts.poppins(fontSize: 13),
            decoration: const InputDecoration(
              labelText: 'Pincode',
              border: OutlineInputBorder(),
              filled: true,
              fillColor: Colors.white,
            ),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _cityController,
                  style: GoogleFonts.poppins(fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'City',
                    border: OutlineInputBorder(),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _stateController,
                  style: GoogleFonts.poppins(fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'State',
                    border: OutlineInputBorder(),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          
          if (_addresses.isNotEmpty) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _addNewAddress,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black87,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('SAVE NEW ADDRESS'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSuccessScreen() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppTheme.primaryRose.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_outline_rounded,
                  size: 44,
                  color: AppTheme.primaryRose,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'ORDER PLACED!',
                style: GoogleFonts.montserrat(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2.0,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Your scent journey has begun. We have sent an email confirmation with invoice details.',
                style: GoogleFonts.poppins(
                  fontSize: 13.5,
                  color: Colors.black54,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              
              // Order Reference Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9F9FB),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.black12, width: 0.8),
                ),
                child: Column(
                  children: [
                    _buildSuccessLine('Order Reference', _orderNumber),
                    if (_carrierName.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      _buildSuccessLine('Carrier Partner', _carrierName),
                    ],
                    if (_trackingNumber.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      _buildSuccessLine('Waybill Tracking', _trackingNumber),
                    ],
                  ],
                ),
              ),
              
              const SizedBox(height: 40),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryRose,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    elevation: 0,
                  ),
                  child: Text(
                    'CONTINUE SHOPPING',
                    style: GoogleFonts.montserrat(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessLine(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.montserrat(fontSize: 11, fontWeight: FontWeight.normal, color: Colors.black54),
        ),
        Text(
          value,
          style: GoogleFonts.montserrat(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
        ),
      ],
    );
  }
}

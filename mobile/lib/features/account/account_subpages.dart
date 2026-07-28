import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';
import '../../core/api/token_manager.dart';
import '../../core/widgets/cached_image.dart';
import '../../core/widgets/logo_loader.dart';
import '../../core/locale/locale_provider.dart';
import '../auth/login_screen.dart';

// Brand rose color tokens
const Color kBrandRose = Color(0xFFD2168D);
const Color kBrandRoseLight = Color(0xFFFDF0F6); // Soft luxury pink tint
const Color kBrandRoseBorder = Color(0xFFF5D6E3); // Soft rose border

String _formatDateTime(DateTime dt) {
  final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final day = dt.day.toString().padLeft(2, '0');
  final month = months[dt.month - 1];
  final year = dt.year;
  final hour24 = dt.hour;
  final minute = dt.minute.toString().padLeft(2, '0');
  final ampm = hour24 >= 12 ? 'PM' : 'AM';
  final hour = hour24 % 12 == 0 ? 12 : hour24 % 12;
  return "$day $month $year, ${hour.toString().padLeft(2, '0')}:$minute $ampm";
}

// Helper to launch URLs safely
Future<void> _launchURL(String urlString) async {
  try {
    final uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  } catch (_) {}
}

// Helper widget for Not Logged In states
Widget _buildNotLoggedInPlaceholder(BuildContext context, WidgetRef ref, String featureName, VoidCallback onBackFromLogin) {
  final isAr = ref.watch(localeProvider).languageCode == 'ar';
  
  final featureNameAr = {
    'orders': 'طلباتك',
    'addresses': 'عناوين الشحن الخاصة بك',
    'wishlist': 'قائمة رغباتك',
  }[featureName.toLowerCase()] ?? featureName;

  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: kBrandRoseLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.lock_outline_rounded,
              size: 40,
              color: kBrandRose,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            isAr ? 'مطلوب تسجيل الدخول' : 'SIGN IN REQUIRED',
            style: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            isAr 
                ? 'يرجى تسجيل الدخول لعرض وإدارة $featureNameAr.' 
                : 'Please sign in to view and manage your $featureName.',
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: Colors.black54,
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              ).then((_) => onBackFromLogin());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: kBrandRose,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
            ),
            child: Text(
              isAr ? 'تسجيل الدخول / إنشاء حساب' : 'SIGN IN / REGISTER',
              style: GoogleFonts.montserrat(
                fontSize: 10.5,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.0,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. My Orders Screen
// ─────────────────────────────────────────────────────────────────────────────

class MyOrdersScreen extends ConsumerStatefulWidget {
  const MyOrdersScreen({super.key});

  @override
  ConsumerState<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends ConsumerState<MyOrdersScreen> {
  final _api = ApiClient();
  List<dynamic> _orders = [];
  bool _isLoading = true;
  bool _isLoggedIn = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      final token = await TokenManager.getToken();
      if (token == null || token.isEmpty) {
        if (!mounted) return;
        setState(() {
          _isLoggedIn = false;
          _isLoading = false;
        });
        return;
      }

      setState(() {
        _isLoggedIn = true;
      });

      final res = await _api.dio.get('/storefront/account/orders');
      if (res.statusCode == 200 && res.data != null) {
        if (!mounted) return;
        setState(() {
          _orders = res.data as List<dynamic>;
          _isLoading = false;
        });
      } else {
        if (!mounted) return;
        setState(() {
          _error = 'Failed to load orders.';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to fetch orders. Please check your network connection.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = ref.watch(localeProvider).languageCode == 'ar';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          isAr ? 'طلباتي' : 'MY ORDERS',
          style: GoogleFonts.montserrat(
            fontSize: 13.5,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
            color: Colors.black87,
          ),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: kBrandRoseBorder, height: 1),
        ),
      ),
      body: _isLoading
          ? const LogoLoader()
          : !_isLoggedIn
              ? _buildNotLoggedInPlaceholder(context, ref, 'orders', _fetchOrders)
              : _error.isNotEmpty
                  ? _buildErrorPlaceholder()
                  : _orders.isEmpty
                      ? _buildEmptyPlaceholder()
                      : ListView.builder(
                          padding: const EdgeInsets.all(20),
                          itemCount: _orders.length,
                          itemBuilder: (context, index) {
                            return _buildOrderCard(_orders[index]);
                          },
                        ),
    );
  }

  Widget _buildErrorPlaceholder() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 40, color: kBrandRose),
            const SizedBox(height: 16),
            Text(
              _error,
              style: GoogleFonts.poppins(color: Colors.black54, fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: _fetchOrders,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: kBrandRose),
                foregroundColor: kBrandRose,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: Text('RETRY', style: GoogleFonts.montserrat(fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyPlaceholder() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(color: kBrandRoseLight, shape: BoxShape.circle),
              child: const Icon(Icons.shopping_bag_outlined, size: 36, color: kBrandRose),
            ),
            const SizedBox(height: 20),
            Text(
              'You have no orders yet.',
              style: GoogleFonts.poppins(color: Colors.black54, fontSize: 13.5, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderCard(dynamic order) {
    final number = order['order_number']?.toString() ?? 'Order';
    final dateStr = order['created_at']?.toString() ?? '';
    final total = order['total_amount']?.toString() ?? '0.00';
    final status = (order['status']?.toString() ?? 'pending').toUpperCase();
    final items = order['items'] as List<dynamic>? ?? [];
    
    DateTime? date;
    if (dateStr.isNotEmpty) {
      try {
        date = DateTime.parse(dateStr);
      } catch (_) {}
    }

    Color statusColor = Colors.orange;
    if (status == 'DELIVERED') statusColor = Colors.green;
    if (status == 'SHIPPED') statusColor = kBrandRose;
    if (status == 'CANCELLED') statusColor = Colors.red;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBrandRoseBorder),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Elegant Header of order card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: kBrandRoseLight,
              borderRadius: BorderRadius.vertical(top: Radius.circular(11)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ORDER #$number',
                      style: GoogleFonts.montserrat(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                        color: Colors.black87,
                      ),
                    ),
                    if (date != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        _formatDateTime(date.toLocal()),
                        style: GoogleFonts.poppins(fontSize: 9.5, color: Colors.black54),
                      ),
                    ],
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        status,
                        style: GoogleFonts.montserrat(
                          fontSize: 8.5,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Order items list
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: items.map((item) {
                final v = item['variant'];
                final prod = v != null ? v['product'] : null;
                final prodName = prod != null ? prod['name']?.toString() ?? 'Product' : 'Fragrance';
                final size = v != null ? v['size']?.toString() ?? '' : '';
                final qty = item['quantity']?.toString() ?? '1';
                final price = item['unit_price']?.toString() ?? '0.00';
                
                String? imgUrl;
                if (prod != null && prod['images'] is List && prod['images'].isNotEmpty) {
                  imgUrl = prod['images'][0]['image_url']?.toString();
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFAF9F6),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFF2F2F7)),
                        ),
                        child: imgUrl != null
                            ? CachedImage(imageUrl: imgUrl, fit: BoxFit.contain)
                            : const Icon(Icons.image_outlined, size: 22, color: Colors.black26),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              prodName,
                              style: GoogleFonts.poppins(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w500,
                                color: Colors.black87,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${size.isNotEmpty ? "$size | " : ""}QTY: $qty',
                              style: GoogleFonts.poppins(fontSize: 10.5, color: Colors.black54),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Text(
                        '₹$price',
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          
          const Divider(color: Color(0xFFF2F2F7), height: 1),
          
          // Total Amount footer
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'TOTAL AMOUNT',
                  style: GoogleFonts.montserrat(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 0.5),
                ),
                Text(
                  '₹$total',
                  style: GoogleFonts.montserrat(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: kBrandRose,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Shipping Addresses Screen
// ─────────────────────────────────────────────────────────────────────────────

class ShippingAddressesScreen extends ConsumerStatefulWidget {
  const ShippingAddressesScreen({super.key});

  @override
  ConsumerState<ShippingAddressesScreen> createState() => _ShippingAddressesScreenState();
}

class _ShippingAddressesScreenState extends ConsumerState<ShippingAddressesScreen> {
  final _api = ApiClient();
  List<dynamic> _addresses = [];
  bool _isLoading = true;
  bool _isLoggedIn = true;

  @override
  void initState() {
    super.initState();
    _fetchAddresses();
  }

  Future<void> _fetchAddresses() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final token = await TokenManager.getToken();
      if (token == null || token.isEmpty) {
        if (!mounted) return;
        setState(() {
          _isLoggedIn = false;
          _isLoading = false;
        });
        return;
      }

      setState(() {
        _isLoggedIn = true;
      });

      final res = await _api.dio.get('/storefront/account/addresses');
      if (res.statusCode == 200 && res.data != null) {
        if (!mounted) return;
        setState(() {
          _addresses = res.data as List<dynamic>;
          _isLoading = false;
        });
      } else {
        if (!mounted) return;
        setState(() => _isLoading = false);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteAddress(String addressId) async {
    try {
      final res = await _api.dio.delete('/storefront/account/addresses/$addressId');
      if (res.statusCode == 204 || res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Address deleted successfully', style: GoogleFonts.poppins(fontSize: 12)),
            backgroundColor: Colors.black87,
          ),
        );
        _fetchAddresses();
      }
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to delete address', style: GoogleFonts.poppins(fontSize: 12)),
          backgroundColor: Colors.black87,
        ),
      );
    }
  }

  void _showAddAddressSheet() {
    final labelCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    final areaCtrl = TextEditingController();
    final cityCtrl = TextEditingController();
    final stateCtrl = TextEditingController();
    final pinCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'ADD NEW ADDRESS',
                  style: GoogleFonts.montserrat(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                    color: Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                
                // Form Fields
                _buildField(labelCtrl, 'ADDRESS LABEL (e.g. Home, Office)'),
                _buildField(addressCtrl, 'ADDRESS LINE 1 (Building / Villa / House)'),
                _buildField(areaCtrl, 'ADDRESS LINE 2 (Area / Landmark)'),
                _buildField(cityCtrl, 'CITY / EMIRATE'),
                _buildField(stateCtrl, 'STATE'),
                _buildField(pinCtrl, 'PINCODE / PO BOX'),
                _buildField(phoneCtrl, 'CONTACT PHONE NUMBER', isPhone: true),
                
                const SizedBox(height: 28),
                ElevatedButton(
                  onPressed: () async {
                    if (labelCtrl.text.isEmpty || addressCtrl.text.isEmpty || cityCtrl.text.isEmpty || phoneCtrl.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Please complete all required fields', style: GoogleFonts.poppins(fontSize: 12)),
                          backgroundColor: Colors.black87,
                        ),
                      );
                      return;
                    }
                    
                    Navigator.of(context).pop();
                    setState(() => _isLoading = true);
                    
                    try {
                      await _api.dio.post(
                        '/storefront/account/addresses',
                        data: {
                          'label': labelCtrl.text.trim(),
                          'address_line1': addressCtrl.text.trim(),
                          'address_line2': areaCtrl.text.trim(),
                          'city': cityCtrl.text.trim(),
                          'state': stateCtrl.text.trim().isNotEmpty ? stateCtrl.text.trim() : cityCtrl.text.trim(),
                          'pincode': pinCtrl.text.trim().isNotEmpty ? pinCtrl.text.trim() : '00000',
                          'phone': phoneCtrl.text.trim(),
                          'country': 'India',
                        },
                      );
                      _fetchAddresses();
                    } catch (_) {
                      setState(() => _isLoading = false);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Failed to save address.', style: GoogleFonts.poppins(fontSize: 12)),
                          backgroundColor: Colors.black87,
                        ),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(
                    'SAVE ADDRESS',
                    style: GoogleFonts.montserrat(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.5),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildField(TextEditingController ctrl, String label, {bool isPhone = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: TextField(
        controller: ctrl,
        keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
        style: GoogleFonts.poppins(fontSize: 12),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.montserrat(fontSize: 8.5, fontWeight: FontWeight.bold, letterSpacing: 1.0, color: Colors.black54),
          contentPadding: const EdgeInsets.symmetric(vertical: 8),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFE5E5EA))),
          focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: kBrandRose)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isAr = ref.watch(localeProvider).languageCode == 'ar';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          isAr ? 'عناوين الشحن' : 'SHIPPING ADDRESSES',
          style: GoogleFonts.montserrat(
            fontSize: 13.5,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
            color: Colors.black87,
          ),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: _isLoggedIn
            ? [
                IconButton(
                  icon: const Icon(Icons.add, color: kBrandRose),
                  onPressed: _showAddAddressSheet,
                ),
              ]
            : null,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: kBrandRoseBorder, height: 1),
        ),
      ),
      body: _isLoading
          ? const LogoLoader()
          : !_isLoggedIn
              ? _buildNotLoggedInPlaceholder(context, ref, 'addresses', _fetchAddresses)
              : _addresses.isEmpty
                  ? _buildEmptyPlaceholder()
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: _addresses.length,
                      itemBuilder: (context, index) {
                        final addr = _addresses[index];
                        final id = addr['id']?.toString() ?? '';
                        final label = addr['label']?.toString() ?? 'Address';
                        final line1 = addr['address_line1']?.toString() ?? '';
                        final line2 = addr['address_line2']?.toString() ?? '';
                        final city = addr['city']?.toString() ?? '';
                        final state = addr['state']?.toString() ?? '';
                        final pin = addr['pincode']?.toString() ?? '';
                        final phone = addr['phone']?.toString() ?? '';

                        return Container(
                          margin: const EdgeInsets.only(bottom: 20),
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: kBrandRoseBorder),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x06000000),
                                blurRadius: 10,
                                offset: Offset(0, 4),
                              )
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: kBrandRoseLight,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      label.toUpperCase(),
                                      style: GoogleFonts.montserrat(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.0,
                                        color: kBrandRose,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline_rounded, size: 20, color: kBrandRose),
                                    onPressed: () => _deleteAddress(id),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                line1,
                                style: GoogleFonts.poppins(fontSize: 13, color: Colors.black87, fontWeight: FontWeight.w500),
                              ),
                              if (line2.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  line2,
                                  style: GoogleFonts.poppins(fontSize: 12, color: Colors.black54),
                                ),
                              ],
                              const SizedBox(height: 4),
                              Text(
                                '$city, $state - $pin',
                                style: GoogleFonts.poppins(fontSize: 12, color: Colors.black54),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  const Icon(Icons.phone_iphone, size: 13, color: Colors.black45),
                                  const SizedBox(width: 6),
                                  Text(
                                    phone,
                                    style: GoogleFonts.poppins(fontSize: 11.5, color: Colors.black54, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
    );
  }

  Widget _buildEmptyPlaceholder() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(color: kBrandRoseLight, shape: BoxShape.circle),
              child: const Icon(Icons.location_on_outlined, size: 36, color: kBrandRose),
            ),
            const SizedBox(height: 20),
            Text(
              'No saved shipping addresses found.',
              style: GoogleFonts.poppins(color: Colors.black54, fontSize: 13.5, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: _showAddAddressSheet,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: kBrandRose),
                foregroundColor: kBrandRose,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: Text(
                'ADD NEW ADDRESS',
                style: GoogleFonts.montserrat(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


// 4. Customer Support Screen
// ─────────────────────────────────────────────────────────────────────────────

class CustomerSupportScreen extends StatelessWidget {
  const CustomerSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'CUSTOMER SUPPORT',
          style: GoogleFonts.montserrat(
            fontSize: 13.5,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
            color: Colors.black87,
          ),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: kBrandRoseBorder, height: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            Text(
              'WE\'RE HERE TO HELP',
              style: GoogleFonts.montserrat(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Our concierge support team is available from 9 AM to 9 PM IST to assist with orders, tracking, and fragrance recommendations.',
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: Colors.black54,
                height: 1.6,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 36),
            
            // Support Option Cards with Action Buttons
            _buildSupportCard(
              context,
              Icons.mail_outline_rounded,
              'EMAIL ASSISTANCE',
              'info@pommastore.com',
              'Expect a response within 12-24 hours.',
              'EMAIL NOW',
              () => _launchURL('mailto:info@pommastore.com'),
            ),
            const SizedBox(height: 16),
            _buildSupportCard(
              context,
              Icons.phone_iphone_rounded,
              'WHATSAPP & PHONE',
              '+91 99465 96018',
              'Quick chat support for order status.',
              'CHAT ON WHATSAPP',
              () => _launchURL('https://wa.me/919946596018'),
            ),
            const SizedBox(height: 16),
            _buildSupportCard(
              context,
              Icons.location_on_outlined,
              'CORPORATE OFFICE',
              'Pommastore Commodities Pvt Ltd,\nCochin, Kerala, IN 682026',
              'Registered corporate details.',
              'VIEW DETAILS',
              null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSupportCard(
    BuildContext context,
    IconData icon,
    String title,
    String val,
    String subtitle,
    String btnLabel,
    VoidCallback? onAction,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: kBrandRoseBorder),
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x04000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: kBrandRoseLight,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 20, color: kBrandRose),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.montserrat(
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                        color: Colors.black54,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      val,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: Colors.black38,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (onAction != null) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onAction,
              style: ElevatedButton.styleFrom(
                backgroundColor: kBrandRose,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: Text(
                btnLabel,
                style: GoogleFonts.montserrat(
                  fontSize: 9.5,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

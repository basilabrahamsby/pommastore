import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_responsive.dart';
import '../../core/api/api_client.dart';
import '../../core/api/token_manager.dart';
import '../cart/cart_provider.dart';
import '../wishlist/wishlist_provider.dart';
import '../auth/login_screen.dart';
import '../wishlist/wishlist_screen.dart';
import '../catalog/rewards_gallery_screen.dart';
import 'account_subpages.dart';
import '../../core/widgets/logo_loader.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/locale/locale_provider.dart';

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  bool _isLoggedIn = false;
  String _name = 'Guest User';
  String _email = 'Log in to sync your cart and preferences';
  int _loyaltyPoints = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final token = await TokenManager.getToken();
      if (token == null || token.isEmpty) {
        _setGuestState();
        return;
      }

      final res = await ApiClient().dio.get('/storefront/account/me');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final fName = data['first_name']?.toString() ?? '';
        final lName = data['last_name']?.toString() ?? '';
        final email = data['email']?.toString() ?? data['phone']?.toString() ?? '';
        final points = data['loyalty_points'] is int ? data['loyalty_points'] as int : 0;
        final fullName = (fName.isNotEmpty || lName.isNotEmpty)
            ? '$fName $lName'.trim()
            : 'Customer';

        if (mounted) {
          setState(() {
            _isLoggedIn = true;
            _name = fullName;
            _email = email;
            _loyaltyPoints = points;
            _isLoading = false;
          });
        }
      } else {
        _setGuestState();
      }
    } catch (_) {
      _setGuestState();
    }
  }

  void _setGuestState() {
    if (mounted) {
      setState(() {
        _isLoggedIn = false;
        _name = 'Guest User';
        _email = 'Log in to sync your preferences';
        _loyaltyPoints = 0;
        _isLoading = false;
      });
    }
  }

  Future<void> _signOut() async {
    setState(() => _isLoading = true);
    try {
      await TokenManager.clearToken();
      ref.read(cartProvider.notifier).clearCart();
      ref.read(wishlistProvider.notifier).clearWishlist();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Logged out successfully!', style: GoogleFonts.poppins(fontSize: 12)),
          backgroundColor: Colors.black87,
        ),
      );
      _setGuestState();
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Image.asset('assets/logo.png', height: 42, fit: BoxFit.contain),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, color: Colors.black87, size: 20),
            onPressed: _loadProfile,
          ),
        ],
      ),
      body: AnimatedBackground(
        child: SafeArea(
        child: _isLoading
            ? const LogoLoader()
            : Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 500),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Profile Luxury Floating Card
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 500),
                            curve: Curves.easeInOut,
                            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 24),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: _isLoggedIn
                                    ? [Colors.white, const Color(0xFFFCF9FA)]
                                    : [const Color(0xFFFFF5FA), const Color(0xFFFDE8F3)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: _isLoggedIn ? const Color(0xFFD4AF37) : const Color(0xFFF5D6E3),
                                width: 1.2,
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x0C000000),
                                  blurRadius: 18,
                                  offset: Offset(0, 6),
                                )
                              ],
                            ),
                            child: Column(
                              children: [
                                // Elegant Profile Ring
                                Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: _isLoggedIn ? const Color(0xFFD4AF37) : const Color(0xFFD2168D),
                                      width: 1.5,
                                    ),
                                  ),
                                  child: CircleAvatar(
                                    radius: 38,
                                    backgroundColor: _isLoggedIn ? const Color(0xFFFAF6F0) : Colors.white,
                                    child: Icon(
                                      Icons.person_outline_rounded,
                                      size: 34,
                                      color: _isLoggedIn ? Colors.black87 : const Color(0xFFD2168D),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 18),
                                
                                // Customer Name
                                Text(
                                  _isLoggedIn ? _name : 'Welcome to Pommastore',
                                  style: GoogleFonts.montserrat(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.2,
                                    color: Colors.black87,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 6),
                                
                                // Customer Email/Phone details
                                Text(
                                  _isLoggedIn ? _email : 'Sign in to unlock personalized fragrance matching',
                                  style: GoogleFonts.poppins(
                                    color: AppTheme.textMuted,
                                    fontSize: 11,
                                    height: 1.4,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 24),

                                if (_isLoggedIn) ...[
                                  // Elite Member Badge
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFAF6F0),
                                      border: Border.all(color: const Color(0xFFEADFCD)),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.star, color: Color(0xFFD4AF37), size: 14),
                                        const SizedBox(width: 6),
                                        Text(
                                          'ELITE MEMBER  |  $_loyaltyPoints PTS',
                                          style: GoogleFonts.montserrat(
                                            fontSize: 9,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 1.2,
                                            color: const Color(0xFF8C6D3B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 20),
                                  
                                  // Sign out Outlined Button
                                  OutlinedButton(
                                    onPressed: _signOut,
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Color(0xFFE5E5EA)),
                                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                    ),
                                    child: Text(
                                      'SIGN OUT',
                                      style: GoogleFonts.montserrat(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                  ),
                                ] else ...[
                                  // Login Solid Button (Brand Rose Pink)
                                  ElevatedButton(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(builder: (context) => const LoginScreen()),
                                      ).then((_) => _loadProfile());
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFD2168D),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 14),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                      shadowColor: const Color(0x3DD2168D),
                                    ),
                                    child: Text(
                                      'SIGN IN / REGISTER',
                                      style: GoogleFonts.montserrat(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                        
                        // Quick Perks Banner Grid
                        _buildQuickPerksGrid(),
                        
                        const SizedBox(height: 8),
                        
                        // Preferences Section Header
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                          child: Row(
                            children: [
                              Text(
                                'ACCOUNT PREFERENCES',
                                style: GoogleFonts.montserrat(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.5,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                'POMMASTORE VIP',
                                style: GoogleFonts.montserrat(
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.0,
                                  color: AppTheme.primaryRose,
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        // Action Menu Items with luxury card styling
                        _buildMenuItem(
                          Icons.favorite_rounded,
                          'My Wishlist',
                          () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const WishlistScreen()),
                            ).then((_) => _loadProfile());
                          },
                          iconColor: AppTheme.primaryRose,
                          subtitle: 'Saved fragrance favorites & collections',
                        ),
                        _buildMenuItem(
                          Icons.local_shipping_rounded,
                          'My Orders & Returns',
                          () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const MyOrdersScreen()),
                            );
                          },
                          iconColor: const Color(0xFF3B82F6),
                          subtitle: 'Track active shipments & order history',
                        ),
                        _buildMenuItem(
                          Icons.location_on_rounded,
                          'Shipping Addresses',
                          () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const ShippingAddressesScreen()),
                            );
                          },
                          iconColor: const Color(0xFF10B981),
                          subtitle: 'Manage delivery addresses & pincodes',
                        ),
                        _buildMenuItem(
                          Icons.workspace_premium_rounded,
                          'Insider VIP Rewards',
                          () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const RewardsGalleryScreen()),
                            );
                          },
                          iconColor: AppTheme.accentGold,
                          subtitle: 'Redeem loyalty points for exclusive gifts',
                        ),
                        Consumer(
                          builder: (context, ref, _) {
                            final localeNotifier = ref.watch(localeProvider.notifier);
                            final isAr = localeNotifier.isArabic;
                            return _buildMenuItem(
                              Icons.language_rounded,
                              isAr ? 'اللغة / Language' : 'Language / اللغة',
                              () => localeNotifier.toggleLocale(),
                              iconColor: AppTheme.primaryRose,
                              subtitle: isAr ? 'التغيير إلى الإنجليزية (English)' : 'Switch to Arabic (العربية)',
                            );
                          },
                        ),
                        _buildMenuItem(
                          Icons.headset_mic_rounded,
                          '24/7 Customer Support',
                          () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const CustomerSupportScreen()),
                            );
                          },
                          iconColor: const Color(0xFF8B5CF6),
                          subtitle: 'Live perfumery concierge & help desk',
                        ),
                        
                        const SizedBox(height: 32),

                        // Pommastore Luxury Brand Footer
                        Center(
                          child: Column(
                            children: [
                              Image.asset('assets/logo.png', height: 20, fit: BoxFit.contain),
                              const SizedBox(height: 6),
                              Text(
                                'HANDCRAFTED PERFUMERY • MADE FOR CONNOISSEURS',
                                style: GoogleFonts.montserrat(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.5,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'v2.4.0 • Pommastore Inc.',
                                style: GoogleFonts.poppins(
                                  fontSize: 9,
                                  color: Colors.black26,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ),
        ),
      ),
    );
  }

  Widget _buildQuickPerksGrid() {
    final perks = [
      {'icon': Icons.local_shipping_outlined, 'title': 'EXPRESS SHIPPING', 'subtitle': 'Free on ₹999+'},
      {'icon': Icons.verified_outlined, 'title': '100% ORIGINAL', 'subtitle': 'Direct House'},
      {'icon': Icons.card_giftcard_outlined, 'title': 'FREE SAMPLES', 'subtitle': 'Every Order'},
      {'icon': Icons.lock_outline_rounded, 'title': 'SECURE PAY', 'subtitle': 'COD & UPI'},
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primaryRose.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryRose.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: perks.map((p) {
          return Expanded(
            child: Column(
              children: [
                Icon(p['icon'] as IconData, size: 20, color: AppTheme.primaryRose),
                const SizedBox(height: 6),
                Text(
                  p['title'] as String,
                  style: GoogleFonts.montserrat(
                    fontSize: 7.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                    color: AppTheme.textNeutral,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  p['subtitle'] as String,
                  style: GoogleFonts.poppins(
                    fontSize: 8.5,
                    color: AppTheme.textMuted,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMenuItem(
    IconData icon,
    String title,
    VoidCallback onTap, {
    Color iconColor = AppTheme.primaryRose,
    String? subtitle,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        leading: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: iconColor.withValues(alpha: 0.1),
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        title: Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle,
                style: GoogleFonts.poppins(fontSize: 10, color: AppTheme.textMuted),
              )
            : null,
        trailing: Container(
          padding: const EdgeInsets.all(4),
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: AppTheme.surfaceLight,
          ),
          child: const Icon(Icons.chevron_right_rounded, color: Colors.black45, size: 16),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        onTap: onTap,
      ),
    );
  }
}

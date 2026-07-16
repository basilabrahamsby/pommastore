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

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  bool _isLoggedIn = false;
  String _name = 'Guest User';
  String _email = 'Log in to sync your cart and preferences';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    try {
      final token = await TokenManager.getToken();
      if (token == null || token.isEmpty) {
        if (mounted) {
          setState(() {
            _isLoggedIn = false;
            _name = 'Guest User';
            _email = 'Log in to sync your preferences';
            _isLoading = false;
          });
        }
        return;
      }

      final res = await ApiClient().dio.get('/storefront/account/me');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final fName = data['first_name']?.toString() ?? '';
        final lName = data['last_name']?.toString() ?? '';
        final email = data['email']?.toString() ?? data['phone']?.toString() ?? '';
        final fullName = (fName.isNotEmpty || lName.isNotEmpty)
            ? '$fName $lName'.trim()
            : 'Customer';

        if (mounted) {
          setState(() {
            _isLoggedIn = true;
            _name = fullName;
            _email = email;
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
        const SnackBar(content: Text('Logged out successfully!')),
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
        title: Image.asset('assets/logo.png', height: R.pad(context, 26), fit: BoxFit.contain),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryRose))
            : Center(
                child: ConstrainedBox(
                  constraints: R.maxContent(context),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // User Profile Section
                        Container(
                          color: AppTheme.surfaceLight,
                          padding: EdgeInsets.symmetric(
                            vertical: R.pad(context, 30),
                            horizontal: R.pad(context, 24),
                          ),
                          child: Column(
                            children: [
                              CircleAvatar(
                                radius: R.pad(context, 36),
                                backgroundColor: AppTheme.primaryRose,
                                child: Icon(Icons.person, size: R.icon(context, 40), color: Colors.white),
                              ),
                              SizedBox(height: R.pad(context, 14)),
                              Text(
                                _name,
                                style: GoogleFonts.montserrat(
                                  fontSize: R.font(context, 16),
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              SizedBox(height: R.pad(context, 4)),
                              Text(
                                _email,
                                style: GoogleFonts.poppins(
                                  color: AppTheme.textMuted,
                                  fontSize: R.font(context, 12),
                                ),
                              ),
                              SizedBox(height: R.pad(context, 14)),
                              ElevatedButton(
                                onPressed: () {
                                  if (_isLoggedIn) {
                                    _signOut();
                                  } else {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(builder: (context) => const LoginScreen()),
                                    ).then((_) => _loadProfile());
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: R.pad(context, 20),
                                    vertical: R.pad(context, 8),
                                  ),
                                  backgroundColor: _isLoggedIn ? Colors.black54 : AppTheme.primaryRose,
                                ),
                                child: Text(
                                  _isLoggedIn ? 'SIGN OUT' : 'SIGN IN / REGISTER',
                                  style: GoogleFonts.montserrat(
                                    fontSize: R.font(context, 10.5),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        SizedBox(height: R.pad(context, 16)),
                        
                        // Settings list
                        Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: R.pad(context, 24),
                            vertical: R.pad(context, 8),
                          ),
                          child: Text(
                            'PREFERENCES',
                            style: GoogleFonts.montserrat(
                              fontSize: R.font(context, 9.5),
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ),
                        
                        ListTile(
                          leading: Icon(Icons.favorite_border, color: AppTheme.primaryRose, size: R.icon(context, 22)),
                          title: Text('My Wishlist', style: TextStyle(fontSize: R.font(context, 14))),
                          trailing: Icon(Icons.chevron_right, color: AppTheme.textMuted, size: R.icon(context, 20)),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const WishlistScreen()),
                            ).then((_) => _loadProfile());
                          },
                        ),
                        const Divider(color: AppTheme.borderLight, height: 1),

                        ListTile(
                          leading: Icon(Icons.shopping_bag_outlined, color: AppTheme.primaryRose, size: R.icon(context, 22)),
                          title: Text('My Orders', style: TextStyle(fontSize: R.font(context, 14))),
                          trailing: Icon(Icons.chevron_right, color: AppTheme.textMuted, size: R.icon(context, 20)),
                          onTap: () {},
                        ),
                        const Divider(color: AppTheme.borderLight, height: 1),
                        
                        ListTile(
                          leading: Icon(Icons.location_on_outlined, color: AppTheme.primaryRose, size: R.icon(context, 22)),
                          title: Text('Shipping Addresses', style: TextStyle(fontSize: R.font(context, 14))),
                          trailing: Icon(Icons.chevron_right, color: AppTheme.textMuted, size: R.icon(context, 20)),
                          onTap: () {},
                        ),
                        const Divider(color: AppTheme.borderLight, height: 1),

                        ListTile(
                          leading: Icon(Icons.credit_card_outlined, color: AppTheme.primaryRose, size: R.icon(context, 22)),
                          title: Text('Saved Payments', style: TextStyle(fontSize: R.font(context, 14))),
                          trailing: Icon(Icons.chevron_right, color: AppTheme.textMuted, size: R.icon(context, 20)),
                          onTap: () {},
                        ),
                        const Divider(color: AppTheme.borderLight, height: 1),
                        
                        ListTile(
                          leading: Icon(Icons.help_outline, color: AppTheme.primaryRose, size: R.icon(context, 22)),
                          title: Text('Customer Support', style: TextStyle(fontSize: R.font(context, 14))),
                          trailing: Icon(Icons.chevron_right, color: AppTheme.textMuted, size: R.icon(context, 20)),
                          onTap: () {},
                        ),
                        SizedBox(height: R.pad(context, 40)),
                      ],
                    ),
                  ),
                ),
              ),
      ),
    );
  }
}

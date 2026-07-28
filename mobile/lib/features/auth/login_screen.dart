import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';
import '../../core/api/token_manager.dart';
import '../cart/cart_provider.dart';
import '../checkout/checkout_screen.dart';

// Brand Rose colors matching logo
const Color kBrandRose = Color(0xFFD2168D);
const Color kBrandRoseLight = Color(0xFFFDF0F6);
const Color kBrandRoseBorder = Color(0xFFF5D6E3);

class LoginScreen extends ConsumerStatefulWidget {
  /// If true, after successful login the user is automatically taken to checkout.
  final bool redirectToCheckout;
  const LoginScreen({super.key, this.redirectToCheckout = false});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with SingleTickerProviderStateMixin {
  final _contactController = TextEditingController();
  final _otpController = TextEditingController();
  final _api = ApiClient();
  
  bool _otpSent = false;
  bool _isLoading = false;
  int _timerSeconds = 60;
  Timer? _countdownTimer;
  String _loginMethod = 'email'; // 'email' or 'phone'

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeIn);
    _fadeController.forward();
  }

  void _startTimer() {
    setState(() {
      _timerSeconds = 60;
    });
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timerSeconds == 0) {
        timer.cancel();
      } else {
        setState(() {
          _timerSeconds--;
        });
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _contactController.dispose();
    _otpController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    final input = _contactController.text.trim();
    if (input.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _loginMethod == 'email' ? 'Please enter your email address' : 'Please enter your phone number',
            style: GoogleFonts.poppins(fontSize: 12),
          ),
          backgroundColor: Colors.black87,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final isPhone = _loginMethod == 'phone';
      final body = isPhone
          ? {'phone': input}
          : {'email': input};

      await _api.dio.post('/storefront/auth/otp/send', data: body);

      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _otpSent = true;
      });
      _startTimer();
      _fadeController.reset();
      _fadeController.forward();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Verification code sent successfully!', style: GoogleFonts.poppins(fontSize: 12)),
          backgroundColor: Colors.black87,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      final msg = e.toString().contains('400')
          ? 'Invalid address format. Please try again.'
          : 'Failed to send verification code. Please check connection.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg, style: GoogleFonts.poppins(fontSize: 12)), backgroundColor: Colors.black87),
      );
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please enter verification code', style: GoogleFonts.poppins(fontSize: 12)),
          backgroundColor: Colors.black87,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final input = _contactController.text.trim();
      final isPhone = _loginMethod == 'phone';
      final body = isPhone
          ? {'phone': input, 'otp': otp}
          : {'email': input, 'otp': otp};

      final res = await _api.dio.post('/storefront/auth/otp/verify', data: body);
      final token = res.data['access_token']?.toString() ?? '';

      if (token.isNotEmpty) {
        await TokenManager.saveToken(token);
        await ref.read(cartProvider.notifier).syncWithServerAfterLogin();
      }

      if (!mounted) return;
      setState(() => _isLoading = false);

      if (widget.redirectToCheckout) {
        // Replace login screen with checkout directly
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const CheckoutScreen()),
        );
      } else {
        Navigator.of(context).pop();
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Logged in successfully! 🎉', style: GoogleFonts.poppins(fontSize: 12)),
          backgroundColor: Colors.black87,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      final msg = e.toString().contains('400')
          ? 'Invalid or expired code. Please try again.'
          : 'Verification failed. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg, style: GoogleFonts.poppins(fontSize: 12)), backgroundColor: Colors.black87),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 600;

    return Scaffold(
      backgroundColor: const Color(0xFFFCF9FA), // Soft luxury off-white/rose canvas background
      body: Stack(
        children: [
          // Absolute Top-Left Back Button: Always stays at the corner of the physical screen
          Positioned(
            top: 24,
            left: 24,
            child: InkWell(
              onTap: () => Navigator.of(context).pop(),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x0A000000),
                      blurRadius: 10,
                      offset: Offset(0, 4),
                    )
                  ],
                ),
                child: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  size: 15,
                  color: Colors.black87,
                ),
              ),
            ),
          ),

          // Central Container
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 80),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: double.infinity,
                  constraints: const BoxConstraints(maxWidth: 500),
                  padding: EdgeInsets.all(isWide ? 40 : 24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: kBrandRoseBorder.withOpacity(0.5)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x08000000),
                        blurRadius: 20,
                        offset: Offset(0, 10),
                      )
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Center Logo
                      Center(
                        child: Image.asset(
                          'assets/logo.png',
                          height: 32,
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(height: 36),

                      // Sign In Header Title
                      Text(
                        _otpSent ? 'VERIFY ACCOUNT' : 'SIGN IN',
                        style: GoogleFonts.montserrat(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2.0,
                          color: Colors.black87,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _otpSent
                            ? 'Enter the 6-digit authentication code sent to ${_contactController.text}'
                            : 'Unlock your personalized scent journey',
                        style: GoogleFonts.poppins(
                          color: AppTheme.textMuted,
                          fontSize: 11.5,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),

                      if (!_otpSent) ...[
                        // Segmented tabs (Email / Mobile)
                        Container(
                          margin: const EdgeInsets.only(bottom: 28),
                          decoration: const BoxDecoration(
                            border: Border(
                              bottom: BorderSide(color: Color(0xFFF2F2F7), width: 1.5),
                            ),
                          ),
                          child: Row(
                            children: [
                              _buildTabButton('email', 'Email Address'),
                              _buildTabButton('phone', 'Mobile Number'),
                            ],
                          ),
                        ),

                        // Form input
                        Text(
                          _loginMethod == 'email' ? 'EMAIL IDENTIFICATION' : 'MOBILE VERIFICATION',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                            color: Colors.black54,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _contactController,
                          style: GoogleFonts.poppins(fontSize: 13.5, color: Colors.black87),
                          keyboardType: _loginMethod == 'email' ? TextInputType.emailAddress : TextInputType.phone,
                          decoration: InputDecoration(
                            hintText: _loginMethod == 'email' ? 'yourname@example.com' : '+91 99999 99999',
                            hintStyle: GoogleFonts.poppins(color: Colors.black26, fontSize: 13),
                            prefixIcon: Icon(
                              _loginMethod == 'email' ? Icons.mail_outline_rounded : Icons.phone_iphone_rounded,
                              size: 18,
                              color: kBrandRose,
                            ),
                            contentPadding: const EdgeInsets.symmetric(vertical: 16),
                            enabledBorder: const UnderlineInputBorder(
                              borderSide: BorderSide(color: Color(0xFFE5E5EA)),
                            ),
                            focusedBorder: const UnderlineInputBorder(
                              borderSide: BorderSide(color: kBrandRose, width: 1.5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Continue CTA
                        ElevatedButton(
                          onPressed: _isLoading ? null : _requestOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.black,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(28),
                            ),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : Text(
                                  'CONTINUE',
                                  style: GoogleFonts.montserrat(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                        ),
                        const SizedBox(height: 36),

                        // Social Sign In
                        Row(
                          children: [
                            const Expanded(child: Divider(color: Color(0xFFE5E5EA))),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                'OR CONNECT WITH',
                                style: GoogleFonts.montserrat(
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black38,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ),
                            const Expanded(child: Divider(color: Color(0xFFE5E5EA))),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(child: _buildSocialButton('GOOGLE', Icons.g_mobiledata)),
                            const SizedBox(width: 16),
                            Expanded(child: _buildSocialButton('APPLE', Icons.apple)),
                          ],
                        ),
                      ] else ...[
                        // OTP Verification Inputs
                        Text(
                          'ENTER 6-DIGIT CODE',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                            color: Colors.black54,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          style: GoogleFonts.montserrat(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 8,
                            color: Colors.black87,
                          ),
                          textAlign: TextAlign.center,
                          decoration: InputDecoration(
                            counterText: '',
                            hintText: '000000',
                            hintStyle: GoogleFonts.montserrat(color: Colors.black12, letterSpacing: 8),
                            contentPadding: const EdgeInsets.symmetric(vertical: 12),
                            enabledBorder: const UnderlineInputBorder(
                              borderSide: BorderSide(color: Color(0xFFE5E5EA)),
                            ),
                            focusedBorder: const UnderlineInputBorder(
                              borderSide: BorderSide(color: kBrandRose, width: 1.5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Verify OTP CTA
                        ElevatedButton(
                          onPressed: _isLoading ? null : _verifyOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kBrandRose,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(28),
                            ),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : Text(
                                  'VERIFY & CONTINUE',
                                  style: GoogleFonts.montserrat(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                        ),
                        const SizedBox(height: 24),

                        // Timer countdown and resend option
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _timerSeconds > 0
                                  ? 'Resend code in ${_timerSeconds}s'
                                  : 'Didn\'t receive code? ',
                              style: GoogleFonts.poppins(fontSize: 12, color: Colors.black54),
                            ),
                            if (_timerSeconds == 0)
                              InkWell(
                                onTap: () {
                                  _requestOtp();
                                },
                                child: Text(
                                  'Resend',
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    color: kBrandRose,
                                    fontWeight: FontWeight.bold,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 36),

                      // Secure lock badges footer
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _buildTrustBadge('100% ORIGINAL', Icons.verified_outlined),
                          const SizedBox(width: 24),
                          _buildTrustBadge('SECURE SYSTEM', Icons.lock_outline_rounded),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabButton(String method, String label) {
    final active = _loginMethod == method;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _loginMethod = method;
            _contactController.clear();
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: active ? kBrandRose : Colors.transparent,
                width: 2.0,
              ),
            ),
          ),
          child: Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 11,
              fontWeight: active ? FontWeight.bold : FontWeight.w500,
              color: active ? Colors.black87 : Colors.black38,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }

  Widget _buildSocialButton(String label, IconData icon) {
    return OutlinedButton(
      onPressed: () {},
      style: OutlinedButton.styleFrom(
        side: const BorderSide(color: Color(0xFFE5E5EA)),
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18, color: Colors.black87),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 9.5,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrustBadge(String label, IconData icon) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: const Color(0xFFD4AF37)),
        const SizedBox(width: 6),
        Text(
          label,
          style: GoogleFonts.montserrat(
            fontSize: 7.5,
            fontWeight: FontWeight.bold,
            color: Colors.black38,
            letterSpacing: 0.8,
          ),
        ),
      ],
    );
  }
}

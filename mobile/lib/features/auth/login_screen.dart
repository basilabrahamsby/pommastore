import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' show ImageFilter;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_responsive.dart';
import '../../core/api/api_client.dart';
import '../../core/api/token_manager.dart';
import '../cart/cart_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

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
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat(reverse: true);
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
    _animController.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    final input = _contactController.text.trim();
    if (input.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email or phone number')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final isPhone = RegExp(r'^[0-9]{10}$').hasMatch(input);
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP sent! Check your email / SMS.')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      final msg = e.toString().contains('400')
          ? 'Invalid identifier. Please try again.'
          : 'Failed to send OTP. Check your connection.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter OTP code')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final input = _contactController.text.trim();
      final isPhone = RegExp(r'^[0-9]{10}$').hasMatch(input);
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
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Logged in successfully! 🎉')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      final msg = e.toString().contains('400')
          ? 'Invalid or expired OTP. Please try again.'
          : 'Login failed. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // 1. Moving Fluid/Aurora Gradient Background
          AnimatedBuilder(
            animation: _animController,
            builder: (context, child) {
              final val = _animController.value;
              
              // Bubble movements
              final b1X = 0.1 + 0.15 * math.sin(val * 2 * math.pi);
              final b1Y = 0.2 + 0.12 * math.cos(val * 2 * math.pi);
              
              final b2X = 0.8 + 0.12 * math.cos(val * 2 * math.pi + math.pi);
              final b2Y = 0.7 + 0.18 * math.sin(val * 2 * math.pi + math.pi);
              
              final b3X = 0.5 + 0.2 * math.sin(val * 2 * math.pi / 2);
              final b3Y = 0.4 + 0.1 * math.cos(val * 2 * math.pi / 2);

              return Stack(
                children: [
                  // Base soft gradient
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFFFF8F8), Color(0xFFFAF2F4), Color(0xFFF0E5E9)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
                  
                  // Ambient Blob 1 (Rose Pink)
                  Align(
                    alignment: FractionalOffset(b1X, b1Y),
                    child: Container(
                      width: 320,
                      height: 320,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.primaryRose.withOpacity(0.24),
                      ),
                    ),
                  ),
                  
                  // Ambient Blob 2 (Creamy Gold)
                  Align(
                    alignment: FractionalOffset(b2X, b2Y),
                    child: Container(
                      width: 280,
                      height: 280,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFFF7E6D4), // Soft Gold Cream
                      ),
                    ),
                  ),
                  
                  // Ambient Blob 3 (Lavender / Mauve)
                  Align(
                    alignment: FractionalOffset(b3X, b3Y),
                    child: Container(
                      width: 260,
                      height: 260,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFE8D4F7).withOpacity(0.28),
                      ),
                    ),
                  ),
                  
                  // Massive blur layer to blend all blobs into fluid ambient lights
                  Positioned.fill(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 75.0, sigmaY: 75.0),
                      child: Container(color: Colors.transparent),
                    ),
                  ),
                ],
              );
            },
          ),
          
          // 2. Main Login Form Card with Glassmorphism overlay
          Positioned.fill(
            child: Container(
              color: Colors.white.withOpacity(0.92),
              child: SafeArea(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: R.pad(context, 24),
                      vertical: R.pad(context, 24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Custom Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.black87),
                              onPressed: () => Navigator.of(context).pop(),
                            ),
                            Image.asset('assets/logo.png', height: R.pad(context, 26), fit: BoxFit.contain),
                            const SizedBox(width: 48), // Spacer to balance back button
                          ],
                        ),
                        SizedBox(height: R.pad(context, 28)),
                        
                        Text(
                          _otpSent ? 'ENTER VERIFICATION' : 'WELCOME TO KOZMOCART',
                          style: GoogleFonts.montserrat(
                            fontSize: R.font(context, 15),
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2.0,
                            color: Colors.black87,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: R.pad(context, 8)),
                        Text(
                          _otpSent 
                            ? 'We\'ve sent an authentication code to ${_contactController.text}'
                            : 'Unlock your personalized scent journey',
                          style: GoogleFonts.poppins(
                            color: AppTheme.textMuted,
                            fontSize: R.font(context, 11),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: R.pad(context, 32)),
                        
                        if (!_otpSent) ...[
                          TextField(
                            controller: _contactController,
                            style: GoogleFonts.poppins(fontSize: R.font(context, 14)),
                            decoration: InputDecoration(
                              labelText: 'EMAIL OR PHONE NUMBER',
                              labelStyle: GoogleFonts.montserrat(
                                fontSize: R.font(context, 9),
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                              hintText: 'e.g. arun@gmail.com / 9946596018',
                              hintStyle: GoogleFonts.poppins(
                                fontSize: R.font(context, 12),
                                color: Colors.black26,
                              ),
                              fillColor: Colors.white.withOpacity(0.9),
                              filled: true,
                              enabledBorder: const OutlineInputBorder(
                                borderSide: BorderSide(color: Color(0xFFE5E5EA)),
                                borderRadius: BorderRadius.all(Radius.circular(12)),
                              ),
                              focusedBorder: const OutlineInputBorder(
                                borderSide: BorderSide(color: AppTheme.primaryRose, width: 1.5),
                                borderRadius: BorderRadius.all(Radius.circular(12)),
                              ),
                            ),
                          ),
                          SizedBox(height: R.pad(context, 24)),
                          ElevatedButton(
                            onPressed: _isLoading ? null : _requestOtp,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryRose,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                              padding: EdgeInsets.symmetric(vertical: R.pad(context, 14)),
                              elevation: 0,
                            ),
                            child: _isLoading 
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : Text(
                                  'REQUEST CODE',
                                  style: GoogleFonts.montserrat(
                                    fontSize: R.font(context, 11),
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                          ),
                        ] else ...[
                          TextField(
                            controller: _otpController,
                            style: GoogleFonts.poppins(fontSize: R.font(context, 14)),
                            decoration: InputDecoration(
                              labelText: 'VERIFICATION CODE',
                              labelStyle: GoogleFonts.montserrat(
                                fontSize: R.font(context, 9),
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                              hintText: '6-digit OTP',
                              hintStyle: GoogleFonts.poppins(
                                fontSize: R.font(context, 12),
                                color: Colors.black26,
                              ),
                              fillColor: Colors.white.withOpacity(0.9),
                              filled: true,
                              enabledBorder: const OutlineInputBorder(
                                borderSide: BorderSide(color: Color(0xFFE5E5EA)),
                                borderRadius: BorderRadius.all(Radius.circular(12)),
                              ),
                              focusedBorder: const OutlineInputBorder(
                                borderSide: BorderSide(color: AppTheme.primaryRose, width: 1.5),
                                borderRadius: BorderRadius.all(Radius.circular(12)),
                              ),
                            ),
                            keyboardType: TextInputType.number,
                          ),
                          SizedBox(height: R.pad(context, 24)),
                          ElevatedButton(
                            onPressed: _isLoading ? null : _verifyOtp,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryRose,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                              padding: EdgeInsets.symmetric(vertical: R.pad(context, 14)),
                              elevation: 0,
                            ),
                            child: _isLoading 
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : Text(
                                  'VERIFY & CONTINUE',
                                  style: GoogleFonts.montserrat(
                                    fontSize: R.font(context, 11),
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                          ),
                          SizedBox(height: R.pad(context, 16)),
                          Center(
                            child: _timerSeconds > 0
                              ? Text(
                                  'Resend code in ${_timerSeconds}s',
                                  style: GoogleFonts.poppins(
                                    color: AppTheme.textMuted,
                                    fontSize: R.font(context, 11),
                                  ),
                                )
                              : TextButton(
                                  onPressed: _requestOtp,
                                  child: Text(
                                    'RESEND CODE',
                                    style: GoogleFonts.montserrat(
                                      color: AppTheme.primaryRose,
                                      fontSize: R.font(context, 11),
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                ),
                          ),
                        ],
                        
                        const SizedBox(height: 32),
                        Row(
                          children: [
                            const Expanded(child: Divider(color: AppTheme.borderLight)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16.0),
                              child: Text(
                                'OR CONNECT WITH',
                                style: GoogleFonts.montserrat(
                                  fontSize: R.font(context, 8.5),
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.0,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                            ),
                            const Expanded(child: Divider(color: AppTheme.borderLight)),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () {},
                                style: OutlinedButton.styleFrom(
                                  padding: EdgeInsets.symmetric(vertical: R.pad(context, 12)),
                                  side: const BorderSide(color: Color(0xFFE5E5EA)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                  backgroundColor: Colors.white.withOpacity(0.6),
                                ),
                                child: Text(
                                  'GOOGLE',
                                  style: GoogleFonts.montserrat(
                                    fontSize: R.font(context, 9.5),
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () {},
                                style: OutlinedButton.styleFrom(
                                  padding: EdgeInsets.symmetric(vertical: R.pad(context, 12)),
                                  side: const BorderSide(color: Color(0xFFE5E5EA)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                  backgroundColor: Colors.white.withOpacity(0.6),
                                ),
                                child: Text(
                                  'APPLE',
                                  style: GoogleFonts.montserrat(
                                    fontSize: R.font(context, 9.5),
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

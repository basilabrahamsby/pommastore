import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _contactController = TextEditingController();
  final _otpController = TextEditingController();
  
  bool _otpSent = false;
  bool _isLoading = false;
  int _timerSeconds = 60;
  Timer? _countdownTimer;

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
    super.dispose();
  }

  Future<void> _requestOtp() async {
    if (_contactController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email or phone number')),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    // Simulate sending OTP request
    await Future.delayed(const Duration(milliseconds: 800));
    
    setState(() {
      _isLoading = false;
      _otpSent = true;
    });
    _startTimer();
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter OTP code')),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    // Simulate verifying OTP and logging in
    await Future.delayed(const Duration(milliseconds: 800));
    
    setState(() => _isLoading = false);
    if (mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Logged in successfully!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(color: Colors.black),
        title: Image.asset('assets/logo.png', height: 26, fit: BoxFit.contain),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Text(
                _otpSent ? 'ENTER VERIFICATION CODE' : 'WELCOME TO KOZMOCART',
                style: GoogleFonts.montserrat(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2.0,
                  color: Colors.black,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                _otpSent 
                  ? 'We have sent an authentication code to ${_contactController.text}'
                  : 'Enter your email or phone number to sign in',
                style: GoogleFonts.poppins(color: AppTheme.textMuted, fontSize: 12),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 36),
              if (!_otpSent) ...[
                TextField(
                  controller: _contactController,
                  style: GoogleFonts.poppins(fontSize: 14),
                  decoration: InputDecoration(
                    labelText: 'EMAIL OR PHONE NUMBER',
                    labelStyle: GoogleFonts.montserrat(fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                    hintText: 'e.g. arun@gmail.com / 9946596018',
                    hintStyle: GoogleFonts.poppins(fontSize: 12, color: Colors.black26),
                    fillColor: const Color(0xFFF9F9FB),
                    filled: true,
                    enabledBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: Color(0xFFE5E5EA)),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: AppTheme.primaryRose),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _requestOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _isLoading 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(
                        'REQUEST CODE',
                        style: GoogleFonts.montserrat(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                ),
              ] else ...[
                TextField(
                  controller: _otpController,
                  style: GoogleFonts.poppins(fontSize: 14),
                  decoration: InputDecoration(
                    labelText: 'VERIFICATION CODE',
                    labelStyle: GoogleFonts.montserrat(fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                    hintText: '6-digit OTP',
                    hintStyle: GoogleFonts.poppins(fontSize: 12, color: Colors.black26),
                    fillColor: const Color(0xFFF9F9FB),
                    filled: true,
                    enabledBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: Color(0xFFE5E5EA)),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: AppTheme.primaryRose),
                    ),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _verifyOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _isLoading 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(
                        'VERIFY & CONTINUE',
                        style: GoogleFonts.montserrat(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: _timerSeconds > 0
                    ? Text(
                        'Resend code in ${_timerSeconds}s',
                        style: GoogleFonts.poppins(color: AppTheme.textMuted, fontSize: 11),
                      )
                    : TextButton(
                        onPressed: _requestOtp,
                        child: Text(
                          'RESEND CODE',
                          style: GoogleFonts.montserrat(
                            color: AppTheme.primaryRose,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

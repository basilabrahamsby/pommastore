import 'dart:async';
import 'package:flutter/material.dart';
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
      appBar: AppBar(title: const Text('KOZMOCART')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Text(
                _otpSent ? 'ENTER VERIFICATION CODE' : 'WELCOME TO KOZMOCART',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                _otpSent 
                  ? 'We have sent an authentication code to ${_contactController.text}'
                  : 'Enter your email or phone number to sign in',
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 36),
              if (!_otpSent) ...[
                TextField(
                  controller: _contactController,
                  decoration: const InputDecoration(
                    labelText: 'EMAIL OR PHONE NUMBER',
                    hintText: 'e.g. arun@gmail.com / 9946596018',
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _requestOtp,
                  child: _isLoading 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                    : const Text('REQUEST CODE'),
                ),
              ] else ...[
                TextField(
                  controller: _otpController,
                  decoration: const InputDecoration(
                    labelText: 'VERIFICATION CODE',
                    hintText: '6-digit OTP',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _verifyOtp,
                  child: _isLoading 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                    : const Text('VERIFY & CONTINUE'),
                ),
                const SizedBox(height: 16),
                Center(
                  child: _timerSeconds > 0
                    ? Text(
                        'Resend code in ${_timerSeconds}s',
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                      )
                    : TextButton(
                        onPressed: _requestOtp,
                        child: const Text(
                          'RESEND CODE',
                          style: TextStyle(color: AppTheme.primaryGold, fontSize: 12, fontWeight: FontWeight.bold),
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

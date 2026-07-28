import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LogoLoader extends StatefulWidget {
  final double height;
  const LogoLoader({super.key, this.height = 75});

  @override
  State<LogoLoader> createState() => _LogoLoaderState();
}

class _LogoLoaderState extends State<LogoLoader> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pulseAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _pulseAnim = Tween<double>(begin: 0.94, end: 1.04).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );

    _fadeAnim = Tween<double>(begin: 0.65, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Ambient luxury glow container
          Stack(
            alignment: Alignment.center,
            children: [
              FadeTransition(
                opacity: _fadeAnim,
                child: Container(
                  width: widget.height * 2.2,
                  height: widget.height * 1.5,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(100),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFD2168D).withValues(alpha: 0.12),
                        blurRadius: 40,
                        spreadRadius: 10,
                      ),
                    ],
                  ),
                ),
              ),
              ScaleTransition(
                scale: _pulseAnim,
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: Image.asset(
                    'assets/logo.png',
                    height: widget.height,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return Text(
                        'POMMASTORE',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFFD2168D),
                          letterSpacing: 3.0,
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Sleek progress line
          SizedBox(
            width: 70,
            child: LinearProgressIndicator(
              minHeight: 2,
              borderRadius: BorderRadius.circular(2),
              backgroundColor: const Color(0xFFF2F2F7),
              color: const Color(0xFFD2168D),
            ),
          ),

          const SizedBox(height: 14),

          // Luxury Tagline
          FadeTransition(
            opacity: _fadeAnim,
            child: Text(
              'LUXURY FRAGRANCE HOUSE',
              style: GoogleFonts.montserrat(
                fontSize: 8.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 3.0,
                color: const Color(0xFF8E8E93),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

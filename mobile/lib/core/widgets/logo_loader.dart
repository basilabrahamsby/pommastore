import 'package:flutter/material.dart';

class LogoLoader extends StatefulWidget {
  final double height;
  const LogoLoader({super.key, this.height = 36});

  @override
  State<LogoLoader> createState() => _LogoLoaderState();
}

class _LogoLoaderState extends State<LogoLoader> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.35, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
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
        mainAxisSize: MainAxisSize.min,
        children: [
          FadeTransition(
            opacity: _animation,
            child: Image.asset(
              'assets/logo.png',
              height: widget.height,
              fit: BoxFit.contain,
            ),
          ),
          const SizedBox(height: 16),
          // Soft thin loading bar indicator for additional feedback
          SizedBox(
            width: 48,
            child: LinearProgressIndicator(
              minHeight: 1.5,
              backgroundColor: const Color(0xFFF2F2F7),
              color: const Color(0xFFD2168D),
            ),
          ),
        ],
      ),
    );
  }
}

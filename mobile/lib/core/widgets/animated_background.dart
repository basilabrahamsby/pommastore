import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// A dynamic animated gradient background featuring a rotating linear gradient canvas
/// and drifting luxury glowing ambient orbs.
class AnimatedBackground extends StatefulWidget {
  final Widget child;
  final bool enableFloatingOrbs;

  const AnimatedBackground({
    super.key,
    required this.child,
    this.enableFloatingOrbs = true,
  });

  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enableFloatingOrbs) {
      return Container(
        color: AppTheme.backgroundLight,
        child: widget.child,
      );
    }

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final progress = _controller.value;
        final angle = progress * math.pi * 2;
        
        final double dx1 = math.sin(angle) * 70;
        final double dy1 = math.cos(angle) * 55;
        final double dx2 = math.cos(angle) * 65;
        final double dy2 = math.sin(angle) * 80;
        final double pulseScale = 1.0 + (math.sin(angle) * 0.18);

        // Animated gradient alignments rotating smoothly
        final beginAlignment = Alignment(math.cos(angle), math.sin(angle));
        final endAlignment = Alignment(math.cos(angle + math.pi), math.sin(angle + math.pi));

        return Stack(
          children: [
            // ── 1. Dynamic Rotating Canvas Linear Gradient ──
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: beginAlignment,
                  end: endAlignment,
                  colors: const [
                    Color(0xFFFFF0F5), // Soft Rose
                    Color(0xFFFFF7ED), // Soft Gold
                    Color(0xFFF3E8FF), // Soft Lavender
                    Color(0xFFFAFAFC), // Luxury Canvas White
                  ],
                  stops: const [0.0, 0.35, 0.70, 1.0],
                ),
              ),
            ),

            // ── 2. Top-Right Drifting Brand Rose Glow Orb ──
            Positioned(
              top: -60 + dy1,
              right: -80 + dx1,
              child: Transform.scale(
                scale: pulseScale,
                child: Container(
                  width: 360,
                  height: 360,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppTheme.primaryRose.withValues(alpha: 0.32),
                        AppTheme.primaryRose.withValues(alpha: 0.08),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                  ),
                ),
              ),
            ),

            // ── 3. Top-Left Drifting Warm Gold Glow Orb ──
            Positioned(
              top: 140 - dy2,
              left: -90 + dx2,
              child: Transform.scale(
                scale: 1.15 - (pulseScale - 1.0),
                child: Container(
                  width: 380,
                  height: 380,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppTheme.accentGold.withValues(alpha: 0.35),
                        AppTheme.accentGold.withValues(alpha: 0.08),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.55, 1.0],
                    ),
                  ),
                ),
              ),
            ),

            // ── 4. Bottom-Right Drifting Electric Violet Accent Orb ──
            Positioned(
              bottom: 60 + dy1,
              right: -80 - dx2,
              child: Container(
                width: 340,
                height: 340,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFA855F7).withValues(alpha: 0.28),
                      const Color(0xFFA855F7).withValues(alpha: 0.06),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.55, 1.0],
                  ),
                ),
              ),
            ),

            // ── 5. Center-Bottom Soft Sunset Orange Glow ──
            Positioned(
              bottom: MediaQuery.of(context).size.height * 0.22 + (dy2 * 0.6),
              left: MediaQuery.of(context).size.width * 0.10 + (dx1 * 0.6),
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppTheme.discountOrange.withValues(alpha: 0.24),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // ── 6. Main Screen Content Layer ──
            widget.child,
          ],
        );
      },
    );
  }
}

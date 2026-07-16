import 'package:flutter/material.dart';

/// Breakpoint names for the app.
enum AppBreakpoint { xs, sm, md, lg, xl }

/// Centralized responsive utility.
/// Usage: `R.font(context, 14)` → scaled font size.
class R {
  // ── Screen geometry ────────────────────────────────────────────────────────

  /// Logical screen width.
  static double sp(BuildContext context) =>
      MediaQuery.of(context).size.width;

  /// Logical screen height.
  static double sh(BuildContext context) =>
      MediaQuery.of(context).size.height;

  // ── Breakpoint ─────────────────────────────────────────────────────────────

  static AppBreakpoint breakpoint(BuildContext context) {
    final w = sp(context);
    if (w < 360) return AppBreakpoint.xs;
    if (w < 480) return AppBreakpoint.sm;
    if (w < 768) return AppBreakpoint.md;
    if (w < 1024) return AppBreakpoint.lg;
    return AppBreakpoint.xl;
  }

  static bool isXs(BuildContext context) =>
      breakpoint(context) == AppBreakpoint.xs;
  static bool isMdUp(BuildContext context) => sp(context) >= 480;
  static bool isLgUp(BuildContext context) => sp(context) >= 768;
  static bool isXlUp(BuildContext context) => sp(context) >= 1024;

  // ── Scaling helpers ────────────────────────────────────────────────────────

  /// Returns a font size scaled to screen width.
  /// Pass the base size designed for a 390pt screen.
  static double font(BuildContext context, double base) {
    final w = sp(context);
    if (w < 360) return (base * 0.85).clamp(7.0, base);
    if (w < 480) return base;
    if (w < 768) return (base * 1.12).clamp(base, base + 6);
    return (base * 1.25).clamp(base, base + 10);
  }

  /// Returns a padding/spacing value scaled to screen width.
  static double pad(BuildContext context, double base) {
    final w = sp(context);
    if (w < 360) return (base * 0.75).clamp(4.0, base);
    if (w < 480) return base;
    if (w < 768) return base * 1.25;
    return base * 1.6;
  }

  /// Returns an icon size scaled to screen width.
  static double icon(BuildContext context, double base) {
    final w = sp(context);
    if (w < 360) return (base * 0.85).clamp(12.0, base);
    if (w < 480) return base;
    if (w < 768) return base * 1.1;
    return base * 1.25;
  }

  // ── Grid ───────────────────────────────────────────────────────────────────

  /// Returns the number of grid columns for product grids.
  static int cols(BuildContext context) {
    final w = sp(context);
    if (w < 768) return 2;
    if (w < 1024) return 3;
    return 4;
  }

  /// Returns child aspect ratio for product grid cards.
  static double cardAspect(BuildContext context) {
    final w = sp(context);
    if (w < 360) return 0.52;
    if (w < 480) return 0.56;
    if (w < 768) return 0.60;
    return 0.64;
  }

  // ── Hero Banner ────────────────────────────────────────────────────────────

  /// Returns the hero banner aspect ratio by screen size.
  static double heroAspect(BuildContext context) {
    return 0.82;
  }

  // ── Convenience ────────────────────────────────────────────────────────────

  /// Horizontal page padding.
  static EdgeInsets pagePad(BuildContext context) => EdgeInsets.symmetric(
        horizontal: pad(context, 16),
      );

  /// Symmetric padding.
  static EdgeInsets symPad(
          BuildContext context, double horiz, double vert) =>
      EdgeInsets.symmetric(
        horizontal: pad(context, horiz),
        vertical: pad(context, vert),
      );
  /// Constrains content width on large screens.
  /// Returns a BoxConstraints with max width.
  static BoxConstraints maxContent(BuildContext context) {
    final w = sp(context);
    if (w > 768) return const BoxConstraints(maxWidth: 600);
    return const BoxConstraints();
  }

  /// Picks a value based on the current breakpoint.
  static T val<T>(
    BuildContext context, {
    required T xs,
    required T sm,
    T? md,
    T? lg,
    T? xl,
  }) {
    switch (breakpoint(context)) {
      case AppBreakpoint.xs:
        return xs;
      case AppBreakpoint.sm:
        return sm;
      case AppBreakpoint.md:
        return md ?? sm;
      case AppBreakpoint.lg:
        return lg ?? md ?? sm;
      case AppBreakpoint.xl:
        return xl ?? lg ?? md ?? sm;
    }
  }
}

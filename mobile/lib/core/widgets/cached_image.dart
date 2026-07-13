import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class CachedImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final double opacity;
  final Alignment alignment;
  final Widget? placeholder;
  final Widget? errorWidget;

  const CachedImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.opacity = 1.0,
    this.alignment = Alignment.center,
    this.placeholder,
    this.errorWidget,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isEmpty) {
      return errorWidget ?? Container(color: Colors.grey.shade200);
    }

    // On Web, standard Image.network uses browser native caching
    if (kIsWeb) {
      return Image.network(
        imageUrl,
        width: width,
        height: height,
        fit: fit,
        alignment: alignment,
        opacity: AlwaysStoppedAnimation(opacity),
        errorBuilder: (context, error, stackTrace) =>
            errorWidget ?? Container(color: Colors.grey.shade200),
      );
    }

    // On mobile, CachedNetworkImage caches onto disk/SQLite for instant display
    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      alignment: alignment,
      memCacheWidth: width != null ? (width! * 2).toInt() : null,
      memCacheHeight: height != null ? (height! * 2).toInt() : null,
      errorWidget: (context, url, error) =>
          errorWidget ?? Container(color: Colors.grey.shade200),
    );
  }
}

class AutoCycleImage extends StatefulWidget {
  final List<String> imageUrls;
  final String id;
  final BoxFit fit;
  final Alignment alignment;

  const AutoCycleImage({
    super.key,
    required this.imageUrls,
    required this.id,
    this.fit = BoxFit.cover,
    this.alignment = Alignment.center,
  });

  @override
  State<AutoCycleImage> createState() => _AutoCycleImageState();
}

class _AutoCycleImageState extends State<AutoCycleImage> {
  int _currentIndex = 0;
  Timer? _timer;
  Timer? _staggerTimeout;

  @override
  void initState() {
    super.initState();
    _startCycling();
  }

  @override
  void dispose() {
    _staggerTimeout?.cancel();
    _timer?.cancel();
    super.dispose();
  }

  void _startCycling() {
    if (widget.imageUrls.length <= 1) return;

    int hash = 0;
    for (int i = 0; i < widget.id.length; i++) {
      hash = widget.id.codeUnitAt(i) + ((hash << 5) - hash);
    }
    final staggerDelayMs = (hash.abs() % 1500);

    _staggerTimeout = Timer(Duration(milliseconds: staggerDelayMs), () {
      if (!mounted) return;
      _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
        if (mounted) {
          setState(() {
            _currentIndex = (_currentIndex + 1) % widget.imageUrls.length;
          });
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.imageUrls.isEmpty) {
      return Container(
        color: const Color(0xFFF5F5F5),
        child: const Icon(Icons.image_not_supported, color: Colors.black12),
      );
    }

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 600),
      transitionBuilder: (child, animation) {
        return FadeTransition(opacity: animation, child: child);
      },
      child: CachedImage(
        key: ValueKey<int>(_currentIndex),
        imageUrl: widget.imageUrls[_currentIndex],
        fit: widget.fit,
        alignment: widget.alignment,
        errorWidget: Container(
          color: const Color(0xFFF5F5F5),
          child: const Icon(Icons.image_not_supported, color: Colors.black12),
        ),
      ),
    );
  }
}

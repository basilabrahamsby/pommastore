import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import 'cached_image.dart';
import '../../features/catalog/product_detail_screen.dart';

class ProductCard extends StatefulWidget {
  final Map<String, dynamic> product;

  const ProductCard({
    super.key,
    required this.product,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  int _currentImageIndex = 0;
  Timer? _timer;
  Timer? _staggerTimeout;

  @override
  void initState() {
    super.initState();
    _startImageCycling();
  }

  @override
  void dispose() {
    _staggerTimeout?.cancel();
    _timer?.cancel();
    super.dispose();
  }

  void _startImageCycling() {
    final images = widget.product['images'] as List? ?? [];
    if (images.length <= 1) return;

    final id = widget.product['id']?.toString() ?? '';
    int hash = 0;
    for (int i = 0; i < id.length; i++) {
      hash = id.codeUnitAt(i) + ((hash << 5) - hash);
    }
    final staggerDelayMs = (hash.abs() % 1500);

    _staggerTimeout = Timer(Duration(milliseconds: staggerDelayMs), () {
      if (!mounted) return;
      _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
        if (mounted) {
          setState(() {
            _currentImageIndex = (_currentImageIndex + 1) % images.length;
          });
        }
      });
    });
  }

  String _getMediaUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    String cleanPath = path.replaceAll(RegExp(r'^/kozmocart'), '');
    if (cleanPath.startsWith('http')) return cleanPath;
    if (cleanPath.startsWith('data:')) return cleanPath;
    cleanPath = cleanPath.startsWith('/') ? cleanPath : '/$cleanPath';
    return 'https://kozmocart.com$cleanPath';
  }

  @override
  Widget build(BuildContext context) {
    final id = widget.product['id']?.toString() ?? '';
    final name = widget.product['name']?.toString() ?? '';
    final brand = widget.product['brand_name']?.toString() ?? '';
    final images = widget.product['images'] as List? ?? [];
    final resolvedImg = images.isNotEmpty ? _getMediaUrl(images[_currentImageIndex]?.toString()) : '';
    final variants = widget.product['variants'] as List? ?? [];
    final price = variants.isNotEmpty ? (variants[0]['selling_price'] ?? 0.0) : 0.0;
    final oldPrice = variants.isNotEmpty ? variants[0]['compare_at_price'] : null;

    // Deterministic rating based on ID hash
    int hash = 0;
    for (int i = 0; i < id.length; i++) {
      hash = id.codeUnitAt(i) + ((hash << 5) - hash);
    }
    final rating = (4.0 + (hash.abs() % 10) / 10).toStringAsFixed(1);
    final reviews = (5 + (hash.abs() % 95)).toString();

    // Discount percentage
    final discountPercentage = (oldPrice != null && oldPrice > price)
        ? ((oldPrice - price) / oldPrice * 100).round()
        : 0;

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(product: widget.product),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Product Image
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 600),
                      transitionBuilder: (child, animation) {
                        return FadeTransition(opacity: animation, child: child);
                      },
                      child: CachedImage(
                        key: ValueKey<int>(_currentImageIndex),
                        imageUrl: resolvedImg,
                        fit: BoxFit.cover,
                        errorWidget: Container(
                          color: const Color(0xFFF5F5F5),
                          child: const Icon(Icons.image_not_supported, color: Colors.black12),
                        ),
                      ),
                    ),
                    // Star Rating Overlay
                    Positioned(
                      bottom: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star, color: Color(0xFFF1C40F), size: 10),
                            const SizedBox(width: 2),
                            Text(
                              '$rating  $reviews',
                              style: GoogleFonts.montserrat(
                                fontSize: 8,
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Product Name (First)
            Text(
              name.toUpperCase(),
              style: GoogleFonts.montserrat(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Colors.black,
                letterSpacing: 0.5,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            // Brand Name (Second)
            Text(
              brand.toUpperCase(),
              style: GoogleFonts.poppins(
                fontSize: 8,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF8E8E93),
                letterSpacing: 0.3,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            // Price details
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  '₹$price',
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryRose,
                  ),
                ),
                if (oldPrice != null && oldPrice > price) ...[
                  const SizedBox(width: 5),
                  Text(
                    '₹$oldPrice',
                    style: GoogleFonts.montserrat(
                      fontSize: 8,
                      color: Colors.black38,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '($discountPercentage% OFF)',
                    style: GoogleFonts.montserrat(
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryRose,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

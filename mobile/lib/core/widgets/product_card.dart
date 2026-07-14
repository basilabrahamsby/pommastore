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

  // Local state for interactive controls matching catalog cards
  bool _isWishlisted = false;
  int _cartQty = 0;

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
    final rawImages = widget.product['images'] as List? ?? 
        (widget.product['gallery_images'] as List? ?? []);
    if (rawImages.length <= 1) return;

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
            _currentImageIndex = (_currentImageIndex + 1) % rawImages.length;
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

  List<String> _getScentNotes(Map<String, dynamic> product) {
    final catName = (product['category_name'] ?? product['category'] ?? '').toString();
    final desc = (product['description'] ?? product['short_description'] ?? '').toString().toLowerCase();
    
    final List<String> families = [];
    if (catName.toLowerCase().contains('floral') || desc.contains('floral')) families.add('Floral');
    if (catName.toLowerCase().contains('woody') || desc.contains('woody')) families.add('Woody');
    if (catName.toLowerCase().contains('oriental') || desc.contains('oriental') || desc.contains('oudh')) families.add('Oriental');
    if (catName.toLowerCase().contains('fresh') || desc.contains('fresh')) families.add('Fresh');
    if (catName.toLowerCase().contains('citrus') || desc.contains('citrus')) families.add('Citrus');
    
    if (families.isEmpty) {
      final rawNotes = product['scent_notes'];
      if (rawNotes is Map) {
        rawNotes.forEach((key, val) {
          if (val is List && val.isNotEmpty) {
            families.add(val[0].toString());
          }
        });
      } else if (rawNotes is List && rawNotes.isNotEmpty) {
        families.add(rawNotes[0].toString());
      }
    }
    
    if (families.isEmpty) {
      families.add('Fresh');
    }
    return families;
  }

  @override
  Widget build(BuildContext context) {
    final id = widget.product['id']?.toString() ?? '';
    final name = widget.product['name']?.toString() ?? '';
    final brand = (widget.product['brand_name'] ?? widget.product['brand'] ?? '').toString();
    
    final List<dynamic> rawImages = widget.product['images'] as List<dynamic>? ??
        (widget.product['gallery_images'] as List<dynamic>? ?? [widget.product['image_url'] ?? '']);
    final List<String> images = rawImages.map((e) => _getMediaUrl(e?.toString())).toList();
    final resolvedImg = images.isNotEmpty ? images[_currentImageIndex] : '';

    final variants = widget.product['variants'] as List? ?? [];
    double price = 0.0;
    double? oldPrice;
    
    if (variants.isNotEmpty) {
      price = double.tryParse(variants[0]['selling_price']?.toString() ?? '0.0') ?? 0.0;
      final cp = variants[0]['compare_at_price'];
      oldPrice = cp != null ? double.tryParse(cp.toString()) : null;
    } else {
      price = double.tryParse(widget.product['price']?.toString() ?? '0.0') ?? 0.0;
      final mrpVal = widget.product['mrp'];
      oldPrice = mrpVal != null ? double.tryParse(mrpVal.toString()) : null;
    }

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

    final notesList = _getScentNotes(widget.product);

    // Build the detailProduct payload for detail navigation
    final detailProduct = {
      'id': id,
      'slug': widget.product['slug']?.toString() ?? id,
      'brand_id': widget.product['brand_id']?.toString() ?? '',
      'category_id': widget.product['category_id']?.toString() ?? '',
      'name': name,
      'brand_name': brand,
      'price': price,
      'mrp': oldPrice ?? price,
      'image_url': resolvedImg,
      'description': widget.product['description']?.toString() ?? '',
      'short_description': widget.product['short_description']?.toString() ?? '',
      'full_description': widget.product['full_description']?.toString() ?? '',
      'scent_notes': notesList,
      'rating': double.tryParse(rating) ?? 4.5,
      'reviews': int.tryParse(reviews) ?? 20,
      'images': images,
    };

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(product: detailProduct),
          ),
        );
      },
      child: Card(
        elevation: 0,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(6),
          side: const BorderSide(color: AppTheme.borderLight),
        ),
        color: Colors.white,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Product Image & Badge overlays
            Expanded(
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
                  // Top-Left Discount Badge
                  if (discountPercentage > 0)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        color: AppTheme.primaryRose,
                        child: Text(
                          '$discountPercentage% OFF',
                          style: GoogleFonts.montserrat(
                            color: Colors.white,
                            fontSize: 7.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  // Top-Right Wishlist Heart Overlay
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _isWishlisted = !_isWishlisted;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              _isWishlisted ? 'Added to Wishlist' : 'Removed from Wishlist',
                            ),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.85),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Icon(
                          _isWishlisted ? Icons.favorite : Icons.favorite_border,
                          color: _isWishlisted ? AppTheme.primaryRose : Colors.black54,
                          size: 14,
                        ),
                      ),
                    ),
                  ),
                  // Star Rating Overlay
                  Positioned(
                    bottom: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, color: AppTheme.ratingAmber, size: 9),
                          const SizedBox(width: 2),
                          Text(
                            '$rating ($reviews)',
                            style: GoogleFonts.montserrat(
                              fontSize: 7.5,
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
            
            // Text details section
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Brand (Montserrat bold, all-caps)
                  Text(
                    brand.toUpperCase(),
                    style: GoogleFonts.montserrat(
                      fontSize: 8,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMuted,
                      letterSpacing: 0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  // Product Name (Montserrat bold)
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
                  // Scent Notes Family
                  Text(
                    notesList.join(' · ').toUpperCase(),
                    style: GoogleFonts.montserrat(
                      fontSize: 7.5,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primaryRose,
                      letterSpacing: 0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  // Pricing Row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        '₹${price.toInt()}',
                        style: GoogleFonts.montserrat(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                      if (oldPrice != null && oldPrice > price) ...[
                        const SizedBox(width: 4),
                        Text(
                          '₹${oldPrice.toInt()}',
                          style: GoogleFonts.montserrat(
                            fontSize: 8,
                            color: Colors.black38,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  
                  // Add to Bag & Buy Now steppers
                  SizedBox(
                    height: 34,
                    child: _cartQty > 0
                        ? Row(
                            children: [
                              Expanded(
                                child: Container(
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.black, width: 1),
                                    borderRadius: BorderRadius.circular(4),
                                    color: Colors.white,
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      IconButton(
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        icon: const Icon(Icons.remove, size: 12, color: Colors.black),
                                        onPressed: () {
                                          setState(() {
                                            _cartQty--;
                                          });
                                        },
                                      ),
                                      Text(
                                        '$_cartQty',
                                        style: GoogleFonts.poppins(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.black,
                                        ),
                                      ),
                                      IconButton(
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        icon: const Icon(Icons.add, size: 12, color: Colors.black),
                                        onPressed: () {
                                          setState(() {
                                            _cartQty++;
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => ProductDetailScreen(product: detailProduct),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryRose,
                                      borderRadius: BorderRadius.circular(4),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppTheme.primaryRose.withValues(alpha: 0.3),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        )
                                      ],
                                    ),
                                    child: Text(
                                      'BUY NOW',
                                      style: GoogleFonts.poppins(
                                        color: Colors.white,
                                        fontSize: 7.5,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          )
                        : Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _cartQty = 1;
                                    });
                                  },
                                  child: Container(
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.black, width: 1),
                                      borderRadius: BorderRadius.circular(4),
                                      color: Colors.white,
                                    ),
                                    child: Text(
                                      'ADD TO BAG',
                                      style: GoogleFonts.poppins(
                                        color: Colors.black,
                                        fontSize: 7.5,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => ProductDetailScreen(product: detailProduct),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryRose,
                                      borderRadius: BorderRadius.circular(4),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppTheme.primaryRose.withValues(alpha: 0.3),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        )
                                      ],
                                    ),
                                    child: Text(
                                      'BUY NOW',
                                      style: GoogleFonts.poppins(
                                        color: Colors.white,
                                        fontSize: 7.5,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../theme/app_responsive.dart';
import 'cached_image.dart';
import '../../features/catalog/product_detail_screen.dart';
import '../../features/cart/cart_provider.dart';
import '../../features/wishlist/wishlist_provider.dart';

class ProductCard extends ConsumerStatefulWidget {
  final Map<String, dynamic> product;

  const ProductCard({
    super.key,
    required this.product,
  });

  @override
  ConsumerState<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends ConsumerState<ProductCard> {
  int _currentImageIndex = 0;
  Timer? _timer;
  Timer? _staggerTimeout;

  // Local state for interactive controls
  bool _isWishlisted = false;

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
    String cleanPath = path.replaceAll(RegExp(r'^/pommastore'), '');
    if (cleanPath.startsWith('http')) return cleanPath;
    if (cleanPath.startsWith('data:')) return cleanPath;
    cleanPath = cleanPath.startsWith('/') ? cleanPath : '/$cleanPath';
    return 'https://pommastore.com$cleanPath';
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
    final wishlist = ref.watch(wishlistProvider);
    final id = widget.product['id']?.toString() ?? '';
    final isWishlisted = wishlist.any((item) => (item['id']?.toString() ?? '') == id);
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
                    duration: const Duration(milliseconds: 900),
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
                      top: R.pad(context, 8),
                      left: R.pad(context, 8),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: R.pad(context, 6),
                          vertical: R.pad(context, 3),
                        ),
                        color: AppTheme.primaryRose,
                        child: Text(
                          '$discountPercentage% OFF',
                          style: GoogleFonts.montserrat(
                            color: Colors.white,
                            fontSize: R.font(context, 7.5),
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  // Top-Right Wishlist Heart Overlay
                  Positioned(
                    top: R.pad(context, 8),
                    right: R.pad(context, 8),
                    child: GestureDetector(
                      onTap: () {
                        ref.read(wishlistProvider.notifier).toggleWishlist(detailProduct);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              !isWishlisted ? 'Added to Wishlist' : 'Removed from Wishlist',
                            ),
                            duration: const Duration(seconds: 1),
                          ),
                        );
                      },
                      child: Container(
                        padding: EdgeInsets.all(R.pad(context, 5)),
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
                          isWishlisted ? Icons.favorite : Icons.favorite_border,
                          color: isWishlisted ? AppTheme.primaryRose : Colors.black54,
                          size: R.icon(context, 14),
                        ),
                      ),
                    ),
                  ),
                  // Star Rating Overlay
                  Positioned(
                    bottom: R.pad(context, 8),
                    left: R.pad(context, 8),
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: R.pad(context, 5),
                        vertical: R.pad(context, 2.5),
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.star, color: AppTheme.ratingAmber, size: R.icon(context, 9)),
                          SizedBox(width: R.pad(context, 2)),
                          Text(
                            '$rating ($reviews)',
                            style: GoogleFonts.montserrat(
                              fontSize: R.font(context, 7.5),
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
              padding: EdgeInsets.all(R.pad(context, 8)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Brand (Montserrat bold, all-caps)
                  Text(
                    brand.toUpperCase(),
                    style: GoogleFonts.montserrat(
                      fontSize: R.font(context, 8),
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMuted,
                      letterSpacing: 0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: R.pad(context, 2)),
                  // Product Name (Montserrat bold)
                  Text(
                    name.toUpperCase(),
                    style: GoogleFonts.montserrat(
                      fontSize: R.font(context, 10),
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                      letterSpacing: 0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: R.pad(context, 2)),
                  // Scent Notes Family
                  Text(
                    notesList.join(' · ').toUpperCase(),
                    style: GoogleFonts.montserrat(
                      fontSize: R.font(context, 7.5),
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primaryRose,
                      letterSpacing: 0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: R.pad(context, 6)),
                  // Pricing Row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        '\u20B9${price.toInt()}',
                        style: GoogleFonts.montserrat(
                          fontSize: R.font(context, 11),
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                          textStyle: const TextStyle(
                            fontFamilyFallback: ['Roboto', 'sans-serif'],
                          ),
                        ),
                      ),
                      if (oldPrice != null && oldPrice > price) ...[
                        SizedBox(width: R.pad(context, 4)),
                        Text(
                          '\u20B9${oldPrice.toInt()}',
                          style: GoogleFonts.montserrat(
                            fontSize: R.font(context, 8),
                            color: Colors.black38,
                            decoration: TextDecoration.lineThrough,
                            decorationColor: Colors.black38,
                            textStyle: const TextStyle(
                              fontFamilyFallback: ['Roboto', 'sans-serif'],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  SizedBox(height: R.pad(context, 8)),
                                     // Add to Bag & Buy Now steppers
                  Builder(builder: (context) {
                    // Compute variant ID for cart lookup
                    final vId = variants.isNotEmpty
                        ? variants[0]['id']?.toString() ?? id
                        : id;
                    final cartItems = ref.watch(cartProvider);
                    final cartQty = cartItems
                        .where((i) => i.id == vId)
                        .fold(0, (sum, i) => sum + i.quantity);
                    return SizedBox(
                      height: R.val(context, xs: 30.0, sm: 34.0, md: 38.0, lg: 42.0),
                      child: cartQty > 0
                          ? Row(
                              children: [
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.black26, width: 1.0),
                                      borderRadius: BorderRadius.circular(4),
                                      color: const Color(0xFFF9F9FB),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        InkWell(
                                          onTap: () {
                                            ref.read(cartProvider.notifier).updateQuantity(vId, cartQty - 1);
                                          },
                                          borderRadius: const BorderRadius.only(
                                            topLeft: Radius.circular(3),
                                            bottomLeft: Radius.circular(3),
                                          ),
                                          child: Container(
                                            width: 28,
                                            height: double.infinity,
                                            alignment: Alignment.center,
                                            child: const Icon(Icons.remove, size: 12, color: Colors.black87),
                                          ),
                                        ),
                                        Text(
                                          '$cartQty',
                                          style: GoogleFonts.montserrat(
                                            fontSize: R.font(context, 10.5),
                                            fontWeight: FontWeight.w700,
                                            color: Colors.black87,
                                          ),
                                        ),
                                        InkWell(
                                          onTap: () {
                                            ref.read(cartProvider.notifier).updateQuantity(vId, cartQty + 1);
                                          },
                                          borderRadius: const BorderRadius.only(
                                            topRight: Radius.circular(3),
                                            bottomRight: Radius.circular(3),
                                          ),
                                          child: Container(
                                            width: 28,
                                            height: double.infinity,
                                            alignment: Alignment.center,
                                            child: const Icon(Icons.add, size: 12, color: Colors.black87),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => context.go('/bag'),
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
                                          fontSize: R.font(context, 7.5),
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
                                      final variantName = variants.isNotEmpty
                                          ? (variants[0]['name'] ?? '').toString()
                                          : '';
                                      final loyaltyPts = int.tryParse(
                                              (variants.isNotEmpty
                                                      ? variants[0]['loyalty_points']
                                                      : widget.product['loyalty_points'])
                                                  ?.toString() ?? '0') ??
                                          0;
                                      print('ProductCard: ADD TO BAG tapped! Name: $name, vId: $vId, Price: $price, Image: $resolvedImg');
                                      ref.read(cartProvider.notifier).addItem(
                                            id: vId,
                                            name: name,
                                            price: price,
                                            imageUrl: resolvedImg,
                                            variantName: variantName,
                                            loyaltyPoints: loyaltyPts,
                                            slug: widget.product['slug']?.toString() ?? id,
                                          );
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text('$name added to bag!'),
                                          duration: const Duration(seconds: 1),
                                        ),
                                      );
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
                                          fontSize: R.font(context, 7.5),
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
                                          fontSize: R.font(context, 7.5),
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                    );
                  }),

                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

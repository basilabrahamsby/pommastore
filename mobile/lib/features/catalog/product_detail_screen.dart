import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';
import '../../core/widgets/cached_image.dart';
import '../../core/widgets/product_card.dart';

class ProductDetailScreen extends StatefulWidget {
  final Map<String, dynamic> product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final _pincodeController = TextEditingController();
  final ApiClient _apiClient = ApiClient();
  bool _isCheckingPincode = false;
  String? _pincodeStatus;
  double? _deliveryCharge;
  int _selectedImageIndex = 0;

  // Recommendations & Enriched Product States (Next.js alignment)
  Map<String, dynamic>? _enrichedProduct;
  bool _isLoadingProduct = true;
  List<dynamic> _sameCategoryProducts = [];
  List<dynamic> _sameBrandProducts = [];
  List<dynamic> _samePriceProducts = [];

  @override
  void initState() {
    super.initState();
    _loadProductDetailsAndRecommendations();
  }

  @override
  void dispose() {
    _pincodeController.dispose();
    super.dispose();
  }

  String _getMediaUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    String cleanPath = path.replaceAll(RegExp(r'^/kozmocart'), '');
    if (cleanPath.startsWith('http')) return cleanPath;
    if (cleanPath.startsWith('data:')) return cleanPath;
    cleanPath = cleanPath.startsWith('/') ? cleanPath : '/$cleanPath';
    return 'https://kozmocart.com$cleanPath';
  }

  Future<void> _loadProductDetailsAndRecommendations() async {
    setState(() {
      _isLoadingProduct = true;
    });
    try {
      final slug = widget.product['slug'] ?? widget.product['id']?.toString() ?? '';
      
      // 1. Fetch full product details
      final prodRes = await _apiClient.dio.get('/storefront/products/$slug');
      if (prodRes.statusCode == 200) {
        final prod = prodRes.data as Map<String, dynamic>;
        
        // 2. Fetch all products for client-side recommendations
        final allRes = await _apiClient.dio.get('/storefront/products', queryParameters: {
          'limit': 100,
        });

        if (allRes.statusCode == 200) {
          final allProducts = allRes.data as List? ?? [];
          final String currentId = prod['id']?.toString() ?? '';
          final String currentBrandId = prod['brand_id']?.toString() ?? '';
          final String currentCategoryId = prod['category_id']?.toString() ?? '';
          
          final variants = prod['variants'] as List? ?? [];
          final double currentPrice = variants.isNotEmpty 
              ? double.tryParse(variants[0]['selling_price']?.toString() ?? '0.0') ?? 0.0
              : 0.0;

          // Filter out active product
          final filteredList = allProducts.where((p) => p['id']?.toString() != currentId).toList();

          // 1. Same Brand Products
          List<dynamic> sameBrand = [];
          if (currentBrandId.isNotEmpty) {
            sameBrand = filteredList.where((p) => p['brand_id']?.toString() == currentBrandId).toList();
          }

          // 2. Same Category Products
          List<dynamic> sameCategory = [];
          if (currentCategoryId.isNotEmpty) {
            sameCategory = filteredList.where((p) => p['category_id']?.toString() == currentCategoryId).toList();
          }

          // 3. Same Price Level Items (closest in price)
          final List<dynamic> samePrice = List.from(filteredList);
          samePrice.sort((a, b) {
            final av = a['variants'] as List? ?? [];
            final bv = b['variants'] as List? ?? [];
            final ap = av.isNotEmpty ? (av[0]['selling_price'] ?? 0.0) : 0.0;
            final bp = bv.isNotEmpty ? (bv[0]['selling_price'] ?? 0.0) : 0.0;
            final diffA = (ap - currentPrice).abs();
            final diffB = (bp - currentPrice).abs();
            return diffA.compareTo(diffB);
          });

          setState(() {
            _enrichedProduct = prod;
            _sameBrandProducts = sameBrand.take(4).toList();
            _sameCategoryProducts = sameCategory.take(4).toList();
            _samePriceProducts = samePrice.take(4).toList();
            _isLoadingProduct = false;
          });
          return;
        }
      }
      
      // Fallback if full details fail
      setState(() {
        _enrichedProduct = widget.product;
        _isLoadingProduct = false;
      });
    } catch (_) {
      setState(() {
        _enrichedProduct = widget.product;
        _isLoadingProduct = false;
      });
    }
  }

  Future<void> _checkPincode() async {
    final pin = _pincodeController.text.trim();
    if (pin.isEmpty || pin.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 6-digit pincode')),
      );
      return;
    }

    setState(() {
      _isCheckingPincode = true;
      _pincodeStatus = null;
      _deliveryCharge = null;
    });

    try {
      final res = await _apiClient.dio.get('/storefront/shipping/verify-pincode', queryParameters: {
        'pincode': pin,
      });

      if (res.statusCode == 200) {
        final data = res.data;
        setState(() {
          if (data['serviceable'] == true) {
            _pincodeStatus = 'Delivering to $pin • COD Available';
            _deliveryCharge = double.tryParse(data['delivery_charge']?.toString() ?? '150');
          } else {
            _pincodeStatus = 'Sorry, service is not available at $pin';
          }
        });
      }
    } catch (e) {
      setState(() {
        _pincodeStatus = 'Pincode validation failed. Standard shipping applies.';
        _deliveryCharge = 150.0;
      });
    } finally {
      setState(() => _isCheckingPincode = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeProd = _enrichedProduct ?? widget.product;

    final rawImages = activeProd['images'];
    final List<dynamic> rawImagesList = rawImages is List ? rawImages : [activeProd['image_url'] ?? ''];
    final List<String> images = rawImagesList.map((e) => _getMediaUrl(e?.toString())).toList();
    
    final name = activeProd['name'] ?? 'Luxury Fragrance';
    final price = activeProd['price'] ?? 999;
    List<dynamic> notes = ['Saffron', 'Amberwood', 'Fir Resin', 'Cedar'];
    final rawNotes = activeProd['scent_notes'];
    if (rawNotes is Map) {
      final List<dynamic> extracted = [];
      rawNotes.forEach((key, val) {
        if (val is List) {
          extracted.addAll(val);
        }
      });
      if (extracted.isNotEmpty) {
        notes = extracted;
      }
    } else if (rawNotes is List) {
      notes = rawNotes;
    }

    final shortDescription = activeProd['short_description']?.toString().isNotEmpty == true
        ? activeProd['short_description']?.toString()
        : 'An immersive sensory journey crafted by world-class perfumers. This signature masterpiece balances rare raw extracts with cutting-edge molecular engineering, producing a timeless scent trail that adapts dynamically to your skin chemistry. Designed for connoisseurs of authentic luxury.';

    final fullDescription = activeProd['full_description']?.toString() ?? '';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(color: Colors.black),
        centerTitle: true,
        title: Image.asset('assets/logo.png', height: 26, fit: BoxFit.contain),
      ),
      body: _isLoadingProduct
          ? const Center(
              child: CircularProgressIndicator(
                color: AppTheme.primaryRose,
              ),
            )
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Interactive Horizontal Zoom Gallery
                  SizedBox(
                    height: 320,
                    child: Stack(
                      children: [
                        PageView.builder(
                          itemCount: images.length,
                          onPageChanged: (index) {
                            setState(() {
                              _selectedImageIndex = index;
                            });
                          },
                          itemBuilder: (context, index) {
                            return InteractiveViewer(
                              panEnabled: true,
                              minScale: 1.0,
                              maxScale: 3.0,
                              child: Center(
                                child: CachedImage(
                                  imageUrl: images[index],
                                  fit: BoxFit.contain,
                                ),
                              ),
                            );
                          },
                        ),
                        if (images.length > 1)
                          Positioned(
                            bottom: 16,
                            left: 0,
                            right: 0,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(images.length, (index) {
                                return Container(
                                  width: 6,
                                  height: 6,
                                  margin: const EdgeInsets.symmetric(horizontal: 4),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: _selectedImageIndex == index
                                        ? AppTheme.primaryRose
                                        : Colors.black26,
                                  ),
                                );
                              }),
                            ),
                          ),
                      ],
                    ),
                  ),
                  
                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Product Headers
                        Text(
                          name.toUpperCase(),
                          style: GoogleFonts.montserrat(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '₹${price.toString()}',
                          style: GoogleFonts.montserrat(
                            color: AppTheme.primaryRose,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 18),
                        
                        // Short Description
                        Text(
                          'DESCRIPTION',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          shortDescription!,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            height: 1.6,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Collapsible Creation Narrative Accordion
                        if (fullDescription.isNotEmpty)
                          CreationNarrativeAccordion(fullDescription: fullDescription),

                        const SizedBox(height: 20),

                        // Scent Notes Chips
                        Text(
                          'FRAGRANCE FAMILY NOTES',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: notes.map((note) {
                            return Chip(
                              label: Text(
                                note.toString().toUpperCase(),
                                style: GoogleFonts.poppins(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              backgroundColor: const Color(0xFFF9F9F9),
                              side: const BorderSide(color: Color(0xFFE5E5EA)),
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),

                        // Delhivery Pincode Checker Widget
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9F9FB),
                            border: Border.all(color: const Color(0xFFE5E5EA)),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '🚚 CHECK DELIVERY DETAILS',
                                style: GoogleFonts.montserrat(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.0,
                                  color: AppTheme.primaryRose,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: SizedBox(
                                      height: 42,
                                      child: TextField(
                                        controller: _pincodeController,
                                        decoration: InputDecoration(
                                          labelText: 'PINCODE',
                                          fillColor: Colors.white,
                                          filled: true,
                                          labelStyle: GoogleFonts.montserrat(fontSize: 9, fontWeight: FontWeight.bold),
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          enabledBorder: const OutlineInputBorder(
                                            borderSide: BorderSide(color: Color(0xFFE5E5EA)),
                                          ),
                                          focusedBorder: const OutlineInputBorder(
                                            borderSide: BorderSide(color: AppTheme.primaryRose),
                                          ),
                                        ),
                                        keyboardType: TextInputType.number,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  SizedBox(
                                    height: 42,
                                    child: ElevatedButton(
                                      onPressed: _isCheckingPincode ? null : _checkPincode,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.black,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 16),
                                        shape: const RoundedRectangleBorder(
                                          borderRadius: BorderRadius.zero,
                                        ),
                                      ),
                                      child: _isCheckingPincode
                                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5))
                                          : Text(
                                              'CHECK',
                                              style: GoogleFonts.montserrat(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                    ),
                                  ),
                                ],
                              ),
                              if (_pincodeStatus != null) ...[
                                const SizedBox(height: 12),
                                Text(
                                  _pincodeStatus!,
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    color: _pincodeStatus!.contains('Sorry') ? Colors.red : Colors.green,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                              if (_deliveryCharge != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Shipping Charge: ₹${_deliveryCharge!.toInt()}',
                                  style: GoogleFonts.poppins(fontSize: 11, color: Colors.black87, fontWeight: FontWeight.bold),
                                ),
                              ]
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 30),
                        
                        // Action buttons
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Added to Shopping Bag')),
                                  );
                                },
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.black),
                                  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                                child: Text(
                                  'ADD TO BAG',
                                  style: GoogleFonts.montserrat(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Proceeding to Checkout')),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryRose,
                                  foregroundColor: Colors.white,
                                  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                                child: Text(
                                  'BUY NOW',
                                  style: GoogleFonts.montserrat(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Dynamic recommendations — Section 1: Same Category Products (SENSORY SIBLING CURATIONS)
                  if (_sameCategoryProducts.isNotEmpty) ...[
                    const Divider(height: 40),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SENSORY SIBLING CURATIONS',
                            style: GoogleFonts.montserrat(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.black45,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Similar Scent Profile',
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 290,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _sameCategoryProducts.length,
                        itemBuilder: (context, index) {
                          final p = _sameCategoryProducts[index];
                          return SizedBox(
                            width: 150,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6.0),
                              child: ProductCard(product: p),
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  // Dynamic recommendations — Section 2: Same Brand Products (SENSORY LINEAGE)
                  if (_sameBrandProducts.isNotEmpty) ...[
                    const Divider(height: 40),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SENSORY LINEAGE',
                            style: GoogleFonts.montserrat(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.black45,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'More from this Brand',
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 290,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _sameBrandProducts.length,
                        itemBuilder: (context, index) {
                          final p = _sameBrandProducts[index];
                          return SizedBox(
                            width: 150,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6.0),
                              child: ProductCard(product: p),
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  // Dynamic recommendations — Section 3: Same Price Level Items (AFFORDABLE LUXURIES)
                  if (_samePriceProducts.isNotEmpty) ...[
                    const Divider(height: 40),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'AFFORDABLE LUXURIES',
                            style: GoogleFonts.montserrat(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.black45,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Same Price Level Items',
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 290,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _samePriceProducts.length,
                        itemBuilder: (context, index) {
                          final p = _samePriceProducts[index];
                          return SizedBox(
                            width: 150,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6.0),
                              child: ProductCard(product: p),
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }
}

class CreationNarrativeAccordion extends StatefulWidget {
  final String fullDescription;

  const CreationNarrativeAccordion({super.key, required this.fullDescription});

  @override
  State<CreationNarrativeAccordion> createState() => _CreationNarrativeAccordionState();
}

class _CreationNarrativeAccordionState extends State<CreationNarrativeAccordion> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    if (widget.fullDescription.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9FB),
        border: Border.all(color: const Color(0xFFE5E5EA)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () {
              setState(() {
                _isExpanded = !_isExpanded;
              });
            },
            child: Padding(
              padding: const EdgeInsets.all(14.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'CREATION NARRATIVE (CLICK TO VIEW DETAILS)',
                      style: GoogleFonts.montserrat(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        color: Colors.black87,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                  Icon(
                    _isExpanded ? Icons.expand_less : Icons.expand_more,
                    size: 16,
                    color: Colors.black54,
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Container(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Text(
                widget.fullDescription,
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  height: 1.5,
                  color: Colors.black54,
                ),
              ),
            ),
            crossFadeState: _isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 300),
          ),
        ],
      ),
    );
  }
}

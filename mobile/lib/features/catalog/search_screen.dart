import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/cached_image.dart';
import '../../core/api/api_client.dart';
import 'product_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  final String? initialQuery;
  final String? categoryId;
  final String? brandId;
  final String? gender;
  final bool? isFeatured;
  final bool? isNewArrival;
  final String? title;

  const SearchScreen({
    super.key,
    this.initialQuery,
    this.categoryId,
    this.brandId,
    this.gender,
    this.isFeatured,
    this.isNewArrival,
    this.title,
  });

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _products = [];
  bool _isLoading = true;
  String _error = '';
  String _query = '';
  String? _selectedGender;
  String _selectedSort = 'Recommended';

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery ?? '';
    _selectedGender = widget.gender;
    _searchController.text = _query;
    _loadProducts();
  }

  @override
  void dispose() {
    _searchController.dispose();
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

  Future<void> _loadProducts() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      final Map<String, dynamic> params = {
        'limit': 100,
      };
      if (_query.isNotEmpty) params['search'] = _query;
      if (widget.categoryId != null) params['category_id'] = widget.categoryId;
      if (widget.brandId != null) params['brand_id'] = widget.brandId;
      
      final activeGender = _selectedGender;
      if (activeGender != null) params['gender'] = activeGender;
      
      if (widget.isFeatured != null) params['is_featured'] = widget.isFeatured;
      if (widget.isNewArrival != null) params['is_new_arrival'] = widget.isNewArrival;

      final res = await _apiClient.dio.get('/storefront/products', queryParameters: params);
      setState(() {
        _products = res.data as List? ?? [];
        _applySortInternal();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _applySortInternal() {
    if (_selectedSort == 'Price: Low to High') {
      _products.sort((a, b) {
        final av = a['variants'] as List?;
        final bv = b['variants'] as List?;
        final ap = av != null && av.isNotEmpty ? (av[0]['selling_price'] ?? 0.0) : 0.0;
        final bp = bv != null && bv.isNotEmpty ? (bv[0]['selling_price'] ?? 0.0) : 0.0;
        return ap.compareTo(bp);
      });
    } else if (_selectedSort == 'Price: High to Low') {
      _products.sort((a, b) {
        final av = a['variants'] as List?;
        final bv = b['variants'] as List?;
        final ap = av != null && av.isNotEmpty ? (av[0]['selling_price'] ?? 0.0) : 0.0;
        final bp = bv != null && bv.isNotEmpty ? (bv[0]['selling_price'] ?? 0.0) : 0.0;
        return bp.compareTo(ap);
      });
    } else if (_selectedSort == 'Newest') {
      _products.sort((a, b) {
        final ad = DateTime.tryParse(a['created_at']?.toString() ?? '') ?? DateTime(2000);
        final bd = DateTime.tryParse(b['created_at']?.toString() ?? '') ?? DateTime(2000);
        return bd.compareTo(ad);
      });
    }
  }

  void _applySort() {
    if (_selectedSort == 'Recommended') {
      _loadProducts();
    } else {
      setState(() {
        _applySortInternal();
      });
    }
  }

  void _showSortBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'SORT BY',
                  style: GoogleFonts.montserrat(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
              const Divider(height: 1),
              _buildSortOptionTile('Recommended'),
              _buildSortOptionTile('Price: Low to High'),
              _buildSortOptionTile('Price: High to Low'),
              _buildSortOptionTile('Newest'),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSortOptionTile(String option) {
    final active = _selectedSort == option;
    return ListTile(
      onTap: () {
        setState(() {
          _selectedSort = option;
          _applySort();
        });
        Navigator.pop(context);
      },
      title: Text(
        option,
        style: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: active ? FontWeight.bold : FontWeight.normal,
          color: active ? AppTheme.primaryRose : Colors.black87,
        ),
      ),
      trailing: active ? const Icon(Icons.check, color: AppTheme.primaryRose, size: 18) : null,
    );
  }

  Widget _buildGenderChip(String label, String? val) {
    final active = _selectedGender == val;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedGender = val;
        });
        _loadProducts();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: active ? AppTheme.primaryRose : Colors.white,
          border: Border.all(
            color: active ? AppTheme.primaryRose : const Color(0xFFE5E5EA),
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 9,
              fontWeight: active ? FontWeight.bold : FontWeight.w500,
              color: active ? Colors.white : Colors.black87,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final titleText = widget.title ?? 
        (widget.isNewArrival == true ? 'NEW ARRIVALS' : 
         widget.isFeatured == true ? 'POPULAR PICKS' : 'EXPLORE COLLECTION');

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: widget.title != null || widget.categoryId != null || widget.brandId != null || widget.isFeatured != null || widget.isNewArrival != null
            ? const BackButton(color: Colors.black)
            : null,
        centerTitle: true,
        title: Image.asset('assets/logo.png', height: 26, fit: BoxFit.contain),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Search Input Header
            if (widget.categoryId == null && widget.brandId == null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
                child: TextField(
                  controller: _searchController,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (val) {
                    setState(() {
                      _query = val;
                    });
                    _loadProducts();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search for scent families, notes, or titles...',
                    prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted),
                    suffixIcon: _query.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, color: AppTheme.textMuted),
                            onPressed: () {
                              setState(() {
                                _searchController.clear();
                                _query = '';
                              });
                              _loadProducts();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF9F9FB),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    enabledBorder: OutlineInputBorder(
                      borderSide: const BorderSide(color: Color(0xFFE5E5EA)),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: const BorderSide(color: AppTheme.primaryRose),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),

            // Filter and Sort Bar
            Container(
              height: 48,
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: Color(0xFFF0F0F2), width: 1),
                ),
              ),
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                children: [
                  // Sort Trigger Button
                  InkWell(
                    onTap: _showSortBottomSheet,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE5E5EA)),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.swap_vert, size: 14, color: Colors.black87),
                          const SizedBox(width: 4),
                          Text(
                            'Sort: $_selectedSort',
                            style: GoogleFonts.montserrat(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(width: 1, height: 16, color: const Color(0xFFE5E5EA)),
                  const SizedBox(width: 8),

                  // Gender Filter Chips
                  _buildGenderChip('ALL', null),
                  const SizedBox(width: 8),
                  _buildGenderChip('FOR HIM', 'MEN'),
                  const SizedBox(width: 8),
                  _buildGenderChip('FOR HER', 'WOMEN'),
                  const SizedBox(width: 8),
                  _buildGenderChip('UNISEX', 'UNISEX'),
                ],
              ),
            ),

            // Section Subheader/Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    titleText.toUpperCase(),
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 16,
                      fontWeight: FontWeight.normal,
                      color: Colors.black,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    width: 32,
                    height: 1.5,
                    color: AppTheme.primaryRose,
                  ),
                ],
              ),
            ),

            // Products Grid or Loader
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppTheme.primaryRose,
                      ),
                    )
                  : _error.isNotEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.cloud_off, size: 48, color: Colors.black26),
                              const SizedBox(height: 12),
                              Text('Error loading products: $_error', style: const TextStyle(color: Colors.black54)),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: _loadProducts,
                                child: const Text('RETRY'),
                              ),
                            ],
                          ),
                        )
                      : _products.isEmpty
                          ? const Center(
                              child: Text(
                                'No fragrances found matching your search.',
                                style: TextStyle(color: AppTheme.textMuted),
                              ),
                            )
                          : GridView.builder(
                              padding: const EdgeInsets.all(16),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                crossAxisSpacing: 14,
                                mainAxisSpacing: 18,
                                childAspectRatio: 0.64,
                              ),
                              itemCount: _products.length,
                              itemBuilder: (context, index) {
                                final product = _products[index] as Map<String, dynamic>;
                                final name = product['name']?.toString() ?? '';
                                final brand = product['brand_name']?.toString() ?? '';
                                final images = product['images'] as List? ?? [];
                                final resolvedImg = images.isNotEmpty ? _getMediaUrl(images[0]?.toString()) : '';
                                final variants = product['variants'] as List? ?? [];
                                final price = variants.isNotEmpty ? (variants[0]['selling_price'] ?? 0.0) : 0.0;
                                final oldPrice = variants.isNotEmpty ? variants[0]['compare_at_price'] : null;

                                return GestureDetector(
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => ProductDetailScreen(product: product),
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
                                                CachedImage(
                                                  imageUrl: resolvedImg,
                                                  fit: BoxFit.cover,
                                                  errorWidget: Container(
                                                    color: const Color(0xFFF5F5F5),
                                                    child: const Icon(Icons.image_not_supported, color: Colors.black12),
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
                                        // Scent description snippets
                                        Text(
                                          product['short_description']?.toString() ?? '',
                                          style: GoogleFonts.poppins(
                                            fontSize: 8,
                                            color: Colors.black54,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 6),
                                        // Price details
                                        Row(
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
                                              const SizedBox(width: 6),
                                              Text(
                                                '₹$oldPrice',
                                                style: GoogleFonts.montserrat(
                                                  fontSize: 9,
                                                  color: Colors.black38,
                                                  decoration: TextDecoration.lineThrough,
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }
}

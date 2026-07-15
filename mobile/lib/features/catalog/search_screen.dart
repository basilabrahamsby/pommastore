import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'home_screen.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/cached_image.dart';
import '../../core/api/api_client.dart';
import 'product_detail_screen.dart';

class SearchScreen extends ConsumerStatefulWidget {
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
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchController = TextEditingController();
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _allProducts = [];
  List<dynamic> _products = [];
  List<dynamic> _categories = [];
  List<dynamic> _brands = [];
  bool _isLoading = true;
  String _error = '';
  String _query = '';
  String _selectedSort = 'Recommended';

  // Active filter selections (mirroring Next.js storefront shop page)
  final List<String> _selectedGenders = [];
  final List<String> _selectedCategories = [];
  final List<String> _selectedBrands = [];
  final List<String> _selectedPrices = [];
  final List<String> _selectedFamilies = [];
  final List<String> _selectedConcentrations = [];

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery ?? '';
    _searchController.text = _query;
    if (widget.gender != null) {
      final formatted = widget.gender!.toLowerCase();
      if (formatted == 'men') _selectedGenders.add('Men');
      if (formatted == 'women') _selectedGenders.add('Women');
      if (formatted == 'unisex') _selectedGenders.add('Unisex');
    }
    _loadProducts();
    _loadCategories();
    _loadBrands();
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

  Future<void> _loadCategories() async {
    try {
      final res = await _apiClient.dio.get('/storefront/categories');
      setState(() {
        _categories = res.data as List? ?? [];
        if (widget.categoryId != null) {
          final match = _categories.firstWhere(
            (c) => c['id']?.toString() == widget.categoryId,
            orElse: () => null,
          );
          if (match != null) {
            _selectedCategories.add(match['name']?.toString() ?? '');
          }
        }
      });
    } catch (_) {}
  }

  Future<void> _loadBrands() async {
    try {
      final res = await _apiClient.dio.get('/storefront/brands');
      setState(() {
        _brands = res.data as List? ?? [];
        if (widget.brandId != null) {
          final match = _brands.firstWhere(
            (b) => b['id']?.toString() == widget.brandId,
            orElse: () => null,
          );
          if (match != null) {
            _selectedBrands.add(match['name']?.toString() ?? '');
          }
        }
      });
    } catch (_) {}
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
      if (widget.isFeatured != null) params['is_featured'] = widget.isFeatured;
      if (widget.isNewArrival != null) params['is_new_arrival'] = widget.isNewArrival;

      final res = await _apiClient.dio.get('/storefront/products', queryParameters: params);
      setState(() {
        _allProducts = res.data as List? ?? [];
        _applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _applyFilters() {
    List<dynamic> results = List.from(_allProducts);

    // 0. Discovery Search Check
    if (_query.isNotEmpty) {
      final q = _query.toLowerCase();
      results = results.where((p) {
        final name = (p['name']?.toString() ?? '').toLowerCase();
        final brand = (p['brand_name']?.toString() ?? '').toLowerCase();
        final desc = (p['short_description']?.toString() ?? '').toLowerCase();
        return name.contains(q) || brand.contains(q) || desc.contains(q);
      }).toList();
    }

    // 1. Gender Check
    if (_selectedGenders.isNotEmpty) {
      results = results.where((p) {
        final pg = p['gender']?.toString().toLowerCase() ?? '';
        return _selectedGenders.any((g) => g.toLowerCase() == pg);
      }).toList();
    }

    // 2. Category Check
    if (_selectedCategories.isNotEmpty) {
      results = results.where((p) {
        final pc = p['category_name']?.toString() ?? '';
        return _selectedCategories.contains(pc);
      }).toList();
    }

    // 3. Brand Check
    if (_selectedBrands.isNotEmpty) {
      results = results.where((p) {
        final pb = p['brand_name']?.toString() ?? '';
        return _selectedBrands.contains(pb);
      }).toList();
    }

    // 4. Price Threshold Check
    if (_selectedPrices.isNotEmpty) {
      results = results.where((p) {
        final variants = p['variants'] as List? ?? [];
        if (variants.isEmpty) return false;
        final basePrice = variants
            .map((v) => (v['selling_price'] ?? 0.0) as num)
            .map((n) => n.toDouble())
            .reduce(math.min);
        
        return _selectedPrices.any((range) {
          if (range == "Under ₹1,000") return basePrice < 1000;
          if (range == "₹1,000 - ₹5,000") return basePrice >= 1000 && basePrice <= 5000;
          if (range == "₹5,000 - ₹10,000") return basePrice > 5000 && basePrice <= 10000;
          if (range == "Over ₹10,000") return basePrice > 10000;
          return false;
        });
      }).toList();
    }

    // 5. Scent Palette Consistency
    if (_selectedFamilies.isNotEmpty) {
      results = results.where((p) {
        final catName = (p['category_name']?.toString() ?? '').toLowerCase();
        final desc = (p['short_description']?.toString() ?? '').toLowerCase();
        return _selectedFamilies.any((family) {
          final f = family.toLowerCase();
          return catName.contains(f) || desc.contains(f);
        });
      }).toList();
    }

    // 6. Material Concentration Mapping
    if (_selectedConcentrations.isNotEmpty) {
      results = results.where((p) {
        final variants = p['variants'] as List? ?? [];
        final concentrations = variants.map((v) => (v['concentration']?.toString() ?? '').toLowerCase()).toList();
        return _selectedConcentrations.any((c) => concentrations.contains(c.toLowerCase()));
      }).toList();
    }

    setState(() {
      _products = results;
      _applySortInternal();
    });
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

  Widget _buildFilterCategorySection({
    required String title,
    required List<String> options,
    required List<String> selectedList,
    required StateSetter setFilterState,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8.0),
          child: Text(
            title.toUpperCase(),
            style: GoogleFonts.montserrat(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
          ),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((opt) {
            final isChecked = selectedList.contains(opt);
            return InkWell(
              onTap: () {
                setFilterState(() {
                  if (isChecked) {
                    selectedList.remove(opt);
                  } else {
                    selectedList.add(opt);
                  }
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isChecked ? Colors.black : const Color(0xFFF5F5F7),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  opt.toUpperCase(),
                  style: GoogleFonts.poppins(
                    fontSize: 8,
                    fontWeight: isChecked ? FontWeight.bold : FontWeight.w500,
                    color: isChecked ? Colors.white : Colors.black87,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  void _showFilterEngineBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.85,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return StatefulBuilder(
              builder: (context, setFilterState) {
                return Column(
                  children: [
                    // Header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'FILTER ENGINE',
                            style: GoogleFonts.montserrat(
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                              letterSpacing: 1.5,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              setFilterState(() {
                                _selectedGenders.clear();
                                _selectedCategories.clear();
                                _selectedBrands.clear();
                                _selectedPrices.clear();
                                _selectedFamilies.clear();
                                _selectedConcentrations.clear();
                              });
                              setState(() {
                                _applyFilters();
                              });
                            },
                            child: Text(
                              'CLEAR ALL',
                              style: GoogleFonts.montserrat(
                                fontSize: 10,
                                color: AppTheme.primaryRose,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    
                    // Filter options list
                    Expanded(
                      child: ListView(
                        controller: scrollController,
                        padding: const EdgeInsets.all(16),
                        children: [
                          // 1. Gender
                          _buildFilterCategorySection(
                            title: 'Gender',
                            options: ['Men', 'Women', 'Unisex'],
                            selectedList: _selectedGenders,
                            setFilterState: setFilterState,
                          ),
                          // 2. Category
                          if (_categories.isNotEmpty)
                            _buildFilterCategorySection(
                              title: 'Category',
                              options: _categories.map((c) => c['name']?.toString() ?? '').toList(),
                              selectedList: _selectedCategories,
                              setFilterState: setFilterState,
                            ),
                          // 3. Brand
                          if (_brands.isNotEmpty)
                            _buildFilterCategorySection(
                              title: 'Brand',
                              options: _brands.map((b) => b['name']?.toString() ?? '').toList(),
                              selectedList: _selectedBrands,
                              setFilterState: setFilterState,
                            ),
                          // 4. Price Range
                          _buildFilterCategorySection(
                            title: 'Price Range',
                            options: ["Under ₹1,000", "₹1,000 - ₹5,000", "₹5,000 - ₹10,000", "Over ₹10,000"],
                            selectedList: _selectedPrices,
                            setFilterState: setFilterState,
                          ),
                          // 5. Scent Family
                          _buildFilterCategorySection(
                            title: 'Scent Family',
                            options: ["Floral", "Woody", "Oriental", "Fresh", "Citrus"],
                            selectedList: _selectedFamilies,
                            setFilterState: setFilterState,
                          ),
                          // 6. Concentration
                          _buildFilterCategorySection(
                            title: 'Concentration',
                            options: ["EDP", "EDT", "Parfum", "Cologne"],
                            selectedList: _selectedConcentrations,
                            setFilterState: setFilterState,
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    
                    // Apply button
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _applyFilters();
                            });
                            Navigator.pop(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.black,
                            foregroundColor: Colors.white,
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                          child: Text(
                            'APPLY FILTERS',
                            style: GoogleFonts.montserrat(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  List<Map<String, String>> _getSearchSuggestions(String text) {
    if (text.isEmpty) return [];
    final q = text.toLowerCase();
    final List<Map<String, String>> suggestions = [];

    // 1. Check matching Brands
    for (final b in _brands) {
      if (b is Map) {
        final bName = b['name']?.toString() ?? '';
        if (bName.toLowerCase().contains(q)) {
          suggestions.add({
            'type': 'Brand',
            'value': bName,
          });
        }
      }
    }

    // 2. Check matching Categories
    for (final c in _categories) {
      if (c is Map) {
        final cName = c['name']?.toString() ?? '';
        if (cName.toLowerCase().contains(q)) {
          suggestions.add({
            'type': 'Category',
            'value': cName,
          });
        }
      }
    }

    // 3. Check matching Products
    for (final p in _allProducts) {
      if (p is Map) {
        final pName = p['name']?.toString() ?? '';
        if (pName.toLowerCase().contains(q)) {
          suggestions.add({
            'type': 'Product',
            'value': pName,
          });
        }
      }
    }

    // 4. Check matching Scent Notes / Families
    final Set<String> matchingNotes = {};
    for (final p in _allProducts) {
      if (p is Map) {
        final notesData = p['scent_notes'];
        List<String> notes = [];
        if (notesData is Map) {
          final top = notesData['top'] as List? ?? [];
          final heart = notesData['heart'] as List? ?? [];
          final base = notesData['base'] as List? ?? [];
          notes = [...top, ...heart, ...base].map((e) => e.toString()).toList();
        } else if (notesData is List) {
          notes = notesData.map((e) => e.toString()).toList();
        }
        for (final note in notes) {
          if (note.toLowerCase().contains(q)) {
            matchingNotes.add(note);
          }
        }
      }
    }
    for (final note in matchingNotes) {
      suggestions.add({
        'type': 'Scent Note',
        'value': note,
      });
    }

    return suggestions.take(8).toList();
  }

  void _onSuggestionTap(Map<String, String> sug) {
    final value = sug['value'] ?? '';
    final type = sug['type'] ?? '';

    setState(() {
      _searchController.text = value;
      _query = value;
      
      _selectedBrands.clear();
      _selectedCategories.clear();
      _selectedGenders.clear();

      if (type == 'Brand') {
        _selectedBrands.add(value);
      } else if (type == 'Category') {
        _selectedCategories.add(value);
      }
      
      _applyFilters();
    });

    FocusScope.of(context).unfocus();
  }

  Widget _buildSuggestionsOverlay() {
    final text = _searchController.text;
    final suggestions = _getSearchSuggestions(text);

    return Container(
      color: Colors.white,
      width: double.infinity,
      height: double.infinity,
      child: suggestions.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.search_off_outlined, size: 48, color: Colors.black26),
                    const SizedBox(height: 12),
                    Text(
                      'No suggestions for "$text"',
                      style: GoogleFonts.poppins(color: Colors.black54, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Press search to look for this query',
                      style: GoogleFonts.poppins(color: Colors.black38, fontSize: 11),
                    ),
                  ],
                ),
              ),
            )
          : ListView.builder(
              itemCount: suggestions.length + 1,
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return ListTile(
                    leading: const Icon(Icons.search, color: AppTheme.primaryRose, size: 20),
                    title: Text(
                      'Search for "$text"',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryRose,
                        fontSize: 13,
                      ),
                    ),
                    onTap: () {
                      setState(() {
                        _query = text;
                        _applyFilters();
                      });
                      FocusScope.of(context).unfocus();
                    },
                  );
                }

                final sug = suggestions[index - 1];
                final value = sug['value'] ?? '';
                final type = sug['type'] ?? '';

                IconData icon;
                Color iconColor;
                if (type == 'Brand') {
                  icon = Icons.domain_outlined;
                  iconColor = const Color(0xFFE91E63);
                } else if (type == 'Category') {
                  icon = Icons.grid_view_outlined;
                  iconColor = const Color(0xFF007AFF);
                } else if (type == 'Scent Note') {
                  icon = Icons.spa_outlined;
                  iconColor = const Color(0xFF4CD964);
                } else {
                  icon = Icons.local_mall_outlined;
                  iconColor = Colors.black54;
                }

                return ListTile(
                  leading: Icon(icon, color: iconColor, size: 18),
                  title: RichText(
                    text: TextSpan(
                      style: GoogleFonts.poppins(color: Colors.black87, fontSize: 13),
                      children: [
                        TextSpan(text: value),
                        TextSpan(
                          text: '  ($type)',
                          style: GoogleFonts.poppins(color: Colors.black38, fontSize: 10, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                  trailing: const Icon(Icons.north_west, size: 14, color: Colors.black26),
                  onTap: () => _onSuggestionTap(sug),
                );
              },
            ),
    );
  }

  Widget _buildTopCategoryNavBar() {
    final navItems = [
      {
        'name': 'HOME',
        'action': () {
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      },
      {
        'name': 'MEN',
        'action': () {
          if (widget.gender == 'Men') return;
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const SearchScreen(gender: 'Men', title: 'MEN FRAGRANCES'),
            ),
          );
        }
      },
      {
        'name': 'WOMEN',
        'action': () {
          if (widget.gender == 'Women') return;
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const SearchScreen(gender: 'Women', title: 'WOMEN FRAGRANCES'),
            ),
          );
        }
      },
      {
        'name': 'UNISEX',
        'action': () {
          if (widget.gender == 'Unisex') return;
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const SearchScreen(gender: 'Unisex', title: 'UNISEX FRAGRANCES'),
            ),
          );
        }
      },
      {
        'name': 'BRANDS',
        'action': () {
          ref.read(homeScrollTargetProvider.notifier).state = 'brands';
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      },
      {
        'name': 'OFFERS',
        'action': () {
          ref.read(homeScrollTargetProvider.notifier).state = 'offers';
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      },
      {
        'name': 'PRODUCTS',
        'action': () {
          if (widget.title == 'ALL PRODUCTS' && widget.gender == null && widget.categoryId == null && widget.brandId == null) return;
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const SearchScreen(title: 'ALL PRODUCTS'),
            ),
          );
        }
      },
    ];

    return Container(
      height: 44,
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: AppTheme.borderLight, width: 1.0),
        ),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: navItems.length,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        itemBuilder: (context, index) {
          final item = navItems[index];
          
          bool isActive = false;
          final name = item['name'].toString();
          if (name == 'MEN' && widget.gender == 'Men') {
            isActive = true;
          } else if (name == 'WOMEN' && widget.gender == 'Women') {
            isActive = true;
          } else if (name == 'UNISEX' && widget.gender == 'Unisex') {
            isActive = true;
          } else if (name == 'PRODUCTS' && widget.title == 'ALL PRODUCTS' && widget.gender == null && widget.categoryId == null && widget.brandId == null) {
            isActive = true;
          }

          return GestureDetector(
            onTap: item['action'] as VoidCallback,
            child: Container(
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              margin: const EdgeInsets.only(right: 8),
              child: Text(
                name,
                style: GoogleFonts.montserrat(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2.0,
                  color: isActive ? AppTheme.primaryRose : Colors.black87,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Find category name if active
    String? activeCategoryName;
    if (widget.categoryId != null && _categories.isNotEmpty) {
      final match = _categories.firstWhere(
        (c) => c['id']?.toString() == widget.categoryId,
        orElse: () => null,
      );
      if (match != null) {
        activeCategoryName = match['name']?.toString();
      }
    }
    activeCategoryName ??= widget.title;

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
            _buildTopCategoryNavBar(),
            // Search Input Header
            if (widget.categoryId == null && widget.brandId == null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
                child: TextField(
                  controller: _searchController,
                  textInputAction: TextInputAction.search,
                  onChanged: (val) {
                    setState(() {});
                  },
                  onSubmitted: (val) {
                    setState(() {
                      _query = val;
                      _applyFilters();
                    });
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
                                _applyFilters();
                              });
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

            Expanded(
              child: Stack(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Sorting Trigger Bar
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
                ],
              ),
            ),

            // Breadcrumbs & Item Count block (Compacted to maximize product grid space)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'HOME',
                        style: GoogleFonts.montserrat(
                          fontSize: 8,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF8E8E93),
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right, size: 10, color: Color(0xFF8E8E93)),
                      const SizedBox(width: 4),
                      Text(
                        'SHOP',
                        style: GoogleFonts.montserrat(
                          fontSize: 8,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF8E8E93),
                          letterSpacing: 1.0,
                        ),
                      ),
                      if (activeCategoryName != null) ...[
                        const SizedBox(width: 4),
                        const Icon(Icons.chevron_right, size: 10, color: Color(0xFF8E8E93)),
                        const SizedBox(width: 4),
                        Text(
                          activeCategoryName.toUpperCase(),
                          style: GoogleFonts.montserrat(
                            fontSize: 8,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryRose,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_products.length} FRAGRANCES MATCH FILTERS',
                    style: GoogleFonts.montserrat(
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF8E8E93),
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
            ),

            // Horizontal Categories Scroll View
            if (_categories.isNotEmpty) ...[
              const SizedBox(height: 6),
              SizedBox(
                height: 92,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final cat = _categories[index] as Map<String, dynamic>;
                    final catId = cat['id']?.toString();
                    final name = cat['name'] ?? '';
                    final catImg = cat['image_url'] ??
                        (cat['images'] is List && (cat['images'] as List).isNotEmpty
                            ? cat['images'][0]
                            : cat['banner_url']);
                    final imageResolved = _getMediaUrl(catImg?.toString());
                    final isSelected = widget.categoryId == catId || _selectedCategories.contains(name.toString());

                    return GestureDetector(
                      onTap: () {
                        if (isSelected) {
                          setState(() {
                            _selectedCategories.remove(name.toString());
                            _applyFilters();
                          });
                        } else {
                          setState(() {
                            _selectedCategories.add(name.toString());
                            _applyFilters();
                          });
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8.0),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(2.5),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: isSelected
                                      ? const [
                                          Color(0xFFFFB300),
                                          Color(0xFFE91E63),
                                          AppTheme.primaryRose
                                        ]
                                      : const [
                                          Color(0xFFE5E5EA),
                                          Color(0xFFE5E5EA),
                                        ],
                                  begin: Alignment.bottomLeft,
                                  end: Alignment.topRight,
                                ),
                              ),
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white),
                                child: ClipOval(
                                  child: SizedBox(
                                    width: 60,
                                    height: 60,
                                    child: CachedImage(
                                      imageUrl: imageResolved,
                                      fit: BoxFit.cover,
                                      errorWidget: Container(
                                        color: const Color(0xFFF5F5F5),
                                        child: const Icon(Icons.image_outlined, color: Colors.black12, size: 20),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              name.toString().toUpperCase(),
                              style: GoogleFonts.montserrat(
                                fontSize: 8,
                                fontWeight: FontWeight.w700,
                                color: isSelected ? AppTheme.primaryRose : Colors.black87,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],

            // Interactive Filter Engine Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: OutlinedButton.icon(
                onPressed: _showFilterEngineBottomSheet,
                icon: const Icon(Icons.tune_outlined, size: 14, color: Colors.black87),
                label: Text(
                  'INTERACTIVE FILTER ENGINE',
                  style: GoogleFonts.montserrat(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                    letterSpacing: 1.5,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: const BorderSide(color: Colors.black12),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.zero,
                  ),
                ),
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
                                'No fragrances found matching filters.',
                                style: TextStyle(color: AppTheme.textMuted),
                              ),
                            )
                          : GridView.builder(
                              padding: const EdgeInsets.all(16),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                                childAspectRatio: 0.55,
                              ),
                              itemCount: _products.length,
                              itemBuilder: (context, index) {
                                final product = _products[index] as Map<String, dynamic>;
                                final id = product['id']?.toString() ?? '';
                                final name = product['name']?.toString() ?? '';
                                final brand = product['brand_name']?.toString() ?? '';
                                final desc = (product['description'] ?? product['short_description'] ?? '').toString();
                                final images = product['images'] as List? ?? [];
                                final resolvedImg = images.isNotEmpty ? _getMediaUrl(images[0]?.toString()) : '';
                                final variants = product['variants'] as List? ?? [];
                                final price = variants.isNotEmpty ? (variants[0]['selling_price'] ?? 0.0) : 0.0;
                                final oldPrice = variants.isNotEmpty ? variants[0]['compare_at_price'] : null;

                                // Deterministic rating based on ID hash
                                int hash = 0;
                                for (int i = 0; i < id.length; i++) {
                                  hash = id.codeUnitAt(i) + ((hash << 5) - hash);
                                }
                                final rating = (4.0 + (hash.abs() % 10) / 10).toStringAsFixed(1);
                                final reviews = (5 + (hash.abs() % 95)).toString();

                                final discountPercentage = (oldPrice != null && oldPrice > price)
                                    ? ((oldPrice - price) / oldPrice * 100).round()
                                    : 0;

                                final List<String> allImages = images.map((e) => _getMediaUrl(e?.toString())).toList();
                                if (allImages.isEmpty && resolvedImg.isNotEmpty) {
                                  allImages.add(resolvedImg);
                                }

                                final notes = _getScentNotes(product);

                                final detailProduct = {
                                  'id': id,
                                  'slug': product['slug']?.toString() ?? id,
                                  'brand_id': product['brand_id']?.toString() ?? '',
                                  'category_id': product['category_id']?.toString() ?? '',
                                  'name': name,
                                  'brand_name': brand,
                                  'price': price,
                                  'mrp': oldPrice ?? price,
                                  'image_url': resolvedImg,
                                  'description': desc,
                                  'short_description': product['short_description']?.toString() ?? desc,
                                  'full_description': product['full_description']?.toString() ?? '',
                                  'scent_notes': notes,
                                  'rating': rating,
                                  'reviews': reviews,
                                  'images': allImages,
                                };

                                bool isWishlisted = false;
                                int cartQty = 0;

                                return StatefulBuilder(
                                  builder: (context, setCardState) {
                                    return GestureDetector(
                                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                                          builder: (_) => ProductDetailScreen(product: detailProduct))),
                                      child: Card(
                                        elevation: 0,
                                        clipBehavior: Clip.antiAlias,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(6),
                                          side: const BorderSide(color: AppTheme.borderLight),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.stretch,
                                          children: [
                                            // Product Image
                                            Expanded(
                                              child: Stack(
                                                fit: StackFit.expand,
                                                children: [
                                                  AutoCycleImage(
                                                    imageUrls: allImages,
                                                    id: id,
                                                    fit: BoxFit.cover,
                                                  ),
                                                  // Discount badge
                                                  if (discountPercentage > 0)
                                                    Positioned(
                                                      top: 8,
                                                      left: 8,
                                                      child: Container(
                                                        padding: const EdgeInsets.symmetric(
                                                            horizontal: 6, vertical: 3),
                                                        decoration: BoxDecoration(
                                                          color: AppTheme.primaryRose,
                                                          borderRadius: BorderRadius.circular(3),
                                                        ),
                                                        child: Text('$discountPercentage% OFF',
                                                            style: GoogleFonts.montserrat(
                                                                color: Colors.white,
                                                                fontSize: 8,
                                                                fontWeight: FontWeight.w700,
                                                                letterSpacing: 0.5)),
                                                      ),
                                                    ),
                                                  // Favorite button
                                                  Positioned(
                                                    top: 6,
                                                    right: 6,
                                                    child: GestureDetector(
                                                      onTap: () => setCardState(
                                                          () => isWishlisted = !isWishlisted),
                                                      child: Container(
                                                        width: 28,
                                                        height: 28,
                                                        decoration: BoxDecoration(
                                                          color: Colors.white.withValues(alpha: 0.85),
                                                          shape: BoxShape.circle,
                                                          border: Border.all(
                                                              color: const Color(0xFFE5E5EA),
                                                              width: 0.8),
                                                        ),
                                                        child: Icon(
                                                          isWishlisted
                                                              ? Icons.favorite
                                                              : Icons.favorite_border,
                                                          size: 14,
                                                          color: isWishlisted
                                                              ? AppTheme.primaryRose
                                                              : const Color(0xFFA3A3A3),
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                  // Rating chip
                                                  Positioned(
                                                    bottom: 8,
                                                    left: 8,
                                                    child: Container(
                                                      padding: const EdgeInsets.symmetric(
                                                          horizontal: 6, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: const Color(0xF2FFFFFF),
                                                        borderRadius: BorderRadius.circular(10),
                                                        border:
                                                            Border.all(color: AppTheme.borderLight),
                                                      ),
                                                      child: Row(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          Text(rating,
                                                              style: GoogleFonts.poppins(
                                                                  fontSize: 8,
                                                                  fontWeight: FontWeight.w600,
                                                                  color: Colors.black)),
                                                          const SizedBox(width: 2),
                                                          const Icon(Icons.star,
                                                              size: 8, color: Color(0xFFFFA41C)),
                                                          const SizedBox(width: 2),
                                                          Text('($reviews)',
                                                              style: GoogleFonts.poppins(
                                                                  fontSize: 8, color: Colors.black54)),
                                                        ],
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            // Product Info
                                            Padding(
                                              padding: const EdgeInsets.fromLTRB(10, 8, 10, 6),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  // Product name
                                                  Text(
                                                    name.toUpperCase(),
                                                    style: GoogleFonts.poppins(
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w500,
                                                      letterSpacing: 0.6,
                                                      color: const Color(0xFF525252),
                                                      height: 1.2,
                                                    ),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                  // Brand name
                                                  if (brand.isNotEmpty)
                                                    Padding(
                                                      padding: const EdgeInsets.only(top: 1),
                                                      child: Text(
                                                        brand.toUpperCase(),
                                                        style: GoogleFonts.poppins(
                                                          fontSize: 10,
                                                          fontWeight: FontWeight.w900,
                                                          letterSpacing: 1.0,
                                                          color: Colors.black,
                                                        ),
                                                        maxLines: 1,
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ),
                                                  const SizedBox(height: 3),
                                                  // Scent notes
                                                  Text(notes.join(' · '),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                      style: GoogleFonts.poppins(
                                                          color: AppTheme.textMuted, fontSize: 9)),
                                                  const SizedBox(height: 6),
                                                  // Price row
                                                  Wrap(
                                                    crossAxisAlignment: WrapCrossAlignment.center,
                                                    spacing: 5,
                                                    children: [
                                                      Text('₹$price',
                                                          style: GoogleFonts.poppins(
                                                              color: Colors.black,
                                                              fontWeight: FontWeight.w700,
                                                              fontSize: 13)),
                                                      if (discountPercentage > 0 && oldPrice != null) ...[
                                                        Text('₹$oldPrice',
                                                            style: GoogleFonts.poppins(
                                                                color: const Color(0xFFA3A3A3),
                                                                fontSize: 10,
                                                                decoration: TextDecoration.lineThrough,
                                                                decorationColor:
                                                                    const Color(0xFFA3A3A3))),
                                                        Text('$discountPercentage% off',
                                                            style: GoogleFonts.poppins(
                                                                color: AppTheme.primaryRose,
                                                                fontSize: 10,
                                                                fontWeight: FontWeight.w700)),
                                                      ],
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                            // Action Buttons
                                            Padding(
                                              padding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
                                              child: cartQty > 0
                                                  ? Row(
                                                      children: [
                                                        Expanded(
                                                          child: Container(
                                                            height: 34,
                                                            decoration: BoxDecoration(
                                                              border: Border.all(
                                                                  color: const Color(0xFFE5E5EA)),
                                                              borderRadius: BorderRadius.circular(4),
                                                              color: const Color(0xFFF9F9F9),
                                                            ),
                                                            child: Row(
                                                              children: [
                                                                Expanded(
                                                                  child: GestureDetector(
                                                                    onTap: () => setCardState(() {
                                                                      if (cartQty > 0) cartQty--;
                                                                    }),
                                                                    child: Container(
                                                                      alignment: Alignment.center,
                                                                      child: Text('-',
                                                                          style: GoogleFonts.poppins(
                                                                              fontSize: 14,
                                                                              fontWeight:
                                                                                  FontWeight.w700,
                                                                              color: Colors.black)),
                                                                    ),
                                                                  ),
                                                                ),
                                                                Expanded(
                                                                  flex: 2,
                                                                  child: Container(
                                                                    alignment: Alignment.center,
                                                                    child: Text('$cartQty IN BAG',
                                                                        style: GoogleFonts.poppins(
                                                                            fontSize: 7,
                                                                            fontWeight: FontWeight.w800,
                                                                            letterSpacing: 0.5,
                                                                            color: Colors.black)),
                                                                  ),
                                                                ),
                                                                Expanded(
                                                                  child: GestureDetector(
                                                                    onTap: () => setCardState(
                                                                        () => cartQty++),
                                                                    child: Container(
                                                                      alignment: Alignment.center,
                                                                      child: Text('+',
                                                                          style: GoogleFonts.poppins(
                                                                              fontSize: 14,
                                                                              fontWeight:
                                                                                  FontWeight.w700,
                                                                              color: Colors.black)),
                                                                    ),
                                                                  ),
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
                                                                    builder: (_) =>
                                                                        ProductDetailScreen(
                                                                            product: detailProduct)),
                                                              );
                                                            },
                                                            child: Container(
                                                              height: 34,
                                                              alignment: Alignment.center,
                                                              decoration: BoxDecoration(
                                                                color: AppTheme.primaryRose,
                                                                borderRadius:
                                                                    BorderRadius.circular(4),
                                                                boxShadow: [
                                                                  BoxShadow(
                                                                    color: AppTheme.primaryRose
                                                                        .withValues(alpha: 0.3),
                                                                    blurRadius: 8,
                                                                    offset: const Offset(0, 2),
                                                                  )
                                                                ],
                                                              ),
                                                              child: Text('BUY NOW',
                                                                  style: GoogleFonts.poppins(
                                                                      color: Colors.white,
                                                                      fontSize: 8,
                                                                      fontWeight: FontWeight.w800,
                                                                      letterSpacing: 1.5)),
                                                            ),
                                                          ),
                                                        ),
                                                      ],
                                                    )
                                                  : Row(
                                                      children: [
                                                        Expanded(
                                                          child: GestureDetector(
                                                            onTap: () =>
                                                                setCardState(() => cartQty = 1),
                                                            child: Container(
                                                              height: 34,
                                                              alignment: Alignment.center,
                                                              decoration: BoxDecoration(
                                                                border: Border.all(
                                                                    color: Colors.black, width: 1),
                                                                borderRadius:
                                                                    BorderRadius.circular(4),
                                                                color: Colors.white,
                                                              ),
                                                              child: Text('ADD TO BAG',
                                                                  style: GoogleFonts.poppins(
                                                                      color: Colors.black,
                                                                      fontSize: 8,
                                                                      fontWeight: FontWeight.w800,
                                                                      letterSpacing: 1.5)),
                                                            ),
                                                          ),
                                                        ),
                                                        const SizedBox(width: 6),
                                                        Expanded(
                                                          child: GestureDetector(
                                                            onTap: () {
                                                              Navigator.of(context).push(
                                                                MaterialPageRoute(
                                                                    builder: (_) =>
                                                                        ProductDetailScreen(
                                                                            product: detailProduct)),
                                                              );
                                                            },
                                                            child: Container(
                                                              height: 34,
                                                              alignment: Alignment.center,
                                                              decoration: BoxDecoration(
                                                                color: AppTheme.primaryRose,
                                                                borderRadius:
                                                                    BorderRadius.circular(4),
                                                                boxShadow: [
                                                                  BoxShadow(
                                                                    color: AppTheme.primaryRose
                                                                        .withValues(alpha: 0.3),
                                                                    blurRadius: 8,
                                                                    offset: const Offset(0, 2),
                                                                  )
                                                                ],
                                                              ),
                                                              child: Text('BUY NOW',
                                                                  style: GoogleFonts.poppins(
                                                                      color: Colors.white,
                                                                      fontSize: 8,
                                                                      fontWeight: FontWeight.w800,
                                                                      letterSpacing: 1.5)),
                                                            ),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                      ),
                    ],
                  ),
                  if (_searchController.text.isNotEmpty &&
                      _searchController.text != _query &&
                      (_searchController.text.length >= 2 || _getSearchSuggestions(_searchController.text).isNotEmpty))
                    _buildSuggestionsOverlay(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
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
      families.add('Fresh');
    }
    return families;
  }
}

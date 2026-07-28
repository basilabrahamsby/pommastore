import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/locale/locale_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_responsive.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/widgets/product_card.dart';
import '../../core/api/api_client.dart';
import 'homepage_provider.dart';
import 'search_screen.dart';

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  int _selectedCategoryIndex = 0;
  List<dynamic> _allCatalogProducts = [];
  final ScrollController _scrollController = ScrollController();
  bool _isFetchingMore = false;
  bool _hasMore = true;
  int _page = 1;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _fetchFullCatalog();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 300) {
      _fetchMoreCatalog();
    }
  }

  Future<void> _fetchFullCatalog() async {
    try {
      final res = await ApiClient().dio.get('/storefront/products', queryParameters: {'limit': 200});
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data;
        final list = data is List ? data : (data['items'] ?? data['products'] ?? []);
        if (mounted && list is List && list.isNotEmpty) {
          setState(() {
            _allCatalogProducts = list;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchMoreCatalog() async {
    if (_isFetchingMore || !_hasMore) return;
    setState(() => _isFetchingMore = true);
    try {
      final res = await ApiClient().dio.get('/storefront/products', queryParameters: {'skip': _page * 50, 'limit': 50});
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data;
        final list = data is List ? data : (data['items'] ?? data['products'] ?? []);
        if (mounted && list is List) {
          if (list.isEmpty) {
            _hasMore = false;
          } else {
            _page++;
            setState(() {
              _allCatalogProducts.addAll(list);
            });
          }
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isFetchingMore = false);
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  final Map<String, List<Map<String, dynamic>>> _curatedSubcategories = {
    'Eau de Parfum (EDP)': [
      {'name': 'Luxury EDP Collection', 'tag': 'Popular', 'icon': LucideIcons.sparkles},
      {'name': 'Intense EDP Spray', 'tag': 'Long Lasting', 'icon': LucideIcons.flame},
      {'name': 'Signature EDP Edits', 'tag': 'Trending', 'icon': LucideIcons.star},
      {'name': 'Travel Size EDP', 'tag': 'Best Value', 'icon': LucideIcons.packageCheck},
    ],
    'Eau de Toilette (EDT)': [
      {'name': 'Fresh EDT Sprays', 'tag': 'Daily Wear', 'icon': LucideIcons.wind},
      {'name': 'Citrus & Aqua EDT', 'tag': 'Summer Special', 'icon': LucideIcons.droplets},
      {'name': 'Floral EDT Notes', 'tag': 'Top Rated', 'icon': LucideIcons.heart},
      {'name': 'Sport EDT Editions', 'tag': 'Active', 'icon': LucideIcons.zap},
    ],
    'Niche and Classic': [
      {'name': 'Private Blend Niche', 'tag': 'Exclusive', 'icon': LucideIcons.gem},
      {'name': 'Artisanal Perfumes', 'tag': 'Prestige', 'icon': LucideIcons.award},
      {'name': 'Vintage Classics', 'tag': 'Heritage', 'icon': LucideIcons.crown},
      {'name': 'Unisex Niche Elixirs', 'tag': 'Best Seller', 'icon': LucideIcons.sparkles},
    ],
    'Oudh (Oriental)': [
      {'name': 'Pure Cambodi Oud', 'tag': 'Prestige', 'icon': LucideIcons.flame},
      {'name': 'Royal Oud Oil Attar', 'tag': '100% Pure', 'icon': LucideIcons.droplet},
      {'name': 'Smokey Oud Wood', 'tag': 'Signature', 'icon': LucideIcons.shieldCheck},
      {'name': 'Oriental Bakhoor & Incense', 'tag': 'Traditional', 'icon': LucideIcons.sun},
    ],
  };

  final List<Map<String, dynamic>> _fallbackCategories = [
    {
      'id': 'cat-1',
      'name': 'Eau de Parfum (EDP)',
      'icon': LucideIcons.sparkles,
      'discount': 'EXPLORE ALL',
      'subcategories': [
        {'name': 'Luxury EDP Collection', 'tag': 'Popular', 'icon': LucideIcons.sparkles},
        {'name': 'Intense EDP Spray', 'tag': 'Long Lasting', 'icon': LucideIcons.flame},
        {'name': 'Signature EDP Edits', 'tag': 'Trending', 'icon': LucideIcons.star},
        {'name': 'Travel Size EDP', 'tag': 'Best Value', 'icon': LucideIcons.packageCheck},
      ]
    },
    {
      'id': 'cat-2',
      'name': 'Eau de Toilette (EDT)',
      'icon': LucideIcons.droplets,
      'discount': 'EXPLORE ALL',
      'subcategories': [
        {'name': 'Fresh EDT Sprays', 'tag': 'Daily Wear', 'icon': LucideIcons.wind},
        {'name': 'Citrus & Aqua EDT', 'tag': 'Summer Special', 'icon': LucideIcons.droplets},
        {'name': 'Floral EDT Notes', 'tag': 'Top Rated', 'icon': LucideIcons.heart},
        {'name': 'Sport EDT Editions', 'tag': 'Active', 'icon': LucideIcons.zap},
      ]
    },
    {
      'id': 'cat-3',
      'name': 'Niche and Classic',
      'icon': LucideIcons.gem,
      'discount': 'EXCLUSIVE',
      'subcategories': [
        {'name': 'Private Blend Niche', 'tag': 'Exclusive', 'icon': LucideIcons.gem},
        {'name': 'Artisanal Perfumes', 'tag': 'Prestige', 'icon': LucideIcons.award},
        {'name': 'Vintage Classics', 'tag': 'Heritage', 'icon': LucideIcons.crown},
        {'name': 'Unisex Niche Elixirs', 'tag': 'Best Seller', 'icon': LucideIcons.sparkles},
      ]
    },
    {
      'id': 'cat-4',
      'name': 'Oudh (Oriental)',
      'icon': LucideIcons.flame,
      'discount': 'EXPLORE ALL',
      'subcategories': [
        {'name': 'Pure Cambodi Oud', 'tag': 'Prestige', 'icon': LucideIcons.flame},
        {'name': 'Royal Oud Oil Attar', 'tag': '100% Pure', 'icon': LucideIcons.droplet},
        {'name': 'Smokey Oud Wood', 'tag': 'Signature', 'icon': LucideIcons.shieldCheck},
        {'name': 'Oriental Bakhoor & Incense', 'tag': 'Traditional', 'icon': LucideIcons.sun},
      ]
    },
  ];

  @override
  Widget build(BuildContext context) {
    final homepageData = ref.watch(homepageDataProvider);
    final apiCategories = homepageData.value?['categories'] as List?;

    // Extract all products from catalog or fallback to homepage data
    final rawProductsList = _allCatalogProducts.isNotEmpty
        ? _allCatalogProducts
        : [
            ...?(homepageData.value?['featured_products'] as List?),
            ...?(homepageData.value?['new_arrivals'] as List?),
            ...?(homepageData.value?['best_sellers'] as List?),
            ...?(homepageData.value?['products'] as List?),
          ];

    final Map<String, dynamic> uniqueProductsMap = {};
    for (var p in rawProductsList) {
      if (p is Map<String, dynamic>) {
        final id = p['id']?.toString() ?? p['name']?.toString() ?? '';
        if (id.isNotEmpty) uniqueProductsMap[id] = p;
      }
    }
    final List<dynamic> allProducts = uniqueProductsMap.values.toList();

    final categoriesList = (apiCategories != null && apiCategories.isNotEmpty)
        ? apiCategories.map((c) {
            final catName = c['name']?.toString() ?? 'Category';
            final apiSubs = (c['subcategories'] as List? ?? []).map((sub) => {
              'name': sub['name']?.toString() ?? 'Collection',
              'tag': 'Best Value',
              'icon': LucideIcons.sparkles,
            }).toList();

            final subcatsResolved = apiSubs.isNotEmpty
                ? apiSubs
                : (_curatedSubcategories[catName] ?? [
                    {'name': 'Featured Fragrances', 'tag': 'Top Rated', 'icon': LucideIcons.star},
                    {'name': 'New Arrivals', 'tag': 'Trending', 'icon': LucideIcons.sparkles},
                    {'name': 'Best Sellers', 'tag': 'Popular', 'icon': LucideIcons.flame},
                    {'name': 'Gift Collections', 'tag': 'Special', 'icon': LucideIcons.gift},
                  ]);

            return {
              'id': c['id']?.toString() ?? '',
              'name': catName,
              'discount': 'EXPLORE ALL',
              'subcategories': subcatsResolved,
            };
          }).toList()
        : _fallbackCategories;

    final selectedCat = categoriesList[_selectedCategoryIndex.clamp(0, categoriesList.length - 1)];

    // Filter products matching current category
    final String catId = selectedCat['id']?.toString() ?? '';
    final String catNameLower = selectedCat['name']?.toString().toLowerCase() ?? '';

    List<dynamic> categoryProducts = allProducts.where((p) {
      if (p is! Map<String, dynamic>) return false;
      final pCatId = p['category_id']?.toString() ?? '';
      final pCatName = (p['category']?['name']?.toString() ?? p['category_name']?.toString() ?? '').toLowerCase();
      final pTitle = (p['title']?.toString() ?? p['name']?.toString() ?? '').toLowerCase();

      if (catId.isNotEmpty && pCatId == catId) return true;
      if (catNameLower.isNotEmpty && (pCatName.contains(catNameLower) || catNameLower.contains(pCatName))) return true;

      if (catNameLower.contains('edp') && (pTitle.contains('edp') || pTitle.contains('parfum'))) return true;
      if (catNameLower.contains('edt') && (pTitle.contains('edt') || pTitle.contains('toilette'))) return true;
      if (catNameLower.contains('oud') && (pTitle.contains('oud') || pTitle.contains('attar'))) return true;
      if (catNameLower.contains('niche') && (pTitle.contains('niche') || pTitle.contains('intense'))) return true;

      return false;
    }).toList();

    // If specific filter returns no match, show all available products as fallback so screen is never blank
    if (categoryProducts.isEmpty && allProducts.isNotEmpty) {
      categoryProducts = allProducts;
    }

    final isAr = ref.watch(localeProvider).languageCode == 'ar';

    String locCategoryName(String name) {
      if (!isAr) return name;
      final Map<String, String> dict = {
        'Eau de Parfum (EDP)': 'أو دو بارفيوم (EDP)',
        'Eau de Toilette (EDT)': 'أو دو تواليت (EDT)',
        'Niche and Classic': 'عطور النيش والكلاسيكية',
        'Oudh (Oriental)': 'العود والشرقيات',
        'Oriental Oud': 'العود الشرقي',
        'Attar & Oils': 'الدهن والعطور',
        'Men': 'عطور رجالية',
        'Women': 'عطور نسائية',
        'Unisex': 'عطور للجنسين',
        'Featured Fragrances': 'العطور المميزة',
        'New Arrivals': 'وصل حديثاً',
        'Best Sellers': 'الأكثر مبيعاً',
        'Gift Collections': 'مجموعات الهدايا',
      };
      return dict[name] ?? dict[name.trim()] ?? name;
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        titleSpacing: 16,
        title: Row(
          children: [
            Text(
              isAr ? 'الفئات' : 'CATEGORIES',
              style: GoogleFonts.montserrat(
                color: AppTheme.textNeutral,
                fontSize: R.font(context, 13),
                fontWeight: FontWeight.w800,
                letterSpacing: 2.0,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.primaryRose.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                isAr ? '${categoryProducts.length} منتج' : '${categoryProducts.length} ITEMS',
                style: GoogleFonts.poppins(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryRose,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.search, size: 20, color: AppTheme.textNeutral),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const SearchScreen()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: AnimatedBackground(
        child: Column(
          children: [
            // ── 1. Top Main Categories Bar (Horizontal Scroll) ──
            Container(
              height: 52,
              color: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: categoriesList.length,
                itemBuilder: (context, index) {
                  final cat = categoriesList[index];
                  final isSelected = index == _selectedCategoryIndex;
                  final catNameEn = cat['name']?.toString() ?? '';
                  final catNameAr = cat['name_ar'] ?? cat['nameAr'];
                  final catName = (isAr && catNameAr != null && catNameAr.toString().isNotEmpty)
                      ? catNameAr.toString()
                      : locCategoryName(catNameEn);
                  final catIcon = cat['icon'] as IconData? ?? LucideIcons.layers;

                  return GestureDetector(
                    onTap: () {
                      setState(() => _selectedCategoryIndex = index);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primaryRose : AppTheme.surfaceLight,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? AppTheme.primaryRose : AppTheme.borderLight,
                        ),
                        boxShadow: isSelected ? [
                          BoxShadow(
                            color: AppTheme.primaryRose.withValues(alpha: 0.25),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          )
                        ] : null,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            catIcon,
                            size: 15,
                            color: isSelected ? Colors.white : AppTheme.textMuted,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            catName,
                            style: GoogleFonts.montserrat(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                              color: isSelected ? Colors.white : AppTheme.textNeutral,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            const Divider(height: 1, color: AppTheme.borderLight),

            // ── 2. Full-Width Product Grid Area (Maximum Screen Space) ──
            Expanded(
              child: Container(
                color: Colors.white,
                child: CustomScrollView(
                  controller: _scrollController,
                  key: ValueKey(_selectedCategoryIndex),
                  slivers: [
                    const SliverToBoxAdapter(child: SizedBox(height: 8)),
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.67,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 12,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            if (index < 0 || index >= categoryProducts.length) {
                              return const SizedBox.shrink();
                            }
                            final productMap = categoryProducts[index] as Map<String, dynamic>;
                            return ProductCard(product: productMap);
                          },
                          childCount: categoryProducts.length,
                        ),
                      ),
                    ),
                    if (_isFetchingMore)
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 16.0),
                          child: Center(
                            child: CircularProgressIndicator(color: AppTheme.primaryRose, strokeWidth: 2.5),
                          ),
                        ),
                      ),
                    const SliverToBoxAdapter(child: SizedBox(height: 24)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

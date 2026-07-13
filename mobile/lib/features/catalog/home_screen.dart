import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import 'homepage_provider.dart';
import 'product_detail_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final PageController _bannerController = PageController();
  int _currentBannerIndex = 0;

  @override
  void dispose() {
    _bannerController.dispose();
    super.dispose();
  }

  String _getMediaUrl(String? path) {
    if (path == null || path.isEmpty) {
      return 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&q=80'; // Fallback
    }
    // Strip /kozmocart prefix if present in database path values
    String cleanPath = path.replaceAll(RegExp(r'^/kozmocart'), '');
    if (cleanPath.startsWith('http')) return cleanPath;
    if (cleanPath.startsWith('data:')) return cleanPath;
    cleanPath = cleanPath.startsWith('/') ? cleanPath : '/$cleanPath';
    return 'https://kozmocart.com$cleanPath';
  }

  List<String> _getScentNotes(Map<String, dynamic> product) {
    final notesData = product['scent_notes'];
    if (notesData is Map) {
      final top = notesData['top'] as List? ?? [];
      final heart = notesData['heart'] as List? ?? [];
      final base = notesData['base'] as List? ?? [];
      final combined = [...top, ...heart, ...base];
      if (combined.isNotEmpty) {
        return combined.map((e) => e.toString()).toSet().toList();
      }
    } else if (notesData is List) {
      return notesData.map((e) => e.toString()).toList();
    }
    return ['Bergamot', 'Rose', 'Oudh', 'Sandalwood'];
  }

  Map<String, String> _getProductRating(String id) {
    int hash = 0;
    for (int i = 0; i < id.length; i++) {
      hash = id.codeUnitAt(i) + ((hash << 5) - hash);
    }
    final rating = 4.0 + (hash.abs() % 10) / 10;
    final reviews = 5 + (hash.abs() % 95);
    return {
      'rating': rating.toStringAsFixed(1),
      'reviews': reviews.toString(),
    };
  }

  @override
  Widget build(BuildContext context) {
    final homepageAsync = ref.watch(homepageDataProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('KOZMOCART'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.black),
            onPressed: () => ref.invalidate(homepageDataProvider),
          )
        ],
      ),
      body: homepageAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryRose),
        ),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text('Failed to sync live data: $err', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(homepageDataProvider),
                  child: const Text('RETRY CONNECTION'),
                ),
              ],
            ),
          ),
        ),
        data: (data) {
          // Banners
          final layout = data['layout'] as Map<String, dynamic>? ?? {};
          final heroSlides = (layout['hero_slides'] as List?) ?? [];

          // Categories
          final categories = (data['categories'] as List?) ?? [];

          // Product groups
          final newArrivals = (data['new_arrivals'] as List?) ?? [];
          final bestsellers = (data['bestsellers'] as List?) ?? [];
          final offers = (data['offers'] as List?) ?? [];

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(homepageDataProvider);
              await ref.read(homepageDataProvider.future);
            },
            color: AppTheme.primaryRose,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Live Dynamic Hero Banner Slider
                  if (heroSlides.isNotEmpty)
                    SizedBox(
                      height: 250,
                      child: Stack(
                        children: [
                          PageView.builder(
                            controller: _bannerController,
                            onPageChanged: (index) {
                              setState(() {
                                _currentBannerIndex = index;
                              });
                            },
                            itemCount: heroSlides.length,
                            itemBuilder: (context, index) {
                              final slide = heroSlides[index] as Map<String, dynamic>;
                              final imageMobile = slide['image_mobile'] ?? slide['banner_url_mobile'] ?? slide['banner_url'] ?? slide['image'];
                              final imageResolved = _getMediaUrl(imageMobile?.toString());
                              final title = slide['title'] ?? 'The Signature Scent';
                              final subtitle = slide['subtitle'] ?? 'PREMIUM COLLECTION';
                              final desc = slide['desc'] ?? '';

                              return Container(
                                decoration: BoxDecoration(
                                  image: DecorationImage(
                                    image: NetworkImage(imageResolved),
                                    fit: BoxFit.cover,
                                    colorFilter: const ColorFilter.mode(Colors.black45, BlendMode.darken),
                                  ),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(24.0),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        subtitle.toString().toUpperCase(),
                                        style: const TextStyle(
                                          color: AppTheme.accentGold,
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 2.0,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        title.toString().toUpperCase(),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                      if (desc.toString().isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          desc.toString(),
                                          style: const TextStyle(color: Colors.white70, fontSize: 11, height: 1.4),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                          // Slider Dots
                          Positioned(
                            bottom: 12,
                            right: 16,
                            child: Row(
                              children: List.generate(heroSlides.length, (idx) {
                                return Container(
                                  width: 16,
                                  height: 2,
                                  margin: const EdgeInsets.symmetric(horizontal: 2),
                                  color: _currentBannerIndex == idx
                                      ? AppTheme.primaryRose
                                      : Colors.white30,
                                );
                              }),
                            ),
                          )
                        ],
                      ),
                    ),

                  const SizedBox(height: 20),

                  // Signature Categories from live data
                  if (categories.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20.0),
                      child: Text(
                        'SIGNATURE CATEGORIES',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                          color: Colors.black54,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 120,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: categories.length,
                        itemBuilder: (context, index) {
                          final cat = categories[index] as Map<String, dynamic>;
                          final name = cat['name'] ?? '';
                          final catImg = cat['image_url'] ?? (cat['images'] is List && (cat['images'] as List).isNotEmpty ? cat['images'][0] : cat['banner_url']);
                          final imageResolved = _getMediaUrl(catImg?.toString());

                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8.0),
                            child: Column(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(2.5),
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: LinearGradient(
                                      colors: [Color(0xFFFFB300), Color(0xFFE91E63), AppTheme.primaryRose],
                                      begin: Alignment.bottomLeft,
                                      end: Alignment.topRight,
                                    ),
                                  ),
                                  child: Container(
                                    padding: const EdgeInsets.all(2),
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Colors.white,
                                    ),
                                    child: CircleAvatar(
                                      radius: 34,
                                      backgroundImage: NetworkImage(imageResolved),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  name.toString().toUpperCase(),
                                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.black87),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  // New Arrivals live product list
                  if (newArrivals.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20.0),
                      child: Text(
                        'NEW ARRIVALS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                          color: Colors.black54,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildProductGrid(newArrivals.cast<Map<String, dynamic>>()),
                  ],

                  // Featured Bestsellers live product list
                  if (bestsellers.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20.0),
                      child: Text(
                        'FEATURED BESTSELLERS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                          color: Colors.black54,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildProductGrid(bestsellers.cast<Map<String, dynamic>>()),
                  ],

                  // Special Promo Offers Section
                  if (offers.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20.0),
                      child: Text(
                        'PROMOTIONAL OFFERS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                          color: Colors.black54,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: offers.length,
                      itemBuilder: (context, index) {
                        final offer = offers[index] as Map<String, dynamic>;
                        final title = offer['title'] ?? 'Exclusive Deal';
                        final code = offer['code'] ?? '';
                        final discountVal = offer['discount_value'] ?? '';
                        final type = offer['discount_type'] ?? '';

                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          color: AppTheme.surfaceLight,
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            title: Text(
                              title.toString().toUpperCase(),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 6.0),
                              child: Text(
                                type.toString().isNotEmpty ? '$type Discount • Code: $code' : 'Promo Code: $code',
                                style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                              ),
                            ),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryRose,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                discountVal.toString().isNotEmpty ? '$discountVal OFF' : 'CLAIM',
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ],

                  const SizedBox(height: 40),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildProductGrid(List<Map<String, dynamic>> products) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.65,
      ),
      itemCount: products.length,
      itemBuilder: (context, index) {
        final product = products[index];
        final id = product['id']?.toString() ?? '';
        final name = product['name'] ?? '';
        final desc = product['description'] ?? '';

        // Handle variant selling price extraction
        final variants = product['variants'] as List?;
        final price = (variants != null && variants.isNotEmpty)
            ? (variants[0]['selling_price'] ?? 0)
            : 0;

        // Image resolve
        final imagesList = product['images'] as List?;
        final mainImg = (imagesList != null && imagesList.isNotEmpty)
            ? imagesList[0].toString()
            : '';
        final resolvedImg = _getMediaUrl(mainImg);

        // Rating metadata extraction
        final ratingMeta = _getProductRating(id);
        final notes = _getScentNotes(product);

        // Standardize schema format for details route transition
        final detailProduct = {
          'id': id,
          'name': name,
          'price': price,
          'image_url': resolvedImg,
          'description': desc,
          'scent_notes': notes,
          'rating': ratingMeta['rating'],
          'reviews': ratingMeta['reviews'],
          'images': imagesList?.map((e) => _getMediaUrl(e.toString())).toList() ?? [resolvedImg],
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(6),
                            topRight: Radius.circular(6),
                          ),
                          image: DecorationImage(
                            image: NetworkImage(resolvedImg),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xF2FFFFFF),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppTheme.borderLight),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                ratingMeta['rating']!,
                                style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.black),
                              ),
                              const SizedBox(width: 2),
                              const Icon(Icons.star, size: 8, color: Color(0xFFFFA41C)),
                              const SizedBox(width: 2),
                              const Text('|', style: TextStyle(fontSize: 8, color: Colors.black26)),
                              const SizedBox(width: 2),
                              Text(
                                ratingMeta['reviews']!,
                                style: const TextStyle(fontSize: 8, color: Colors.black54),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name.toString().toUpperCase(),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 0.5,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        notes.join(', '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 10,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '₹$price',
                            style: const TextStyle(
                              color: AppTheme.primaryRose,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          const Icon(
                            Icons.shopping_bag_outlined,
                            size: 16,
                            color: AppTheme.primaryRose,
                          )
                        ],
                      ),
                    ],
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }
}

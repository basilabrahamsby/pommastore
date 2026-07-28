import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import 'homepage_provider.dart';
import 'product_detail_screen.dart';
import 'search_screen.dart';
import 'rewards_gallery_screen.dart';
import '../../core/widgets/cached_image.dart';
import '../../core/widgets/image_lightbox.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/animated_background.dart';
import '../../core/locale/locale_provider.dart';
final homeScrollTargetProvider = StateProvider<String?>((ref) => null);

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final PageController _bannerController = PageController();
  final ScrollController _scrollController = ScrollController();
  int _currentBannerIndex = 0;
  bool _appBarVisible = false;
  final GlobalKey _brandsKey = GlobalKey();
  final GlobalKey _offersKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      final shouldShow = _scrollController.offset > 250;
      if (shouldShow != _appBarVisible) {
        setState(() => _appBarVisible = shouldShow);
      }
    });
  }

  @override
  void dispose() {
    _bannerController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  String _getMediaUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    String cleanPath = path.replaceAll(RegExp(r'^/pommastore'), '');
    if (cleanPath.startsWith('http')) return cleanPath;
    if (cleanPath.startsWith('data:')) return cleanPath;
    cleanPath = cleanPath.startsWith('/') ? cleanPath : '/$cleanPath';
    return 'https://pommastore.com$cleanPath';
  }

  void _handleSlideNavigation(Map<String, dynamic> slide) {
    final prodSlug = slide['product_slug']?.toString();
    final prodId = slide['product_id']?.toString();
    final customLink = slide['custom_link']?.toString() ?? slide['link']?.toString() ?? '';

    if (prodSlug != null && prodSlug.isNotEmpty) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => ProductDetailScreen(
            product: {
              'slug': prodSlug,
              'id': prodId ?? prodSlug,
            },
          ),
        ),
      );
      return;
    } else if (prodId != null && prodId.isNotEmpty) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => ProductDetailScreen(
            product: {
              'slug': prodId,
              'id': prodId,
            },
          ),
        ),
      );
      return;
    }

    if (customLink.isNotEmpty) {
      final cleanLink = customLink.replaceAll('https://pommastore.com', '');
      final uri = Uri.tryParse(cleanLink);
      if (uri != null) {
        if (uri.path.contains('/product/')) {
          final slug = uri.pathSegments.last;
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => ProductDetailScreen(
                product: {
                  'slug': slug,
                  'id': slug,
                },
              ),
            ),
          );
          return;
        } else if (uri.queryParameters.containsKey('category')) {
          final catId = uri.queryParameters['category'];
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => SearchScreen(
                categoryId: catId,
                title: 'Category',
              ),
            ),
          );
          return;
        } else if (uri.queryParameters.containsKey('brand')) {
          final brandId = uri.queryParameters['brand'];
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => SearchScreen(
                brandId: brandId,
                title: 'Brand',
              ),
            ),
          );
          return;
        }
      }
    }

    // Default fallback to all-products search screen
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const SearchScreen(),
      ),
    );
  }

  void _scrollToSection(GlobalKey key) {
    final context = key.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
      );
    }
  }

  Widget _buildNavSideDrawer(BuildContext context, List<dynamic> categories) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Luxury Header with Logo
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 18, 12, 18),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(color: AppTheme.borderLight, width: 1.0),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SizedBox(
                        height: 44,
                        child: Image.asset(
                          'assets/logo.png',
                          height: 44,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) {
                            return Text(
                              'POMMASTORE',
                              style: GoogleFonts.playfairDisplay(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryRose,
                                letterSpacing: 2.0,
                              ),
                            );
                          },
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.black87, size: 22),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'LUXURY FRAGRANCE HOUSE',
                    style: GoogleFonts.montserrat(
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryRose,
                      letterSpacing: 2.5,
                    ),
                  ),
                ],
              ),
            ),

            // Navigation Links List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _drawerTile(
                    icon: Icons.home_outlined,
                    title: 'HOME',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).popUntil((route) => route.isFirst);
                      if (_scrollController.hasClients) {
                        _scrollController.animateTo(
                          0,
                          duration: const Duration(milliseconds: 500),
                          curve: Curves.easeInOut,
                        );
                      }
                    },
                  ),
                  _drawerTile(
                    icon: Icons.male_outlined,
                    title: 'MEN FRAGRANCES',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const SearchScreen(gender: 'Men', title: 'MEN FRAGRANCES'),
                        ),
                      );
                    },
                  ),
                  _drawerTile(
                    icon: Icons.female_outlined,
                    title: 'WOMEN FRAGRANCES',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const SearchScreen(gender: 'Women', title: 'WOMEN FRAGRANCES'),
                        ),
                      );
                    },
                  ),
                  _drawerTile(
                    icon: Icons.wc_outlined,
                    title: 'UNISEX FRAGRANCES',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const SearchScreen(gender: 'Unisex', title: 'UNISEX FRAGRANCES'),
                        ),
                      );
                    },
                  ),
                  _drawerTile(
                    icon: Icons.grid_view_outlined,
                    title: 'ALL PRODUCTS',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const SearchScreen(title: 'ALL PRODUCTS'),
                        ),
                      );
                    },
                  ),
                  _drawerTile(
                    icon: Icons.workspace_premium_outlined,
                    title: 'REWARDS GALLERY',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const RewardsGalleryScreen(),
                        ),
                      );
                    },
                  ),
                  _drawerTile(
                    icon: Icons.diamond_outlined,
                    title: 'ELITE BRAND HOUSES',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).popUntil((route) => route.isFirst);
                      _scrollToSection(_brandsKey);
                    },
                  ),
                  _drawerTile(
                    icon: Icons.local_offer_outlined,
                    title: 'PROMOTIONAL OFFERS',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).popUntil((route) => route.isFirst);
                      _scrollToSection(_offersKey);
                    },
                  ),

                  Consumer(
                    builder: (context, ref, _) {
                      final localeNotifier = ref.watch(localeProvider.notifier);
                      final isAr = localeNotifier.isArabic;
                      return _drawerTile(
                        icon: Icons.language_outlined,
                        title: isAr ? 'اللغة: English' : 'Language: العربية',
                        onTap: () {
                          localeNotifier.toggleLocale();
                          Navigator.of(context).pop();
                        },
                      );
                    },
                  ),

                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: Divider(color: AppTheme.borderLight),
                  ),

                  // Account & Shopping Section
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                    child: Text(
                      'ACCOUNT & SHOPPING',
                      style: GoogleFonts.montserrat(
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textMuted,
                        letterSpacing: 2.0,
                      ),
                    ),
                  ),
                  _drawerTile(
                    icon: Icons.person_outline,
                    title: 'MY ACCOUNT',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/account');
                    },
                  ),
                  _drawerTile(
                    icon: Icons.favorite_border,
                    title: 'MY WISHLIST',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/wishlist');
                    },
                  ),
                  _drawerTile(
                    icon: Icons.shopping_bag_outlined,
                    title: 'SHOPPING BAG',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/cart');
                    },
                  ),

                  if (categories.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      child: Divider(color: AppTheme.borderLight),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                      child: Text(
                        'EXPLORE CATEGORIES',
                        style: GoogleFonts.montserrat(
                          fontSize: 8,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textMuted,
                          letterSpacing: 2.0,
                        ),
                      ),
                    ),
                    ...categories.map((cat) {
                      final isAr = ref.watch(localeProvider.notifier).isArabic;
                      final nameEn = cat['name']?.toString() ?? '';
                      final nameAr = cat['name_ar']?.toString() ?? cat['nameAr']?.toString();
                      final name = (isAr && nameAr != null && nameAr.isNotEmpty) ? nameAr : nameEn;
                      final catId = cat['id']?.toString();
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                        dense: true,
                        title: Text(
                          name,
                          style: GoogleFonts.poppins(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                            color: Colors.black87,
                          ),
                        ),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 10, color: Colors.black38),
                        onTap: () {
                          Navigator.of(context).pop();
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => SearchScreen(categoryId: catId, title: name),
                            ),
                          );
                        },
                      );
                    }),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _drawerTile({required IconData icon, required String title, required VoidCallback onTap}) {
    return ListTile(
      leading: Icon(icon, size: 18, color: Colors.black87),
      title: Text(
        title,
        style: GoogleFonts.montserrat(
          fontSize: 10.5,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.5,
          color: Colors.black87,
        ),
      ),
      onTap: onTap,
    );
  }

  List<String> _getScentNotes(Map<String, dynamic> product) {
    final notesData = product['scent_notes'];
    if (notesData is Map) {
      final top = notesData['top'] as List? ?? [];
      final heart = notesData['heart'] as List? ?? [];
      final base = notesData['base'] as List? ?? [];
      final combined = [...top, ...heart, ...base];
      if (combined.isNotEmpty) return combined.map((e) => e.toString()).toSet().toList();
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
    return {
      'rating': (4.0 + (hash.abs() % 10) / 10).toStringAsFixed(1),
      'reviews': (5 + (hash.abs() % 95)).toString(),
    };
  }

  String _locText(String text, bool isAr) {
    if (!isAr) return text;
    final String key = text.trim();
    final Map<String, String> dict = {
      'SHOP BY CATEGORY': 'التسوق حسب الفئة',
      'JUST ARRIVED': 'وصل حديثاً',
      'NEW ARRIVALS': 'المنتجات الجديدة',
      'BESTSELLERS': 'الأكثر مبيعاً',
      'POPULAR PICK': 'الاختيار الشهير',
      'FAVORITE SELECTION': 'المفضلة المختارة',
      'PREMIUM BRANDS': 'العلامات التجارية المتميزة',
      'EXCLUSIVE OFFERS': 'العروض الحصرية',
      'VIEW ALL': 'عرض الكل',
      'BUY NOW': 'شراء الآن',
      'SHOP NOW': 'تسوق الآن',
      'ADD TO BAG': 'إضافة للحقيبة',
      'FOR HIM': 'للرجال',
      'FOR HER': 'للنساء',
      'SHOP MEN': 'تسوق للرجال',
      'SHOP WOMEN': 'تسوق للنساء',
      'POMMA REWARDS': 'مكافآت بوما',
      'THE PRIVILEGE COLLECTION': 'مجموعة الامتياز الفاخرة',
      'EXPLORE REWARDS': 'استكشف المكافآت',
      'ELITE PERFUMERY': 'عطور النخبة',
      'THE GLOBAL HOUSES': 'دور العطور العالمية',
      'SIGNATURE HOUSE': 'دار العطور الشهيرة',
      'EXPLORE HOUSE': 'استكشف الدار',
      'Exclusive Fragrance': 'عطور حصرية',
      'Exquisite Collection': 'تشكيلة فاخرة',
      'Top Curated Fragrances': 'أفضل العطور المختارة',
      'Prestige Selection': 'تشكيلة مرموقة',
      'THE ELITE LIST': 'قائمة النخبة',
      'HOUSE FAVORITES': 'المفضلة لدى الدار',
      'REFINED & BOLD': 'أنيق وجذاب',
      'ELEGANT & SWEET': 'أنيقة وناعمة',
      'THE PRIVILEGE COLLECTION.': 'مجموعة الامتياز الفاخرة',
      '100% Authentic Luxury': 'فخامة أصلي 100٪',
      'Sourced directly from global brand houses': 'مستورد مباشرة من دور العطور العالمية',
      'Express UAE & Gulf Delivery': 'توصيل سريع للإمارات والخليج',
      'Compliments & Samples': 'عينات وهدايا مجانية',
      '24/7 Perfumery Concierge': 'خدمة عملاء العطور 24/7',
    };
    return dict[key] ?? dict[key.toUpperCase()] ?? key;
  }

  // ── Section Header ────────────────────────────────────────────────────────
  Widget _buildSectionHeader(String title, String subtitle, {VoidCallback? onViewAll}) {
    final isAr = ref.watch(localeProvider).languageCode == 'ar';
    final localizedTitle = _locText(title, isAr);
    final localizedSubtitle = _locText(subtitle, isAr);
    final viewAllText = isAr ? 'عرض الكل' : 'VIEW ALL';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            localizedSubtitle.toUpperCase(),
            style: GoogleFonts.montserrat(
              fontSize: 8,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF8E8E93),
              letterSpacing: 2.0,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                localizedTitle.toUpperCase(),
                style: GoogleFonts.playfairDisplay(
                  fontSize: 22,
                  fontWeight: FontWeight.normal,
                  color: Colors.black,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                  child: Divider(color: Color(0xFFE5E5EA), thickness: 1)),
              if (onViewAll != null) ...[
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: onViewAll,
                  child: Text(
                    viewAllText,
                    style: GoogleFonts.montserrat(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryRose,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMyntraHeader(BuildContext context) {
    return Consumer(
      builder: (context, ref, child) {
        final localeNotifier = ref.read(localeProvider.notifier);
        final currentLocale = ref.watch(localeProvider);
        final isAr = currentLocale.languageCode == 'ar';

        return SafeArea(
          bottom: false,
          top: true,
          child: Container(
            padding: const EdgeInsets.fromLTRB(4, 4, 6, 4),
            color: Colors.white,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.menu, color: AppTheme.textNeutral, size: 24),
                  onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                ),
                InkWell(
                  onTap: () => localeNotifier.toggleLocale(),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.borderLight, width: 0.8),
                    ),
                    child: Text(
                      isAr ? 'EN' : 'عربي',
                      style: GoogleFonts.montserrat(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primaryRose,
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                // Centered App Logo
                SizedBox(
                  height: 38,
                  child: Image.asset(
                    'assets/logo.png',
                    height: 38,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return Text(
                        'POMMASTORE',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryRose,
                          letterSpacing: 2.0,
                        ),
                      );
                    },
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.search, color: AppTheme.textNeutral, size: 20),
                  onPressed: () => context.push('/search'),
                ),
                IconButton(
                  icon: const Icon(Icons.favorite_border, color: AppTheme.textNeutral, size: 20),
                  onPressed: () => context.push('/wishlist'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStoryCategoryBubbles(List<dynamic> categories) {
    final isAr = ref.watch(localeProvider.notifier).isArabic;
    final List<Map<String, dynamic>> items = [
      {
        'name': isAr ? 'رجالي' : 'MEN',
        'icon': Icons.male_outlined,
        'gradient': [AppTheme.primaryRose, const Color(0xFFFF905A)],
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => SearchScreen(gender: 'Men', title: isAr ? 'عطور رجالية' : 'MEN FRAGRANCES'),
            ),
          );
        },
      },
      {
        'name': isAr ? 'نسائي' : 'WOMEN',
        'icon': Icons.female_outlined,
        'gradient': [const Color(0xFFEC4899), const Color(0xFFF472B6)],
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => SearchScreen(gender: 'Women', title: isAr ? 'عطور نسائية' : 'WOMEN FRAGRANCES'),
            ),
          );
        },
      },
      {
        'name': isAr ? 'الجنسين' : 'UNISEX',
        'icon': Icons.wc_outlined,
        'gradient': [const Color(0xFF8B5CF6), const Color(0xFFC084FC)],
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => SearchScreen(gender: 'Unisex', title: isAr ? 'عطور للجنسين' : 'UNISEX FRAGRANCES'),
            ),
          );
        },
      },
      {
        'name': isAr ? 'الكل' : 'ALL',
        'icon': Icons.grid_view_outlined,
        'gradient': [AppTheme.primaryRose, AppTheme.accentGold],
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => SearchScreen(title: isAr ? 'جميع المنتجات' : 'ALL PRODUCTS'),
            ),
          );
        },
      },
      {
        'name': isAr ? 'المكافآت' : 'REWARDS',
        'icon': Icons.workspace_premium_outlined,
        'gradient': [const Color(0xFFF59E0B), const Color(0xFFFCD34D)],
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => const RewardsGalleryScreen(),
            ),
          );
        },
      },
      {
        'name': isAr ? 'الماركات' : 'BRANDS',
        'icon': Icons.diamond_outlined,
        'gradient': [const Color(0xFF10B981), const Color(0xFF34D399)],
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => SearchScreen(title: isAr ? 'تشكيلة الماركات الرسمية' : 'OFFICIAL BRAND COLLECTIONS'),
            ),
          );
        },
      },
      {
        'name': isAr ? 'العروض' : 'OFFERS',
        'icon': Icons.local_offer_outlined,
        'gradient': [const Color(0xFFEF4444), const Color(0xFFF87171)],
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => SearchScreen(
                onSale: true,
                title: isAr ? 'عروض وصفقات حصرية' : 'EXCLUSIVE OFFERS & DEALS',
              ),
            ),
          );
        },
      },
    ];

    return Container(
      height: 96,
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          final gradientColors = item['gradient'] as List<Color>;
          final void Function() onTapAction = item['onTap'] as void Function();
          return GestureDetector(
            onTap: onTapAction,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 8),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: gradientColors,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                      child: CircleAvatar(
                        radius: 22,
                        backgroundColor: AppTheme.surfaceLight,
                        child: Icon(
                          item['icon'] as IconData,
                          size: 18,
                          color: gradientColors[0],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item['name'] as String,
                    style: GoogleFonts.montserrat(
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textNeutral,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCenteredSectionHeader(String title, String subtitle) {
    final isAr = ref.watch(localeProvider.notifier).isArabic;
    final localizedTitle = _locText(title, isAr);
    final localizedSubtitle = _locText(subtitle, isAr);

    return Center(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            localizedSubtitle.toUpperCase(),
            style: GoogleFonts.montserrat(
              fontSize: 8,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF8E8E93),
              letterSpacing: 2.0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            localizedTitle.toUpperCase(),
            style: GoogleFonts.playfairDisplay(
              fontSize: 22,
              fontWeight: FontWeight.normal,
              color: Colors.black,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: 32,
            height: 2,
            color: AppTheme.accentGold,
          ),
        ],
      ),
    );
  }

  // ── In-Between Ad Banner (left+right split card) ──────────────────────────
  Widget _buildAdBanner(Map<String, dynamic> slide, {bool isAd3 = false}) {
    final isAr = ref.watch(localeProvider).languageCode == 'ar';

    final leftImgRaw = (slide['left_image_mobile'] ?? slide['left_image'])?.toString();
    final leftImg = _getMediaUrl(leftImgRaw != null && leftImgRaw.isNotEmpty 
        ? leftImgRaw 
        : '/model-banner-1.png');

    final rightImgRaw = (slide['right_image_mobile'] ?? slide['right_image'])?.toString();
    final rightImg = _getMediaUrl(rightImgRaw != null && rightImgRaw.isNotEmpty 
        ? rightImgRaw 
        : (isAd3 ? '/model-banner-3.png' : '/model-banner-2.png'));

    final leftTitleRaw = slide['left_title']?.toString();
    final leftTitle = leftTitleRaw != null && leftTitleRaw.isNotEmpty 
        ? leftTitleRaw 
        : (isAd3 ? 'Top Curated Fragrances' : 'Exclusive Fragrance');

    final leftSubtitleRaw = slide['left_subtitle']?.toString();
    final leftSubtitle = leftSubtitleRaw != null && leftSubtitleRaw.isNotEmpty 
        ? leftSubtitleRaw 
        : 'Exquisite Collection';

    final leftDescRaw = slide['left_desc']?.toString();
    final leftDesc = leftDescRaw != null && leftDescRaw.isNotEmpty 
        ? leftDescRaw 
        : 'We offer the best niche fragrances on the market selected by our team of experts.';

    final rightTitleRaw = slide['right_title']?.toString();
    final rightTitle = rightTitleRaw != null && rightTitleRaw.isNotEmpty 
        ? rightTitleRaw 
        : (isAd3 ? 'Top Curated Fragrances' : 'Premium Fragrances');

    final rightSubtitleRaw = slide['right_subtitle']?.toString();
    final rightSubtitle = rightSubtitleRaw != null && rightSubtitleRaw.isNotEmpty 
        ? rightSubtitleRaw 
        : (isAd3 ? 'Prestige Selection' : 'Prestige Selection');

    final rightDescRaw = slide['right_desc']?.toString();
    final rightDesc = rightDescRaw != null && rightDescRaw.isNotEmpty 
        ? rightDescRaw 
        : 'We offer the best niche fragrances on the market selected by our team of experts.';

    Widget bannerCard(
        String imgUrl, String subtitle, String title, String desc, Color bg, String linkTarget) {
      final locSub = _locText(subtitle, isAr);
      final locTitle = _locText(title, isAr);
      final locDesc = _locText(desc, isAr);
      final ctaText = isAr ? 'شراء الآن' : 'BUY NOW';

      return Container(
        height: 170,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(4),
          color: bg,
        ),
        child: Row(
          children: [
            // Image half
            Expanded(
              flex: 4,
              child: GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => ImageLightboxScreen(
                        imageUrls: [imgUrl],
                        initialIndex: 0,
                      ),
                    ),
                  );
                },
                child: CachedImage(
                  imageUrl: imgUrl,
                  fit: BoxFit.cover,
                  height: 170,
                  errorWidget: Container(color: bg.withValues(alpha: 0.3)),
                ),
              ),
            ),
            // Text half
            Expanded(
              flex: 6,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (locSub.isNotEmpty)
                      Text(
                        locSub.toUpperCase(),
                        style: GoogleFonts.montserrat(
                          fontSize: 7,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2.0,
                          color: Colors.white70,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 4),
                    Text(
                      locTitle.toUpperCase(),
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 14,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.8,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (locDesc.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        locDesc,
                        style: GoogleFonts.poppins(
                          fontSize: 9,
                          color: Colors.white70,
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: () {
                        _handleSlideNavigation({'custom_link': linkTarget});
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.black,
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Text(
                          ctaText,
                          style: GoogleFonts.montserrat(
                            fontSize: 7,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Only show if at least one side has content
    final hasContent = leftTitle.isNotEmpty || rightTitle.isNotEmpty;
    if (!hasContent) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          if (leftTitle.isNotEmpty)
            bannerCard(leftImg, leftSubtitle, leftTitle, leftDesc,
                const Color(0xFFa5682a), slide['left_link']?.toString() ?? ''),
          if (leftTitle.isNotEmpty && rightTitle.isNotEmpty)
            const SizedBox(height: 12),
          if (rightTitle.isNotEmpty)
            bannerCard(rightImg, rightSubtitle, rightTitle, rightDesc,
                const Color(0xFF5c4033), slide['right_link']?.toString() ?? ''),
        ],
      ),
    );
  }

  // ── Elite Brand Houses Section ─────────────────────────────────────────────
  Widget _buildBrandsSection(List<dynamic> brands) {
    if (brands.isEmpty) return const SizedBox.shrink();
    final isAr = ref.watch(localeProvider).languageCode == 'ar';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 32),
        _buildSectionHeader('Elite Perfumery', 'The Global Houses'),
        const SizedBox(height: 16),
        SizedBox(
          height: 310,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: brands.length,
            itemBuilder: (context, index) {
              final brand = brands[index] as Map<String, dynamic>;
              final nameEn = brand['name'] ?? '';
              final nameAr = brand['name_ar'] ?? brand['nameAr'];
              final name = (isAr && nameAr != null && nameAr.toString().isNotEmpty) ? nameAr.toString() : nameEn.toString();
              final logoUrl = _getMediaUrl(brand['logo_url']?.toString());
              final bannerUrl = _getMediaUrl((brand['brand_banner'] ?? brand['banner_url'])?.toString());
              final descEn = brand['description'] ?? 'Discover the signature collections and exclusive raw extractions crafted by the luxury house of $name.';
              final descAr = brand['description_ar'] ?? brand['descriptionAr'];
              final desc = (isAr && descAr != null && descAr.toString().isNotEmpty) ? descAr.toString() : descEn.toString();

              final brandId = brand['id']?.toString();
              final brandTitle = name.toString().toUpperCase();

              return GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => SearchScreen(
                        brandId: brandId,
                        title: brandTitle.isNotEmpty ? brandTitle : (isAr ? 'تشكيلة الماركة' : 'BRAND COLLECTION'),
                      ),
                    ),
                  );
                },
                child: Container(
                  width: 250,
                  margin: const EdgeInsets.only(right: 16, bottom: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.borderLight),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      )
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Banner Image
                        Container(
                          height: 100,
                          color: const Color(0xFFF5F5F5),
                          child: CachedImage(
                            imageUrl: bannerUrl,
                            fit: BoxFit.cover,
                            errorWidget: const Icon(Icons.image_outlined, color: Colors.black12, size: 30),
                          ),
                        ),
                        // Content details
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                // Small logo circle (floating style)
                                Transform.translate(
                                  offset: const Offset(0, -32),
                                  child: Container(
                                    width: 50,
                                    height: 50,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.1),
                                          blurRadius: 4,
                                        )
                                      ],
                                    ),
                                    child: ClipOval(
                                      child: CachedImage(
                                        imageUrl: logoUrl,
                                        fit: BoxFit.contain,
                                        errorWidget: Center(
                                          child: Text(
                                            name.isNotEmpty ? name[0] : '✦',
                                            style: GoogleFonts.playfairDisplay(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.accentGold,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                Transform.translate(
                                  offset: const Offset(0, -20),
                                  child: Column(
                                    children: [
                                      Text(
                                        isAr ? 'دار متميزة' : 'SIGNATURE HOUSE',
                                        style: GoogleFonts.montserrat(
                                          color: AppTheme.accentGold,
                                          fontSize: 7,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 1.5,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        name.toString().toUpperCase(),
                                        style: GoogleFonts.playfairDisplay(
                                          fontSize: 14,
                                          fontWeight: FontWeight.normal,
                                          color: Colors.black,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        desc,
                                        style: GoogleFonts.poppins(
                                          fontSize: 9,
                                          color: AppTheme.textMuted,
                                          height: 1.4,
                                        ),
                                        maxLines: 2,
                                        textAlign: TextAlign.center,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                                const Spacer(),
                                // Explore House Button
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: const Color(0xFFE5E5EA)),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        isAr ? 'استكشف الدار' : 'EXPLORE HOUSE',
                                        style: GoogleFonts.montserrat(
                                          fontSize: 7,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 1.0,
                                          color: Colors.black87,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.chevron_right, size: 10, color: Colors.black54),
                                    ],
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
              );
            },
          ),
        ),
      ],
    );
  }

  // ── Editorial (For Him, Privilege Collection, For Her) Section ─────────────
  Widget _buildEditorialSection(List<dynamic> loyaltyRewards, Map<String, dynamic> layout) {
    final isAr = ref.watch(localeProvider).languageCode == 'ar';
    final splitBanners = layout['split_banners'] as Map<String, dynamic>? ?? {};
    final menImg = _getMediaUrl((splitBanners['men_mobile'] ?? splitBanners['men'])?.toString() ?? '/banner-men.png');
    final womenImg = _getMediaUrl((splitBanners['women_mobile'] ?? splitBanners['women'])?.toString() ?? '/banner-women.png');

    final List<String> galleryUrls = [];
    for (final r in loyaltyRewards) {
      if (r is Map) {
        final img = _getMediaUrl(r['image_url']?.toString() ?? '');
        if (img.isNotEmpty) galleryUrls.add(img);
      }
    }
    if (galleryUrls.isEmpty) {
      galleryUrls.addAll([
        _getMediaUrl('/model-banner-1.png'),
        _getMediaUrl('/model-banner-2.png'),
        _getMediaUrl('/model-banner-3.png'),
      ]);
    }

    void openRewardsGallery() {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => RewardsGalleryScreen(
            initialRewards: loyaltyRewards,
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 32),
        // 1. Column 1: For Him
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => SearchScreen(gender: 'Men', title: isAr ? 'عطور رجالية' : 'MEN FRAGRANCES'),
                ),
              );
            },
            child: Container(
              height: 240,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                color: Colors.grey.shade900,
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedImage(
                    imageUrl: menImg,
                    fit: BoxFit.cover,
                    errorWidget: Container(color: Colors.black26),
                  ),
                  Container(color: Colors.black38),
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          isAr ? 'أنيق وجذاب' : 'REFINED & BOLD',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white70,
                            letterSpacing: 2.0,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          isAr ? 'للرجال' : 'FOR HIM',
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 28,
                            fontWeight: FontWeight.normal,
                            color: Colors.white,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            isAr ? 'تسوق للرجال' : 'SHOP MEN',
                            style: GoogleFonts.montserrat(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              letterSpacing: 2.0,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(height: 24),

        // 2. Column 2: The Privilege Collection (Loyalty Rewards Card)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.surfaceLight,
              border: Border.all(color: AppTheme.borderLight),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Column(
              children: [
                Text(
                  isAr ? 'مكافآت بوما' : 'POMMA REWARDS',
                  style: GoogleFonts.montserrat(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textMuted,
                    letterSpacing: 2.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isAr ? 'مجموعة الامتياز الفاخرة.' : 'THE PRIVILEGE COLLECTION.',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Container(
                  width: 32,
                  height: 1.5,
                  color: AppTheme.primaryRose,
                ),
                const SizedBox(height: 20),

                // Central Reward card (if rewards are available)
                if (loyaltyRewards.isNotEmpty) ...[
                  Builder(builder: (context) {
                    final reward = loyaltyRewards[0] as Map<String, dynamic>;
                    final rewardImg = _getMediaUrl(reward['image_url']?.toString() ?? '');
                    final rewardNameEn = reward['name']?.toString() ?? 'Exclusive Reward';
                    final rewardNameAr = reward['name_ar']?.toString() ?? reward['nameAr']?.toString();
                    final rewardName = (isAr && rewardNameAr != null && rewardNameAr.isNotEmpty) ? rewardNameAr : rewardNameEn;

                    final rewardType = reward['reward_type']?.toString() ?? 'MEMBERSHIP';
                    final rewardDescEn = reward['description']?.toString() ?? '';
                    final rewardDescAr = reward['description_ar']?.toString() ?? reward['descriptionAr']?.toString();
                    final rewardDesc = (isAr && rewardDescAr != null && rewardDescAr.isNotEmpty) ? rewardDescAr : rewardDescEn;

                    final pointCost = reward['point_cost']?.toString() ?? '';

                    return GestureDetector(
                      onTap: () => openRewardsGallery(),
                      child: Container(
                        height: 140,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade900,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            CachedImage(
                              imageUrl: rewardImg,
                              fit: BoxFit.cover,
                              opacity: 0.5,
                              errorWidget: Container(color: Colors.black26),
                            ),
                            Container(color: Colors.black38),
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    rewardType.toUpperCase(),
                                    style: GoogleFonts.montserrat(
                                      fontSize: 8,
                                      fontWeight: FontWeight.w900,
                                      color: const Color(0xFFC9A84C), // accentGold
                                      letterSpacing: 2.0,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    rewardName,
                                    style: GoogleFonts.playfairDisplay(
                                      fontSize: 14,
                                      fontStyle: FontStyle.italic,
                                      color: Colors.white,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (rewardDesc.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      rewardDesc,
                                      style: GoogleFonts.poppins(
                                        fontSize: 9,
                                        color: Colors.white70,
                                        height: 1.4,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.only(top: 8),
                                    decoration: const BoxDecoration(
                                      border: Border(top: BorderSide(color: Colors.white10)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          pointCost.isNotEmpty ? (isAr ? '$pointCost نقطة' : '$pointCost POINTS') : (isAr ? 'استكشف' : 'EXPLORE'),
                                          style: GoogleFonts.montserrat(
                                            fontSize: 8,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            letterSpacing: 1.5,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        const Icon(Icons.arrow_forward, size: 8, color: Colors.white),
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
                  }),
                ],

                const SizedBox(height: 20),
                GestureDetector(
                  onTap: () => openRewardsGallery(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.black12),
                      borderRadius: BorderRadius.circular(16),
                      color: Colors.white,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          isAr ? 'عرض المعرض كامل' : 'VIEW FULL GALLERY',
                          style: GoogleFonts.montserrat(
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2.0,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_forward, size: 10, color: Colors.black87),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 24),

        // 3. Column 3: For Her
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => SearchScreen(gender: 'Women', title: isAr ? 'عطور نسائية' : 'WOMEN FRAGRANCES'),
                ),
              );
            },
            child: Container(
              height: 240,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                color: Colors.grey.shade900,
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedImage(
                    imageUrl: womenImg,
                    fit: BoxFit.cover,
                    errorWidget: Container(color: Colors.black26),
                  ),
                  Container(color: Colors.black38),
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          isAr ? 'أنيقة وناعمة' : 'ELEGANT & SWEET',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white70,
                            letterSpacing: 2.0,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          isAr ? 'للنساء' : 'FOR HER',
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 28,
                            fontWeight: FontWeight.normal,
                            color: Colors.white,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            isAr ? 'تسوق للنساء' : 'SHOP WOMEN',
                            style: GoogleFonts.montserrat(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              letterSpacing: 2.0,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── House Favorites Section (Vertical Arches without cropping) ──────────────
  Widget _buildVerticalArchedCard(Map<String, dynamic> item, double width, double height) {
    final name = item['name']?.toString() ?? '';
    final imgUrl = _getMediaUrl(item['img']?.toString() ?? '');

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(55)),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          )
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (imgUrl.isNotEmpty)
            CachedImage(
              imageUrl: imgUrl, 
              fit: BoxFit.cover,
              alignment: Alignment.topCenter, // keeps the top of the bottle visible
            )
          else
            Container(color: const Color(0xFFF5F8F6)),
          // Gradient bottom overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withValues(alpha: 0.0),
                    Colors.black.withValues(alpha: 0.85),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
              alignment: Alignment.bottomCenter,
              child: Text(
                name.toUpperCase(),
                style: GoogleFonts.montserrat(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHouseFavorites(List<dynamic> houseFavorites) {
    if (houseFavorites.isEmpty) return const SizedBox.shrink();

    return LayoutBuilder(
      builder: (context, constraints) {
        final screenWidth = constraints.maxWidth;
        // 3 columns layout: 16px horizontal screen padding, 12px gap between items
        final cardWidth = (screenWidth - 32 - 24) / 3;
        final cardHeight = cardWidth * 1.8; // tall aspect ratio to fit full perfume bottles

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 32),
            _buildSectionHeader('House Favorites', 'The Elite List'),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 12,
                runSpacing: 16,
                alignment: WrapAlignment.center,
                children: houseFavorites.map((item) {
                  return _buildVerticalArchedCard(
                    item as Map<String, dynamic>,
                    cardWidth,
                    cardHeight,
                  );
                }).toList(),
              ),
            ),
          ],
        );
      },
    );
  }

  // ── Full-Width Ad Banner (for grid_ads_2) ──────────────────────────────────
  Widget _buildFullWidthAdBanner(Map<String, dynamic> slide) {
    final imgRaw = (slide['image_mobile'] ?? slide['image'])?.toString();
    final imgUrl = _getMediaUrl(imgRaw != null && imgRaw.isNotEmpty ? imgRaw : '/model-banner-3.png');

    final titleRaw = slide['title']?.toString();
    final title = titleRaw != null && titleRaw.isNotEmpty ? titleRaw : 'Top Curated Fragrances';

    final subtitleRaw = slide['subtitle']?.toString();
    final subtitle = subtitleRaw != null && subtitleRaw.isNotEmpty ? subtitleRaw : 'Prestige Selection';

    final descRaw = slide['desc']?.toString();
    final desc = descRaw != null && descRaw.isNotEmpty 
        ? descRaw 
        : 'We offer the best niche fragrances on the market selected by our team of experts. Experience a masterfully curated collection of prestige fragrances, hand-selected to define your signature presence.';

    if (title.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        height: 200,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(4),
          color: const Color(0xFF1B3B22), // green bg matching web
        ),
        child: Row(
          children: [
            // Left: Text half
            Expanded(
              flex: 5,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (subtitle.isNotEmpty)
                      Text(
                        subtitle.toUpperCase(),
                        style: GoogleFonts.montserrat(
                          fontSize: 8,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2.0,
                          color: Colors.white70,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 6),
                    Text(
                      title.toUpperCase(),
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.0,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (desc.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        desc,
                        style: GoogleFonts.poppins(
                          fontSize: 9,
                          color: Colors.white70,
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: () {
                        final linkTarget = slide['link']?.toString() ?? slide['custom_link']?.toString() ?? '';
                        _handleSlideNavigation({'custom_link': linkTarget});
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black,
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Text(
                          'BUY NOW',
                          style: GoogleFonts.montserrat(
                            fontSize: 8,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Right: Image half
            Expanded(
              flex: 4,
              child: GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => ImageLightboxScreen(
                        imageUrls: [imgUrl],
                        initialIndex: 0,
                      ),
                    ),
                  );
                },
                child: CachedImage(
                  imageUrl: imgUrl,
                  fit: BoxFit.cover,
                  height: 200,
                  errorWidget: Container(color: const Color(0xFF1B3B22).withValues(alpha: 0.3)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Product Grid ──────────────────────────────────────────────────────────
  Widget _buildProductGrid(List<Map<String, dynamic>> products) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.66,
      ),
      itemCount: products.length,
      itemBuilder: (context, index) => ProductCard(product: products[index]),
    );
  }

  Widget _buildProductGridUnused(List<Map<String, dynamic>> products) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.66,
      ),
      itemCount: products.length,
      itemBuilder: (context, index) {
        final product = products[index];
        final id = product['id']?.toString() ?? '';
        final name = product['name'] ?? '';
        final desc = product['description'] ?? '';

        final variants = product['variants'] as List?;
        num sellingPrice = 0;
        num mrp = 0;
        if (variants != null && variants.isNotEmpty) {
          final v = variants[0] as Map<String, dynamic>;
          sellingPrice = (v['selling_price'] ?? v['price'] ?? 0) as num;
          mrp = (v['mrp'] ?? v['compare_at_price'] ?? v['original_price'] ?? 0) as num;
        }

        final hasDiscount = mrp > 0 && mrp > sellingPrice;
        final discountPct = hasDiscount
            ? (((mrp - sellingPrice) / mrp) * 100).round()
            : 0;

        final imagesList = product['images'] as List?;
        final mainImg = (imagesList != null && imagesList.isNotEmpty)
            ? imagesList[0].toString()
            : '';
        final resolvedImg = _getMediaUrl(mainImg);

        final ratingMeta = _getProductRating(id);
        final notes = _getScentNotes(product);

        final detailProduct = {
          'id': id,
          'slug': product['slug']?.toString() ?? id,
          'brand_id': product['brand_id']?.toString() ?? '',
          'category_id': product['category_id']?.toString() ?? '',
          'name': name,
          'brand_name': (product['brand_name'] ?? product['brand'] ?? '').toString(),
          'price': sellingPrice,
          'mrp': mrp,
          'image_url': resolvedImg,
          'description': desc,
          'short_description': product['short_description']?.toString() ?? desc,
          'full_description': product['full_description']?.toString() ?? '',
          'scent_notes': notes,
          'rating': ratingMeta['rating'],
          'reviews': ratingMeta['reviews'],
          'images': imagesList?.map((e) => _getMediaUrl(e.toString())).toList() ??
              [resolvedImg],
        };

        // Local state for wishlist and cart quantity
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
                    // ── Product Image with overlays ────────────────────────
                    Expanded(
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          AutoCycleImage(
                            imageUrls: (detailProduct['images'] as List? ?? []).cast<String>(),
                            id: id,
                            fit: BoxFit.cover,
                          ),
                          // Discount badge — top left
                          if (hasDiscount)
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
                                child: Text('$discountPct% OFF',
                                    style: GoogleFonts.montserrat(
                                        color: Colors.white,
                                        fontSize: 8,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 0.5)),
                              ),
                            ),
                          // Favorite (heart) button — top right
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
                          // Rating chip — bottom left
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
                                  Text(ratingMeta['rating']!,
                                      style: GoogleFonts.poppins(
                                          fontSize: 8,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.black)),
                                  const SizedBox(width: 2),
                                  const Icon(Icons.star,
                                      size: 8, color: Color(0xFFFFA41C)),
                                  const SizedBox(width: 2),
                                  Text('(${ratingMeta['reviews']})',
                                      style: GoogleFonts.poppins(
                                          fontSize: 8, color: Colors.black54)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // ── Product Info ───────────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.fromLTRB(10, 8, 10, 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Product name — first (matches storefront ProductCard line 297)
                          Text(
                            name.toString().toUpperCase(),
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
                          // Brand name — below (matches storefront ProductCard line 300)
                          if ((product['brand_name'] ??
                                      product['brand'] ??
                                      '')
                                  .toString()
                                  .isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 1),
                              child: Text(
                                (product['brand_name'] ??
                                        product['brand'] ??
                                        '')
                                    .toString()
                                    .toUpperCase(),
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
                              Text('₹$sellingPrice',
                                  style: GoogleFonts.poppins(
                                      color: Colors.black,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13)),
                              if (hasDiscount) ...[
                                Text('₹$mrp',
                                    style: GoogleFonts.poppins(
                                        color: const Color(0xFFA3A3A3),
                                        fontSize: 10,
                                        decoration: TextDecoration.lineThrough,
                                        decorationColor:
                                            const Color(0xFFA3A3A3))),
                                Text('$discountPct% off',
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
                    // ── Action Buttons ─────────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
                      child: cartQty > 0
                          // In-bag state: qty stepper + Buy Now
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
                                        // Minus
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
                                        // Qty label
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
                                        // Plus
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
                                // Buy Now
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
                          // Default state: Add to Bag + Buy Now
                          : Row(
                              children: [
                                // Add to Bag
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
                                // Buy Now
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
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<String?>(homeScrollTargetProvider, (previous, next) {
      if (next == 'brands') {
        _scrollToSection(_brandsKey);
        ref.read(homeScrollTargetProvider.notifier).state = null;
      } else if (next == 'offers') {
        _scrollToSection(_offersKey);
        ref.read(homeScrollTargetProvider.notifier).state = null;
      }
    });

    final homepageAsync = ref.watch(homepageDataProvider);

    return Scaffold(
      key: _scaffoldKey,
      drawer: homepageAsync.when(
        data: (data) => _buildNavSideDrawer(context, (data['categories'] as List?) ?? []),
        loading: () => _buildNavSideDrawer(context, []),
        error: (_, __) => _buildNavSideDrawer(context, []),
      ),
      body: homepageAsync.when(
        loading: () => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/logo.png',
                height: 32,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 20),
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  color: AppTheme.primaryRose,
                  strokeWidth: 1.5,
                ),
              ),
            ],
          ),
        ),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text('Failed to sync live data: $err',
                    textAlign: TextAlign.center),
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
          final layout = data['layout'] as Map<String, dynamic>? ?? {};
          final heroSlides = (layout['hero_slides'] as List?) ?? [];
          final categories = (data['categories'] as List?) ?? [];
          final newArrivals = (data['new_arrivals'] as List?) ?? [];
          final bestsellers = (data['bestsellers'] as List?) ?? [];
          final offers = (data['offers'] as List?) ?? [];
          final brands = (data['brands'] as List?) ?? [];
          final rewards = (data['rewards'] as List?) ?? [];
          final houseFavorites = (layout['house_favorites'] as List?) ?? [];
          final apiBadges = (layout['trust_badges'] as List?) ?? [];

          // Pre-cache hero slides for instant first-time image rendering
          if (heroSlides.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                for (final slide in heroSlides.take(4)) {
                  if (slide is Map) {
                    final raw = (slide['banner_url'] ?? slide['image'] ?? slide['banner_url_mobile'] ?? slide['image_mobile'])?.toString();
                    if (raw != null && raw.isNotEmpty) {
                      final url = _getMediaUrl(raw);
                      if (url.isNotEmpty) {
                        precacheImage(NetworkImage(url), context);
                      }
                    }
                  }
                }
              }
            });
          }

          // Between-product ad banners from CMS layout (with web fallbacks)
          final gridAds1Raw = layout['grid_ads_1'];
          final List<dynamic> gridAds1 = gridAds1Raw is List ? gridAds1Raw : [];
          final Map<String, dynamic> ad1 = gridAds1.isNotEmpty
              ? gridAds1[0] as Map<String, dynamic>
              : {
                  'left_image': '/model-banner-1.png',
                  'left_title': 'Exclusive Fragrance',
                  'left_subtitle': 'Exquisite Collection',
                  'left_desc': 'We offer the best niche fragrances on the market selected by our team of experts.',
                  'left_product_id': '',
                  'right_image': '/model-banner-2.png',
                  'right_title': 'Premium Fragrances',
                  'right_subtitle': 'Prestige Selection',
                  'right_desc': 'We offer the best niche fragrances on the market selected by our team of experts.',
                  'right_product_id': '',
                };

          final gridAds2Raw = layout['grid_ads_2'];
          final List<dynamic> gridAds2 = gridAds2Raw is List ? gridAds2Raw : [];
          final Map<String, dynamic> ad2 = gridAds2.isNotEmpty
              ? gridAds2[0] as Map<String, dynamic>
              : {
                  'image': '/model-banner-3.png',
                  'title': 'Top Curated Fragrances',
                  'subtitle': 'Prestige Selection',
                  'desc': 'We offer the best niche fragrances on the market selected by our team of experts. Experience a masterfully curated collection of prestige fragrances, hand-selected to define your signature presence.',
                  'product_id': '',
                };

          final gridAds3Raw = layout['grid_ads_3'];
          final List<dynamic> gridAds3 = gridAds3Raw is List ? gridAds3Raw : [];
          final Map<String, dynamic> ad3 = gridAds3.isNotEmpty
              ? gridAds3[0] as Map<String, dynamic>
              : {
                  'left_image': '/model-banner-1.png',
                  'left_title': 'Top Curated Fragrances',
                  'left_subtitle': 'Exquisite Collection',
                  'left_desc': 'We offer the best niche fragrances on the market selected by our team of experts.',
                  'left_product_id': '',
                  'right_image': '/model-banner-3.png',
                  'right_title': 'Top Curated Fragrances',
                  'right_subtitle': 'Prestige Selection',
                  'right_desc': 'We offer the best niche fragrances on the market selected by our team of experts.',
                  'right_product_id': '',
                };

          return AnimatedBackground(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(homepageDataProvider);
                await ref.read(homepageDataProvider.future);
              },
              color: AppTheme.primaryRose,
              child: SingleChildScrollView(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── Myntra Top Header (Search Pill + Actions) ──
                  _buildMyntraHeader(context),
                  
                  // ── Myntra Story Category Bubbles ──
                  _buildStoryCategoryBubbles(categories),


                  if (heroSlides.isNotEmpty)
                    AspectRatio(
                      aspectRatio: 16 / 9,
                      child: Stack(
                        children: [
                          PageView.builder(
                            controller: _bannerController,
                            onPageChanged: (i) =>
                                setState(() => _currentBannerIndex = i),
                            itemCount: heroSlides.length,
                            itemBuilder: (context, index) {
                              final slide =
                                  heroSlides[index] as Map<String, dynamic>;
                              final imageResolved = _getMediaUrl(
                                  (slide['banner_url'] ??
                                          slide['image'] ??
                                          slide['banner_url_mobile'] ??
                                          slide['image_mobile'])
                                      ?.toString());
                              final title =
                                  slide['title'] ?? 'The Signature Scent';
                              final subtitle =
                                  slide['subtitle'] ?? 'PREMIUM COLLECTION';
                              final desc = slide['desc'] ?? '';

                              return Stack(
                                fit: StackFit.expand,
                                children: [
                                  GestureDetector(
                                    onTap: () {
                                      final List<String> allSlideUrls = [];
                                      for (final s in heroSlides) {
                                        if (s is Map) {
                                          allSlideUrls.add(_getMediaUrl(
                                            (s['banner_url'] ??
                                             s['image'] ??
                                             s['banner_url_mobile'] ??
                                             s['image_mobile'])?.toString()
                                          ));
                                        }
                                      }
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) => ImageLightboxScreen(
                                            imageUrls: allSlideUrls,
                                            initialIndex: index,
                                          ),
                                        ),
                                      );
                                    },
                                    child: CachedImage(
                                      imageUrl: imageResolved,
                                      fit: BoxFit.cover,
                                      errorWidget: Container(color: Colors.black54),
                                    ),
                                  ),
                                  Container(
                                      color: const Color(0x55000000)),
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                        16, 12, 16, 16),
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.end,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          subtitle.toString().toUpperCase(),
                                          style: GoogleFonts.montserrat(
                                              color: AppTheme.accentGold,
                                              fontSize: 8,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 2.5),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          title.toString().toUpperCase(),
                                          style: GoogleFonts.playfairDisplay(
                                              color: Colors.white,
                                              fontSize: 20,
                                              fontWeight: FontWeight.normal,
                                              letterSpacing: 1.0,
                                              height: 1.1),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        if (desc.toString().isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(desc.toString(),
                                              style: GoogleFonts.poppins(
                                                  color: Colors.white70,
                                                  fontSize: 9.5,
                                                  height: 1.3),
                                              maxLines: 1,
                                              overflow:
                                                  TextOverflow.ellipsis),
                                        ],
                                        const SizedBox(height: 8),
                                        OutlinedButton(
                                          onPressed: () {
                                            _handleSlideNavigation(slide);
                                          },
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: Colors.white,
                                            side: const BorderSide(
                                                color: Colors.white70, width: 0.8),
                                            padding:
                                                const EdgeInsets.symmetric(
                                                    horizontal: 14,
                                                    vertical: 4),
                                            minimumSize: Size.zero,
                                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                            shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(
                                                        16)),
                                          ),
                                          child: Text('SHOP NOW',
                                              style: GoogleFonts.montserrat(
                                                  fontSize: 8,
                                                  fontWeight: FontWeight.w700,
                                                  letterSpacing: 1.8,
                                                  color: Colors.white)),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                          Positioned(
                            bottom: 12,
                            right: 16,
                            child: Row(
                              children: List.generate(heroSlides.length, (idx) {
                                return AnimatedContainer(
                                  duration: const Duration(milliseconds: 250),
                                  width: _currentBannerIndex == idx ? 16 : 6,
                                  height: 2,
                                  margin:
                                      const EdgeInsets.symmetric(horizontal: 2),
                                  decoration: BoxDecoration(
                                    color: _currentBannerIndex == idx
                                        ? AppTheme.primaryRose
                                        : Colors.white38,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                );
                              }),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // ── Shop By Category (Below Hero Banner) ──
                  if (categories.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Row(
                        children: [
                          Text(
                            'SHOP BY CATEGORY',
                            style: GoogleFonts.montserrat(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.textNeutral,
                              letterSpacing: 2.0,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Expanded(child: Divider(color: AppTheme.borderLight, thickness: 1)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    categories.length <= 4
                        ? Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8.0),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: categories.map((c) {
                                final cat = c as Map<String, dynamic>;
                                final name = cat['name']?.toString() ?? 'Category';
                                final catId = cat['id']?.toString();
                                final catImg = cat['image_url'] ??
                                    (cat['images'] is List && (cat['images'] as List).isNotEmpty
                                        ? cat['images'][0]
                                        : cat['banner_url']);
                                final imageResolved = _getMediaUrl(catImg?.toString());

                                return Expanded(
                                  child: GestureDetector(
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) => SearchScreen(
                                            categoryId: catId,
                                            title: name,
                                          ),
                                        ),
                                      );
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 2),
                                      child: Column(
                                        children: [
                                          Container(
                                            width: 62,
                                            height: 62,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: AppTheme.surfaceLight,
                                              border: Border.all(color: AppTheme.borderLight, width: 1.5),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black.withValues(alpha: 0.04),
                                                  blurRadius: 6,
                                                  offset: const Offset(0, 2),
                                                )
                                              ],
                                            ),
                                            child: ClipOval(
                                              child: CachedImage(
                                                imageUrl: imageResolved,
                                                fit: BoxFit.cover,
                                                errorWidget: Container(
                                                  color: AppTheme.surfaceLight,
                                                  child: const Icon(Icons.category_outlined, color: AppTheme.primaryRose, size: 22),
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            name.toUpperCase(),
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.montserrat(
                                              fontSize: 8.5,
                                              fontWeight: FontWeight.w800,
                                              color: AppTheme.textNeutral,
                                              letterSpacing: 0.3,
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          )
                        : SizedBox(
                            height: 100,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              itemCount: categories.length,
                              itemBuilder: (context, index) {
                                final cat = categories[index] as Map<String, dynamic>;
                                final name = cat['name']?.toString() ?? 'Category';
                                final catId = cat['id']?.toString();
                                final catImg = cat['image_url'] ??
                                    (cat['images'] is List && (cat['images'] as List).isNotEmpty
                                        ? cat['images'][0]
                                        : cat['banner_url']);
                                final imageResolved = _getMediaUrl(catImg?.toString());

                                return GestureDetector(
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => SearchScreen(
                                          categoryId: catId,
                                          title: name,
                                        ),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    width: 86,
                                    margin: const EdgeInsets.symmetric(horizontal: 6),
                                    child: Column(
                                      children: [
                                        Container(
                                          width: 64,
                                          height: 64,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: AppTheme.surfaceLight,
                                            border: Border.all(color: AppTheme.borderLight, width: 1.5),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black.withValues(alpha: 0.04),
                                                blurRadius: 6,
                                                offset: const Offset(0, 2),
                                              )
                                            ],
                                          ),
                                          child: ClipOval(
                                            child: CachedImage(
                                              imageUrl: imageResolved,
                                              fit: BoxFit.cover,
                                              errorWidget: Container(
                                                color: AppTheme.surfaceLight,
                                                child: const Icon(Icons.category_outlined, color: AppTheme.primaryRose, size: 22),
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          name.toUpperCase(),
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.montserrat(
                                            fontSize: 8.5,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.textNeutral,
                                            letterSpacing: 0.5,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                  ],





                   // ── New Arrivals (Part 1: Products 1-10) ──────────────────
                  if (newArrivals.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _buildSectionHeader(
                      'New Arrivals', 
                      'Just Arrived',
                      onViewAll: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => const SearchScreen(
                              isNewArrival: true,
                              title: 'New Arrivals',
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildProductGrid(
                        newArrivals.take(10).cast<Map<String, dynamic>>().toList()),
                  ],

                  // ── Ad Banner Block 1 (after new arrivals 1-10) ───────────
                  if (newArrivals.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    _buildAdBanner(ad1),
                  ],

                  // ── New Arrivals (Part 2: Products 11-20) ─────────────────
                  if (newArrivals.length > 10) ...[
                    const SizedBox(height: 24),
                    _buildProductGrid(
                        newArrivals.skip(10).take(10).cast<Map<String, dynamic>>().toList()),
                  ],

                  // ── Ad Banner Block 2 (after new arrivals 11-20 - Full Width)
                  if (newArrivals.length > 10) ...[
                    const SizedBox(height: 24),
                    _buildFullWidthAdBanner(ad2),
                  ],

                  // ── New Arrivals (Part 3: Products 21+) ───────────────────
                  if (newArrivals.length > 20) ...[
                    const SizedBox(height: 24),
                    _buildProductGrid(
                        newArrivals.skip(20).cast<Map<String, dynamic>>().toList()),
                  ],

                  // ── Featured Bestsellers ──────────────────────────────────
                  if (bestsellers.isNotEmpty) ...[
                    const SizedBox(height: 28),
                    _buildSectionHeader(
                      'Popular Picks', 
                      'Store Favorites',
                      onViewAll: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => const SearchScreen(
                              isFeatured: true,
                              title: 'Popular Picks',
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildProductGrid(
                        bestsellers.cast<Map<String, dynamic>>().toList()),
                  ],

                  // ── Ad Banner Block 3 (after Featured Bestsellers) ────────
                  if (newArrivals.isNotEmpty || bestsellers.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    _buildAdBanner(ad3, isAd3: true),
                  ],

                  // ── Elite Brand Houses Section ─────────────────────────────
                  Container(
                    key: _brandsKey,
                    child: _buildBrandsSection(brands),
                  ),

                  // ── Editorial (For Him, Privilege Collection, For Her) Section 
                  _buildEditorialSection(rewards, layout),

                  // ── House Favorites Section (Arches) ───────────────────────
                  _buildHouseFavorites(houseFavorites),

                  // ── Promotional Offers (Matching Storefront Offer Banners) ───────────────
                  (() {
                    final displayOffers = offers.isNotEmpty
                        ? offers
                        : [
                            {
                              'title': 'EXCLUSIVE SIGNATURE PROMO',
                              'code': 'POMMA999',
                              'discount_value': 'FLAT 15% OFF',
                              'description': 'Enjoy flat discounts across all luxury fragrance collections using code POMMA999 at checkout.'
                            }
                          ];

                    return Container(
                      key: _offersKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 28),
                          _buildSectionHeader('Promotional Offers', 'Exclusive Deals'),
                          const SizedBox(height: 12),
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: displayOffers.length,
                            itemBuilder: (context, index) {
                              final offer = displayOffers[index] as Map<String, dynamic>;
                              final title = offer['title']?.toString() ?? 'Exclusive Deal';
                              final code = offer['code']?.toString() ?? 'POMMA999';
                              final discountVal = offer['discount_value']?.toString() ?? 'SPECIAL DEAL';
                              final desc = offer['description']?.toString() ?? 'Enjoy exclusive promotional discounts on luxury perfumes.';

                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppTheme.primaryRose.withValues(alpha: 0.2)),
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFFFFF0F5), Color(0xFFFFE4E6)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: AppTheme.primaryRose,
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              discountVal.toUpperCase(),
                                              style: GoogleFonts.montserrat(
                                                fontSize: 9,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                                letterSpacing: 1.0,
                                              ),
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(20),
                                              border: Border.all(color: AppTheme.primaryRose),
                                            ),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.confirmation_number_outlined, size: 12, color: AppTheme.primaryRose),
                                                const SizedBox(width: 4),
                                                Text(
                                                  code,
                                                  style: GoogleFonts.montserrat(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w800,
                                                    color: AppTheme.primaryRose,
                                                    letterSpacing: 1.2,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        title.toUpperCase(),
                                        style: GoogleFonts.montserrat(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 12.5,
                                          color: Colors.black87,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        desc,
                                        style: GoogleFonts.poppins(
                                          fontSize: 11,
                                          color: Colors.black54,
                                          height: 1.4,
                                        ),
                                      ),
                                      const SizedBox(height: 14),
                                      SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton(
                                          onPressed: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(
                                                builder: (context) => const SearchScreen(
                                                  onSale: true,
                                                  title: 'OFFERS & PROMOTIONS',
                                                ),
                                              ),
                                            );
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.black,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                          ),
                                          child: Text(
                                            'CLAIM OFFER & SHOP DEALS',
                                            style: GoogleFonts.montserrat(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.bold,
                                              letterSpacing: 1.5,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    );
                  })(),

                  // ── Luxury Trust Badges Section ────────────────────────────
                  _buildTrustBadgesSection(apiBadges),

                  // ── Footer ────────────────────────────────────────────────
                  const _HomeFooter(),
                ],
              ),
            ),
          ),
        );
      },
    ),
  );
}

  Widget _buildTrustBadgesSection([List<dynamic> apiBadges = const []]) {
    // Icon mapping from admin icon_name string -> Flutter IconData
    IconData iconFor(String? name) {
      switch (name) {
        case 'local_shipping_outlined': return Icons.local_shipping_outlined;
        case 'verified_outlined':       return Icons.verified_outlined;
        case 'lock_outline':            return Icons.lock_outline;
        case 'card_giftcard_outlined':  return Icons.card_giftcard_outlined;
        case 'replay_outlined':         return Icons.replay_outlined;
        case 'support_agent':           return Icons.support_agent;
        case 'emoji_events_outlined':   return Icons.emoji_events_outlined;
        case 'eco_outlined':            return Icons.eco_outlined;
        case 'gps_fixed':               return Icons.gps_fixed;
        case 'track_changes':           return Icons.track_changes;
        default:                        return Icons.verified_outlined;
      }
    }

    // Use API badges if available, otherwise fall back to hardcoded defaults
    final badges = apiBadges.isNotEmpty
        ? apiBadges.map((b) {
            final m = b as Map<String, dynamic>;
            return {
              'icon': iconFor(m['icon_name']?.toString()),
              'title': m['title']?.toString() ?? '',
              'desc': m['sub']?.toString() ?? '',
            };
          }).toList()
        : [
            {'icon': Icons.verified_outlined,       'title': '100% AUTHENTIC',  'desc': 'Directly from Brands'},
            {'icon': Icons.gps_fixed,               'title': 'LIVE TRACKING',   'desc': 'Live Delivery Tracking'},
            {'icon': Icons.lock_outline,             'title': 'SECURE PAYMENT',  'desc': 'Safe transactions'},
            {'icon': Icons.local_shipping_outlined,  'title': 'FREE SHIPPING',   'desc': 'On orders above ₹2999'},
          ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 2.6,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
        ),
        itemCount: badges.length,
        itemBuilder: (context, index) {
          final b = badges[index];
          return Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppTheme.primaryRose.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(b['icon'] as IconData, size: 20, color: AppTheme.primaryRose),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      b['title'] as String,
                      style: GoogleFonts.montserrat(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textNeutral,
                        letterSpacing: 0.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      b['desc'] as String,
                      style: GoogleFonts.poppins(
                        fontSize: 8,
                        color: AppTheme.textMuted,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Home Footer — mirrors storefront Footer.tsx
// ═════════════════════════════════════════════════════════════════════════════
class _HomeFooter extends StatelessWidget {
  const _HomeFooter();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF0A0A0A), // neutral-950
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Newsletter strip
          Container(
            color: const Color(0xFF111111),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('STAY IN THE KNOW',
                    style: GoogleFonts.montserrat(
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 3.0,
                        color: AppTheme.primaryRose)),
                const SizedBox(height: 6),
                Text('Get exclusive offers & new arrivals',
                    style: GoogleFonts.playfairDisplay(
                        fontSize: 18,
                        color: Colors.white,
                        fontWeight: FontWeight.normal)),
                const SizedBox(height: 14),
                Container(
                  height: 44,
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFF333333)),
                    borderRadius: BorderRadius.circular(2),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          style: GoogleFonts.poppins(
                              color: Colors.white, fontSize: 12),
                          decoration: InputDecoration(
                            hintText: 'Enter your email address',
                            hintStyle: GoogleFonts.poppins(
                                color: Colors.grey[600], fontSize: 12),
                            filled: true,
                            fillColor: const Color(0xFF1A1A1A),
                            contentPadding:
                                const EdgeInsets.symmetric(horizontal: 12),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                      Container(
                        height: 44,
                        padding:
                            const EdgeInsets.symmetric(horizontal: 16),
                        color: AppTheme.primaryRose,
                        alignment: Alignment.center,
                        child: Text('SUBSCRIBE',
                            style: GoogleFonts.montserrat(
                                fontSize: 8,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.5,
                                color: Colors.white)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Main footer body
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // About
                Text('POMMASTORE',
                    style: GoogleFonts.playfairDisplay(
                        fontSize: 20,
                        color: Colors.white,
                        fontWeight: FontWeight.normal,
                        letterSpacing: 2.0)),
                const SizedBox(height: 10),
                Text(
                  'Your destination for 100% original luxury fragrances. We bring international perfumes directly to India, ensuring premium quality and authenticity with every single spray.',
                  style: GoogleFonts.poppins(
                      color: Colors.grey[500], fontSize: 11, height: 1.6),
                ),
                const SizedBox(height: 16),

                // Social icons row
                Row(
                  children: [
                    _socialBtn(Icons.facebook, 'FB'),
                    const SizedBox(width: 8),
                    _socialBtn(Icons.camera_alt_outlined, 'IG'),
                    const SizedBox(width: 8),
                    _socialBtn(Icons.close, 'X'),
                    const SizedBox(width: 8),
                    _socialBtn(Icons.play_circle_outline, 'YT'),
                  ],
                ),

                const SizedBox(height: 24),
                const Divider(color: Color(0xFF222222)),
                const SizedBox(height: 20),

                // Two-column links
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _footerColumn('CUSTOMER SERVICE', [
                        'Track Your Order',
                        'Return & Refund Policy',
                        'About Us',
                        'FAQ',
                        'Contact Us',
                        'Rewards Program',
                      ]),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _footerColumn('SHOP', [
                        'Men',
                        'Women',
                        'Unisex',
                        'New Arrivals',
                        'Bestsellers',
                        'Sale',
                      ]),
                    ),
                  ],
                ),

                const SizedBox(height: 24),
                const Divider(color: Color(0xFF222222)),
                const SizedBox(height: 16),

                // Authenticity badge
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFF222222)),
                    borderRadius: BorderRadius.circular(2),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('AUTHENTICITY GUARANTEED',
                          style: GoogleFonts.montserrat(
                              fontSize: 8,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 2.0,
                              color: AppTheme.primaryRose)),
                      const SizedBox(height: 4),
                      Text(
                          '100% original products. Certified & verified fragrance retailer.',
                          style: GoogleFonts.poppins(
                              color: Colors.grey[600], fontSize: 10)),
                    ],
                  ),
                ),

                const SizedBox(height: 20),
                const Divider(color: Color(0xFF222222)),
                const SizedBox(height: 16),

                // Payment methods
                Text('WE ACCEPT',
                    style: GoogleFonts.montserrat(
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2.0,
                        color: Colors.grey[600])),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _paymentChip('VISA', const Color(0xFF1A1F71)),
                    const SizedBox(width: 8),
                    _paymentChip('MC', const Color(0xFF252525)),
                    const SizedBox(width: 8),
                    _paymentChip('PAY', const Color(0xFF2C2C54)),
                    const SizedBox(width: 8),
                    _paymentChip('UPI', const Color(0xFFF5F5F5),
                        textColor: const Color(0xFF097939)),
                  ],
                ),

                const SizedBox(height: 20),
                const Divider(color: Color(0xFF222222)),
                const SizedBox(height: 14),

                // Copyright
                Text(
                  '© ${DateTime.now().year} Pommastore Fragrances. All rights reserved.',
                  style: GoogleFonts.montserrat(
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.5,
                      color: Colors.grey[700]),
                ),
                const SizedBox(height: 4),
                Text('Powered by Teqmates',
                    style: GoogleFonts.montserrat(
                        fontSize: 8,
                        letterSpacing: 1.5,
                        color: Colors.grey[700])),
                const SizedBox(height: 8),

                // Legal links
                Row(
                  children: [
                    _legalLink('Privacy'),
                    const SizedBox(width: 16),
                    _legalLink('Terms'),
                    const SizedBox(width: 16),
                    _legalLink('Returns'),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _socialBtn(IconData icon, String label) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFF1A1A1A),
      ),
      child: Icon(icon, size: 15, color: Colors.grey[400]),
    );
  }

  Widget _footerColumn(String heading, List<String> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(heading,
            style: GoogleFonts.montserrat(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                letterSpacing: 2.0,
                color: Colors.grey[500])),
        const SizedBox(height: 6),
        const Divider(color: Color(0xFF222222)),
        const SizedBox(height: 8),
        ...items.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(item,
                  style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.w500)),
            )),
      ],
    );
  }

  Widget _paymentChip(String label, Color bg,
      {Color textColor = Colors.white}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(3)),
      child: Text(label,
          style: GoogleFonts.montserrat(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              color: textColor,
              letterSpacing: 0.5)),
    );
  }

  Widget _legalLink(String label) {
    return Text(label,
        style: GoogleFonts.montserrat(
            fontSize: 8,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
            color: Colors.grey[600]));
  }
}

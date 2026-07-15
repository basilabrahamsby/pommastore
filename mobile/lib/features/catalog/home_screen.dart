import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import 'homepage_provider.dart';
import 'product_detail_screen.dart';
import 'search_screen.dart';
import '../../core/widgets/cached_image.dart';
import '../../core/widgets/image_lightbox.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final PageController _bannerController = PageController();
  final ScrollController _scrollController = ScrollController();
  int _currentBannerIndex = 0;
  bool _appBarVisible = false;

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
    String cleanPath = path.replaceAll(RegExp(r'^/kozmocart'), '');
    if (cleanPath.startsWith('http')) return cleanPath;
    if (cleanPath.startsWith('data:')) return cleanPath;
    cleanPath = cleanPath.startsWith('/') ? cleanPath : '/$cleanPath';
    return 'https://kozmocart.com$cleanPath';
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
      final cleanLink = customLink.replaceAll('https://kozmocart.com', '');
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

  // ── Section Header ────────────────────────────────────────────────────────
  Widget _buildSectionHeader(String title, String subtitle, {VoidCallback? onViewAll}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            subtitle.toUpperCase(),
            style: GoogleFonts.montserrat(
              fontSize: 8,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF8E8E93), // textMuted
              letterSpacing: 2.0,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                title.toUpperCase(),
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
                    'VIEW ALL',
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

  Widget _buildCenteredSectionHeader(String title, String subtitle) {
    return Center(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            subtitle.toUpperCase(),
            style: GoogleFonts.montserrat(
              fontSize: 8,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF8E8E93),
              letterSpacing: 2.0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title.toUpperCase(),
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
                    if (subtitle.isNotEmpty)
                      Text(
                        subtitle.toUpperCase(),
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
                      title.toUpperCase(),
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
                    if (desc.isNotEmpty) ...[
                      const SizedBox(height: 4),
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
                          'BUY NOW',
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
              final name = brand['name'] ?? '';
              final logoUrl = _getMediaUrl(brand['logo_url']?.toString());
              final bannerUrl = _getMediaUrl((brand['brand_banner'] ?? brand['banner_url'])?.toString());
              final desc = brand['description'] ?? 'Discover the signature collections and exclusive raw extractions crafted by the luxury house of $name.';

              return Container(
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
                                      'SIGNATURE HOUSE',
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
                                      'EXPLORE HOUSE',
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
              );
            },
          ),
        ),
      ],
    );
  }

  // ── Editorial (For Him, Privilege Collection, For Her) Section ─────────────
  Widget _buildEditorialSection(List<dynamic> loyaltyRewards, Map<String, dynamic> layout) {
    final splitBanners = layout['split_banners'] as Map<String, dynamic>? ?? {};
    final menImg = _getMediaUrl((splitBanners['men_mobile'] ?? splitBanners['men'])?.toString() ?? '/banner-men.png');
    final womenImg = _getMediaUrl((splitBanners['women_mobile'] ?? splitBanners['women'])?.toString() ?? '/banner-women.png');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 32),
        // 1. Column 1: For Him
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
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
                        'REFINED & BOLD',
                        style: GoogleFonts.montserrat(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: Colors.white70,
                          letterSpacing: 2.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'FOR HIM',
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
                          'SHOP MEN',
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
                  'KOZMO REWARDS',
                  style: GoogleFonts.montserrat(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textMuted,
                    letterSpacing: 2.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'THE PRIVILEGE COLLECTION.',
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
                    final rewardName = reward['name']?.toString() ?? 'Exclusive Reward';
                    final rewardType = reward['reward_type']?.toString() ?? 'MEMBERSHIP';
                    final rewardDesc = reward['description']?.toString() ?? '';
                    final pointCost = reward['point_cost']?.toString() ?? '';

                    return Container(
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
                                        pointCost.isNotEmpty ? '$pointCost POINTS' : 'EXPLORE',
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
                    );
                  }),
                ],

                const SizedBox(height: 20),
                Text(
                  'VIEW FULL GALLERY',
                  style: GoogleFonts.montserrat(
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.0,
                    color: Colors.black,
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
                        'ELEGANT & SWEET',
                        style: GoogleFonts.montserrat(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: Colors.white70,
                          letterSpacing: 2.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'FOR HER',
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
                          'SHOP WOMEN',
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
        childAspectRatio: 0.55,
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
    final homepageAsync = ref.watch(homepageDataProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: AnimatedOpacity(
          opacity: _appBarVisible ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 200),
          child: IgnorePointer(
            ignoring: !_appBarVisible,
            child: AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              centerTitle: true,
              title: Image.asset('assets/logo.png', height: 26, fit: BoxFit.contain),
              shape: const Border(
                bottom: BorderSide(color: AppTheme.borderLight, width: 1.0),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh, color: Colors.black, size: 20),
                  onPressed: () => ref.invalidate(homepageDataProvider),
                ),
              ],
            ),
          ),
        ),
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

          return RefreshIndicator(
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
                  // ── Hero Banner ─────────────────────────────────────────────
                  if (heroSlides.isNotEmpty)
                    SizedBox(
                      height: 320,
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
                                  (slide['image_mobile'] ??
                                          slide['banner_url_mobile'] ??
                                          slide['banner_url'] ??
                                          slide['image'])
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
                                            (s['image_mobile'] ??
                                             s['banner_url_mobile'] ??
                                             s['banner_url'] ??
                                             s['image'])?.toString()
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
                                      color: const Color(0x66000000)),
                                  SafeArea(
                                    child: Padding(
                                      padding: const EdgeInsets.fromLTRB(
                                          24, 16, 24, 24),
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
                                                fontSize: 9,
                                                fontWeight: FontWeight.w700,
                                                letterSpacing: 3.5),
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            title.toString().toUpperCase(),
                                            style: GoogleFonts.playfairDisplay(
                                                color: Colors.white,
                                                fontSize: 32,
                                                fontWeight: FontWeight.normal,
                                                letterSpacing: 1.5,
                                                height: 1.1),
                                          ),
                                          if (desc.toString().isNotEmpty) ...[
                                            const SizedBox(height: 8),
                                            Text(desc.toString(),
                                                style: GoogleFonts.poppins(
                                                    color: Colors.white70,
                                                    fontSize: 11,
                                                    height: 1.5),
                                                maxLines: 2,
                                                overflow:
                                                    TextOverflow.ellipsis),
                                          ],
                                          const SizedBox(height: 16),
                                          OutlinedButton(
                                            onPressed: () {
                                              _handleSlideNavigation(slide);
                                            },
                                            style: OutlinedButton.styleFrom(
                                              foregroundColor: Colors.white,
                                              side: const BorderSide(
                                                  color: Colors.white70),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 20,
                                                      vertical: 8),
                                              shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          24)),
                                            ),
                                            child: Text('SHOP NOW',
                                                style: GoogleFonts.montserrat(
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.w700,
                                                    letterSpacing: 2.5,
                                                    color: Colors.white)),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                          Positioned(
                            bottom: 16,
                            right: 20,
                            child: Row(
                              children: List.generate(heroSlides.length, (idx) {
                                return AnimatedContainer(
                                  duration: const Duration(milliseconds: 250),
                                  width: _currentBannerIndex == idx ? 20 : 8,
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

                  const SizedBox(height: 24),

                  // ── Categories ────────────────────────────────────────────
                  if (categories.isNotEmpty) ...[
                    _buildCenteredSectionHeader('Signature Categories', 'Discover More'),
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 120,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding:
                            const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: categories.length,
                        itemBuilder: (context, index) {
                          final cat =
                              categories[index] as Map<String, dynamic>;
                          final name = cat['name'] ?? '';
                          final catImg = cat['image_url'] ??
                              (cat['images'] is List &&
                                      (cat['images'] as List).isNotEmpty
                                  ? cat['images'][0]
                                  : cat['banner_url']);
                          final imageResolved =
                              _getMediaUrl(catImg?.toString());

                          return GestureDetector(
                            onTap: () {
                              final catId = cat['id']?.toString();
                              final catName = cat['name']?.toString() ?? 'Category';
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => SearchScreen(
                                    categoryId: catId,
                                    title: catName,
                                  ),
                                ),
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8.0),
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(2.5),
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: LinearGradient(
                                        colors: [
                                          Color(0xFFFFB300),
                                          Color(0xFFE91E63),
                                          AppTheme.primaryRose
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
                                          width: 68,
                                          height: 68,
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
                                  Text(name.toString().toUpperCase(),
                                      style: GoogleFonts.montserrat(
                                          fontSize: 8,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.black87,
                                          letterSpacing: 0.5)),
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
                  _buildBrandsSection(brands),

                  // ── Editorial (For Him, Privilege Collection, For Her) Section 
                  _buildEditorialSection(rewards, layout),

                  // ── House Favorites Section (Arches) ───────────────────────
                  _buildHouseFavorites(houseFavorites),

                  // ── Promotional Offers ────────────────────────────────────
                  if (offers.isNotEmpty) ...[
                    const SizedBox(height: 28),
                    _buildSectionHeader('Promotional Offers', 'Exclusive Deals'),
                    const SizedBox(height: 12),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding:
                          const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: offers.length,
                      itemBuilder: (context, index) {
                        final offer =
                            offers[index] as Map<String, dynamic>;
                        final title = offer['title'] ?? 'Exclusive Deal';
                        final code = offer['code'] ?? '';
                        final discountVal = offer['discount_value'] ?? '';
                        final type = offer['discount_type'] ?? '';

                        return Card(
                          margin:
                              const EdgeInsets.symmetric(vertical: 6),
                          color: AppTheme.surfaceLight,
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            title: Text(title.toString().toUpperCase(),
                                style: GoogleFonts.montserrat(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                    letterSpacing: 1.0)),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 6.0),
                              child: Text(
                                type.toString().isNotEmpty
                                    ? '$type Discount • Code: $code'
                                    : 'Promo Code: $code',
                                style: GoogleFonts.poppins(
                                    color: AppTheme.textMuted,
                                    fontSize: 11),
                              ),
                            ),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryRose,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                discountVal.toString().isNotEmpty
                                    ? '$discountVal OFF'
                                    : 'CLAIM',
                                style: GoogleFonts.montserrat(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ],

                  // ── Footer ────────────────────────────────────────────────
                  const _HomeFooter(),
                ],
              ),
            ),
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
                Text('KOZMOCART',
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
                  '© ${DateTime.now().year} Kozmocart Fragrances. All rights reserved.',
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

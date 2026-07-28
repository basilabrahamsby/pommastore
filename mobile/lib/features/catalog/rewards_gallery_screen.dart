import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/api/token_manager.dart';
import '../../core/locale/locale_provider.dart';
import '../auth/login_screen.dart';
import 'homepage_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/cached_image.dart';
import '../../core/widgets/image_lightbox.dart';

final rewardsDataProvider = FutureProvider<List<dynamic>>((ref) async {
  final client = ref.read(apiClientProvider);
  try {
    final res = await client.dio.get('/storefront/loyalty/rewards');
    if (res.data is List) {
      return res.data as List;
    }
  } catch (_) {
    // Return empty list if API fails
  }
  return [];
});

class RewardsGalleryScreen extends ConsumerStatefulWidget {
  final List<dynamic>? initialRewards;

  const RewardsGalleryScreen({
    super.key,
    this.initialRewards,
  });

  @override
  ConsumerState<RewardsGalleryScreen> createState() => _RewardsGalleryScreenState();
}

class _RewardsGalleryScreenState extends ConsumerState<RewardsGalleryScreen> {
  bool _isLoggedIn = false;
  int _userLoyaltyPoints = 0;

  @override
  void initState() {
    super.initState();
    _checkAuthAndPoints();
  }

  Future<void> _checkAuthAndPoints() async {
    try {
      final token = await TokenManager.getToken();
      if (token != null && token.isNotEmpty) {
        final res = await ApiClient().dio.get('/storefront/account/me');
        if (res.statusCode == 200 && res.data != null) {
          final pts = int.tryParse(res.data['loyalty_points']?.toString() ?? '0') ?? 0;
          if (mounted) {
            setState(() {
              _isLoggedIn = true;
              _userLoyaltyPoints = pts;
            });
          }
        } else {
          if (mounted) setState(() => _isLoggedIn = true);
        }
      } else {
        if (mounted) setState(() => _isLoggedIn = false);
      }
    } catch (_) {
      final token = await TokenManager.getToken();
      if (mounted) {
        setState(() {
          _isLoggedIn = token != null && token.isNotEmpty;
        });
      }
    }
  }

  Future<void> _handleRedeem(String rewardId, String rewardName, int ptsCost) async {
    final isAr = ref.watch(localeProvider).languageCode == 'ar';
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isAr ? 'استبدال المكافأة' : 'REDEEM REWARD', style: GoogleFonts.montserrat(fontWeight: FontWeight.bold, fontSize: 13)),
        content: Text(
          isAr ? 'هل أنت تأكد من استبدال "$rewardName" مقابل $ptsCost نقطة ولاء؟' : 'Are you sure you want to redeem "$rewardName" for $ptsCost Loyalty Points?', 
          style: GoogleFonts.poppins(fontSize: 12),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(isAr ? 'إلغاء' : 'CANCEL')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                final res = await ApiClient().dio.post('/storefront/loyalty/rewards/$rewardId/redeem');
                if (res.statusCode == 200 || res.statusCode == 201) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(isAr ? '🎉 تهانينا! لقد تم استبدال $rewardName بنجاح.' : '🎉 Congratulations! You have redeemed $rewardName.')),
                  );
                  _checkAuthAndPoints();
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(isAr ? 'فشل استبدال المكافأة أو أن المكافأة غير متوفرة.' : 'Redemption failed or reward unavailable.')),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryRose),
            child: Text(isAr ? 'تأكيد الاستبدال' : 'CONFIRM REDEEM'),
          ),
        ],
      ),
    );
  }
  String _getMediaUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return 'https://pommastore.com$path';
  }

  @override
  Widget build(BuildContext context) {
    final asyncRewards = ref.watch(rewardsDataProvider);
    final isAr = ref.watch(localeProvider).languageCode == 'ar';

    final rewardsList = asyncRewards.when(
      data: (data) => data.isNotEmpty ? data : (widget.initialRewards ?? []),
      loading: () => widget.initialRewards ?? [],
      error: (_, __) => widget.initialRewards ?? [],
    );

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppTheme.textNeutral),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            InkWell(
              onTap: () => ref.read(localeProvider.notifier).toggleLocale(),
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
            Image.asset('assets/logo.png', height: 36, fit: BoxFit.contain),
            const Spacer(),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: AppTheme.textNeutral, size: 20),
            onPressed: () => context.push('/search'),
          ),
          IconButton(
            icon: const Icon(Icons.favorite_border, color: AppTheme.textNeutral, size: 20),
            onPressed: () => context.push('/wishlist'),
          ),
        ],
        shape: const Border(
          bottom: BorderSide(color: AppTheme.borderLight, width: 1.0),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Section
              Column(
                children: [
                  Text(
                    isAr ? 'الولاء والمزايا' : 'LOYALTY & PRIVILEGES',
                    style: GoogleFonts.montserrat(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textMuted,
                      letterSpacing: 3.0,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isAr ? 'معرض المكافآت' : 'The Rewards Gallery.',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 32,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.w300,
                      color: Colors.black,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: 36,
                    height: 1,
                    color: AppTheme.primaryRose,
                  ),
                  const SizedBox(height: 14),
                  Text(
                    isAr
                        ? 'استبدل نقاط الولاء المتراكمة بهدايا ومزايا حصرية.'
                        : 'EXCHANGE YOUR ACCUMULATED LOYALTY POINTS FOR EXCLUSIVE SIGNATURE GIFTS AND PRIVILEGES.',
                    style: GoogleFonts.montserrat(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF666666),
                      letterSpacing: 1.5,
                      height: 1.6,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // Rewards Grid List
              if (rewardsList.isEmpty && asyncRewards.isLoading)
                const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryRose),
                  ),
                )
              else if (rewardsList.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9F9F9),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.card_giftcard, size: 36, color: Colors.black26),
                      const SizedBox(height: 12),
                      Text(
                        isAr ? 'لا تتوفر مكافآت حالياً' : 'NO REWARDS AVAILABLE RIGHT NOW',
                        style: GoogleFonts.montserrat(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: rewardsList.length,
                  itemBuilder: (context, index) {
                    final item = rewardsList[index] as Map<String, dynamic>;
                    return _buildRewardCard(context, item);
                  },
                ),

              const SizedBox(height: 40),
              const Divider(color: AppTheme.borderLight),
              const SizedBox(height: 24),

              // How Redemption Works Section
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isAr ? 'كيفية استبدال المكافآت' : 'HOW REDEMPTION WORKS',
                    style: GoogleFonts.montserrat(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 2.0,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _howItWorksItem(
                    num: '01',
                    title: isAr ? 'اختر هديتك' : 'SELECT YOUR GIFT',
                    desc: isAr 
                        ? 'اختر من تشكيلتنا المختارة من العطور الفاخرة، ومجموعات الاستكشاف، والإكسسوارات.'
                        : 'Choose from our curated collection of signature fragrances, discovery sets, and luxury accessories.',
                  ),
                  const SizedBox(height: 16),
                  _howItWorksItem(
                    num: '02',
                    title: isAr ? 'تنفيذ فوري' : 'INSTANT FULFILLMENT',
                    desc: isAr
                        ? 'يتم إضافة القسائم فوراً إلى حسابك. تُضاف الهدايا العينية إلى شحنتك القادمة.'
                        : 'Vouchers are credited instantly to your vault. Physical gifts are added to your next shipment or dispatched individually.',
                  ),
                ],
              ),

              const SizedBox(height: 40),

              // Bottom Call to Action Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9F9F9),
                  border: Border.all(color: AppTheme.borderLight),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Column(
                  children: [
                    Text(
                      isAr ? 'انضم إلى دائرة بوماتور الفاخرة' : 'Join the Pommastore Inner Circle.',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 20,
                        fontWeight: FontWeight.normal,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      isAr 
                          ? 'سجل اليوم واحصل على نقاط ترحيبية فوراً لبدء رحلتك العطرية.'
                          : 'SIGN UP TODAY AND RECEIVE COMPLIMENTARY POINTS INSTANTLY TO START YOUR JOURNEY.',
                      style: GoogleFonts.montserrat(
                        fontSize: 8,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.5,
                        color: AppTheme.textMuted,
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () => context.push('/account'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      child: Text(
                        isAr ? 'إنشاء حساب جديد' : 'INITIALIZE ACCOUNT',
                        style: GoogleFonts.montserrat(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2.0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRewardCard(BuildContext context, Map<String, dynamic> reward) {
    final isAr = ref.watch(localeProvider).languageCode == 'ar';
    final rewardId = reward['id']?.toString() ?? '';
    final nameEn = reward['name']?.toString() ?? 'Signature Gift';
    final nameAr = reward['name_ar'] ?? reward['nameAr'];
    final name = (isAr && nameAr != null && nameAr.toString().isNotEmpty) ? nameAr.toString() : nameEn;

    final rewardTypeEn = reward['reward_type']?.toString() ?? 'PRIVILEGE';
    final rewardType = isAr 
        ? ({'TRIP': 'رحلة فاخرة', 'PRIVILEGE': 'امتياز حصير', 'GIFT': 'هدية فاخرة'}[rewardTypeEn.toUpperCase()] ?? rewardTypeEn)
        : rewardTypeEn;

    final descEn = reward['description']?.toString() ?? '';
    final descAr = reward['description_ar'] ?? reward['descriptionAr'];
    final desc = (isAr && descAr != null && descAr.toString().isNotEmpty) ? descAr.toString() : descEn;

    final pointCost = reward['point_cost']?.toString() ?? '0';
    final imgUrl = _getMediaUrl(reward['image_url']?.toString());
    final metadata = reward['reward_metadata'] as Map<String, dynamic>? ?? {};

    String locMetaKey(String k) {
      if (!isAr) return k.toUpperCase();
      final Map<String, String> m = {
        'location': 'الموقع',
        'event': 'الفعالية',
        'duration': 'المدة',
        'validity': 'الصلاحية',
      };
      return m[k.toLowerCase()] ?? k.toUpperCase();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Image Banner with Floating Point Badge
          Stack(
            children: [
              GestureDetector(
                onTap: () {
                  if (imgUrl.isNotEmpty) {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => ImageLightboxScreen(
                          imageUrls: [imgUrl],
                          initialIndex: 0,
                        ),
                      ),
                    );
                  }
                },
                child: Container(
                  height: 220,
                  width: double.infinity,
                  color: const Color(0xFFF5F5F5),
                  child: CachedImage(
                    imageUrl: imgUrl,
                    fit: BoxFit.cover,
                    errorWidget: const Icon(Icons.card_giftcard, size: 40, color: Colors.black12),
                  ),
                ),
              ),

              // Points Badge
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.borderLight),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 6,
                      )
                    ],
                  ),
                  child: Text(
                    isAr ? '$pointCost نقطة' : '$pointCost PTS',
                    style: GoogleFonts.montserrat(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: Colors.black,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
              ),
            ],
          ),

          // Content Box
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(width: 16, height: 1, color: AppTheme.primaryRose),
                    const SizedBox(width: 8),
                    Text(
                      rewardType.toUpperCase(),
                      style: GoogleFonts.montserrat(
                        fontSize: 8,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textMuted,
                        letterSpacing: 2.0,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  name.toUpperCase(),
                  style: GoogleFonts.montserrat(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                    letterSpacing: 0.5,
                  ),
                ),
                if (desc.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    desc,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                      height: 1.5,
                    ),
                  ),
                ],

                // Metadata details (Location, Event, etc.)
                if (metadata.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9F9F9),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppTheme.borderLight),
                    ),
                    child: Column(
                      children: metadata.entries.map((e) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                locMetaKey(e.key.toString()),
                                style: GoogleFonts.montserrat(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textMuted,
                                  letterSpacing: 1.0,
                                ),
                              ),
                              Text(
                                e.value.toString().toUpperCase(),
                                style: GoogleFonts.montserrat(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.black,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],

                const SizedBox(height: 20),

                // Redeem Action Button
                SizedBox(
                  width: double.infinity,
                  child: (() {
                    final requiredPts = int.tryParse(pointCost) ?? 0;

                    if (!_isLoggedIn) {
                      return ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (context) => const LoginScreen()),
                          ).then((_) => _checkAuthAndPoints());
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(2)),
                        ),
                        child: Text(
                          isAr ? 'سجل الدخول للاستبدال' : 'LOGIN TO REDEEM',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 2.0,
                          ),
                        ),
                      );
                    } else if (_userLoyaltyPoints >= requiredPts) {
                      return ElevatedButton(
                        onPressed: () => _handleRedeem(rewardId, name, requiredPts),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryRose,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(2)),
                        ),
                        child: Text(
                          isAr ? 'استبدال المكافأة ($pointCost نقطة)' : 'REDEEM REWARD ($pointCost PTS)',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 2.0,
                          ),
                        ),
                      );
                    } else {
                      final diff = requiredPts - _userLoyaltyPoints;
                      return OutlinedButton(
                        onPressed: null,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: Colors.black26),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(2)),
                        ),
                        child: Text(
                          isAr ? 'تحتاج $diff نقطة إضافية للاستبدال' : 'NEED $diff MORE PTS TO REDEEM',
                          style: GoogleFonts.montserrat(
                            fontSize: 8.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.5,
                            color: Colors.black45,
                          ),
                        ),
                      );
                    }
                  })(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _howItWorksItem({required String num, required String title, required String desc}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFFF5F5F5),
            border: Border.all(color: AppTheme.borderLight),
          ),
          alignment: Alignment.center,
          child: Text(
            num,
            style: GoogleFonts.montserrat(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              color: Colors.black87,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.montserrat(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                desc,
                style: GoogleFonts.poppins(
                  fontSize: 10.5,
                  color: AppTheme.textMuted,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

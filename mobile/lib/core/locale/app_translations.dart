import 'package:flutter/material.dart';

class AppTranslations {
  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      // Navigation
      'nav_home': 'Home',
      'nav_categories': 'Categories',
      'nav_search': 'Search',
      'nav_bag': 'Bag',
      'nav_account': 'Account',
      'nav_menu': 'Menu',

      // Header & Drawer
      'house_title': 'LUXURY FRAGRANCE HOUSE',
      'men_fragrances': 'MEN FRAGRANCES',
      'women_fragrances': 'WOMEN FRAGRANCES',
      'unisex': 'UNISEX',
      'all_fragrances': 'ALL FRAGRANCES',
      'rewards': 'REWARDS',
      'brands': 'BRANDS',
      'offers': 'OFFERS',
      'language': 'Language',
      'switch_language': 'العربية',
      'english': 'English',
      'arabic': 'العربية',

      // Home Sections
      'shop_by_category': 'SHOP BY CATEGORY',
      'new_arrivals': 'NEW ARRIVALS',
      'house_favorites': 'HOUSE FAVORITES',
      'trending_now': 'TRENDING FRAGRANCES',
      'shop_by_gender': 'SHOP BY GENDER',
      'view_all': 'VIEW ALL',
      'shop_now': 'SHOP NOW',
      'explore': 'EXPLORE',

      // Trust Badges
      'badge_authentic_title': '100% AUTHENTIC',
      'badge_authentic_sub': 'Directly from Brands',
      'badge_tracking_title': 'LIVE TRACKING',
      'badge_tracking_sub': 'Live Delivery Tracking',
      'badge_secure_title': 'SECURE PAYMENT',
      'badge_secure_sub': 'Safe transactions',
      'badge_shipping_title': 'FREE SHIPPING',
      'badge_shipping_sub': 'On orders above AED 100',

      // Search & Products
      'search_placeholder': 'Search for Perfumes, Oud, Attar...',
      'search_title': 'Search Fragrances',
      'filter': 'Filter',
      'sort_by': 'Sort By',
      'add_to_bag': 'ADD TO BAG',
      'buy_now': 'BUY NOW',
      'price': 'Price',
      'size': 'Size',
      'in_stock': 'In Stock',
      'out_of_stock': 'Out of Stock',
      'free_express_shipping': 'Free Express Delivery in UAE',

      // Cart & Checkout
      'shopping_bag': 'Shopping Bag',
      'bag_empty': 'Your Bag is Empty',
      'bag_empty_desc': 'Discover our luxury fragrance collection and add your favorites to your bag.',
      'subtotal': 'Subtotal',
      'shipping': 'Shipping',
      'free': 'FREE',
      'total': 'Total Amount',
      'proceed_to_checkout': 'PROCEED TO CHECKOUT',
      'checkout_title': 'Checkout',
      'shipping_address': 'Shipping Address',
      'payment_method': 'Payment Method',
      'cod': 'Cash on Delivery (COD)',
      'card': 'Credit / Debit Card',
      'place_order': 'PLACE ORDER',
      'order_success': 'Order Placed Successfully!',
      'order_number': 'Order Number',

      // Account & Auth
      'login_title': 'Secure Login',
      'enter_mobile_or_email': 'Enter Mobile Number or Email',
      'send_otp': 'SEND ACCESS CODE',
      'enter_otp': 'Enter 6-Digit Access Code',
      'verify_login': 'VERIFY & LOGIN',
      'my_orders': 'My Orders',
      'saved_addresses': 'Saved Addresses',
      'logout': 'Logout',
      'logout_confirm': 'Are you sure you want to logout?',
      'cancel': 'Cancel',
    },
    'ar': {
      // Navigation
      'nav_home': 'الرئيسية',
      'nav_categories': 'الفئات',
      'nav_search': 'البحث',
      'nav_bag': 'الحقيبة',
      'nav_account': 'حسابي',
      'nav_menu': 'القائمة',

      // Header & Drawer
      'house_title': 'دار العطور الفاخرة',
      'men_fragrances': 'عطور رجالية',
      'women_fragrances': 'عطور نسائية',
      'unisex': 'للجنسين',
      'all_fragrances': 'جميع العطور',
      'rewards': 'المكافآت',
      'brands': 'العلامات التجارية',
      'offers': 'العروض',
      'language': 'اللغة',
      'switch_language': 'English',
      'english': 'English',
      'arabic': 'العربية',

      // Home Sections
      'shop_by_category': 'تسوق حسب الفئة',
      'new_arrivals': 'وصل حديثاً',
      'house_favorites': 'المفضلة لدينا',
      'trending_now': 'العطور الأكثر رواجاً',
      'shop_by_gender': 'تسوق حسب الجنس',
      'view_all': 'عرض الكل',
      'shop_now': 'تسوق الآن',
      'explore': 'استكشف',

      // Trust Badges
      'badge_authentic_title': 'أصلي 100%',
      'badge_authentic_sub': 'مباشرة من العلامات التجارية',
      'badge_tracking_title': 'تتبع مباشر',
      'badge_tracking_sub': 'تتبع التسليم المباشر',
      'badge_secure_title': 'دفع آمن',
      'badge_secure_sub': 'معاملات آمنة ومضمونة',
      'badge_shipping_title': 'شحن مجاني',
      'badge_shipping_sub': 'للطلبات أكثر من 100 درهم',

      // Search & Products
      'search_placeholder': 'ابحث عن العطور، العود، العود والطقوم...',
      'search_title': 'البحث عن العطور',
      'filter': 'تصفية',
      'sort_by': 'ترتيب حسب',
      'add_to_bag': 'إضافة إلى الحقيبة',
      'buy_now': 'اشتر الآن',
      'price': 'السعر',
      'size': 'الحجم',
      'in_stock': 'متوفر في المخزون',
      'out_of_stock': 'نفذت الكمية',
      'free_express_shipping': 'توصيل سريع مجاني في الإمارات',

      // Cart & Checkout
      'shopping_bag': 'حقيبة التسوق',
      'bag_empty': 'حقيبة التسوق فارغة',
      'bag_empty_desc': 'استكشف مجموعة عطورنا الفاخرة وأضف مفضلاتك إلى الحقيبة.',
      'subtotal': 'المجموع الفرعي',
      'shipping': 'الشحن',
      'free': 'مجاناً',
      'total': 'الإجمالي النهائي',
      'proceed_to_checkout': 'المتابعة لإتمام الطلب',
      'checkout_title': 'إتمام الطلب',
      'shipping_address': 'عنوان الشحن',
      'payment_method': 'طريقة الدفع',
      'cod': 'الدفع عند الاستلام (COD)',
      'card': 'بطاقة ائتمان / خصم',
      'place_order': 'تأكيد الطلب',
      'order_success': 'تم إرسال طلبك بنجاح!',
      'order_number': 'رقم الطلب',

      // Account & Auth
      'login_title': 'تسجيل الدخول الآمن',
      'enter_mobile_or_email': 'أدخل رقم الهاتف أو البريد الإلكتروني',
      'send_otp': 'إرسال رمز الدخول',
      'enter_otp': 'أدخل رمز الدخول المكون من 6 أرقام',
      'verify_login': 'التحقق وتسجيل الدخول',
      'my_orders': 'طلباتي',
      'saved_addresses': 'العناوين المحفوظة',
      'logout': 'تسجيل الخروج',
      'logout_confirm': 'هل أنت تأكد من رغبتك في تسجيل الخروج؟',
      'cancel': 'إلغاء',
    }
  };

  static String translate(String langCode, String key) {
    return _localizedValues[langCode]?[key] ?? _localizedValues['en']?[key] ?? key;
  }

  /// Dynamic helper: Selects Arabic text if current language is Arabic and Arabic field exists,
  /// otherwise returns English text.
  static String dynamicText(String langCode, String? textEn, String? textAr) {
    if (langCode == 'ar' && textAr != null && textAr.trim().isNotEmpty) {
      return textAr;
    }
    return textEn ?? '';
  }
}

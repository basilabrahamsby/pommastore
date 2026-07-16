import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/navigation/navigation_shell.dart';
import '../../features/catalog/home_screen.dart';
import '../../features/catalog/search_screen.dart';
import '../../features/cart/cart_screen.dart';
import '../../features/account/account_screen.dart';
import '../../features/auth/login_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _shellNavigatorHomeKey = GlobalKey<NavigatorState>(debugLabel: 'shellHome');
final GlobalKey<NavigatorState> _shellNavigatorSearchKey = GlobalKey<NavigatorState>(debugLabel: 'shellSearch');
final GlobalKey<NavigatorState> _shellNavigatorCartKey = GlobalKey<NavigatorState>(debugLabel: 'shellCart');
final GlobalKey<NavigatorState> _shellNavigatorAccountKey = GlobalKey<NavigatorState>(debugLabel: 'shellAccount');

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: <RouteBase>[
    // Authentication Page
    GoRoute(
      path: '/login',
      builder: (BuildContext context, GoRouterState state) => const LoginScreen(),
    ),
    
    // Tab Layout Shell
    StatefulShellRoute.indexedStack(
      builder: (BuildContext context, GoRouterState state, StatefulNavigationShell navigationShell) {
        return NavigationShell(navigationShell: navigationShell);
      },
      branches: <StatefulShellBranch>[
        // Home Branch
        StatefulShellBranch(
          navigatorKey: _shellNavigatorHomeKey,
          routes: <RouteBase>[
            GoRoute(
              path: '/',
              builder: (BuildContext context, GoRouterState state) => const HomeScreen(),
            ),
          ],
        ),
        // Search Branch
        StatefulShellBranch(
          navigatorKey: _shellNavigatorSearchKey,
          routes: <RouteBase>[
            GoRoute(
              path: '/search',
              builder: (BuildContext context, GoRouterState state) => const SearchScreen(),
            ),
          ],
        ),
        // Cart Branch
        StatefulShellBranch(
          navigatorKey: _shellNavigatorCartKey,
          routes: <RouteBase>[
            GoRoute(
              path: '/bag',
              builder: (BuildContext context, GoRouterState state) => const CartScreen(),
            ),
          ],
        ),
        // Account Branch
        StatefulShellBranch(
          navigatorKey: _shellNavigatorAccountKey,
          routes: <RouteBase>[
            GoRoute(
              path: '/account',
              builder: (BuildContext context, GoRouterState state) => const AccountScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
